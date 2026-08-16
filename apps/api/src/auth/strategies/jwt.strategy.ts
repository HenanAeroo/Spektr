import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UsersService } from '../../users/users.service';

/**
 * Passport JWT strategy. Extracts the bearer token, verifies it against
 * `JWT_SECRET` (HS256), and resolves the current {@link User} so controllers can
 * inject it via `@CurrentUser()`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  /**
   * Resolves the JWT subject to a user record.
   *
   * @param payload - The verified JWT payload (holds the user id in `sub`).
   * @throws UnauthorizedException When the user no longer exists.
   * @returns The authenticated {@link User}, attached to the request.
   */
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne({ id: payload.sub });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
