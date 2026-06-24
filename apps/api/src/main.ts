import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { PrismaExceptionFilter } from './shared/filters/prisma-exception.filter';

async function bootstrap() {
  const frontUrl = process.env.FRONT_URL;
  if (!frontUrl) throw new Error('FRONT_URL environment variable is not set');

  const app = await NestFactory.create(AppModule);
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
    origin: frontUrl,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
