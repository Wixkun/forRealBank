import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChatFileEntity, UserEntity } from '@forreal/infrastructure-typeorm';

export interface UploadedChatFileDto {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class ChatFilesService implements OnModuleInit {
  private readonly logger = new Logger(ChatFilesService.name);

  constructor(
    @InjectRepository(ChatFileEntity) private readonly files: Repository<ChatFileEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  // Les déploiements existants ne rejouent pas db/init : on garantit la table
  // au démarrage, de façon idempotente (plusieurs replicas peuvent démarrer
  // en même temps, une erreur de course est bénigne).
  async onModuleInit() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS chat_files (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          uploader_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name text NOT NULL,
          mime_type text NOT NULL,
          size int NOT NULL,
          data bytea NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      // Colonne de nom des groupes : garantie sur les bases existantes, sinon
      // l'entité Conversation (qui déclare `name`) casserait les requêtes.
      await this.dataSource.query(`
        ALTER TABLE conversations ADD COLUMN IF NOT EXISTS name varchar(120) NULL
      `);
    } catch (err) {
      this.logger.warn(
        `chat schema bootstrap: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async saveAll(files: Express.Multer.File[], uploaderId: string): Promise<UploadedChatFileDto[]> {
    const results: UploadedChatFileDto[] = [];
    for (const file of files) {
      // multer décode originalname en latin1 : on restaure l'UTF-8 (accents…)
      const name = Buffer.from(file.originalname, 'latin1').toString('utf8');
      const saved = await this.files.save(
        this.files.create({
          uploader: { id: uploaderId } as UserEntity,
          name,
          mimeType: file.mimetype,
          size: file.size,
          data: file.buffer,
        }),
      );
      results.push({
        url: `/api/chat/files/${saved.id}`,
        name,
        size: file.size,
        mimeType: file.mimetype,
      });
    }
    return results;
  }

  async findById(id: string): Promise<ChatFileEntity> {
    const file = await this.files.findOne({ where: { id } });
    if (!file) throw new NotFoundException('FILE_NOT_FOUND');
    return file;
  }
}
