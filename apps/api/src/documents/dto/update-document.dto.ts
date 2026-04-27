import { IsInt, IsOptional } from 'class-validator';

export class UpdateDocumentDto {
  @IsOptional()
  @IsInt()
  folderId?: number;
}
