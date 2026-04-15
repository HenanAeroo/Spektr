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
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User as UserModel } from '../../prisma/generated/prisma/client';

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

  @Get('me')
  findMyApplications(@CurrentUser() user: UserModel) {
    return this.applicationsService.findMyApplications(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserModel) {
    return this.applicationsService.findOne(+id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @CurrentUser() user: UserModel,
  ) {
    return this.applicationsService.update(+id, updateApplicationDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: UserModel) {
    return this.applicationsService.remove(+id, user.id);
  }
}
