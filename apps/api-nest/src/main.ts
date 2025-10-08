import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './interface/app.module';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api');
  app.use(cookieParser());
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}
bootstrap();
