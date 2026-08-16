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

/**
 * Manages student documents (CVs, cover letters, misc files): upload to MinIO
 * object storage with sanitized keys, presigned downloads, admin review with
 * notifications, and the pending-review queue. Cross-user access is gated by
 * {@link PromoAccessService}.
 */
@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly notificationsService: NotificationsService,
    private readonly promoAccess: PromoAccessService,
  ) {}

  /**
   * Stores an uploaded file in MinIO under a randomized, per-user storage key,
   * records the Document row (sanitizing the display name) and fires a
   * best-effort "document added" notification.
   *
   * @param file - The uploaded file (Multer): buffer, size, mimetype, name.
   * @param folderId - Optional folder to place the document in.
   * @param userId - Owner of the document.
   * @param docType - Optional semantic type (e.g. CV, LM).
   * @returns The created Document row.
   */
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

  /**
   * Lists the caller's own documents.
   *
   * @param userId - Owner of the documents.
   * @returns The user's documents.
   */
  findAll(userId: number) {
    return this.prisma.document.findMany({ where: { userId } });
  }

  /**
   * Admin listing of another user's documents — scoped to promos the requester
   * administers (AC-02). SUPER_ADMIN bypasses.
   *
   * @param targetUserId - Student whose documents are being listed.
   * @param requester - The calling admin (id + role) for promo scoping.
   * @throws NotFoundException When the target user does not exist.
   * @throws ForbiddenException When the requester doesn't administer the promo.
   * @returns The target user's documents.
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

  /**
   * Returns a short-lived (1h) presigned download URL for a document. The owner
   * may always download; anyone else must administer the owner's promo (AC-01).
   *
   * @param id - Document id.
   * @param requester - The calling user (id + role).
   * @throws NotFoundException When the document does not exist.
   * @throws ForbiddenException When a non-owner doesn't administer the promo.
   * @returns An object holding the presigned `url`.
   */
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

  /**
   * Deletes an owned document from both the database and MinIO storage.
   *
   * @param id - Document id to delete.
   * @param userId - Owner id (scopes the delete).
   * @throws NotFoundException When no owned document matches `id`.
   */
  async remove(id: number, userId: number) {
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });

    if (!doc) throw new NotFoundException();

    await this.prisma.document.delete({ where: { id } });
    await this.minio.deleteFile(doc.storageKey);
  }

  /**
   * Records an admin review of a document (status, optional type reclassification)
   * and notifies the owning student. Requires the requester to administer the
   * student's promo.
   *
   * @param id - Document id being reviewed.
   * @param dto - Review outcome (status) and optional `docType`.
   * @param requester - The reviewing admin (id + role).
   * @throws NotFoundException When the document does not exist.
   * @throws ForbiddenException When the requester doesn't administer the promo.
   * @returns The updated document with basic owner info.
   */
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

  /**
   * Lists CV/LM documents awaiting review (PENDING or TO_CORRECT), scoped to the
   * promos the requester administers (AC-03), newest first.
   *
   * @param requester - The calling admin (id + role).
   * @returns The pending documents with basic owner info.
   */
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
