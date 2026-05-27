import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Provider } from '../../prisma/generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LocalRegisterDto } from './dto/local-register.dto';
import { randomBytes, createHmac } from 'crypto';
import { Profile } from 'passport-google-oauth20';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailService,
  ) {}

  // ----- HELPERS -----

  // HMAC-SHA256 with JWT_SECRET for DB storage — prevents rainbow table attacks on stolen DB
  private hashTokenForStorage(token: string): string {
    return createHmac('sha256', this.config.get<string>('JWT_SECRET')!)
      .update(token)
      .digest('hex');
  }

  // Generate an access token which expires in 15min
  private generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: '15min',
    });
  }

  // Security purpose : will return a 64 octets in token format to the client
  private generateRawRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  // Let the refreshToken alive for 7 days before the expiring date
  private getRefreshExpiry(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }

  // Send both tokens to the controller
  private async issueTokens(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const accessToken = await this.generateAccessToken({
      sub: userId,
      role: user!.role,
    });

    const rawRefreshToken = this.generateRawRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        token: this.hashTokenForStorage(rawRefreshToken),
        expires_at: this.getRefreshExpiry(),
        userId,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  // ---- Public methods -----

  // Used in local.strategy.ts to validate if a user exists with the local provider
  async validateLocal(email: string, password: string) {
    const user = await this.usersService.findOne({ email });
    if (!user) return null;

    const provider = await this.prisma.authProvider.findUnique({
      where: {
        userId_provider: { userId: user.id, provider: Provider.local },
      },
    });
    if (!provider?.password) return null;

    const isMatch = await bcrypt.compare(password, provider.password);
    return isMatch ? user : null;
  }

  // Implements the local sign up logic
  async localRegister(dto: LocalRegisterDto) {
    const usedEmail = await this.usersService.findOne({ email: dto.email });
    if (usedEmail) throw new ConflictException('Cet email est déjà utilisé');

    const hashed = await bcrypt.hash(dto.password, 12);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        first_name: dto.first_name,
        last_name: dto.last_name,
        authProviders: {
          create: { provider: Provider.local, password: hashed },
        },
      },
    });

    const token = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.update({
      where: { id: newUser.id },
      data: { verificationToken: token, verificationExpiry: expiry },
    });

    const frontUrl = this.config.get<string>('FRONT_URL');
    const verifyUrl = `${frontUrl}/verify-email?token=${token}`;
    const firstName = user.first_name ?? 'là';

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#1d1d1e;padding:24px 32px;">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
        Spek<span style="color:#23b2a4;">tr</span>
      </div>
      <div style="font-size:10px;color:rgba(255,255,255,0.4);font-weight:600;letter-spacing:2px;margin-top:2px;">YNOV CAMPUS RENNES</div>
    </div>

    <div style="padding:32px;">
      <div style="font-size:28px;margin-bottom:12px;">✉️</div>
      <h1 style="margin:0 0 6px;font-size:20px;color:#1d1d1e;">Bonjour ${firstName},</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
        Merci de vous être inscrit sur Spektr. Confirmez votre adresse email pour activer votre compte.
      </p>

      <div style="background:#f0fdf9;border:1px solid rgba(35,178,164,0.2);border-radius:10px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 16px;font-size:13px;color:#6b7280;line-height:1.6;">
          Ce lien est valable <strong style="color:#1d1d1e;">24 heures</strong>.
        </p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#23b2a4;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;letter-spacing:0.2px;">
          Confirmer mon email
        </a>
      </div>

      <div style="background:#f9fafb;border:1px solid #e8e8e8;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Lien alternatif</div>
        <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;line-height:1.6;">${verifyUrl}</p>
      </div>

      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
        Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email.
      </p>
    </div>

    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e8e8e8;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        Ce message a été envoyé automatiquement par Spektr · Ynov Campus Rennes
      </p>
    </div>
  </div>
