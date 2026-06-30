import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Unique } from 'typeorm';

@Entity('news_user_archives')
@Unique(['userId', 'newsId'])
export class UserNewsArchiveEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', name: 'news_id' })
  newsId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'archived_at' })
  archivedAt!: Date;
}
