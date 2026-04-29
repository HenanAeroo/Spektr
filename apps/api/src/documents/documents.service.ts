import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import 'multer';
import { NotificationsService } from '../notifications/notifications.service';
import { NotifType } from '../../prisma/generated/prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async upload(
    file: Express.Multer.File,
    folderId: number | undefined,
    userId: number,
  ) {
    const storageKey = `${userId}/${Date.now()}-${file.originalname}`;
    await this.minio.uploadFile(
      storageKey,
      file.buffer,
      file.size,
      file.mimetype,
    );
    const doc = await this.prisma.document.create({
      data: {
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey,
        folderId,
        userId,
      },
    });

    await this.notificationsService.createAndEmit(
      userId,
      NotifType.DOCUMENT_ADDED,
      { documentName: file.originalname },
    );

    return doc;
  }

  findAll(userId: number) {
    return this.prisma.document.findMany({ where: { userId } });
  }

  async getDownloadUrl(id: number, userId: number) {
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });

    if (!doc) throw new NotFoundException();

    const url = await this.minio.getPresignedUrl(doc.storageKey, 3600);

    return { url };
  }

  async remove(id: number, userId: number) {
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });

    if (!doc) throw new NotFoundException();
    await this.minio.deleteFile(doc.storageKey);

    return this.prisma.document.delete({ where: { id } });
  }
}
