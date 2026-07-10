import { Column, Entity, ManyToMany, JoinTable } from 'typeorm';
import { RoleEntity } from './RoleEntity';
import { BaseEntity } from './BaseEntity';

@Entity('users')
export class UserEntity extends BaseEntity {
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

  @Column({ type: 'timestamptz', name: 'last_login_at', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ type: 'boolean', name: 'email_verified', default: false })
  emailVerified!: boolean;

  @Column({ type: 'timestamptz', name: 'email_verified_at', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ default: false, name: 'is_banned' })
  isBanned!: boolean;

  @Column({ type: 'timestamptz', name: 'banned_at', nullable: true })
  bannedAt!: Date | null;

  @Column({ type: 'text', name: 'ban_reason', nullable: true })
  banReason!: string | null;

  @Column({ type: 'int', name: 'failed_login_count', default: 0 })
  failedLoginCount!: number;

  @Column({ type: 'timestamptz', name: 'lock_until', nullable: true })
  lockUntil!: Date | null;
}
