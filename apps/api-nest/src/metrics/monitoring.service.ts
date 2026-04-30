import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Counter,
  Histogram,
  register,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MonitoringService implements OnModuleInit {
  private httpRequestsTotal: Counter;
  private httpRequestDuration: Histogram;
  private authLoginTotal: Counter;
  private appErrorsTotal: Counter;
  private databaseQueriesTotal: Counter;

  constructor() {
    this.httpRequestsTotal = this.getOrCreateCounter(
      'http_requests_total',
      'Total number of HTTP requests',
      ['method', 'route', 'status_code'],
    );

    this.httpRequestDuration = this.getOrCreateHistogram(
      'http_request_duration_seconds',
      'HTTP request duration in seconds',
      ['method', 'route', 'status_code'],
      [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    );

    this.authLoginTotal = this.getOrCreateCounter(
      'auth_login_total',
      'Total number of login attempts',
      ['status'],
    );

    this.appErrorsTotal = this.getOrCreateCounter(
      'app_errors_total',
      'Total number of application errors',
      ['type'],
    );

    this.databaseQueriesTotal = this.getOrCreateCounter(
      'database_queries_total',
      'Total number of database queries',
      ['status'],
    );
  }

  onModuleInit() {
    try {
      collectDefaultMetrics({ register });
    } catch {
      // Les métriques par défaut sont peut-être déjà collectées
      // Ne pas lever d'erreur, continuer silencieusement
    }
  }

  private getOrCreateCounter(
    name: string,
    help: string,
    labelNames: string[],
  ): Counter {
    const existing = register.getSingleMetric(name);
    if (existing) {
      return existing as Counter;
    }
    return new Counter({
      name,
      help,
      labelNames,
      registers: [register],
    });
  }

  private getOrCreateHistogram(
    name: string,
    help: string,
    labelNames: string[],
    buckets: number[],
  ): Histogram {
    const existing = register.getSingleMetric(name);
    if (existing) {
      return existing as Histogram;
    }
    return new Histogram({
      name,
      help,
      labelNames,
      buckets,
      registers: [register],
    });
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const statusCodeStr = String(statusCode);

    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCodeStr,
    });

    this.httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCodeStr,
      },
      durationSeconds,
    );
  }

  recordLoginAttempt(status: 'success' | 'failure'): void {
    this.authLoginTotal.inc({
      status,
    });
  }

  recordAuthAttempt(endpoint: string, success: boolean): void {
    this.recordLoginAttempt(success ? 'success' : 'failure');
  }

  recordAppError(type: string): void {
    this.appErrorsTotal.inc({
      type,
    });
  }

  recordDatabaseQuery(status: 'success' | 'error'): void {
    this.databaseQueriesTotal.inc({
      status,
    });
  }
}
