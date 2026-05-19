import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    const fromAddress = config.get<string>('SMTP_FROM', user!);

    this.from = `"Spektr — Ynov Campus" <${fromAddress}>`;

    this.transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
    });
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email envoyé à ${to} — ${subject}`);
    } catch (err) {
      this.logger.error(`Échec d'envoi à ${to}: ${(err as Error).message}`);
    }
  }
}
