import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Query,
  Inject,
  UseGuards,
  Req,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListNotificationsByUserUseCase } from '@forreal/application';
import { GetUnreadCountUseCase } from '@forreal/application';
import { MarkNotificationReadUseCase } from '@forreal/application';
import { MarkAllNotificationsReadUseCase } from '@forreal/application';
import { DeleteNotificationUseCase } from '@forreal/application';

function extractUserId(req: Request): string {
  const userId = (req as any).auth?.userId ?? (req as any).user?.id ?? null;
  if (!userId) throw new BadRequestException('Missing auth context');
  return userId as string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(ListNotificationsByUserUseCase)
    private readonly listUC: ListNotificationsByUserUseCase,
    @Inject(GetUnreadCountUseCase)
    private readonly unreadCountUC: GetUnreadCountUseCase,
    @Inject(MarkNotificationReadUseCase)
    private readonly markReadUC: MarkNotificationReadUseCase,
    @Inject(MarkAllNotificationsReadUseCase)
    private readonly markAllReadUC: MarkAllNotificationsReadUseCase,
    @Inject(DeleteNotificationUseCase)
    private readonly deleteUC: DeleteNotificationUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Req() req: Request,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const userId = extractUserId(req);
    return this.listUC.execute({
      userId,
      limit: limit ? +limit : 50,
      offset: offset ? +offset : 0,
    });
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@Req() req: Request) {
    const userId = extractUserId(req);
    return this.unreadCountUC.execute({ userId });
  }

  @HttpCode(200)
  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  async markAllRead(@Req() req: Request) {
    const userId = extractUserId(req);
    return this.markAllReadUC.execute({ userId });
  }

  @HttpCode(200)
  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markRead(@Param('id') id: string, @Req() req: Request) {
    const userId = extractUserId(req);
    return this.markReadUC.execute({ notificationId: id, userId });
  }

  @HttpCode(200)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req: Request) {
    const userId = extractUserId(req);
    return this.deleteUC.execute({ notificationId: id, userId });
  }
}
