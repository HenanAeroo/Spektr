import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LocalLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
