import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Transactional email sender backed by a Nodemailer SMTP transport (Brevo
 * relay). Configured once from `SMTP_*` env vars; a fixed "from" identity is
 * used for every message.
 */
@Injectable()
export class MailService {
  private readonly transporter: Transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const user = config.get<string>('SMTP_USER') ?? '';
    const pass = config.get<string>('SMTP_PASS') ?? '';
    const fromAddress = config.get<string>('SMTP_FROM') ?? user;

    this.from = `"Spektr — Ynov Campus" <${fromAddress}>`;

    this.transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
    });
  }

  /**
   * Sends an HTML email and logs the outcome. Rethrows on failure so callers can
   * decide whether the send is critical (awaited) or best-effort (`.catch()`).
   *
   * @param to - Recipient email address.
   * @param subject - Email subject line.
   * @param html - HTML body of the message.
   * @throws When the SMTP transport fails to send.
   */
  async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email envoyé avec succès - ${subject}`);
    } catch (err) {
      this.logger.error(
        `Échec d'envoi de l'email - ${subject}: ${(err as Error).message}`,
      );
      throw err;
    }
  }
}
