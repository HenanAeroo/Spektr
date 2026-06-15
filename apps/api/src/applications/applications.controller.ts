import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User as UserModel } from '../../prisma/generated/prisma/client';
import { Role } from '../../prisma/generated/prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';

@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  create(
    @Body() createApplicationDto: CreateApplicationDto,
    @CurrentUser() user: UserModel,
  ) {
    return this.applicationsService.create(createApplicationDto, user.id);
  }

  @Post('import')
  // Fix #8: tighter rate limit for this write-amplifying endpoint
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'text/csv',
          'text/plain',
          'application/vnd.ms-excel',
          'application/csv',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          // Fix #3: pass a native Error so multer handles it correctly (not BadRequestException)
          cb(new Error('INVALID_CSV_TYPE'), false);
        }
      },
    }),
  )
  importCsv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserModel,
  ) {
    if (!file)
      throw new BadRequestException(
        'Fichier manquant ou type invalide (CSV uniquement)',
      );
    return this.applicationsService.importFromCsv(file.buffer, user.id);
  }

  @Get('me')
  findMyApplications(@CurrentUser() user: UserModel) {
    return this.applicationsService.findMyApplications(user.id);
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.applicationsService.findMyApplications(userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserModel,
  ) {
    return this.applicationsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @CurrentUser() user: UserModel,
  ) {
    return this.applicationsService.update(id, updateApplicationDto, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserModel,
  ) {
    return this.applicationsService.remove(id, user.id);
  }
}
