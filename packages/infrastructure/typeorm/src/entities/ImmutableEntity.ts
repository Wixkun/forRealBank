import { CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export abstract class ImmutableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
