import { Entity, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { UserEntity } from './UserEntity';
import { ImmutableEntity } from './ImmutableEntity';

@Entity('advisor_clients')
@Unique('uq_advisor_client', ['advisor', 'client'])
export class AdvisorClientEntity extends ImmutableEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'advisor_id' })
  advisor!: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'client_id' })
  client!: UserEntity;
}
