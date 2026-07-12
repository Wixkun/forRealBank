import { Controller, Get, Inject, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { RoleName } from '@forreal/domain';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.CLIENT, RoleName.ADVISOR, RoleName.DIRECTOR, RoleName.ADMIN)
export class AnalyticsController {
  constructor(@Inject(AnalyticsService) private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview(@Req() req: Request, @Query() query: AnalyticsQueryDto) {
    const auth = (req as any).auth as { userId: string; roles: RoleName[] };
    return this.analytics.overview(auth.userId, auth.roles ?? [], query.months);
  }
}
