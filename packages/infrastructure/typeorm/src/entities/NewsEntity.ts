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

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle!: string | null;

  @Column({ type: 'text', nullable: false })
  content!: string;

  @Column({ type: 'varchar', length: 50, default: 'INFORMATION' })
  status!: string;

  @Column({ type: 'varchar', length: 20, default: 'MANUAL' })
  source!: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'image_url' })
  imageUrl!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;
}
