import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ConversationEntity } from './ConversationEntity';
import { UserEntity } from './UserEntity';
import { ImmutableEntity } from './ImmutableEntity';

@Entity('messages')
export class MessageEntity extends ImmutableEntity {
  @ManyToOne(() => ConversationEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: ConversationEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'sender_id' })
  sender!: UserEntity;

  @Column({ type: 'text', nullable: false })
  content!: string;

  @Column({ type: 'timestamptz', name: 'read_at', nullable: true })
  readAt!: Date | null;
}
