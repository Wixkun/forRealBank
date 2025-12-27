import { Controller, Get, Post, Body, Param, Query, Inject, Sse, Delete } from '@nestjs/common';
import { Observable, interval, map, switchMap, merge } from 'rxjs';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(
    @Inject(NewsService) private readonly newsService: NewsService,
  ) {}

  @Post()
  async create(@Body() body: { authorId: string; title: string; content: string }) {
    return this.newsService.createNews(body.authorId, body.title, body.content);
  }

  @Get()
  async list(@Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.newsService.listNews(limit ? +limit : 20, offset ? +offset : 0);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.newsService.deleteNews(id);
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return merge(
      this.newsService.getNewsChangeObservable(),
      interval(5000).pipe(
        switchMap(async () => this.newsService.listNews(10, 0)),
      ),
    ).pipe(
      map((news) => ({ data: news } as MessageEvent)),
    );
  }
}
