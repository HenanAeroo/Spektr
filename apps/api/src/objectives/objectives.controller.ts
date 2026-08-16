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
import { ObjectivesService } from './objectives.service';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { UpdateObjectiveDto } from './dto/update-objective.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../prisma/generated/prisma/client';
import type { User } from '../../prisma/generated/prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Objective endpoints under `/objectives`. Guarded by JWT + {@link RolesGuard},
 * defaulting to ADMIN; the student-facing routes (`my`, `:id/toggle`) opt STUDENT
 * back in. Admin reads/writes are promo-scoped in the service layer.
 */
@Controller('objectives')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ObjectivesController {
  constructor(private readonly objectivesService: ObjectivesService) {}

  /**
   * `POST /objectives` — admin; creates an objective and notifies the promo.
   *
   * @param createObjectiveDto - Objective fields plus target promo.
   * @param user - The authenticated admin (injected).
   * @returns The created objective.
   */
  @Post()
  create(
    @Body() createObjectiveDto: CreateObjectiveDto,
    @CurrentUser() user: User,
  ) {
    return this.objectivesService.create(createObjectiveDto, user);
  }

  /**
   * `GET /objectives` — admin; lists objectives in the caller's promos.
   *
   * @param user - The authenticated admin (injected).
   * @returns The in-scope objectives.
   */
  @Get()
  findAll(@CurrentUser() user: User) {
    return this.objectivesService.findAll(user);
  }

  /**
   * `GET /objectives/my` — student/admin; the caller's promo objectives with a
   * per-user `done` flag.
   *
   * @param user - The authenticated user (injected).
   * @returns The user's objectives with completion state.
   */
  @Get('my')
  @Roles(Role.STUDENT, Role.ADMIN)
  findByUser(@CurrentUser() user: User) {
    return this.objectivesService.findByUser(user);
  }

  /**
   * `POST /objectives/:id/toggle` — student/admin; toggles the caller's
   * completion of an objective in their own promo.
   *
   * @param id - Objective id (path).
   * @param user - The authenticated user (injected).
   * @returns The upserted completion row.
   */
  @Post(':id/toggle')
  @Roles(Role.STUDENT, Role.ADMIN)
  toggle(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.objectivesService.toggleCompletion(id, user);
  }

  /**
   * `GET /objectives/completions` — admin; the completion matrix for the caller's
   * promos.
   *
   * @param user - The authenticated admin (injected).
   * @returns Objectives with nested completions and student info.
   */
  @Get('completions')
  @Roles(Role.ADMIN)
  findAllCompletions(@CurrentUser() user: User) {
    return this.objectivesService.findAllCompletions(user);
  }

  /**
   * `GET /objectives/recent-activity` — admin; recent completions for the
   * dashboard feed.
   *
   * @param user - The authenticated admin (injected).
   * @returns Recent completions, newest first.
   */
  @Get('recent-activity')
  @Roles(Role.ADMIN)
  findRecentActivity(@CurrentUser() user: User) {
    return this.objectivesService.findRecentActivity(user);
  }

  /**
   * `GET /objectives/:id` — admin; reads a single objective in the caller's
   * scope.
   *
   * @param id - Objective id (path).
   * @param user - The authenticated admin (injected).
   * @returns The objective, or `null`.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.objectivesService.findOne(id, user);
  }

  /**
   * `PATCH /objectives/:id` — admin; updates an objective in the caller's scope.
   *
   * @param id - Objective id (path).
   * @param updateObjectiveDto - Partial objective fields.
   * @param user - The authenticated admin (injected).
   * @returns The updated objective.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateObjectiveDto: UpdateObjectiveDto,
    @CurrentUser() user: User,
  ) {
    return this.objectivesService.update(id, updateObjectiveDto, user);
  }

  /**
   * `DELETE /objectives/:id` — admin; deletes an objective in the caller's scope.
   *
   * @param id - Objective id (path).
   * @param user - The authenticated admin (injected).
   * @returns The deleted objective.
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.objectivesService.remove(id, user);
  }
}
