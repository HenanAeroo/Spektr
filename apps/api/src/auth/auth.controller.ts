import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Res,
  UnauthorizedException,
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

const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Throttle({ default: { ttl: 60000, limit: 10 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ----- LOCAL METHODS -----
  @Post('register')
  async register(@Body() dto: LocalRegisterDto, @Res() res: any) {
    const { accessToken, refreshToken } =
      await this.authService.localRegister(dto);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return res.json({ accessToken });
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@CurrentUser() user: JwtPayload, @Res() res: any) {
    // req.user est injecté par LocalStrategy.validate()
    const { accessToken, refreshToken } =
      await this.authService.localLogin(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return res.json({ accessToken });
  }

  @Post('refresh')
  async refresh(@Req() req: any, @Res() res: any) {
    const token = req.cookies['refreshToken'];
    if (!token) throw new UnauthorizedException('Refresh token manquant');

    const { accessToken, refreshToken } = await this.authService.refresh(token);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return res.json({ accessToken });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: JwtPayload, @Res() res: any) {
    await this.authService.logout(user.sub);
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return res.json({ message: 'Déconnecté' });
  }

  // ----- OAUTH METHODS -----
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: any, @Res() res: any) {
    const { refreshToken } = req.user;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return await res.redirect(
      `${this.configService.get('FRONT_URL')}/oauth/callback`,
    );
  }
}
