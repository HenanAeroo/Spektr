import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Prisma,
  User,
  Provider,
  Role,
  AdminPromoRole,
} from '../../prisma/generated/prisma/client';
import bcrypt from 'bcrypt';
import { BulkEmailDto } from './dto/bulk-email.dto';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import juice from 'juice';
import sanitizeHtml from 'sanitize-html';
import { randomBytes, createHmac } from 'crypto';
import * as Papa from 'papaparse';
import {
  ImportStudentResult,
  STUDENT_COLUMN_MAP,
  normalizeStudentKey,
  MAX_STUDENT_CSV_ROWS,
} from './users.csv-mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHmac('sha256', this.config.get<string>('JWT_SECRET')!)
      .update(token)
      .digest('hex');
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findAll(
    page: number,
    limit: number,
    promoId?: number,
    requesterId?: number,
    requesterRole?: Role,
  ) {
    const skip = (page - 1) * limit;

    let where: Prisma.UserWhereInput = {};

    if (requesterRole === Role.SUPER_ADMIN) {
      where = promoId ? { promoId } : {};
    } else {
      where = {
        promo: { adminPromos: { some: { adminId: requesterId } } },
        ...(promoId ? { promoId } : {}),
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        where,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      hasNextPage: page * limit < total,
    };
  }

  findOne(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({ where: userWhereUniqueInput });
  }

  update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({ data, where });
  }

  async remove(
    where: Prisma.UserWhereUniqueInput,
    callerId?: number,
    callerRole?: Role,
  ): Promise<User> {
    const userToDelete = await this.prisma.user.findUnique({ where });
    if (!userToDelete) throw new BadRequestException('Utilisateur introuvable');

    if (
      userToDelete.role === Role.ADMIN ||
      userToDelete.role === Role.SUPER_ADMIN
    ) {
      if (callerRole !== Role.SUPER_ADMIN && callerId !== userToDelete.id) {
        throw new ForbiddenException('Accès refusé');
      }

      // Check if last OWNER of any promo
      const ownerRelations = await this.prisma.adminPromo.findMany({
        where: { adminId: userToDelete.id, role: AdminPromoRole.OWNER },
        include: { promo: { select: { name: true } } },
      });

      for (const rel of ownerRelations) {
        const otherOwners = await this.prisma.adminPromo.count({
          where: {
            promoId: rel.promoId,
            role: AdminPromoRole.OWNER,
            adminId: { not: userToDelete.id },
          },
        });
        if (otherOwners === 0) {
          throw new ConflictException(
            `Impossible de supprimer cet admin : il est le seul propriétaire de la promo "${rel.promo.name}". Assignez un autre propriétaire d'abord.`,
          );
        }
      }
    }

    return this.prisma.user.delete({ where });
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

    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return { success: true };
  }

  async importStudentsFromCsv(
    file: Express.Multer.File,
    requesterId: number,
    requesterRole: Role,
  ): Promise<ImportStudentResult> {
    const raw = file.buffer.toString('utf-8');
    const csv = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;

    const { data: rows, errors } = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0 && rows.length === 0) {
      throw new BadRequestException('Fichier CSV invalide ou mal formaté');
    }

    if (rows.length > MAX_STUDENT_CSV_ROWS) {
      throw new BadRequestException(
        `Le fichier dépasse la limite de ${MAX_STUDENT_CSV_ROWS} lignes`,
      );
    }

    if (rows.length === 0) return { imported: 0, skipped: 0, errors: [] };

    // Build column mapping
    const headers = Object.keys(rows[0]);
    const colMap = new Map<string, string>();
    for (const h of headers) {
      const field = STUDENT_COLUMN_MAP[normalizeStudentKey(h)];
      if (field) colMap.set(h, field);
    }

    // Pre-fetch admin's accessible promos for access control
    let accessiblePromos: Array<{ id: number; name: string }> = [];
    if (requesterRole === Role.SUPER_ADMIN) {
      accessiblePromos = await this.prisma.promo.findMany({
        select: { id: true, name: true },
      });
    } else {
      accessiblePromos = await this.prisma.promo.findMany({
        where: { adminPromos: { some: { adminId: requesterId } } },
        select: { id: true, name: true },
      });
    }

    const promoByName = new Map(
      accessiblePromos.map((p) => [normalizeStudentKey(p.name), p]),
    );

    const result: ImportStudentResult = { imported: 0, skipped: 0, errors: [] };
    const frontUrl = this.config.get<string>('FRONT_URL');

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const row = rows[i];

      const get = (field: string) => {
        for (const [col, mapped] of colMap.entries()) {
          if (mapped === field) return (row[col] ?? '').trim();
        }
        return '';
      };

      const email = get('email').toLowerCase();
      if (!email) {
        result.errors.push({ row: rowNum, message: 'Email manquant' });
        result.skipped++;
        continue;
      }

      // Check if user already exists
      const existing = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existing) {
        result.errors.push({
          row: rowNum,
          email,
          message: `Un compte existe déjà pour cet email`,
        });
        result.skipped++;
        continue;
      }

      // Resolve promo
      let promoId: number | undefined;
      const promoName = get('promoName');
      if (promoName) {
        const found = promoByName.get(normalizeStudentKey(promoName));
        if (!found) {
          result.errors.push({
            row: rowNum,
            email,
            message: `Promo introuvable ou accès refusé : "${promoName}"`,
          });
          result.skipped++;
          continue;
        }
        promoId = found.id;
      }

      try {
        const tempPassword = randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        const rawToken = randomBytes(32).toString('hex');
        const hashedToken = this.hashToken(rawToken);

        await this.prisma.user.create({
          data: {
            email,
            first_name: get('first_name') || null,
            last_name: get('last_name') || null,
            role: Role.STUDENT,
            emailVerified: true,
            promoId: promoId ?? null,
            resetPasswordToken: hashedToken,
            resetPasswordExpiry: new Date(Date.now() + 72 * 60 * 60 * 1000),
            authProviders: {
              create: {
                provider: Provider.local,
                password: hashedPassword,
              },
            },
          },
        });

        const resetUrl = `${frontUrl}/reset-password?token=${rawToken}`;
        const firstName = get('first_name') || 'là';
        await this.mailService
          .send(
            email,
            'Bienvenue sur Spektr — Activez votre compte',
            this.buildInviteEmail(firstName, resetUrl),
          )
          .catch(() => null);

        result.imported++;
      } catch {
        result.errors.push({
          row: rowNum,
          email,
          message: 'Erreur lors de la création du compte',
        });
        result.skipped++;
      }
    }

    return result;
  }

  private buildInviteEmail(firstName: string, resetUrl: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#1d1d1e;padding:24px 32px;">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Spek<span style="color:#23b2a4;">tr</span></div>
      <div style="font-size:10px;color:rgba(255,255,255,0.4);font-weight:600;letter-spacing:2px;margin-top:2px;">YNOV CAMPUS RENNES</div>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 12px;font-size:20px;color:#1d1d1e;">Bienvenue ${firstName} !</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
        Votre compte Spektr a été créé par votre chargé de relations entreprises. Cliquez ci-dessous pour définir votre mot de passe et accéder à la plateforme.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${resetUrl}" style="display:inline-block;background:#23b2a4;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;">
          Activer mon compte
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#9ca3af;">Ce lien est valable 72 heures.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private chunksOf(array: User[], size: number) {
    const result = [];
    let i = 0;
    while (i < array.length) {
      result.push(array.slice(i, i + size));
      i += size;
    }
    return result;
  }

  async bulkEmail(dto: BulkEmailDto) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: dto.userIds } },
    });

    if (users.length === 0) return { sent: 0, failed: 0 };

    const html = this.buildEmailHtml(dto.body);
    const totalResults: PromiseSettledResult<void>[] = [];

    for (const chunk of this.chunksOf(users, 10)) {
      const chunkResults = await Promise.allSettled(
        chunk.map((u) => this.mailService.send(u.email, dto.subject, html)),
      );
      totalResults.push(...chunkResults);
    }

    const failed = totalResults.filter((c) => c.status === 'rejected');
    const sent = totalResults.length - failed.length;

    if (sent === 0) throw new InternalServerErrorException();

    return { sent, failed: failed.length };
  }

  private buildEmailHtml(body: string): string {
    const cleanBody = sanitizeHtml(body, {
      allowedTags: [
        'p',
        'strong',
        'em',
        'u',
        's',
        'h1',
        'h2',
        'h3',
        'ul',
        'ol',
        'li',
        'br',
      ],
      allowedAttributes: {},
    });
    const raw = `<!DOCTYPE html>
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
        <tr>
          <td style="background:#23b2a4;padding:28px 40px">
            <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">Spektr</span>
            <span style="font-size:13px;color:rgba(255,255,255,0.75);margin-left:10px">Ynov Campus Rennes</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px" class="content">${cleanBody}</td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e5e7eb;background:#fafafa">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5">
              Ce message vous a été envoyé par votre équipe Relations Entreprises — <strong>Ynov Campus Rennes</strong>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    return juice(raw);
  }
}
