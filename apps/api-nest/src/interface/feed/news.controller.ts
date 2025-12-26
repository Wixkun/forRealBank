import { Controller, Get, Post, Body, Param, Query, Inject, Sse } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';
import { CreateNewsUseCase } from '@forreal/application/feed/usecases/CreateNewsUseCase';
import { ListNewsUseCase } from '@forreal/application/feed/usecases/ListNewsUseCase';
import { DeleteNewsUseCase } from '@forreal/application/feed/usecases/DeleteNewsUseCase';

@Controller('news')
export class NewsController {
  constructor(
    @Inject(CreateNewsUseCase) private readonly createNewsUseCase: CreateNewsUseCase,
    @Inject(ListNewsUseCase) private readonly listNewsUseCase: ListNewsUseCase,
    @Inject(DeleteNewsUseCase) private readonly deleteNewsUseCase: DeleteNewsUseCase,
  ) {}

  @Post()
  async create(@Body() body: { authorId: string; title: string; content: string }) {
    return this.createNewsUseCase.execute(body);
  }

  @Get()
  async list(@Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.listNewsUseCase.execute({ limit: limit ? +limit : 20, offset: offset ? +offset : 0 });
  }

  @Get(':id')
  async delete(@Param('id') id: string) {
    return this.deleteNewsUseCase.execute({ newsId: id });
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return interval(5000).pipe(
      map(async () => {
        const news = await this.listNewsUseCase.execute({ limit: 10, offset: 0 });
        return { data: news } as MessageEvent;
      }),
      map((promise) => promise as any),
    );
  }
}
