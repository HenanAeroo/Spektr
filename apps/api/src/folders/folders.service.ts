import { Injectable } from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { Folder } from '../../prisma/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  create(createFolderDto: CreateFolderDto, userId: number): Promise<Folder> {
    return this.prisma.folder.create({
      data: {
        ...createFolderDto,
        user: { connect: { id: userId } },
      },
    });
  }

  findAll(userId: number) {
    return this.prisma.folder.findMany({
      where: {
        userId: userId,
      },
    });
  }

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

  remove(id: number, userId: number) {
    return this.prisma.folder.deleteMany({
      where: {
        id: id,
        userId: userId,
      },
    });
  }
}
