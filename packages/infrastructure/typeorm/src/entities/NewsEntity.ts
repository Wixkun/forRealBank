import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './UserEntity';
import { ImmutableEntity } from './ImmutableEntity';

@Entity('news')
export class NewsEntity extends ImmutableEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author!: UserEntity | null;

  @Column({ type: 'varchar', nullable: true, name: 'user_id' })
  userId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: false })
  content!: string;

  @Column({ type: 'varchar', length: 50, default: 'INFORMATION' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'archived_at' })
  archivedAt!: Date | null;
}