</body>
</html>`;

    await this.mailerService.send(user.email, 'Confirmer votre email', html);

    return 'Un email de confirmation a été envoyé';
  }

  // As local strategy validate the user, localLogin is simple
  async localLogin(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (user!.emailVerified === false) {
      throw new UnauthorizedException('Veuillez confirmer votre email');
    } else {
      return this.issueTokens(payload.sub);
    }
  }

  async refresh(rawRefreshToken: string) {
    const hashed = this.hashTokenForStorage(rawRefreshToken);

    const record = await this.prisma.refreshToken.findUnique({
      where: { token: hashed },
      include: { user: true },
    });

    if (!record)
      throw new UnauthorizedException('Refresh token invalide ou expiré');

    // Delete token first to prevent reuse, then check expiry
    await this.prisma.refreshToken.delete({ where: { token: hashed } });

    if (record.expires_at < new Date())
      throw new UnauthorizedException('Refresh token invalide ou expiré');

    return this.issueTokens(record.user.id);
  }

  async logout(userId: number) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async validateOAuthLogin(profile: Profile) {
    const email = profile.emails?.[0]?.value;
    const providerId = profile.id;

    if (!email) throw new Error('Email Google manquant');

    const existing = await this.prisma.authProvider.findUnique({
      where: {
        provider_provider_id: {
          provider: Provider.google,
          provider_id: providerId,
        },
      },
      include: { user: true },
    });

    if (existing) {
      return this.issueTokens(existing.user.id);
    }

    let user = await this.usersService.findOne({ email });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          first_name: profile.name?.givenName,
          last_name: profile.name?.familyName,
          authProviders: {
            create: { provider: Provider.google, provider_id: providerId },
          },
        },
      });
    } else {
      await this.prisma.authProvider.create({
        data: {
          provider: Provider.google,
          provider_id: providerId,
          userId: user.id,
        },
      });
    }

    return this.issueTokens(user.id);
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Token invalide');
    }

    if (!user.verificationExpiry || user.verificationExpiry < new Date()) {
      throw new BadRequestException('Token expiré');
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpiry: null,
      },
    });

    return 'Email confirmé';
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { authProviders: { select: { provider: true } } },
    });

    const hasLocal = user?.authProviders.some(
      (p) => p.provider === Provider.local,
    );

    if (!user || !hasLocal) {
      return 'Un email de réinitialisation a été envoyé';
    }

    const rawToken = randomBytes(32).toString('hex');

    const hashedToken = this.hashTokenForStorage(rawToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const frontUrl = this.config.get<string>('FRONT_URL');
    const resetUrl = `${frontUrl}/reset-password?token=${rawToken}`;
    const firstName = user.first_name ?? 'là';

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#1d1d1e;padding:24px 32px;">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
        Spek<span style="color:#23b2a4;">tr</span>
      </div>
      <div style="font-size:10px;color:rgba(255,255,255,0.4);font-weight:600;letter-spacing:2px;margin-top:2px;">YNOV CAMPUS RENNES</div>
    </div>

    <div style="padding:32px;">
      <div style="font-size:28px;margin-bottom:12px;">✉️</div>
      <h1 style="margin:0 0 6px;font-size:20px;color:#1d1d1e;">Bonjour ${firstName},</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
        Vous êtes à l'origine d'une demande de changement de mot passe, merci de cliquer sur le lien ci-dessous pour effectuer la réinitialisation.
      </p>

      <div style="background:#f0fdf9;border:1px solid rgba(35,178,164,0.2);border-radius:10px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 16px;font-size:13px;color:#6b7280;line-height:1.6;">
          Ce lien est valable <strong style="color:#1d1d1e;">15 minutes</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#23b2a4;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;letter-spacing:0.2px;">
          Réinitialiser mon mot de passe
        </a>
      </div>

      <div style="background:#f9fafb;border:1px solid #e8e8e8;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Lien alternatif</div>
        <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;line-height:1.6;">${resetUrl}</p>
      </div>

      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
        Si vous n'êtes pas à l'origine de cette réinitialisation, ignorez simplement cet email.
      </p>
    </div>

    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e8e8e8;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        Ce message a été envoyé automatiquement par Spektr · Ynov Campus Rennes
      </p>
    </div>
  </div>
</body>
</html>`;

    await this.mailerService.send(
      user.email,
      'Réinitialisation de votre mot de passe',
      html,
    );

    return 'Un email de réinitialisation a été envoyé';
  }

  async resetPassword(token: string, password: string) {
    const hashedToken = this.hashTokenForStorage(token);

    const user = await this.prisma.user.findFirst({
      where: { resetPasswordToken: hashedToken },
      include: { authProviders: { select: { provider: true } } },
    });

    if (!user) {
      throw new BadRequestException('Token invalide');
    }

    if (user.resetPasswordExpiry! < new Date()) {
      throw new BadRequestException('Token expiré');
    }

    if (!user.authProviders.some((p) => p.provider === Provider.local)) {
      throw new BadRequestException(
        'Ce compte utilise Google — aucun mot de passe à réinitialiser',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await this.prisma.authProvider.update({
      where: {
        userId_provider: { userId: user.id, provider: Provider.local },
      },
      data: {
        password: hashedPassword,
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: null, resetPasswordExpiry: null },
    });

    return 'Mot de passe réinitialisé';
  }
}
