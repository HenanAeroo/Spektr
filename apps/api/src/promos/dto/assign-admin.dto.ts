import { IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { AdminPromoRole } from '../../../prisma/generated/prisma/client';

export class AssignAdminDto {
  @IsInt()
  @IsNotEmpty()
  adminId!: number;

  @IsEnum(AdminPromoRole)
  @IsOptional()
  role?: AdminPromoRole = AdminPromoRole.OWNER;
}
