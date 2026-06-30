import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './UserEntity';
import { BaseEntity } from './BaseEntity';

@Entity('notifications')
export class NotificationEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: false })
  content!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  type!: string;

  @Column({ type: 'varchar', length: 100, name: 'target_type', nullable: true })
  targetType!: string | null;

  @Column({ type: 'varchar', name: 'target_id', nullable: true })
  targetId!: string | null;

  @Column({ type: 'text', name: 'target_url', nullable: true })
  targetUrl!: string | null;

  @Column({ type: 'varchar', name: 'group_key', nullable: true })
  groupKey!: string | null;

  @Column({ type: 'varchar', name: 'oldest_unread_message_id', nullable: true })
  oldestUnreadMessageId!: string | null;

  @Column({ type: 'int', name: 'unread_count', default: 1 })
  unreadCount!: number;

  @Column({ type: 'boolean', name: 'is_read', default: false })
  isRead!: boolean;

  @Column({ type: 'timestamptz', name: 'read_at', nullable: true })
  readAt!: Date | null;
}
