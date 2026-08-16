import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

/**
 * Passport local strategy for email/password login. Uses `email` as the
 * username field and validates credentials through {@link AuthService}.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  /**
   * Validates submitted credentials.
   *
   * @param email - The submitted email.
   * @param password - The submitted plaintext password.
   * @throws UnauthorizedException When the credentials are invalid.
   * @returns A minimal payload (`{ sub: userId }`) for the login controller.
   */
  async validate(email: string, password: string) {
    const user = await this.authService.validateLocal(email, password);
    if (!user) throw new UnauthorizedException('Identifiants invalides');
    return { sub: user.id };
  }
}
