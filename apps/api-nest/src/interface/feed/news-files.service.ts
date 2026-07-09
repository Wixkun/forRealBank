import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NewsFileEntity, UserEntity } from '@forreal/infrastructure-typeorm';

// Même mécanique que ChatFilesService : stockage en base pour le cluster.
@Injectable()
export class NewsFilesService implements OnModuleInit {
  private readonly logger = new Logger(NewsFilesService.name);

  constructor(
    @InjectRepository(NewsFileEntity) private readonly files: Repository<NewsFileEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  // Les déploiements existants ne rejouent pas db/init : on garantit la table
  // au démarrage, de façon idempotente.
  async onModuleInit() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS news_files (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          uploader_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name text NOT NULL,
          mime_type text NOT NULL,
          size int NOT NULL,
          data bytea NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);
    } catch (err) {
      this.logger.warn(`news_files bootstrap: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Retourne l'URL publique de chaque image, dans l'ordre d'envoi.
  async saveAll(files: Express.Multer.File[], uploaderId: string): Promise<string[]> {
    const urls: string[] = [];
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
      urls.push(`/api/news/files/${saved.id}`);
    }
    return urls;
  }

  async findById(id: string): Promise<NewsFileEntity> {
    const file = await this.files.findOne({ where: { id } });
    if (!file) throw new NotFoundException('FILE_NOT_FOUND');
    return file;
  }
}
