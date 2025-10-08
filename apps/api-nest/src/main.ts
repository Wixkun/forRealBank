import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './interface/app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  const port = config.get<number>('PORT', 3001);
  const origin = config.get<string>('FRONTEND_ORIGIN', 'http://localhost:3000');
  const isProd = (config.get<string>('NODE_ENV') ?? 'development') === 'production';

  app.setGlobalPrefix('api');

  app.enableCors({
    origin,
    credentials: true,
  });

  app.use(cookieParser());
  app.use(helmet());

  if (isProd) {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);
  }

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.enableShutdownHooks();

  await app.listen(port);
  Logger.log(`API up: http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`CORS origin: ${origin} | NODE_ENV=${isProd ? 'production' : 'development'}`, 'Bootstrap');
}

bootstrap();
