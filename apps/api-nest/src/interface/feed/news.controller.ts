import {
  Controller, Get, Post, Body, Param, Query, Inject,
  Sse, Delete, UseGuards, Req, BadRequestException, Patch, HttpCode,
} from '@nestjs/common';
import { Observable, interval, map, switchMap, merge } from 'rxjs';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '@forreal/domain';
import type { Request } from 'express';

@Controller('news')
export class NewsController {
  constructor(@Inject(NewsService) private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADVISOR, RoleName.DIRECTOR)
  async create(@Body() body: { title: string; content: string }, @Req() req: Request) {
    const auth = (req as any).auth;
    if (!auth?.userId) throw new BadRequestException('Missing auth context');
    return this.newsService.createNews(auth.userId, body.title, body.content);
  }

  @Get()
  @UseGuards(OptionalJwtGuard)
  async list(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Req() req?: Request,
  ) {
    const userId = (req as any)?.auth?.userId ?? null;
    return this.newsService.listNews(limit ? +limit : 20, offset ? +offset : 0, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req: Request) {
    const auth = (req as any).auth;
    return this.newsService.deleteNews(id, auth?.userId);
  }

  @HttpCode(200)
  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  async archive(@Param('id') id: string) {
    return this.newsService.archiveNews(id);
  }

  @HttpCode(200)
  @Post(':id/unarchive')
  @UseGuards(JwtAuthGuard)
  async unarchive(@Param('id') id: string) {
    return this.newsService.unarchiveNews(id);
  }

  @HttpCode(200)
  @Post(':id/dismiss')
  @UseGuards(JwtAuthGuard)
  async dismiss(@Param('id') id: string, @Req() req: Request) {
    const auth = (req as any).auth;
    if (!auth?.userId) throw new BadRequestException('Missing auth context');
    return this.newsService.dismissNews(id, auth.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADVISOR, RoleName.DIRECTOR)
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string },
    @Req() req: Request,
  ) {
    const auth = (req as any).auth;
    if (!auth?.userId) throw new BadRequestException('Missing auth context');
    return this.newsService.updateNews(id, { title: body.title, content: body.content });
  }

  @Sse('stream')
  @UseGuards(OptionalJwtGuard)
  stream(@Req() req: Request): Observable<MessageEvent> {
    const userId = (req as any)?.auth?.userId ?? null;
    return merge(
      this.newsService.getNewsChangeObservable(),
      interval(5000).pipe(switchMap(async () => this.newsService.listNews(20, 0, userId))),
    ).pipe(map((news) => ({ data: news }) as MessageEvent));
  }
}
