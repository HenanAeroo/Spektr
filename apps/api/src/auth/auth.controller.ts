import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Res,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalRegisterDto } from './dto/local-register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { Request, Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Cookie attributes for the refresh token. `httpOnly` keeps it out of JS;
 * in production `secure` + `sameSite=none` allow the cross-site Vercel↔Render
 * setup, while `lax` is used locally.
 */
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
};

/** Lifetime of the refresh cookie: 7 days, in milliseconds. */
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Authentication endpoints under `/auth`: local register/login/logout, refresh
 * rotation, Google OAuth, email verification and password reset. Globally
 * rate-limited to 10 requests/min. The refresh token travels only in an
 * httpOnly cookie — never in a response body or URL.
 */
@Throttle({ default: { ttl: 60000, limit: 10 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ----- LOCAL METHODS -----

  /**
   * `POST /auth/register` — creates a local account and triggers the email
   * verification flow.
   *
   * @param dto - Email, password and name.
   * @returns A `{ message }` confirming the verification email was sent.
   */
  @Post('register')
  async register(@Body() dto: LocalRegisterDto) {
    const message = await this.authService.localRegister(dto);
    return { message };
  }

  /**
   * `POST /auth/login` — validates credentials via {@link LocalAuthGuard}, sets
   * the refresh cookie and returns the access token.
   *
   * @param user - JWT payload injected by the local strategy.
   * @param res - Express response used to set the refresh cookie.
   * @returns `{ accessToken }` for the in-memory client store.
   */
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    // user est injecté par LocalStrategy.validate()
    const { accessToken, refreshToken } =
      await this.authService.localLogin(user);

    res.cookie('refreshToken', refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return { accessToken };
  }

  /**
   * `POST /auth/refresh` — rotates the refresh token from the cookie and returns
   * a new access token (rate-limited to 5/min).
   *
   * @param req - Express request (reads the `refreshToken` cookie).
   * @param res - Express response used to set the rotated refresh cookie.
   * @throws UnauthorizedException When the refresh cookie is missing.
   * @returns `{ accessToken }`.
   */
  @Post('refresh')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string | undefined>)?.[
      'refreshToken'
    ];
    if (!token) throw new UnauthorizedException('Refresh token manquant');

    const { accessToken, refreshToken } = await this.authService.refresh(token);

    res.cookie('refreshToken', refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return { accessToken };
  }

  /**
   * `POST /auth/logout` — revokes the user's refresh tokens and clears the
   * cookie.
   *
   * @param user - The authenticated user's JWT payload.
   * @param res - Express response used to clear the refresh cookie.
   * @returns A `{ message }` confirming logout.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.sub);
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    return { message: 'Déconnecté' };
  }

  // ----- OAUTH METHODS -----

  /**
   * `GET /auth/google` — entry point that redirects to Google's consent screen.
   * The body is intentionally empty; {@link GoogleAuthGuard} performs the
   * redirect.
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  /**
   * `GET /auth/google/callback` — OAuth return URL. Sets the refresh cookie and
   * redirects to the SPA callback page, which restores its access token via
   * `/auth/refresh`. The JWT is never placed in the URL (AC-12 / CWE-598).
   *
   * @param req - Express request holding the authenticated `user`.
   * @param res - Express response used to set the cookie and redirect.
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Req() req: Request, @Res() res: Response) {
    const { refreshToken } = req.user as { refreshToken: string };

    res.cookie('refreshToken', refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    // The refresh cookie is set above; the SPA restores its access token by
    // calling /auth/refresh on the callback page. Never put the JWT in the URL
    // (history/Referer/proxy-log leakage — AC-12 / MISC-02 / CWE-598).
    res.redirect(`${this.configService.get('FRONT_URL')}/oauth/callback`);
  }

  /**
   * `GET /auth/verify-email` — confirms an account from the emailed token.
   *
   * @param token - The raw verification token (query).
   * @returns A `{ message }` confirming verification.
   */
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    const message = await this.authService.verifyEmail(token);
    return { message };
  }

  /**
   * `POST /auth/forgot-password` — starts the reset flow. Always returns the same
   * neutral message to avoid user enumeration.
   *
   * @param dto - The email requesting a reset.
   * @returns A neutral `{ message }`.
   */
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const message = await this.authService.forgotPassword(dto.email);
    return { message };
  }

  /**
   * `POST /auth/reset-password` — sets a new password from a valid reset token.
   *
   * @param dto - The reset token and the new password.
   * @returns A `{ message }` confirming the reset.
   */
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const message = await this.authService.resetPassword(
      dto.token,
      dto.password,
    );
    return { message };
  }
}
