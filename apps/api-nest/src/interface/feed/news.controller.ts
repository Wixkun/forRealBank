import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Inject,
  Sse,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
  Res,
  BadRequestException,
  NotFoundException,
  Patch,
  HttpCode,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request as ExpressRequest, Response } from 'express';
import { Observable, filter, interval, map, switchMap, merge } from 'rxjs';
import { NewsService } from './news.service';
import { NewsFilesService } from './news-files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '@forreal/domain';
import type { Request } from 'express';
import { CreateNewsDto, UpdateNewsDto } from './dto/news.dto';

const IMAGE_MIME_TYPES = /^image\/(jpeg|png|gif|webp)$/;

// `image` : champ legacy (une seule image hors contenu)
// `images` : images intégrées au contenu, référencées par `(cid:N)` dans le texte
// Stockage en mémoire puis en base : en cluster (replicas sans volume
// partagé), le disque local d'une instance n'est pas visible des autres.
const newsImageInterceptor = FileFieldsInterceptor(
  [
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ],
  {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (
      _req: ExpressRequest,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!IMAGE_MIME_TYPES.test(file.mimetype)) {
        cb(new BadRequestException('INVALID_IMAGE_TYPE'), false);
        return;
      }
      cb(null, true);
    },
  },
);

// RolesGuard peuple req.auth.userId (lookup DB complet).
// JwtAuthGuard seul peuple req.user.id (payload JWT, pas de DB).
function extractUserId(req: Request): string {
  const userId = (req as any).auth?.userId ?? (req as any).user?.id ?? null;
  if (!userId) throw new BadRequestException('Missing auth context');
  return userId as string;
}

function optionalUserId(req: Request): string | null {
  return (req as any).auth?.userId ?? (req as any).user?.id ?? null;
}

type NewsUploadedFiles = { image?: Express.Multer.File[]; images?: Express.Multer.File[] };

// Le front référence les images inline par `(cid:N)` (index dans le champ `images`) ;
// une fois les fichiers stockés, on substitue leur URL publique dans le contenu.
function resolveInlineImages(content: string, imageUrls: string[]): string {
  return (content ?? '').replace(/\(cid:(\d+)\)/g, (match, idx: string) => {
    const url = imageUrls[Number(idx)];
    return url ? `(${url})` : match;
  });
}

@Controller('news')
export class NewsController {
  constructor(
    @Inject(NewsService) private readonly newsService: NewsService,
    @Inject(NewsFilesService) private readonly newsFilesService: NewsFilesService,
  ) {}

  // ─── Création manuelle (DIRECTOR / ADVISOR uniquement) ───────────────────

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADVISOR, RoleName.DIRECTOR)
  @UseInterceptors(newsImageInterceptor)
  async createManual(
    @Body() body: CreateNewsDto,
    @UploadedFiles() files: NewsUploadedFiles | undefined,
    @Req() req: Request,
  ) {
    const userId = extractUserId(req);
    const { imageUrl, inlineUrls } = await this.storeNewsImages(files, userId);
    const content = resolveInlineImages(body.content, inlineUrls);
    return this.newsService.createManualNews(
      userId,
      body.title,
      content,
      body.status,
      imageUrl,
      body.subtitle?.trim() || null,
    );
  }

  // Stocke en base l'image legacy et les images inline ; retourne leurs URLs.
  private async storeNewsImages(files: NewsUploadedFiles | undefined, userId: string) {
    const legacyImage = files?.image?.[0];
    const [legacyUrl] = legacyImage
      ? await this.newsFilesService.saveAll([legacyImage], userId)
      : [];
    const inlineUrls = files?.images?.length
      ? await this.newsFilesService.saveAll(files.images, userId)
      : [];
    return { imageUrl: legacyUrl ?? null, inlineUrls };
  }

  // ─── Lecture d'une image (public, comme l'ancien statique /uploads/news) ─

  @Get('files/:id')
  async getFile(@Param('id') id: string, @Res() res: Response) {
    const file = await this.newsFilesService.findById(id);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.data.length),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(file.data);
  }

  // ─── Lecture du fil ──────────────────────────────────────────────────────
  // Liste filtrée par utilisateur (news publiques + SES news privées) ;
  // `archivedOnly=true` renvoie ses news archivées.
  @Get()
  @UseGuards(OptionalJwtGuard)
  async list(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('includeArchived') includeArchived?: string,
    @Query('archivedOnly') archivedOnly?: string,
    @Req() req?: Request,
  ) {
    const userId = optionalUserId(req!);
    return this.newsService.listNews(
      limit ? +limit : 20,
      offset ? +offset : 0,
      userId,
      includeArchived === 'true',
      archivedOnly === 'true',
    );
  }

  // ─── Actions utilisateur (per-user, ne modifient jamais la news globale) ─

  @HttpCode(200)
  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  async archive(@Param('id') id: string, @Req() req: Request) {
    return this.newsService.archiveNews(id, extractUserId(req));
  }

  @HttpCode(200)
  @Post(':id/unarchive')
  @UseGuards(JwtAuthGuard)
  async unarchive(@Param('id') id: string, @Req() req: Request) {
    return this.newsService.unarchiveNews(id, extractUserId(req));
  }

  // « Dismiss » : masque la news pour cet utilisateur uniquement.
  @HttpCode(200)
  @Post(':id/dismiss')
  @UseGuards(JwtAuthGuard)
  async dismiss(@Param('id') id: string, @Req() req: Request) {
    return this.newsService.deleteNewsForUser(id, extractUserId(req));
  }

  // ─── Mise à jour d'une news (DIRECTOR / ADVISOR) ────────────────────────

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADVISOR, RoleName.DIRECTOR)
  async update(@Param('id') id: string, @Body() body: UpdateNewsDto) {
    return this.newsService.updateNews(id, { title: body.title, content: body.content });
  }

  // ─── Désactivation globale (DIRECTOR uniquement) ─────────────────────────

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.DIRECTOR)
  async deactivate(@Param('id') id: string) {
    return this.newsService.deactivateNews(id);
  }

  // ─── SSE stream ──────────────────────────────────────────────────────────

  @Sse('stream')
  @UseGuards(OptionalJwtGuard)
  stream(@Req() req: Request): Observable<MessageEvent> {
    const userId = optionalUserId(req);
    // Confidentialité : le flux n'envoie jamais de payload brut partagé.
    // Chaque connexion relit SA liste (filtrée par userId côté serveur),
    // déclenchée par un signal ciblé (news privée → destinataire seul,
    // changement public → tout le monde) ou par le poll de secours.
    return merge(
      this.newsService
        .getNewsChangeObservable()
        .pipe(filter((event) => event.userId === null || event.userId === userId)),
      interval(5000),
    ).pipe(
      switchMap(async () => this.newsService.listNews(20, 0, userId)),
      map((news) => ({ data: news }) as MessageEvent),
    );
  }

  // ─── Lecture d'une news par id (déclaré en dernier : ':id' est un catch-all) ─

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOne(@Param('id') id: string, @Req() req: Request) {
    const news = await this.newsService.getNewsById(id, extractUserId(req));
    if (!news) throw new NotFoundException('NEWS_NOT_FOUND');
    return news;
  }
}
