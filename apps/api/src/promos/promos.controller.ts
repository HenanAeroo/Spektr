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
import { PromosService } from './promos.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';
import { AssignUserDto } from './dto/assign-user.dto';
import { AssignAdminDto } from './dto/assign-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminPromoRole, Role } from '../../prisma/generated/prisma/client';

/**
 * Promo (cohort) endpoints under `/promos`. Every route requires a JWT and
 * passes {@link RolesGuard}: reads are open to ADMIN (scoped to their promos),
 * while structural changes (create/update/delete, admin membership) are
 * restricted to SUPER_ADMIN.
 */
@Controller('promos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  /**
   * `POST /promos` — SUPER_ADMIN only; creates a promo.
   *
   * @param createPromoDto - The promo name.
   * @returns The created promo.
   */
  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() createPromoDto: CreatePromoDto) {
    return this.promosService.create(createPromoDto);
  }

  /**
   * `GET /promos` — lists promos visible to the caller (all for SUPER_ADMIN,
   * administered ones otherwise).
   *
   * @param user - The authenticated admin (id + role, injected).
   * @returns The in-scope promos with their admins.
   */
  @Get()
  @Roles(Role.ADMIN)
  findAll(@CurrentUser() user: { id: number; role: Role }) {
    return this.promosService.findAll(user.id, user.role);
  }

  /**
   * `GET /promos/:id` — reads a single promo the caller may access.
   *
   * @param id - Promo id (path).
   * @param user - The authenticated admin (id + role, injected).
   * @returns The promo with its admins.
   */
  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: Role },
  ) {
    return this.promosService.findOne(id, user.id, user.role);
  }

  /**
   * `PATCH /promos/:id` — SUPER_ADMIN only; updates a promo.
   *
   * @param id - Promo id (path).
   * @param updatePromoDto - Partial promo fields.
   * @returns The updated promo.
   */
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePromoDto: UpdatePromoDto,
  ) {
    return this.promosService.update(id, updatePromoDto);
  }

  /**
   * `PATCH /promos/:id/assign` — assigns a student to this promo (scoped to the
   * caller's rights on both source and destination promos).
   *
   * @param id - Destination promo id (path).
   * @param body - The student id to assign.
   * @param user - The authenticated admin (id + role, injected).
   * @returns The updated student.
   */
  @Patch(':id/assign')
  @Roles(Role.ADMIN)
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AssignUserDto,
    @CurrentUser() user: { id: number; role: Role },
  ) {
    return this.promosService.assignUser(id, body.userId, user.id, user.role);
  }

  /**
   * `POST /promos/:id/admins` — SUPER_ADMIN only; grants an admin a role on the
   * promo (defaults to OWNER).
   *
   * @param id - Promo id (path).
   * @param body - The admin id and optional role.
   * @returns The upserted AdminPromo row.
   */
  @Post(':id/admins')
  @Roles(Role.SUPER_ADMIN)
  assignAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AssignAdminDto,
  ) {
    return this.promosService.assignAdmin(
      id,
      body.adminId,
      body.role ?? AdminPromoRole.OWNER,
    );
  }

  /**
   * `DELETE /promos/:id/admins/:adminId` — SUPER_ADMIN only; revokes an admin's
   * access (refused for the promo's last owner).
   *
   * @param id - Promo id (path).
   * @param adminId - Admin id to remove (path).
   * @returns The deleted AdminPromo row.
   */
  @Delete(':id/admins/:adminId')
  @Roles(Role.SUPER_ADMIN)
  removeAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Param('adminId', ParseIntPipe) adminId: number,
  ) {
    return this.promosService.removeAdmin(id, adminId);
  }

  /**
   * `DELETE /promos/:id` — SUPER_ADMIN only; deletes a promo.
   *
   * @param id - Promo id (path).
   * @returns The deleted promo.
   */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.promosService.remove(id);
  }
}
