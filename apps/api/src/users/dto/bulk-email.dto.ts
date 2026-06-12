import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class BulkEmailDto {
  @IsArray()
  @IsInt({ each: true })
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  userIds!: number[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  body!: string;
}
