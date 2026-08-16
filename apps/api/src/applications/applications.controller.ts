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

/**
 * Application (candidature) endpoints under `/applications`: per-student CRUD,
 * CSV import, and the admin cross-user read. All routes require a JWT; the
 * cross-user read adds {@link RolesGuard}.
 */
@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  /**
   * `POST /applications` — creates an application owned by the caller.
   *
   * @param createApplicationDto - The application fields.
   * @param user - The authenticated owner (injected).
   * @returns The created application.
   */
  @Post()
  create(
    @Body() createApplicationDto: CreateApplicationDto,
    @CurrentUser() user: UserModel,
  ) {
    return this.applicationsService.create(createApplicationDto, user.id);
  }

  /**
   * `POST /applications/import` — bulk-imports the caller's applications from a
   * CSV upload (rate-limited to 3/min, max 5 MB, CSV mime types only).
   *
   * @param file - The uploaded CSV file (multipart `file`).
   * @param user - The authenticated owner (injected).
   * @throws BadRequestException When the file is missing or not a CSV.
   * @returns Counts of imported/skipped rows plus per-row errors.
   */
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

  /**
   * `GET /applications/me` — lists the caller's own applications.
   *
   * @param user - The authenticated owner (injected).
   * @returns The user's applications.
   */
  @Get('me')
  findMyApplications(@CurrentUser() user: UserModel) {
    return this.applicationsService.findMyApplications(user.id);
  }

  /**
   * `GET /applications/user/:userId` — admin-only; lists a student's
   * applications, scoped to the caller's promos.
   *
   * @param userId - Target student id (path).
   * @param user - The authenticated admin (injected).
   * @returns The target user's applications.
   */
  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: UserModel,
  ) {
    return this.applicationsService.findForUser(userId, user);
  }

  /**
   * `GET /applications/:id` — fetches one of the caller's applications.
   *
   * @param id - Application id (path).
   * @param user - The authenticated owner (injected).
   * @returns The application, or `null`.
   */
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserModel,
  ) {
    return this.applicationsService.findOne(id, user.id);
  }

  /**
   * `PATCH /applications/:id` — updates one of the caller's applications.
   *
   * @param id - Application id (path).
   * @param updateApplicationDto - Partial application fields.
   * @param user - The authenticated owner (injected).
   * @returns The updated application.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @CurrentUser() user: UserModel,
  ) {
    return this.applicationsService.update(id, updateApplicationDto, user.id);
  }

  /**
   * `DELETE /applications/:id` — deletes one of the caller's applications.
   *
   * @param id - Application id (path).
   * @param user - The authenticated owner (injected).
   * @returns `{ id }` of the deleted application.
   */
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserModel,
  ) {
    return this.applicationsService.remove(id, user.id);
  }
}
