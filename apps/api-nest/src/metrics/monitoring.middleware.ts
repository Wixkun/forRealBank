import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class MonitoringMiddleware implements NestMiddleware {
  constructor(private monitoring: MonitoringService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Normalize endpoint path (remove IDs to group similar requests)
    let endpoint = req.path;
    endpoint = endpoint.replace(/\/[0-9a-f-]{36}/g, '/:id');
    endpoint = endpoint.replace(/\/\d+/g, '/:id');

    const originalSend = res.send.bind(res);
    const monitoring = this.monitoring;

    res.send = function (this: Response, data: any) {
      const duration = Date.now() - startTime;
      const statusCode = this.statusCode;

      // Record HTTP request
      monitoring.recordHttpRequest(
        req.method,
        endpoint,
        statusCode,
        duration,
      );

      return originalSend(data);
    };

    next();
  }
}
