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

@Controller('promos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() createPromoDto: CreatePromoDto) {
    return this.promosService.create(createPromoDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(@CurrentUser() user: { id: number; role: Role }) {
    return this.promosService.findAll(user.id, user.role);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: Role },
  ) {
    return this.promosService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePromoDto: UpdatePromoDto,
  ) {
    return this.promosService.update(id, updatePromoDto);
  }

  @Patch(':id/assign')
  @Roles(Role.ADMIN)
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AssignUserDto,
    @CurrentUser() user: { id: number; role: Role },
  ) {
    return this.promosService.assignUser(id, body.userId, user.id, user.role);
  }

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

  @Delete(':id/admins/:adminId')
  @Roles(Role.SUPER_ADMIN)
  removeAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Param('adminId', ParseIntPipe) adminId: number,
  ) {
    return this.promosService.removeAdmin(id, adminId);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.promosService.remove(id);
  }
}
