import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User as UserModel } from '../../prisma/generated/prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  create(
    @Body() createFolderDto: CreateFolderDto,
    @CurrentUser() user: UserModel,
  ) {
    return this.foldersService.create(createFolderDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: UserModel) {
    return this.foldersService.findAll(user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
    @CurrentUser() user: UserModel,
  ) {
    return this.foldersService.update(+id, updateFolderDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: UserModel) {
    return this.foldersService.remove(+id, user.id);
  }
}
