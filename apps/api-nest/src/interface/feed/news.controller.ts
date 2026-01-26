import { Controller, Get, Post, Body, Param, Query, Inject, Sse, Delete, UseGuards, Req, BadRequestException, Patch } from '@nestjs/common';
import { Observable, interval, map, switchMap, merge } from 'rxjs';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
  async list(@Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.newsService.listNews(limit ? +limit : 20, offset ? +offset : 0);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADVISOR, RoleName.DIRECTOR)
  async delete(@Param('id') id: string) {
    return this.newsService.deleteNews(id);
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
  stream(): Observable<MessageEvent> {
    return merge(
      this.newsService.getNewsChangeObservable(),
      interval(5000).pipe(switchMap(async () => this.newsService.listNews(10, 0))),
    ).pipe(map((news) => ({ data: news }) as MessageEvent));
  }
}
