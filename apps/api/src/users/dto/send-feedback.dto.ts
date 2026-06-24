import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SendFeedbackDto {
  @IsInt()
  @Min(0)
  @Max(4)
  score!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
