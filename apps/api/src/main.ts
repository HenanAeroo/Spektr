import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LogLevel, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { PrismaExceptionFilter } from './shared/filters/prisma-exception.filter';

async function bootstrap() {
  const frontUrl = process.env.FRONT_URL;
  if (!frontUrl) throw new Error('FRONT_URL environment variable is not set');

  let logLevels: LogLevel[];

  if (process.env.NODE_ENV === 'production') {
    logLevels = ['warn', 'error'];
  } else {
    logLevels = ['log', 'debug', 'verbose', 'warn', 'error'];
  }

  const app = await NestFactory.create(AppModule, { logger: logLevels });
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONT_URL,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
