import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { CommunicationType } from '../../../prisma/generated/prisma/client';

export class CreateCommunicationDto {
  @IsNumber()
  senderId!: number;

  @IsNumber()
  recipientId!: number;

  @IsEnum(CommunicationType)
  type!: CommunicationType;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsNumber()
  score?: number;
}
