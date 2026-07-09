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
import { IMessageRepository } from '@forreal/domain';
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

// Le path est préfixé par /api pour être routable en production : Traefik ne
// route vers l'API que les requêtes en PathPrefix(/api) (le port 3001 n'est
// pas exposé). Le client doit utiliser le même path.
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat', path: '/api/socket.io' })
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

  constructor(
    @Inject(SendMessageUseCase) private readonly sendMessageUseCase: SendMessageUseCase,
    @Inject(AddConversationParticipantUseCase)
    private readonly addConversationParticipantUseCase: AddConversationParticipantUseCase,
    @Inject(IMessageRepository) private readonly messageRepository: IMessageRepository,
    @Inject(ChatClusterBus) private readonly bus: ChatClusterBus,
  ) {}

  afterInit() {
    this.bus.onMessage((message) => this.handleBusMessage(message));
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
  }

  onModuleDestroy() {
    if (this.presenceHeartbeat) clearInterval(this.presenceHeartbeat);
  }

  // ─── Relais des événements publiés par les autres instances ───────────────

  private handleBusMessage(message: ChatBusEnvelope) {
    const room = `conversation:${message.conversationId}`;
    switch (message.type) {
      case 'new_message':
        this.server.to(room).emit('new_message', message.message);
        break;
      case 'new_message_ref':
        void this.emitMessageById(message.conversationId, message.messageId);
        break;
      case 'user_typing':
        this.server.to(room).emit('user_typing', {
          conversationId: message.conversationId,
          userId: message.userId,
        });
        break;
      case 'user_stopped_typing':
        this.server.to(room).emit('user_stopped_typing', {
          conversationId: message.conversationId,
          userId: message.userId,
        });
        break;
      case 'user_joined':
        this.server.to(room).emit('user_joined', {
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
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(client.id, { socketId: client.id, userId });
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
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
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

    members.add(data.userId);

    this.broadcastPresence(data.conversationId);

    try {
      const result = await this.addConversationParticipantUseCase.execute({
        conversationId: data.conversationId,
        userId: data.userId,
      });

      if (result.inserted) {
        this.server.to(roomName).emit('user_joined', {
          conversationId: data.conversationId,
          userId: data.userId,
        });
        this.bus.publish({
          type: 'user_joined',
          conversationId: data.conversationId,
          userId: data.userId,
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
    @MessageBody() data: { conversationId: string; senderId: string; content: string },
  ) {
    try {
      const messageResult = await this.sendMessageUseCase.execute({
        conversationId: data.conversationId,
        senderId: data.senderId,
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

      this.clearTyping(data.conversationId, data.senderId);

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
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    let typingUserIds = this.typingUsers.get(data.conversationId);
    if (!typingUserIds) {
      typingUserIds = new Set<string>();
      this.typingUsers.set(data.conversationId, typingUserIds);
    }
    typingUserIds.add(data.userId);

    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: data.userId,
    });
    this.bus.publish({
      type: 'user_typing',
      conversationId: data.conversationId,
      userId: data.userId,
    });

    return { success: true };
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    this.clearTyping(data.conversationId, data.userId);
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
