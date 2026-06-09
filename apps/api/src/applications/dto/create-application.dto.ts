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
  @IsOptional()
  date_candidature?: string;

  @IsDateString()
  @IsOptional()
  date_relance_contact?: string;

  @IsDateString()
  @IsOptional()
  date_relance_tel?: string;

  @IsDateString()
  @IsOptional()
  date_reponse_entreprise?: string;

  @IsEnum(Outcome)
  @IsOptional()
  outcome?: Outcome;
}
