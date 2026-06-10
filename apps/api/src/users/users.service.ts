import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, Provider } from '../../prisma/generated/prisma/client';
import bcrypt from 'bcrypt';
import { BulkEmailDto } from './dto/bulk-email.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { id: 'asc' },
    });

    const total = await this.prisma.user.count();

    return {
      data: users,
      total,
      hasNextPage: page * limit < total,
    };
  }

  findOne(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    const provider = await this.prisma.authProvider.findUnique({
      where: { userId_provider: { userId, provider: Provider.local } },
    });

    if (!provider?.password) {
      throw new BadRequestException(
        'Aucun mot de passe local configuré pour ce compte.',
      );
    }

    const isMatch = await bcrypt.compare(oldPassword, provider.password);
    if (!isMatch) {
      throw new UnauthorizedException('Mot de passe actuel incorrect.');
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await this.prisma.authProvider.update({
      where: { userId_provider: { userId, provider: Provider.local } },
      data: { password: hashed },
    });

    // Invalidate all refresh tokens → forces re-login on all devices
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return { success: true };
  }

  async bulkEmail(dto: BulkEmailDto) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: dto.userIds } },
    });

    const html = this.buildEmailHtml(dto.body);

    return Promise.all(
      users.map((u) => this.mailService.send(u.email, dto.subject, html)),
    );
  }

  private buildEmailHtml(body: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { margin:0; padding:0; background:#f4f4f5; font-family:'Helvetica Neue',Arial,sans-serif; }
    .content h1 { font-size:22px; font-weight:800; margin:0 0 12px 0; color:#1d1d1e; }
    .content h2 { font-size:18px; font-weight:700; margin:0 0 10px 0; color:#1d1d1e; }
    .content h3 { font-size:15px; font-weight:600; margin:0 0 8px 0; color:#1d1d1e; }
    .content p  { margin:0 0 10px 0; line-height:1.7; color:#374151; font-size:14px; }
    .content ul, .content ol { margin:0 0 10px 0; padding-left:20px; color:#374151; font-size:14px; }
    .content li { margin-bottom:4px; line-height:1.6; }
    .content strong { font-weight:700; }
    .content em { font-style:italic; }
    .content u { text-decoration:underline; }
    .content s { text-decoration:line-through; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">

        <!-- Header -->
        <tr>
          <td style="background:#23b2a4;padding:28px 40px">
            <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">Spektr</span>
            <span style="font-size:13px;color:rgba(255,255,255,0.75);margin-left:10px">Ynov Campus Rennes</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px" class="content">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e5e7eb;background:#fafafa">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5">
              Ce message vous a été envoyé par votre équipe Relations Entreprises —
              <strong>Ynov Campus Rennes</strong>.<br>
              Pour toute question, répondez directement à cet email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
