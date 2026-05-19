import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  oldPassword!: string;

  @IsString()
  @MinLength(12)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/, {
    message:
      'Le nouveau mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractère spécial',
  })
  newPassword!: string;
}
