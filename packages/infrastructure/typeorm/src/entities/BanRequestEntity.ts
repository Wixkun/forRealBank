import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';

export type BanRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

// Demande de bannissement émise par un advisor pour l'un de SES clients,
// attribuée au director le moins chargé. Le message de chat associé n'est
// qu'un affichage : toute décision s'appuie sur cet enregistrement.
@Entity('ban_requests')
@Index(['assignedDirectorId', 'status'])
@Index(['conversationId'])
export class BanRequestEntity extends BaseEntity {
  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'advisor_requester_id', type: 'uuid' })
  advisorRequesterId!: string;

  @Column({ name: 'assigned_director_id', type: 'uuid' })
  assignedDirectorId!: string;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status!: BanRequestStatus;

  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId!: string | null;

  @Column({ name: 'message_id', type: 'uuid', nullable: true })
  messageId!: string | null;

  @Column({ name: 'decision_comment', type: 'text', nullable: true })
  decisionComment!: string | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  @Column({ name: 'processed_by_id', type: 'uuid', nullable: true })
  processedById!: string | null;
}
