import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UserEntity } from './UserEntity';

@Entity('bank_accounts')
@Index(['userId'])
export class BankAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'account_type', type: 'varchar', length: 20 })
  accountType!: 'checking' | 'savings';

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance!: number;

  @Column({ type: 'varchar', length: 34, unique: true })
  iban!: string;

  @Column({ name: 'account_number', type: 'varchar', length: 20 })
  accountNumber!: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: 'active' | 'closed' | 'suspended';

  @Column({ name: 'opened_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  openedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
