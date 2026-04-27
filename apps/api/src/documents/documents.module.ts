import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { MinioService } from '../minio/minio.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, MinioService],
})
export class DocumentsModule {}
