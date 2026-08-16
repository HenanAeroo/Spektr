import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';

/**
 * Passport Google OAuth 2.0 strategy. Requests only the email + profile scopes
 * and delegates account resolution/linking to {@link AuthService}.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {
    super({
      clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'], // Ask google only the email + profile of the user
    });
  }

  /**
   * Passport verify callback: turns a Google profile into an app session.
   *
   * @param _accesToken - Google access token (unused).
   * @param _refreshToken - Google refresh token (unused).
   * @param profile - The authenticated Google profile.
   * @param done - Passport callback invoked with the issued app tokens.
   */
  async validate(
    _accesToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const result = await this.authService.validateOAuthLogin(profile);
    done(null, result);
  }
}
