import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Inject } from '@nestjs/common';
import { SendMessageUseCase } from '@forreal/application/chat/usecases/SendMessageUseCase';
import { AddConversationParticipantUseCase } from '@forreal/application/chat/usecases/AddConversationParticipantUseCase';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<string, { socketId: string; userId: string }>();
  private typingUsers = new Map<string, Set<string>>(); // conversationId -> Set<userId>
  private roomMembers = new Map<string, Set<string>>(); // conversationId -> Set<userId>
  private socketRooms = new Map<string, Set<string>>(); // socketId -> Set<conversationId>

  constructor(
    @Inject(SendMessageUseCase) private readonly sendMessageUseCase: SendMessageUseCase,
    @Inject(AddConversationParticipantUseCase) private readonly addConversationParticipantUseCase: AddConversationParticipantUseCase,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(client.id, { socketId: client.id, userId });
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
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
          this.roomMembers.set(conversationId, members);
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
    console.log('[WS] join_conversation', { socketId: client.id, conversationId: data.conversationId, userId: data.userId });
    client.join(`conversation:${data.conversationId}`);
    let socketSet = this.socketRooms.get(client.id);
    if (!socketSet) {
      socketSet = new Set<string>();
      this.socketRooms.set(client.id, socketSet);
    }
    socketSet.add(data.conversationId);
    let members = this.roomMembers.get(data.conversationId);
    if (!members) {
      members = new Set<string>();
      this.roomMembers.set(data.conversationId, members);
    }
    members.add(data.userId);
    this.broadcastPresence(data.conversationId);
    try {
      await this.addConversationParticipantUseCase.execute({
        conversationId: data.conversationId,
        userId: data.userId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message?.toLowerCase?.().includes('already')) {
        console.error('[WS][ERROR] join_conversation', { socketId: client.id, error: message });
      }
    }
    this.server.to(`conversation:${data.conversationId}`).emit('user_joined', {
      conversationId: data.conversationId,
      userId: data.userId,
    });
    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; senderId: string; content: string },
  ) {
    try {
      console.log('[WS] send_message', { socketId: client.id, conversationId: data.conversationId, senderId: data.senderId, contentLen: data.content?.length ?? 0 });
      const messageResult = await this.sendMessageUseCase.execute({
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
      });


      this.server.to(`conversation:${data.conversationId}`).emit('new_message', {
        messageId: messageResult.messageId,
        conversationId: messageResult.conversationId,
        senderId: messageResult.senderId,
        content: messageResult.content,
        createdAt: messageResult.createdAt,
      });

      this.clearTyping(data.conversationId, data.senderId);

      return { success: true, messageId: messageResult.messageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[WS][ERROR] send_message', { socketId: client.id, error: message });
      return { success: false, error: message };
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    console.log('[WS] typing_start', { socketId: client.id, conversationId: data.conversationId, userId: data.userId });
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

    return { success: true };
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    console.log('[WS] typing_stop', { socketId: client.id, conversationId: data.conversationId, userId: data.userId });
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
    }
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    const user = this.connectedUsers.get(client.id);
    if (user) {
      const rooms = this.socketRooms.get(client.id);
      if (rooms) {
        rooms.delete(data.conversationId);
        this.socketRooms.set(client.id, rooms);
      }
      const members = this.roomMembers.get(data.conversationId);
      if (members) {
        members.delete(user.userId);
        this.roomMembers.set(data.conversationId, members);
        this.broadcastPresence(data.conversationId);
      }
    }
    return { success: true };
  }

  private broadcastPresence(conversationId: string) {
    const members = Array.from(this.roomMembers.get(conversationId) || []);
    this.server.to(`conversation:${conversationId}`).emit('presence_update', {
      conversationId,
      userIds: members,
    });
  }
}
