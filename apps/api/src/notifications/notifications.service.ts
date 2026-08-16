import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { Prisma, NotifType } from '../../prisma/generated/prisma/client';
import { MailService } from '../mail/mail.service';

/** Human labels for the 5-point RE feedback scale (index 0 = best). */
const SMILEY_LABELS = ['Très bien', 'Bien', 'Moyen', 'Préoccupant', 'Critique'];
/** Emoji shown for each feedback score, aligned by index with the labels. */
const SMILEY_EMOJIS = ['😊', '🙂', '😐', '🙁', '😟'];
/** Accent color per feedback score, aligned by index with the labels. */
const SMILEY_COLORS = ['#16a34a', '#65a30d', '#d97706', '#ea580c', '#dc2626'];

/**
 * Escapes the five HTML-significant characters so user-supplied text can be
 * safely interpolated into notification email templates (XSS defense).
 *
 * @param str - Raw, untrusted string.
 * @returns The HTML-escaped string.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Creates in-app notifications, pushes them to the user in real time over the
 * WebSocket gateway, and mirrors them as templated emails. Also owns the
 * transactional emails that aren't tied to a Notification row (RE feedback,
 * password-changed confirmation).
 */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly mailService: MailService,
  ) {}

  private readonly logger = new Logger(NotificationsService.name);

  /**
   * Persists a notification, emails a templated copy (best-effort — failures are
   * logged, not thrown) and pushes it live to the user's WebSocket room.
   *
   * @param userId - Recipient user id.
   * @param type - The notification type, which selects the email template.
   * @param payload - Type-specific data merged into the notification + email.
   * @returns The created notification row.
   */
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
    if (!user) return notif;
    if (user.email) {
      const { subject, html } = this.buildNotificationEmail(
        type,
        payload,
        user.first_name,
      );
      this.mailService.send(user.email, subject, html).catch((err) => {
        this.logger.error(err);
      });
    }

    this.eventsGateway.server.to(`user:${userId}`).emit('notification', notif);

    return notif;
  }

  /**
   * Emails a student the RE feedback (smiley score + optional comment). No-op
   * when the student has no email; send failures are logged, not thrown.
   *
   * @param studentId - Id of the student receiving the feedback.
   * @param score - 0-based score index into the SMILEY_* scales (0 = best).
   * @param comment - Optional free-text comment (HTML-escaped before render).
   */
  async sendFeedbackEmail(studentId: number, score: number, comment: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!student?.email) return;

    const label = SMILEY_LABELS[score] ?? 'Non précisé';
    const emoji = SMILEY_EMOJIS[score] ?? '📋';
    const color = SMILEY_COLORS[score] ?? '#6b7280';
    const firstName = escapeHtml(student.first_name ?? 'Étudiant');

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

      ${
        comment
          ? `
      <div style="background:#f9fafb;border:1px solid #e8e8e8;border-left:3px solid #23b2a4;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Commentaire</div>
        <p style="margin:0;font-size:14px;color:#1d1d1e;line-height:1.6;">${escapeHtml(comment).replace(/\n/g, '<br>')}</p>
      </div>
      `
          : ''
      }

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

    try {
      await this.mailService.send(
        student.email,
        `Feedback RE — ${label}`,
        html,
      );
    } catch (err) {
      this.logger.error(err);
    }
  }

  /**
   * Builds the subject + HTML for a notification email, branching on the
   * notification type (objective created, inactivity alert, document review),
   * with a generic fallback for unknown types. All interpolated values are
   * HTML-escaped.
   *
   * @param type - The notification type driving template selection.
   * @param payload - Type-specific fields (title, deadline, status, …).
   * @param firstName - Recipient first name for the greeting (nullable).
   * @returns The email `subject` and rendered `html`.
   */
  private buildNotificationEmail(
    type: NotifType,
    payload: Record<string, unknown>,
    firstName: string | null,
  ): { subject: string; html: string } {
    const name = escapeHtml(firstName ?? 'Étudiant');

    if (type === NotifType.OBJECTIVE_CREATED) {
      const title = escapeHtml(
        typeof payload.title === 'string' ? payload.title : '',
      );
      const description =
        typeof payload.description === 'string'
          ? escapeHtml(payload.description)
          : null;
      const deadline =
        typeof payload.deadline === 'string'
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
        ${
          deadline
            ? `
        <div style="display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid #e8e8e8;border-radius:6px;padding:6px 12px;font-size:13px;color:#1d1d1e;">
          📅 <strong>Deadline :</strong> ${deadline}
        </div>`
            : ''
        }
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
    } else if (type === NotifType.INACTIVITY_ALERT) {
      const days = typeof payload.days === 'number' ? payload.days : 7;

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
      <div style="font-size:24px;margin-bottom:8px;">⏰ Alerte activité !</div>
      <h1 style="margin:0 0 6px;font-size:20px;color:#1d1d1e;">Bonjour ${name},</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
        Vous avez une alerte d'inactivité.
      </p>

      <div style="background:#f0fdf9;border:1px solid rgba(35,178,164,0.2);border-left:3px solid #23b2a4;border-radius:0 10px 10px 0;padding:20px 24px;margin-bottom:20px;">
        <p style="margin:0 0 12px;font-size:14px;color:#6b7280;line-height:1.6;">Ça fait maintenant ${days} jours qu'on ne t'a pas vu sur Spektr.</p>
        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">Pense à venir voir ce qu'il se passe sur ta plateforme d'accompagnement ; des objectifs ont sûrement été mis à jour. Viens également mettre à jour tes candidatures afin qu'on puisse suivre ton avancement !</p>
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

      return { subject: "Alerte d'activité !", html };
    }

    if (type === NotifType.DOCUMENT_REVIEW) {
      const docName = escapeHtml(
        typeof payload.documentName === 'string'
          ? payload.documentName
          : 'document',
      );
      const status = payload.status as string;
      const docType = payload.docType as string;
      const docTypeLabel =
        docType === 'CV'
          ? 'CV'
          : docType === 'LM'
            ? 'lettre de motivation'
            : 'document';
      const isValidated = status === 'VALIDATED';

      const color = isValidated ? '#16a34a' : '#ea580c';
      const emoji = isValidated ? '✅' : '⚠️';
      const statusLabel = isValidated ? 'Validé' : 'À corriger';
      const message = isValidated
        ? `Votre ${docTypeLabel} a été examiné et <strong style="color:${color};">validé</strong> par votre chargé RE. Bravo !`
        : `Votre ${docTypeLabel} a été examiné et nécessite des <strong style="color:${color};">corrections</strong>. Connectez-vous à Spektr pour en savoir plus.`;

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
      <div style="font-size:24px;margin-bottom:8px;">${emoji} Avis sur votre ${docTypeLabel}</div>
      <h1 style="margin:0 0 6px;font-size:20px;color:#1d1d1e;">Bonjour ${name},</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">${message}</p>
      <div style="background:#f9fafb;border:1px solid #e8e8e8;border-left:3px solid ${color};border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Document concerné</div>
        <div style="font-size:14px;color:#1d1d1e;font-weight:600;">${docName}</div>
        <div style="margin-top:8px;display:inline-block;background:${isValidated ? '#f0fdf4' : '#fff7ed'};border:1px solid ${isValidated ? '#bbf7d0' : '#fed7aa'};border-radius:6px;padding:4px 10px;font-size:12px;font-weight:700;color:${color};">${emoji} ${statusLabel}</div>
      </div>
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
        Connectez-vous à Spektr pour consulter vos documents et mettre à jour votre dossier.
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

      return {
        subject: `${emoji} Votre ${docTypeLabel} — ${statusLabel}`,
        html,
      };
    }

    return {
      subject: 'Nouvelle notification — Spektr',
      html: `<p>Bonjour ${name},<br>Vous avez reçu une nouvelle notification sur Spektr.</p>`,
    };
  }

  /**
   * Sends the security confirmation email after a password change, including the
   * timestamp and a "wasn't you?" warning. No-op without an email; failures are
   * logged, not thrown.
   *
   * @param userId - Id of the user whose password changed.
   */
  async sendPasswordChangedEmail(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) return;

    const firstName = escapeHtml(user.first_name ?? 'Étudiant');
    const date = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

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
      <div style="font-size:28px;margin-bottom:12px;">🔐</div>
      <h1 style="margin:0 0 6px;font-size:20px;color:#1d1d1e;">Bonjour ${firstName},</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
        Le mot de passe de votre compte Spektr a été modifié avec succès.
      </p>

      <div style="background:#f0fdf9;border:1px solid rgba(35,178,164,0.2);border-left:3px solid #23b2a4;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Détails de la modification</div>
        <div style="font-size:14px;color:#1d1d1e;">📅 <strong>${date}</strong></div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">Compte : ${escapeHtml(user.email)}</div>
      </div>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:13px;color:#d97706;font-weight:600;margin-bottom:4px;">⚠️ Ce n'était pas vous ?</div>
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
          Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement votre chargé RE.
        </p>
      </div>

      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
        Vous avez été déconnecté de tous vos appareils par mesure de sécurité. Reconnectez-vous avec votre nouveau mot de passe.
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

    try {
      await this.mailService.send(
        user.email,
        '🔐 Mot de passe modifié — Spektr',
        html,
      );
    } catch (err) {
      this.logger.error(err);
    }
  }

  /**
   * Lists a user's notifications, newest first.
   *
   * @param userId - Owner of the notifications.
   * @returns The user's notifications ordered by `created_at` descending.
   */
  async findAllForUser(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Marks a single notification read, scoped to its owner so a user can't touch
   * someone else's notifications.
   *
   * @param id - Notification id.
   * @param userId - Owner id (part of the where-clause for isolation).
   * @returns Prisma batch payload with the updated count.
   */
  async markAsRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  /**
   * Marks all of a user's notifications read.
   *
   * @param userId - Owner of the notifications.
   * @returns Prisma batch payload with the updated count.
   */
  async markAllRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId },
      data: { read: true },
    });
  }
}
