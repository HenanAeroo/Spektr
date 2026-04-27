import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User as UserModel } from '../../prisma/generated/prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId: string | undefined,
    @CurrentUser() user: UserModel,
  ) {
    return this.documentsService.upload(
      file,
      folderId ? parseInt(folderId) : undefined,
      user.id,
    );
  }

  @Get()
  findAll(@CurrentUser() user: UserModel) {
    return this.documentsService.findAll(user.id);
  }

  @Get(':id/url')
  getDownloadUrl(@Param('id') id: string, @CurrentUser() user: UserModel) {
    return this.documentsService.getDownloadUrl(parseInt(id), user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: UserModel) {
    return this.documentsService.remove(parseInt(id), user.id);
  }
}
