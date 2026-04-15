import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Outcome, Statut } from '../../../prisma/generated/prisma/client';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  entreprise!: string;

  @IsString()
  @IsOptional()
  lien?: string;

  @IsString()
  @IsOptional()
  commentaire?: string;

  @IsEnum(Statut)
  @IsOptional()
  statut?: Statut;

  @IsString()
  @IsOptional()
  contact_nom?: string;

  @IsEmail()
  @IsOptional()
  contact_email?: string;

  @IsString()
  @IsOptional()
  contact_tel?: string;

  @IsDateString()
  date_candidature?: Date;

  @IsDateString()
  date_relance?: Date;

  @IsEnum(Outcome)
  @IsOptional()
  outcome?: Outcome;
}
