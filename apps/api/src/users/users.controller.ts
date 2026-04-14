import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  User as UserModel,
  Role as RoleModel,
} from '../../prisma/generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(RoleModel.ADMIN)
  @UseGuards(RolesGuard)
  @Get()
  findAll(
    @Query() query: { skip?: string; take?: string },
  ): Promise<UserModel[]> {
    return this.usersService.findAll({
      orderBy: { id: 'asc' },
      take: query.take ? Number(query.take) : 20,
      skip: query.skip ? Number(query.skip) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserModel | null> {
    return this.usersService.findOne({ id: Number(id) });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserModel> {
    if (user.sub !== Number(id)) throw new ForbiddenException();

    return this.usersService.update({
      where: { id: Number(id) },
      data: updateUserDto,
    });
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserModel> {
    if (user.sub !== Number(id)) throw new ForbiddenException();

    return this.usersService.remove({ id: Number(id) });
  }
}
