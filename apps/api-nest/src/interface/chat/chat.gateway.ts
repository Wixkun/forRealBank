import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { SendMessageUseCase } from '@forreal/application';
import { AddConversationParticipantUseCase } from '@forreal/application';
import { EnsureConversationMemberUseCase } from '@forreal/application';
import { CanUseConversationUseCase } from '@forreal/application';
import { IMessageRepository, ITokenService, IUserRepository } from '@forreal/domain';
import {
  ChatClusterBus,
  ChatBusMessage,
  ChatBusEnvelope,
  MAX_NOTIFY_BYTES,
} from './chat-cluster.bus';

interface WireMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

// Présence : chaque instance publie périodiquement la liste de ses membres
// locaux par conversation ; les états des autres instances plus vieux que le
// TTL sont considérés comme morts (crash / redéploiement).
const PRESENCE_HEARTBEAT_MS = 20_000;
const PRESENCE_TTL_MS = 60_000;

// CORS WebSocket restreint à l'origine frontend configurée (jamais '*').
function wsCorsOrigins(): string[] {
  const raw = (process.env.FRONTEND_ORIGIN ?? '').trim();
  const origins = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return origins.length ? origins : ['http://localhost:3000'];
}

// Extrait le cookie access_token de l'en-tête Cookie du handshake.
function extractTokenFromHandshake(socket: Socket): string | null {
  const cookieHeader = socket.handshake.headers.cookie;
  if (cookieHeader) {
    for (const part of cookieHeader.split(';')) {
      const [name, ...rest] = part.trim().split('=');
      if (name === 'access_token') return decodeURIComponent(rest.join('='));
    }
  }
  // Fallback explicite (clients ne pouvant pas transmettre le cookie httpOnly).
  const authToken = socket.handshake.auth?.token;
  return typeof authToken === 'string' && authToken ? authToken : null;
}

