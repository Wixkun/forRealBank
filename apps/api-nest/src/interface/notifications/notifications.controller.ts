import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Inject,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable, interval, from, map } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SendNotificationUseCase } from '@forreal/application';
import { MarkNotificationReadUseCase } from '@forreal/application';
import { ListNotificationsByUserUseCase } from '@forreal/application';

@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(SendNotificationUseCase)
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    @Inject(MarkNotificationReadUseCase)
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    @Inject(ListNotificationsByUserUseCase)
    private readonly listNotificationsByUserUseCase: ListNotificationsByUserUseCase,
  ) {}

  @Post()
  async send(@Body() body: { userId: string; title: string; content: string; type: string }) {
    return this.sendNotificationUseCase.execute(body);
  }

  @Post(':id/read')
  async markRead(@Param('id') id: string) {
    return this.markNotificationReadUseCase.execute({ notificationId: id });
  }

  @Get('user/:userId')
  async listByUser(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.listNotificationsByUserUseCase.execute({
      userId,
      limit: limit ? +limit : 50,
      offset: offset ? +offset : 0,
    });
  }

  @Sse('stream/:userId')
  stream(@Param('userId') userId: string): Observable<MessageEvent> {
    return interval(3000).pipe(
      switchMap(() =>
        from(
          this.listNotificationsByUserUseCase.execute({
            userId,
            limit: 10,
            offset: 0,
          }),
        ),
      ),
      map((notifications) => ({ data: notifications })),
    );
  }
}
