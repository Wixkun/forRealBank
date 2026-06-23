import { Entity, Column } from 'typeorm';
import { ImmutableEntity } from './ImmutableEntity';

export enum ConversationType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
}

@Entity('conversations')
export class ConversationEntity extends ImmutableEntity {
  @Column({ type: 'enum', enum: ConversationType })
  type!: ConversationType;
}
