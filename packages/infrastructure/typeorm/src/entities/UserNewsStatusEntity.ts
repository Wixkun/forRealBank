import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

export type UserNewsStatusValue = 'VISIBLE' | 'READ' | 'ARCHIVED' | 'DELETED';

@Entity('user_news_status')
@Unique(['userId', 'newsId'])
export class UserNewsStatusEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', name: 'news_id' })
  newsId!: string;

  @Column({ type: 'varchar', length: 20, default: 'VISIBLE' })
  status!: UserNewsStatusValue;

  @Column({ type: 'timestamptz', name: 'read_at', nullable: true })
  readAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'archived_at', nullable: true })
  archivedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
