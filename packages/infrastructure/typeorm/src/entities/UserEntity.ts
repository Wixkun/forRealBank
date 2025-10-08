import {
  Column, CreateDateColumn, Entity, ManyToMany, JoinTable,
  UpdateDateColumn, PrimaryGeneratedColumn
} from 'typeorm';
import { RoleEntity } from './RoleEntity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ unique: true }) email!: string;
  @Column() passwordHash!: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name', nullable: false })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name', nullable: false })
  lastName!: string;

  @ManyToMany(() => RoleEntity, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'role_id' },
  })
  roles!: RoleEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', name: 'last_login_at', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ default: false, name: 'is_banned' })
  isBanned!: boolean;

  @Column({ type: 'timestamptz', name: 'banned_at', nullable: true })
  bannedAt!: Date | null;

  @Column({ type: 'text', name: 'ban_reason', nullable: true })
  banReason!: string | null;
}
