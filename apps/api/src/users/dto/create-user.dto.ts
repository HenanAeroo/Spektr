import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string | undefined;

  @IsString()
  first_name: string | undefined;

  @IsString()
  last_name: string | undefined;

  @IsString()
  @IsNotEmpty()
  password: string | undefined;
}