// Le path est préfixé par /api pour être routable en production : Traefik ne
// route vers l'API que les requêtes en PathPrefix(/api) (le port 3001 n'est
// pas exposé). Le client doit utiliser le même path.
@WebSocketGateway({
  cors: { origin: wsCorsOrigins(), credentials: true },
  namespace: '/chat',
  path: '/api/socket.io',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  private connectedUsers = new Map<string, { socketId: string; userId: string }>();
  private typingUsers = new Map<string, Set<string>>(); // conversationId -> Set<userId>
  private roomMembers = new Map<string, Set<string>>(); // conversationId -> Set<userId> (locaux)
  private socketRooms = new Map<string, Set<string>>(); // socketId -> Set<conversationId>
  // conversationId -> instanceId -> présence déclarée par les autres instances
  private peerPresence = new Map<string, Map<string, { userIds: string[]; at: number }>>();
  private presenceHeartbeat: NodeJS.Timeout | null = null;

  // ─── Présence GLOBALE (en ligne / hors ligne) ─────────────────────────────
  // Nombre de sockets locaux par utilisateur : > 0 ⇒ en ligne (multi-onglets).
  private userSocketCount = new Map<string, number>();
  // Présence des autres instances (union pour le statut global multi-réplica).
  private peerOnline = new Map<string, { userIds: Set<string>; at: number }>();
  // Dernier ensemble d'utilisateurs en ligne diffusé (pour n'émettre que les
  // transitions online/offline).
  private lastBroadcastOnline = new Set<string>();
  private globalPresenceHeartbeat: NodeJS.Timeout | null = null;

  constructor(
    @Inject(SendMessageUseCase) private readonly sendMessageUseCase: SendMessageUseCase,
    @Inject(AddConversationParticipantUseCase)
    private readonly addConversationParticipantUseCase: AddConversationParticipantUseCase,
    @Inject(EnsureConversationMemberUseCase)
    private readonly ensureConversationMember: EnsureConversationMemberUseCase,
    @Inject(CanUseConversationUseCase)
    private readonly canUseConversation: CanUseConversationUseCase,
    @Inject(IMessageRepository) private readonly messageRepository: IMessageRepository,
    @Inject(ITokenService) private readonly tokenService: ITokenService,
    @Inject(IUserRepository) private readonly userRepository: IUserRepository,
    @Inject(ChatClusterBus) private readonly bus: ChatClusterBus,
  ) {}

  afterInit() {
    this.bus.onMessage((message) => this.handleBusMessage(message));

    // Authentification à la poignée de main : l'identité vient TOUJOURS du JWT
    // vérifié côté serveur, jamais d'un userId envoyé par le client. Une
    // connexion sans token valide (ou d'un utilisateur banni) est refusée.
    this.server.use((socket, next) => {
      void this.authenticate(extractTokenFromHandshake(socket)).then((result) => {
        if ('error' in result) {
          // Message générique : aucune information sensible divulguée au client.
          next(new Error(result.error));
          return;
        }
        socket.data.userId = result.userId;
        next();
      });
    });

    this.presenceHeartbeat = setInterval(() => {
      this.roomMembers.forEach((members, conversationId) => {
        if (members.size > 0) {
          this.bus.publish({
            type: 'presence_state',
            conversationId,
            userIds: Array.from(members),
          });
        }
      });
    }, PRESENCE_HEARTBEAT_MS);

    // Présence globale : republier périodiquement la liste locale et purger les
    // pairs expirés (convergence même après un événement manqué / crash).
    this.globalPresenceHeartbeat = setInterval(() => {
      this.publishGlobalPresence();
      this.recomputeGlobalPresence();
    }, PRESENCE_HEARTBEAT_MS);
  }

  onModuleDestroy() {
    if (this.presenceHeartbeat) clearInterval(this.presenceHeartbeat);
    if (this.globalPresenceHeartbeat) clearInterval(this.globalPresenceHeartbeat);
  }

  // ─── Présence globale : helpers ────────────────────────────────────────────

  private localOnlineUserIds(): string[] {
    return Array.from(this.userSocketCount.entries())
      .filter(([, count]) => count > 0)
      .map(([userId]) => userId);
  }

  /** Union des utilisateurs en ligne localement et sur les autres instances. */
  onlineUserIds(): Set<string> {
    const online = new Set(this.localOnlineUserIds());
    const now = Date.now();
    this.peerOnline.forEach((state, instanceId) => {
      if (now - state.at > PRESENCE_TTL_MS) {
        this.peerOnline.delete(instanceId);
        return;
      }
      state.userIds.forEach((userId) => online.add(userId));
    });
    return online;
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUserIds().has(userId);
  }

  /**
   * Émet un événement vers tous les sockets locaux d'un ensemble d'utilisateurs
   * (ex. « conversation_created » aux membres d'un nouveau groupe). Le relais
   * inter-instances éventuel passe par le bus cluster côté appelant.
   */
  notifyUsers(userIds: string[], event: string, payload: unknown): void {
    const targets = new Set(userIds);
    this.connectedUsers.forEach((user, socketId) => {
      if (targets.has(user.userId)) {
        this.server.to(socketId).emit(event, payload);
      }
    });
  }

  private publishGlobalPresence(): void {
    this.bus.publish({ type: 'global_presence', userIds: this.localOnlineUserIds() });
  }

  // Émet un événement `user_presence { userId, online }` uniquement pour les
  // utilisateurs dont le statut a changé depuis la dernière diffusion.
  private recomputeGlobalPresence(): void {
    const online = this.onlineUserIds();
    const changes: Array<{ userId: string; online: boolean }> = [];
    online.forEach((userId) => {
      if (!this.lastBroadcastOnline.has(userId)) changes.push({ userId, online: true });
    });
    this.lastBroadcastOnline.forEach((userId) => {
      if (!online.has(userId)) changes.push({ userId, online: false });
    });
    for (const change of changes) {
      this.server.emit('user_presence', change);
    }
    this.lastBroadcastOnline = online;
  }

  private addLocalPresence(userId: string): void {
    this.userSocketCount.set(userId, (this.userSocketCount.get(userId) ?? 0) + 1);
    this.publishGlobalPresence();
    this.recomputeGlobalPresence();
  }

  private removeLocalPresence(userId: string): void {
    const next = (this.userSocketCount.get(userId) ?? 0) - 1;
    if (next <= 0) {
      this.userSocketCount.delete(userId);
      // Dernier socket local fermé : on fige la dernière présence constatée.
      // (Si l'utilisateur reste connecté sur une autre instance, celle-ci
      // écrira une valeur plus récente à sa propre fermeture.)
      void this.userRepository.updateLastSeen(userId, new Date()).catch(() => undefined);
    } else {
      this.userSocketCount.set(userId, next);
    }
    this.publishGlobalPresence();
    this.recomputeGlobalPresence();
  }

  /**
   * Ferme immédiatement tous les sockets d'un utilisateur (bannissement) sur
   * cette instance et, via le bus, sur les autres replicas du cluster.
   */
  disconnectUser(userId: string): void {
    this.disconnectLocalSockets(userId);
    this.bus.publish({ type: 'force_disconnect', userId });
  }

  private disconnectLocalSockets(userId: string): void {
    const socketIds: string[] = [];
    this.connectedUsers.forEach((user, socketId) => {
      if (user.userId === userId) socketIds.push(socketId);
    });
    // Gateway à namespace : au runtime `server` est un Namespace dont
    // `sockets` est une Map<socketId, Socket> (le type Nest déclare Server).
    const sockets = this.server.sockets as unknown as Map<string, Socket>;
    for (const socketId of socketIds) {
      sockets.get(socketId)?.disconnect(true);
    }
  }

  // Vérifie un token de handshake et renvoie l'identité serveur. Extrait pour
  // être testable indépendamment de socket.io.
  async authenticate(
    token: string | null,
  ): Promise<{ userId: string } | { error: 'UNAUTHORIZED' | 'FORBIDDEN' }> {
    if (!token) return { error: 'UNAUTHORIZED' };
    const payload = await this.tokenService.verify(token).catch(() => null);
    if (!payload?.userId) return { error: 'UNAUTHORIZED' };

    const user = await this.userRepository.findById(payload.userId);
    if (!user) return { error: 'UNAUTHORIZED' };
    if (user.isBanned) return { error: 'FORBIDDEN' };

    return { userId: user.id };
  }

  // ─── Relais des événements publiés par les autres instances ───────────────

  private handleBusMessage(message: ChatBusEnvelope) {
    switch (message.type) {
      case 'new_message':
        this.server
          .to(`conversation:${message.conversationId}`)
          .emit('new_message', message.message);
        break;
      case 'new_message_ref':
        void this.emitMessageById(message.conversationId, message.messageId);
        break;
      case 'user_typing':
        this.server.to(`conversation:${message.conversationId}`).emit('user_typing', {
          conversationId: message.conversationId,
          userId: message.userId,
        });
        break;
      case 'user_stopped_typing':
        this.server.to(`conversation:${message.conversationId}`).emit('user_stopped_typing', {
          conversationId: message.conversationId,
          userId: message.userId,
        });
        break;
      case 'user_joined':
        this.server.to(`conversation:${message.conversationId}`).emit('user_joined', {
          conversationId: message.conversationId,
          userId: message.userId,
        });
        break;
      case 'presence_state': {
        let peers = this.peerPresence.get(message.conversationId);
        if (!peers) {
          peers = new Map();
          this.peerPresence.set(message.conversationId, peers);
        }
        peers.set(message.senderInstanceId, {
          userIds: message.userIds,
          at: Date.now(),
        });
        this.emitPresence(message.conversationId);
        break;
      }
      case 'global_presence': {
        this.peerOnline.set(message.senderInstanceId, {
          userIds: new Set(message.userIds),
          at: Date.now(),
        });
        this.recomputeGlobalPresence();
        break;
      }
      case 'force_disconnect':
        this.disconnectLocalSockets(message.userId);
        break;
    }
  }

  // Message trop volumineux pour un NOTIFY : publié par référence, chaque
  // instance le relit en base avant de l'émettre à ses sockets.
  private async emitMessageById(conversationId: string, messageId: string) {
    try {
      const message = await this.messageRepository.findById(messageId);
      if (!message) return;
      this.server.to(`conversation:${conversationId}`).emit('new_message', {
        messageId: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        createdAt:
          message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt,
      } satisfies WireMessage);
    } catch (err) {
      this.logger.error(
        `emitMessageById failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private publishNewMessage(message: WireMessage) {
    const envelope: ChatBusMessage = {
      type: 'new_message',
      conversationId: message.conversationId,
      message,
    };
    if (Buffer.byteLength(JSON.stringify(envelope), 'utf8') <= MAX_NOTIFY_BYTES) {
      this.bus.publish(envelope);
    } else {
      this.bus.publish({
        type: 'new_message_ref',
        conversationId: message.conversationId,
        messageId: message.messageId,
      });
    }
  }

  // ─── Cycle de vie des sockets ──────────────────────────────────────────────

  handleConnection(client: Socket) {
    // L'identité a été fixée par le middleware d'authentification (socket.data).
    const userId = client.data.userId as string | undefined;
    if (userId) {
      this.connectedUsers.set(client.id, { socketId: client.id, userId });
      this.addLocalPresence(userId);
      // Trace de présence aussi à la connexion : si l'instance meurt sans
      // exécuter handleDisconnect, la « dernière présence » reste plausible.
      void this.userRepository.updateLastSeen(userId, new Date()).catch(() => undefined);
      // État initial : envoyer au nouveau socket la liste des utilisateurs en ligne.
      client.emit('presence_snapshot', { userIds: Array.from(this.onlineUserIds()) });
    } else {
      // Sécurité : aucune identité vérifiée → on ferme la connexion.
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (user) {
      this.typingUsers.forEach((users) => users.delete(user.userId));
    }
    const rooms = this.socketRooms.get(client.id);
    if (rooms && user) {
      rooms.forEach((conversationId) => {
        const members = this.roomMembers.get(conversationId);
        if (members) {
          members.delete(user.userId);
          this.broadcastPresence(conversationId);
        }
      });
    }
    this.socketRooms.delete(client.id);
    this.connectedUsers.delete(client.id);
    // Présence globale : décrémente le compteur de sockets ; le user passe hors
    // ligne quand son dernier socket se ferme (multi-onglets gérés).
    if (user) this.removeLocalPresence(user.userId);
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return { success: false, error: 'UNAUTHORIZED' };

    // Autorisation : on ne peut rejoindre que ses propres conversations.
    const isMember = await this.ensureConversationMember.isMember({
      conversationId: data.conversationId,
      userId,
    });
    if (!isMember) {
      return { success: false, error: 'FORBIDDEN' };
    }

    const roomName = `conversation:${data.conversationId}`;

    let socketSet = this.socketRooms.get(client.id);
    if (!socketSet) {
      socketSet = new Set<string>();
      this.socketRooms.set(client.id, socketSet);
    }

    if (socketSet.has(data.conversationId)) {
      this.broadcastPresence(data.conversationId);
      return { success: true, alreadyJoined: true };
    }

    void client.join(roomName);
    socketSet.add(data.conversationId);

    let members = this.roomMembers.get(data.conversationId);
    if (!members) {
      members = new Set<string>();
      this.roomMembers.set(data.conversationId, members);
    }

    members.add(userId);

    this.broadcastPresence(data.conversationId);

    try {
      const result = await this.addConversationParticipantUseCase.execute({
        conversationId: data.conversationId,
        userId,
      });

      if (result.inserted) {
        this.server.to(roomName).emit('user_joined', {
          conversationId: data.conversationId,
          userId,
        });
        this.bus.publish({
          type: 'user_joined',
          conversationId: data.conversationId,
          userId,
        });
      }

      return { success: true, inserted: result.inserted };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`join_conversation failed (socket ${client.id}): ${message}`);
      return { success: false, error: message };
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const senderId = client.data.userId as string | undefined;
    if (!senderId) return { success: false, error: 'UNAUTHORIZED' };

    // Autorisation : on ne peut écrire que dans une conversation dont on est membre.
    const isMember = await this.ensureConversationMember.isMember({
      conversationId: data.conversationId,
      userId: senderId,
    });
    if (!isMember) {
      return { success: false, error: 'FORBIDDEN' };
    }

    // Conversation gelée (advisor-client dont la relation d'attribution a été
    // retirée) : l'historique reste consultable mais plus aucun envoi.
    const writable = await this.canUseConversation.isWritable(data.conversationId);
    if (!writable) {
      return { success: false, error: 'CONVERSATION_LOCKED' };
    }

    try {
      const messageResult = await this.sendMessageUseCase.execute({
        conversationId: data.conversationId,
        senderId,
        content: data.content,
      });

      const wireMessage: WireMessage = {
        messageId: messageResult.messageId,
        conversationId: messageResult.conversationId,
        senderId: messageResult.senderId,
        content: messageResult.content,
        createdAt:
          messageResult.createdAt instanceof Date
            ? messageResult.createdAt.toISOString()
            : String(messageResult.createdAt),
      };

      this.server.to(`conversation:${data.conversationId}`).emit('new_message', wireMessage);
      this.publishNewMessage(wireMessage);

      this.clearTyping(data.conversationId, senderId);

      return { success: true, messageId: messageResult.messageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`send_message failed (socket ${client.id}): ${message}`);
      return { success: false, error: message };
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return { success: false, error: 'UNAUTHORIZED' };

    let typingUserIds = this.typingUsers.get(data.conversationId);
    if (!typingUserIds) {
      typingUserIds = new Set<string>();
      this.typingUsers.set(data.conversationId, typingUserIds);
    }
    typingUserIds.add(userId);

    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId,
    });
    this.bus.publish({
      type: 'user_typing',
      conversationId: data.conversationId,
      userId,
    });

    return { success: true };
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return { success: false, error: 'UNAUTHORIZED' };
    this.clearTyping(data.conversationId, userId);
    return { success: true };
  }

  private clearTyping(conversationId: string, userId: string) {
    const users = this.typingUsers.get(conversationId);
    if (users) {
      users.delete(userId);
      this.server.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        conversationId,
        userId,
      });
      this.bus.publish({ type: 'user_stopped_typing', conversationId, userId });
    }
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    void client.leave(`conversation:${data.conversationId}`);
    const user = this.connectedUsers.get(client.id);
    if (user) {
      const rooms = this.socketRooms.get(client.id);
      if (rooms) {
        rooms.delete(data.conversationId);
      }
      const members = this.roomMembers.get(data.conversationId);
      if (members) {
        members.delete(user.userId);
        this.broadcastPresence(data.conversationId);
      }
    }
    return { success: true };
  }

  // ─── Présence ──────────────────────────────────────────────────────────────

  // Publie l'état local aux autres instances puis émet la présence fusionnée.
  private broadcastPresence(conversationId: string) {
    const local = Array.from(this.roomMembers.get(conversationId) ?? []);
    this.bus.publish({ type: 'presence_state', conversationId, userIds: local });
    this.emitPresence(conversationId);
  }

  // Émet aux sockets locaux l'union des membres locaux et de ceux déclarés
  // (récemment) par les autres instances.
  private emitPresence(conversationId: string) {
    const merged = new Set(this.roomMembers.get(conversationId) ?? []);
    const peers = this.peerPresence.get(conversationId);
    if (peers) {
      const now = Date.now();
      peers.forEach((state, instanceId) => {
        if (now - state.at > PRESENCE_TTL_MS) {
          peers.delete(instanceId);
          return;
        }
        state.userIds.forEach((userId) => merged.add(userId));
      });
    }
    this.server.to(`conversation:${conversationId}`).emit('presence_update', {
      conversationId,
      userIds: Array.from(merged),
    });
  }
}
