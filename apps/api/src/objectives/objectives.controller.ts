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

@Controller('objectives')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ObjectivesController {
  constructor(private readonly objectivesService: ObjectivesService) {}

  @Post()
  create(
    @Body() createObjectiveDto: CreateObjectiveDto,
    @CurrentUser() user: User,
  ) {
    return this.objectivesService.create(createObjectiveDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.objectivesService.findAll(user);
  }

  @Get('my')
  @Roles(Role.STUDENT, Role.ADMIN)
  findByUser(@CurrentUser() user: User) {
    return this.objectivesService.findByUser(user);
  }

  @Post(':id/toggle')
  @Roles(Role.STUDENT, Role.ADMIN)
  toggle(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.objectivesService.toggleCompletion(id, user);
  }

  @Get('completions')
  @Roles(Role.ADMIN)
  findAllCompletions(@CurrentUser() user: User) {
    return this.objectivesService.findAllCompletions(user);
  }

  @Get('recent-activity')
  @Roles(Role.ADMIN)
  findRecentActivity(@CurrentUser() user: User) {
    return this.objectivesService.findRecentActivity(user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.objectivesService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateObjectiveDto: UpdateObjectiveDto,
    @CurrentUser() user: User,
  ) {
    return this.objectivesService.update(id, updateObjectiveDto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.objectivesService.remove(id, user);
  }
}
