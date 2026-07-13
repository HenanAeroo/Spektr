import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService {
  private client!: Minio.Client;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = new Minio.Client({
      endPoint: this.config.getOrThrow('R2_ENDPOINT'),
      port: parseInt(this.config.getOrThrow('R2_PORT')),
      useSSL: this.config.get('R2_USE_SSL') === 'true',
      accessKey: this.config.getOrThrow('R2_ACCESS_KEY'),
      secretKey: this.config.getOrThrow('R2_SECRET_KEY'),
    });
  }

  uploadFile(
    objectName: string,
    buffer: Buffer,
    size: number,
    mimeType: string,
  ) {
    return this.client.putObject(
      this.config.getOrThrow('R2_BUCKET'),
      objectName,
      buffer,
      size,
      { 'Content-Type': mimeType },
    );
  }

  getPresignedUrl(objectName: string, expirySeconds: number): Promise<string> {
    return this.client.presignedGetObject(
      this.config.getOrThrow('R2_BUCKET'),
      objectName,
      expirySeconds,
    );
  }

  deleteFile(objectName: string): Promise<void> {
    return this.client.removeObject(
      this.config.getOrThrow('R2_BUCKET'),
      objectName,
    );
  }
}
