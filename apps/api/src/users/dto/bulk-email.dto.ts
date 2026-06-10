import { IsArray, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class BulkEmailDto {
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  userIds!: number[];

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}
