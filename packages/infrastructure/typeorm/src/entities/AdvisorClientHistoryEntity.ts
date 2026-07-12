import { Entity, Column, Index } from 'typeorm';
import { ImmutableEntity } from './ImmutableEntity';

// Audit des réattributions advisor-client : qui a changé quoi, quand.
// oldAdvisorId NULL = première attribution du client.
@Entity('advisor_client_history')
@Index(['clientId'])
export class AdvisorClientHistoryEntity extends ImmutableEntity {
  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'old_advisor_id', type: 'uuid', nullable: true })
  oldAdvisorId!: string | null;

  @Column({ name: 'new_advisor_id', type: 'uuid' })
  newAdvisorId!: string;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy!: string | null;
}
