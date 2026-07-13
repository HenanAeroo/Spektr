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
  Role,
} from '../../prisma/generated/prisma/client';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { PromoAccessService, Requester } from '../promos/promo-access.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly notificationsService: NotificationsService,
    private readonly promoAccess: PromoAccessService,
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

    void this.notificationsService
      .createAndEmit(userId, NotifType.DOCUMENT_ADDED, {
        documentName: file.originalname,
      })
      .catch(() => {});

    return doc;
  }

  findAll(userId: number) {
    return this.prisma.document.findMany({ where: { userId } });
  }

  /**
   * Admin listing of another user's documents — scoped to promos the requester
   * administers (AC-02). SUPER_ADMIN bypasses.
   */
  async findForUser(targetUserId: number, requester: Requester) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { promoId: true },
    });
    if (!target) throw new NotFoundException();
    await this.promoAccess.assertAdministersPromo(requester, target.promoId);
    return this.prisma.document.findMany({ where: { userId: targetUserId } });
  }

  async getDownloadUrl(id: number, requester: Requester) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { user: { select: { promoId: true } } },
    });
    if (!doc) throw new NotFoundException();

    // Owner can always download; otherwise the requester must administer the
    // owner's promo (AC-01). A non-admin third party is rejected here.
    if (doc.userId !== requester.id) {
      await this.promoAccess.assertAdministersPromo(
        requester,
        doc.user.promoId,
      );
    }

    const url = await this.minio.getPresignedUrl(doc.storageKey, 3600);
    return { url };
  }

  async remove(id: number, userId: number) {
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });

    if (!doc) throw new NotFoundException();

    await this.prisma.document.delete({ where: { id } });
    await this.minio.deleteFile(doc.storageKey);
  }

  async review(id: number, dto: ReviewDocumentDto, requester: Requester) {
    const existing = await this.prisma.document.findUnique({
      where: { id },
      include: { user: { select: { promoId: true } } },
    });
    if (!existing) throw new NotFoundException();
    await this.promoAccess.assertAdministersPromo(
      requester,
      existing.user.promoId,
    );

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

    void this.notificationsService
      .createAndEmit(doc.userId, NotifType.DOCUMENT_REVIEW, {
        documentName: doc.name,
        status: dto.status,
        docType: doc.docType,
      })
      .catch(() => {});

    return doc;
  }

  getPendingReviews(requester: Requester) {
    // Only surface CV/LM awaiting review for promos the requester administers (AC-03).
    const promoScope =
      requester.role === Role.SUPER_ADMIN
        ? {}
        : {
            user: {
              promo: { adminPromos: { some: { adminId: requester.id } } },
            },
          };

    return this.prisma.document.findMany({
      where: {
        docType: { in: ['CV', 'LM'] },
        status: { in: ['PENDING', 'TO_CORRECT'] },
        ...promoScope,
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
