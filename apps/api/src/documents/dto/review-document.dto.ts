import { IsEnum, IsOptional } from 'class-validator';
import {
  DocumentStatus,
  DocumentType,
} from '../../../prisma/generated/prisma/client';

export class ReviewDocumentDto {
  @IsEnum(DocumentStatus)
  status!: DocumentStatus;

  @IsEnum(DocumentType)
  @IsOptional()
  docType?: DocumentType;
}
