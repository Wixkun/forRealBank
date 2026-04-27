import { Injectable } from '@nestjs/common';
import {
  Counter,
  Histogram,
  register,
} from 'prom-client';

@Injectable()
export class MonitoringService {
  private httpRequestsTotal: Counter;
  private httpRequestDuration: Histogram;
  private authAttemptsTotal: Counter;
  private httpErrorsTotal: Counter;

  constructor() {
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests processed',
      labelNames: ['method', 'endpoint', 'status_code'],
      registers: [register],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request latency in milliseconds',
      labelNames: ['method', 'endpoint'],
      buckets: [10, 50, 100, 500, 1000, 2000, 5000],
      registers: [register],
    });

    this.authAttemptsTotal = new Counter({
      name: 'auth_attempts_total',
      help: 'Total authentication attempts',
      labelNames: ['endpoint', 'status'],
      registers: [register],
    });

    this.httpErrorsTotal = new Counter({
      name: 'http_errors_total',
      help: 'Total HTTP errors (4xx, 5xx)',
      labelNames: ['method', 'endpoint', 'status_code'],
      registers: [register],
    });
  }

  recordHttpRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
  ) {
    this.httpRequestsTotal.inc({
      method,
      endpoint,
      status_code: statusCode,
    });

    this.httpRequestDuration.observe({
      method,
      endpoint,
    }, duration);

    if (statusCode >= 400) {
      this.httpErrorsTotal.inc({
        method,
        endpoint,
        status_code: statusCode,
      });
    }
  }

  recordAuthAttempt(endpoint: string, success: boolean) {
    this.authAttemptsTotal.inc({
      endpoint,
      status: success ? 'success' : 'failed',
    });
  }
}
