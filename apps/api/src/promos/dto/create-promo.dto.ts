import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePromoDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
