import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import {
  DocumentType,
  NotifType,
} from '../../prisma/generated/prisma/client';
import { ReviewDocumentDto } from './dto/review-document.dto';

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
    docType?: DocumentType,
  ) {
    const ext = extname(file.originalname)
      .replace(/[^a-zA-Z0-9.]/g, '')
      .toLowerCase();
    const safeFilename = `${randomUUID()}${ext}`;
    const storageKey = `${userId}/${Date.now()}-${safeFilename}`;
    await this.minio.uploadFile(
      storageKey,
      file.buffer,
      file.size,
      file.mimetype,
    );
    const doc = await this.prisma.document.create({
      data: {
        name: file.originalname.replace(/[<>"'/\\]/g, '_'),
        mimeType: file.mimetype,
        size: file.size,
        storageKey,
        folderId,
        userId,
        ...(docType ? { docType } : {}),
      },
    });

    try {
      await this.notificationsService.createAndEmit(
        userId,
        NotifType.DOCUMENT_ADDED,
        { documentName: file.originalname },
      );
    } catch {
      // notification failure must not fail the upload
    }

    return doc;
  }

  findAll(userId: number) {
    return this.prisma.document.findMany({ where: { userId } });
  }

  async getDownloadUrl(id: number, userId?: number) {
    const doc = await this.prisma.document.findFirst({
      where: userId !== undefined ? { id, userId } : { id },
    });

    if (!doc) throw new NotFoundException();

    const url = await this.minio.getPresignedUrl(doc.storageKey, 3600);

    return { url };
  }

  async remove(id: number, userId: number) {
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });

    if (!doc) throw new NotFoundException();

    await this.prisma.document.delete({ where: { id } });
    await this.minio.deleteFile(doc.storageKey);
  }

  async review(id: number, dto: ReviewDocumentDto) {
    const doc = await this.prisma.document.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.docType ? { docType: dto.docType } : {}),
      },
      include: {
        user: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    try {
      await this.notificationsService.createAndEmit(
        doc.userId,
        NotifType.DOCUMENT_REVIEW,
        {
          documentName: doc.name,
          status: dto.status,
          docType: doc.docType,
        },
      );
    } catch {
      // notification failure must not fail the review
    }

    return doc;
  }

  getPendingReviews() {
    return this.prisma.document.findMany({
      where: {
        docType: { in: ['CV', 'LM'] },
        status: { in: ['PENDING', 'TO_CORRECT'] },
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            promoId: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
