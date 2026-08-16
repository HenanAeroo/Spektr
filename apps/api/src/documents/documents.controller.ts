import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User as UserModel } from '../../prisma/generated/prisma/client';
import { DocumentType, Role } from '../../prisma/generated/prisma/client';
import { ReviewDocumentDto } from './dto/review-document.dto';

/**
 * Document endpoints under `/documents`: upload, list, presigned download,
 * delete, and the admin review queue. All routes require a JWT; admin routes
 * add {@link RolesGuard}.
 */
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /** Whitelist of MIME types accepted by the upload endpoint. */
  private static readonly ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ]);

  /**
   * `POST /documents/upload` — uploads a document (max 10 MB, whitelisted MIME
   * types) for the caller, optionally into a folder and with a semantic type.
   *
   * @param file - The uploaded file (multipart `file`).
   * @param folderId - Optional destination folder id (string form field).
   * @param docType - Optional document type (validated against the enum).
   * @param user - The authenticated owner (injected).
   * @throws BadRequestException When the file is missing or the type disallowed.
   * @returns The created document row.
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (
        _req: unknown,
        file: Express.Multer.File,
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (DocumentsController.ALLOWED_MIME_TYPES.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Type de fichier non autorisé : ${file.mimetype}`,
            ),
            false,
          );
        }
      },
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId: string | undefined,
    @Body('docType') docType: string | undefined,
    @CurrentUser() user: UserModel,
  ) {
    if (!file) throw new BadRequestException('Fichier manquant');
    const validTypes = Object.values(DocumentType);
    const parsedDocType =
      docType && validTypes.includes(docType as DocumentType)
        ? (docType as DocumentType)
        : undefined;
    return this.documentsService.upload(
      file,
      folderId ? parseInt(folderId) : undefined,
      user.id,
      parsedDocType,
    );
  }

  /**
   * `GET /documents` — lists the caller's own documents.
   *
   * @param user - The authenticated owner (injected).
   * @returns The user's documents.
   */
  @Get()
  findAll(@CurrentUser() user: UserModel) {
    return this.documentsService.findAll(user.id);
  }

  /**
   * `GET /documents/user/:userId` — admin-only; lists a student's documents,
   * scoped to the caller's promos.
   *
   * @param userId - Target student id (path).
   * @param user - The authenticated admin (injected).
   * @returns The target user's documents.
   */
  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: UserModel,
  ) {
    return this.documentsService.findForUser(userId, user);
  }

  /**
   * `GET /documents/:id/url` — returns a short-lived presigned download URL.
   * Owner or an admin of the owner's promo only.
   *
   * @param id - Document id (path).
   * @param user - The authenticated caller (injected).
   * @returns `{ url }` presigned download link.
   */
  @Get(':id/url')
  getDownloadUrl(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserModel,
  ) {
    return this.documentsService.getDownloadUrl(id, user);
  }

  /**
   * `DELETE /documents/:id` — deletes an owned document (DB + storage).
   *
   * @param id - Document id (path).
   * @param user - The authenticated owner (injected).
   */
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserModel,
  ) {
    return this.documentsService.remove(id, user.id);
  }

  /**
   * `GET /documents/admin/pending-reviews` — admin-only; CV/LM awaiting review
   * across the caller's promos.
   *
   * @param user - The authenticated admin (injected).
   * @returns The pending documents.
   */
  @Get('admin/pending-reviews')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getPendingReviews(@CurrentUser() user: UserModel) {
    return this.documentsService.getPendingReviews(user);
  }

  /**
   * `PATCH /documents/:id/review` — admin-only; records a review verdict and
   * notifies the student.
   *
   * @param id - Document id (path).
   * @param dto - Review status and optional type.
   * @param user - The authenticated admin (injected).
   * @returns The updated document.
   */
  @Patch(':id/review')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewDocumentDto,
    @CurrentUser() user: UserModel,
  ) {
    return this.documentsService.review(id, dto, user);
  }
}
