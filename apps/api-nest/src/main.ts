import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './interface/app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

function parseOrigins(raw: string | undefined, fallback: string[]): string[] {
  const value = (raw ?? '').trim();
  if (!value) return fallback;

  const origins = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return origins.length ? origins : fallback;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  const portRaw = config.get<string>('PORT') ?? '3001';
  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${JSON.stringify(portRaw)}`);
  }

  const origins = parseOrigins(config.get<string>('FRONTEND_ORIGIN'), ['http://localhost:3000']);
  const isProd = (config.get<string>('NODE_ENV') ?? 'development') === 'production';

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.use(cookieParser());

  if (isProd) {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableShutdownHooks();

  await app.listen(port);
  Logger.log(`API up: http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(
    `CORS origins: ${origins.join(', ')} | NODE_ENV=${isProd ? 'production' : 'development'}`,
    'Bootstrap',
  );
}

void bootstrap().catch((err) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  Logger.error(message, undefined, 'Bootstrap');
  process.exit(1);
});
