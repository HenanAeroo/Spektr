import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

/**
 * Thin wrapper over the MinIO/S3 client (Cloudflare R2) for document storage:
 * upload, presigned download URLs and delete. The client is created lazily in
 * {@link MinioService.onModuleInit} from `R2_*` config.
 */
@Injectable()
export class MinioService {
  private client!: Minio.Client;

  constructor(private readonly config: ConfigService) {}

  /**
   * Initializes the MinIO client from `R2_*` environment configuration once the
   * module is ready.
   */
  onModuleInit() {
    this.client = new Minio.Client({
      endPoint: this.config.getOrThrow('R2_ENDPOINT'),
      port: parseInt(this.config.getOrThrow('R2_PORT')),
      useSSL: this.config.get('R2_USE_SSL') === 'true',
      accessKey: this.config.getOrThrow('R2_ACCESS_KEY'),
      secretKey: this.config.getOrThrow('R2_SECRET_KEY'),
    });
  }

  /**
   * Uploads an object to the configured bucket.
   *
   * @param objectName - Storage key for the object.
   * @param buffer - The file contents.
   * @param size - Size of the buffer in bytes.
   * @param mimeType - Content-Type stored with the object.
   * @returns The put-object result from MinIO.
   */
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

  /**
   * Generates a time-limited presigned GET URL for an object.
   *
   * @param objectName - Storage key of the object.
   * @param expirySeconds - Link lifetime in seconds.
   * @returns The presigned download URL.
   */
  getPresignedUrl(objectName: string, expirySeconds: number): Promise<string> {
    return this.client.presignedGetObject(
      this.config.getOrThrow('R2_BUCKET'),
      objectName,
      expirySeconds,
    );
  }

  /**
   * Removes an object from the configured bucket.
   *
   * @param objectName - Storage key of the object to delete.
   */
  deleteFile(objectName: string): Promise<void> {
    return this.client.removeObject(
      this.config.getOrThrow('R2_BUCKET'),
      objectName,
    );
  }
}
