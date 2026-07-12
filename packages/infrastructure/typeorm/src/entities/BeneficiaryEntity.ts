import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { UserEntity } from './UserEntity';
import { BaseEntity } from './BaseEntity';

// Bénéficiaire de virement enregistré par un utilisateur : un libellé + un
// IBAN normalisé (sans espaces, majuscules). Unicité par (user, iban).
@Entity('beneficiaries')
@Index(['userId'])
@Unique(['userId', 'iban'])
export class BeneficiaryEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 100 })
  label!: string;

  @Column({ type: 'varchar', length: 34 })
  iban!: string;
}
