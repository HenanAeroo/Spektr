import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User as UserModel } from '../../prisma/generated/prisma/client';

/**
 * Folder endpoints under `/folders` for organizing a user's documents. All
 * routes require a JWT and operate only on the caller's own folders.
 */
@UseGuards(JwtAuthGuard)
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  /**
   * `POST /folders` — creates a folder owned by the caller.
   *
   * @param createFolderDto - The folder fields.
   * @param user - The authenticated owner (injected).
   * @returns The created folder.
   */
  @Post()
  create(
    @Body() createFolderDto: CreateFolderDto,
    @CurrentUser() user: UserModel,
  ) {
    return this.foldersService.create(createFolderDto, user.id);
  }

  /**
   * `GET /folders` — lists the caller's folders.
   *
   * @param user - The authenticated owner (injected).
   * @returns The user's folders.
   */
  @Get()
  findAll(@CurrentUser() user: UserModel) {
    return this.foldersService.findAll(user.id);
  }

  /**
   * `PATCH /folders/:id` — updates one of the caller's folders.
   *
   * @param id - Folder id (path).
   * @param updateFolderDto - Partial folder fields.
   * @param user - The authenticated owner (injected).
   * @returns Prisma batch payload with the updated count.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFolderDto: UpdateFolderDto,
    @CurrentUser() user: UserModel,
  ) {
    return this.foldersService.update(id, updateFolderDto, user.id);
  }

  /**
   * `DELETE /folders/:id` — deletes one of the caller's folders.
   *
   * @param id - Folder id (path).
   * @param user - The authenticated owner (injected).
   * @returns Prisma batch payload with the deleted count.
   */
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserModel,
  ) {
    return this.foldersService.remove(id, user.id);
  }
}
