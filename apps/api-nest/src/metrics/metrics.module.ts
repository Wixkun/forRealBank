import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MonitoringService } from './monitoring.service';

@Module({
  controllers: [MetricsController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MetricsModule {}
