import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class MonitoringMiddleware implements NestMiddleware {
  private readonly logger = new Logger(MonitoringMiddleware.name);

  constructor(private monitoring: MonitoringService) {}

  private normalizeRoute(path: string): string {
    let normalized = path.replace(/\/[0-9a-f-]{36}/gi, '/:id');
    normalized = normalized.replace(/\/\d+/g, '/:id');
    return normalized;
  }

  private shouldExcludeRoute(path: string): boolean {
    return path === '/metrics' || path === '/api/metrics';
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (this.shouldExcludeRoute(req.path)) {
      return next();
    }

    const startTimeMs = Date.now();
    const normalizedRoute = this.normalizeRoute(req.path);
    const monitoring = this.monitoring;

    const originalSend = res.send.bind(res);

    res.send = function (this: Response, data: any) {
      const durationMs = Date.now() - startTimeMs;
      const durationSeconds = durationMs / 1000;
      const statusCode = this.statusCode;

      monitoring.recordHttpRequest(
        req.method,
        normalizedRoute,
        statusCode,
        durationSeconds,
      );

      return originalSend(data);
    };

    next();
  }
}
