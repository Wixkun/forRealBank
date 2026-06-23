import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './UserEntity';
import { ImmutableEntity } from './ImmutableEntity';

@Entity('notifications')
export class NotificationEntity extends ImmutableEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: false })
  content!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  type!: string;

  @Column({ type: 'timestamptz', name: 'read_at', nullable: true })
  readAt!: Date | null;
}
