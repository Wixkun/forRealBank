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
    this.connectedUsers.delete(client.id);
    this.typingUsers.forEach((users) => {
      const user = this.connectedUsers.get(client.id);
      if (user) users.delete(user.userId);
    });
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    try {
      await this.addConversationParticipantUseCase.execute({
        conversationId: data.conversationId,
        userId: data.userId,
      });
      client.join(`conversation:${data.conversationId}`);
      this.server.to(`conversation:${data.conversationId}`).emit('user_joined', {
        conversationId: data.conversationId,
        userId: data.userId,
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
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
    }
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    return { success: true };
  }
}
