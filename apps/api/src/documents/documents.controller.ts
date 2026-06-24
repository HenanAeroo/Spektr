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

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

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

  @Get()
  findAll(@CurrentUser() user: UserModel) {
    return this.documentsService.findAll(user.id);
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: UserModel,
  ) {
    return this.documentsService.findForUser(userId, user);
  }

  @Get(':id/url')
  getDownloadUrl(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserModel,
  ) {
    return this.documentsService.getDownloadUrl(id, user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserModel,
  ) {
    return this.documentsService.remove(id, user.id);
  }

  @Get('admin/pending-reviews')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getPendingReviews(@CurrentUser() user: UserModel) {
    return this.documentsService.getPendingReviews(user);
  }

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
