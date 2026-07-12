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

  // Nom personnalisé des groupes (null pour les conversations privées).
  @Column({ type: 'varchar', length: 120, nullable: true })
  name!: string | null;
}
