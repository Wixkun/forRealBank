import {
  Controller, Get, Post, Body, Param, Query, Inject,
  Sse, Delete, UseGuards, UseInterceptors, UploadedFiles, Req, BadRequestException, NotFoundException, Patch, HttpCode,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Request as ExpressRequest } from 'express';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Observable, filter, interval, map, switchMap, merge } from 'rxjs';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { type NewsStatus, RoleName } from '@forreal/domain';
import type { Request } from 'express';
import { NEWS_UPLOADS_DIR, buildNewsImageUrl } from './news-uploads.constants';

const IMAGE_MIME_TYPES = /^image\/(jpeg|png|gif|webp)$/;

// `image` : champ legacy (une seule image hors contenu)
// `images` : images intégrées au contenu, référencées par `(cid:N)` dans le texte
const newsImageInterceptor = FileFieldsInterceptor([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 },
], {
  storage: diskStorage({
    destination: NEWS_UPLOADS_DIR,
    filename: (_req: ExpressRequest, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) =>
      cb(null, `${randomUUID()}${extname(file.originalname)}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: ExpressRequest, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (!IMAGE_MIME_TYPES.test(file.mimetype)) {
      cb(new BadRequestException('INVALID_IMAGE_TYPE'), false);
      return;
    }
    cb(null, true);
  },
});

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
function resolveInlineImages(content: string, images: Express.Multer.File[]): string {
  return (content ?? '').replace(/\(cid:(\d+)\)/g, (match, idx: string) => {
    const file = images[Number(idx)];
    return file ? `(${buildNewsImageUrl(file.filename)})` : match;
  });
}

@Controller('news')
export class NewsController {
  constructor(@Inject(NewsService) private readonly newsService: NewsService) {}

  // ─── Création manuelle (DIRECTOR / ADVISOR uniquement) ───────────────────

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADVISOR, RoleName.DIRECTOR)
  @UseInterceptors(newsImageInterceptor)
  async createManual(
    @Body() body: { title: string; subtitle?: string; content: string; status?: NewsStatus },
    @UploadedFiles() files: NewsUploadedFiles | undefined,
    @Req() req: Request,
  ) {
    const userId = extractUserId(req);
    const legacyImage = files?.image?.[0];
    const imageUrl = legacyImage ? buildNewsImageUrl(legacyImage.filename) : null;
    const content = resolveInlineImages(body.content, files?.images ?? []);
    return this.newsService.createManualNews(
      userId, body.title, content, body.status, imageUrl, body.subtitle?.trim() || null,
    );
  }

  // Alias rétrocompatible (ancienne route POST /)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADVISOR, RoleName.DIRECTOR)
  @UseInterceptors(newsImageInterceptor)
  async createLegacy(
    @Body() body: { title: string; subtitle?: string; content: string; status?: NewsStatus },
    @UploadedFiles() files: NewsUploadedFiles | undefined,
    @Req() req: Request,
  ) {
    const userId = extractUserId(req);
    const legacyImage = files?.image?.[0];
    const imageUrl = legacyImage ? buildNewsImageUrl(legacyImage.filename) : null;
    const content = resolveInlineImages(body.content, files?.images ?? []);
    return this.newsService.createManualNews(
      userId, body.title, content, body.status, imageUrl, body.subtitle?.trim() || null,
    );
  }

  // ─── Lecture du fil ──────────────────────────────────────────────────────

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  async getFeed(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Req() req?: Request,
  ) {
    const userId = optionalUserId(req!);
    return this.newsService.listNews(limit ? +limit : 20, offset ? +offset : 0, userId);
  }

  @Get('archived')
  @UseGuards(JwtAuthGuard)
  async getArchived(@Req() req: Request) {
    const userId = optionalUserId(req);
    return this.newsService.listNews(100, 0, userId, false, true);
  }

  // Alias rétrocompatible (ancienne route GET /)
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
  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard)
  async archive(@Param('id') id: string, @Req() req: Request) {
    return this.newsService.archiveNews(id, extractUserId(req));
  }

  // Alias rétrocompatible POST (ancien endpoint)
  @HttpCode(200)
  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  async archiveLegacy(@Param('id') id: string, @Req() req: Request) {
    return this.newsService.archiveNews(id, extractUserId(req));
  }

  @HttpCode(200)
  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard)
  async restore(@Param('id') id: string, @Req() req: Request) {
    return this.newsService.unarchiveNews(id, extractUserId(req));
  }

  // Alias rétrocompatible POST (ancien endpoint /unarchive)
  @HttpCode(200)
  @Post(':id/unarchive')
  @UseGuards(JwtAuthGuard)
  async unarchiveLegacy(@Param('id') id: string, @Req() req: Request) {
    return this.newsService.unarchiveNews(id, extractUserId(req));
  }

  @HttpCode(200)
  @Patch(':id/delete')
  @UseGuards(JwtAuthGuard)
  async deleteForUser(@Param('id') id: string, @Req() req: Request) {
    return this.newsService.deleteNewsForUser(id, extractUserId(req));
  }

  // Alias rétrocompatible POST (ancien endpoint /dismiss)
  @HttpCode(200)
  @Post(':id/dismiss')
  @UseGuards(JwtAuthGuard)
  async dismissLegacy(@Param('id') id: string, @Req() req: Request) {
    return this.newsService.deleteNewsForUser(id, extractUserId(req));
  }

  @HttpCode(200)
  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Param('id') id: string, @Req() req: Request) {
    return this.newsService.markAsRead(id, extractUserId(req));
  }

  // ─── Mise à jour d'une news (DIRECTOR / ADVISOR) ────────────────────────

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADVISOR, RoleName.DIRECTOR)
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string },
  ) {
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
  @UseGuards(OptionalJwtGuard)
  async getOne(@Param('id') id: string) {
    const news = await this.newsService.getNewsById(id);
    if (!news) throw new NotFoundException('NEWS_NOT_FOUND');
    return news;
  }
}
