import { Injectable } from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { Folder } from '../../prisma/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * CRUD for document folders, always scoped to the owning user. Updates and
 * deletes use `updateMany`/`deleteMany` with the owner in the where-clause so a
 * user can never touch another user's folders.
 */
@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a folder for the given user.
   *
   * @param createFolderDto - The folder fields.
   * @param userId - Owner of the folder.
   * @returns The created {@link Folder}.
   */
  create(createFolderDto: CreateFolderDto, userId: number): Promise<Folder> {
    return this.prisma.folder.create({
      data: {
        ...createFolderDto,
        user: { connect: { id: userId } },
      },
    });
  }

  /**
   * Lists a user's folders.
   *
   * @param userId - Owner of the folders.
   * @returns The user's folders.
   */
  findAll(userId: number) {
    return this.prisma.folder.findMany({
      where: {
        userId: userId,
      },
    });
  }

  /**
   * Updates an owned folder.
   *
   * @param id - Folder id.
   * @param updateFolderDto - Partial folder fields.
   * @param userId - Owner id (scopes the update).
   * @returns Prisma batch payload with the updated count.
   */
  update(id: number, updateFolderDto: UpdateFolderDto, userId: number) {
    return this.prisma.folder.updateMany({
      where: {
        id: id,
        userId: userId,
      },
      data: {
        ...updateFolderDto,
      },
    });
  }

  /**
   * Deletes an owned folder.
   *
   * @param id - Folder id.
   * @param userId - Owner id (scopes the delete).
   * @returns Prisma batch payload with the deleted count.
   */
  remove(id: number, userId: number) {
    return this.prisma.folder.deleteMany({
      where: {
        id: id,
        userId: userId,
      },
    });
  }
}
