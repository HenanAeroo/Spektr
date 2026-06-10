import { IsNotEmpty, IsString } from 'class-validator';

export class SendPromoEmailDto {
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}
