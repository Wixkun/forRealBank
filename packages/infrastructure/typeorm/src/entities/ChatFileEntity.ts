import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ImmutableEntity } from './ImmutableEntity';
import { UserEntity } from './UserEntity';

// Pièces jointes de la messagerie. Le contenu est stocké en base (bytea) et
// non sur disque : en cluster (plusieurs replicas API sans volume partagé),
// c'est le seul stockage accessible depuis toutes les instances.
@Entity('chat_files')
export class ChatFileEntity extends ImmutableEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'uploader_id' })
  uploader!: UserEntity;

  @Column({ type: 'text', nullable: false })
  name!: string;

  @Column({ type: 'text', name: 'mime_type', nullable: false })
  mimeType!: string;

  @Column({ type: 'int', nullable: false })
  size!: number;

  @Column({ type: 'bytea', nullable: false })
  data!: Buffer;
}
