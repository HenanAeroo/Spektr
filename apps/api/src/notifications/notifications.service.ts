import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { Prisma, NotifType } from '../../prisma/generated/prisma/client';
import { MailService } from '../mail/mail.service';

const SMILEY_LABELS = ['Très bien', 'Bien', 'Moyen', 'Préoccupant', 'Critique'];
const SMILEY_EMOJIS = ['😊', '🙂', '😐', '🙁', '😟'];
const SMILEY_COLORS = ['#16a34a', '#65a30d', '#d97706', '#ea580c', '#dc2626'];

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly mailService: MailService,
  ) {}

  async createAndEmit(
    userId: number,
    type: NotifType,
    payload: Record<string, unknown>,
  ) {
    const notif = await this.prisma.notification.create({
      data: {
        userId,
        type,
        payload: payload as Prisma.InputJsonValue,
        read: false,
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      const { subject, html } = this.buildObjectiveEmail(type, payload, user.first_name);
      await this.mailService.send(user.email, subject, html);
    }

    this.eventsGateway.server.to(`user:${userId}`).emit('notification', notif);

    return notif;
  }

  async sendFeedbackEmail(
    studentId: number,
    score: number,
    comment: string,
  ) {
    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student?.email) return;

    const label = SMILEY_LABELS[score] ?? 'Non précisé';
    const emoji = SMILEY_EMOJIS[score] ?? '📋';
    const color = SMILEY_COLORS[score] ?? '#6b7280';
    const firstName = student.first_name ?? 'Étudiant';

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
      <div style="font-size:24px;margin-bottom:8px;">📋 Nouveau feedback RE</div>
      <h1 style="margin:0 0 6px;font-size:20px;color:#1d1d1e;">Bonjour ${firstName},</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
        Votre chargé RE vous a transmis un feedback sur votre recherche d'alternance.
      </p>

      <div style="background:#f9fafb;border:1px solid #e8e8e8;border-radius:10px;padding:20px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Évaluation de votre situation</div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:32px;">${emoji}</span>
          <div>
            <div style="font-size:18px;font-weight:800;color:${color};">${label}</div>
            <div style="font-size:12px;color:#9ca3af;margin-top:2px;">Score : ${score + 1}/5</div>
          </div>
        </div>
      </div>

      ${comment ? `
      <div style="background:#f9fafb;border:1px solid #e8e8e8;border-left:3px solid #23b2a4;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Commentaire</div>
        <p style="margin:0;font-size:14px;color:#1d1d1e;line-height:1.6;">${comment.replace(/\n/g, '<br>')}</p>
      </div>
      ` : ''}

      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
        N'hésitez pas à contacter votre chargé RE si vous avez des questions ou souhaitez échanger sur ce retour.
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

    await this.mailService.send(student.email, `Feedback RE — ${label}`, html);
  }

  private buildObjectiveEmail(
    type: NotifType,
    payload: Record<string, unknown>,
    firstName: string | null,
  ): { subject: string; html: string } {
    const name = firstName ?? 'Étudiant';

    if (type === NotifType.OBJECTIVE_CREATED) {
      const title = String(payload.title ?? '');
      const description = payload.description ? String(payload.description) : null;
      const deadline = payload.deadline
        ? new Date(String(payload.deadline)).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : null;

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
      <div style="font-size:24px;margin-bottom:8px;">🎯 Nouvel objectif</div>
      <h1 style="margin:0 0 6px;font-size:20px;color:#1d1d1e;">Bonjour ${name},</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
        Votre chargé RE vient de définir un nouvel objectif pour votre promotion.
      </p>

      <div style="background:#f0fdf9;border:1px solid rgba(35,178,164,0.2);border-left:3px solid #23b2a4;border-radius:0 10px 10px 0;padding:20px 24px;margin-bottom:20px;">
        <div style="font-size:16px;font-weight:800;color:#1d1d1e;margin-bottom:8px;">${title}</div>
        ${description ? `<p style="margin:0 0 12px;font-size:14px;color:#6b7280;line-height:1.6;">${description}</p>` : ''}
        ${deadline ? `
        <div style="display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid #e8e8e8;border-radius:6px;padding:6px 12px;font-size:13px;color:#1d1d1e;">
          📅 <strong>Deadline :</strong> ${deadline}
        </div>` : ''}
      </div>

      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
        Connectez-vous à Spektr pour retrouver tous vos objectifs et suivre votre avancement.
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

      return { subject: `Nouvel objectif : ${title}`, html };
    }

    return {
      subject: 'Nouvelle notification — Spektr',
      html: `<p>Bonjour ${name},<br>Vous avez reçu une nouvelle notification sur Spektr.</p>`,
    };
  }

  async findAllForUser(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async markAsRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }
}
