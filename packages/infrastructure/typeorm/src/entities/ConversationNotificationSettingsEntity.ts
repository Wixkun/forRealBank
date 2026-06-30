import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from './BaseEntity';

@Entity('conversation_notification_settings')
@Unique(['userId', 'conversationId'])
export class ConversationNotificationSettingsEntity extends BaseEntity {
  @Column({ type: 'varchar', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', name: 'conversation_id' })
  conversationId!: string;

  @Column({ type: 'boolean', default: false })
  muted!: boolean;

  @Column({ type: 'timestamptz', name: 'muted_until', nullable: true })
  mutedUntil!: Date | null;
}
