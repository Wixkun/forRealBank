import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from './BaseEntity';

@Entity('conversation_user_state')
@Unique(['userId', 'conversationId'])
export class ConversationUserStateEntity extends BaseEntity {
  @Column({ type: 'varchar', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', name: 'conversation_id' })
  conversationId!: string;

  @Column({ type: 'varchar', name: 'last_read_message_id', nullable: true })
  lastReadMessageId!: string | null;

  @Column({ type: 'timestamptz', name: 'last_read_at', nullable: true })
  lastReadAt!: Date | null;
}
