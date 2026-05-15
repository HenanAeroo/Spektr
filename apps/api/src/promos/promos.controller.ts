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
import { PromosService } from './promos.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../prisma/generated/prisma/client';

@Controller('promos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  @Post()
  create(@Body() createPromoDto: CreatePromoDto) {
    return this.promosService.create(createPromoDto);
  }

  @Get()
  findAll() {
    return this.promosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePromoDto: UpdatePromoDto) {
    return this.promosService.update(+id, updatePromoDto);
  }

  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() body: { userId: number }) {
    return this.promosService.assignUser(+id, body.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promosService.remove(+id);
  }
}
