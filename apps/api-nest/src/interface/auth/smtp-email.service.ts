import { Injectable, Logger } from '@nestjs/common';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import nodemailer from 'nodemailer';
import { IEmailService } from '@forreal/domain';
import { resolveEnvSecret } from '@forreal/infrastructure-jwt-nest';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

@Injectable()
export class SmtpEmailService implements IEmailService {
  private readonly logger = new Logger(SmtpEmailService.name);

  async sendPasswordResetEmail(input: {
    to: string;
    firstName: string;
    resetUrl: string;
    expiresInMinutes: number;
  }): Promise<void> {
    const mailgunApiKey = resolveEnvSecret('MAILGUN_API_KEY');
    const mailgunDomain = process.env.MAILGUN_DOMAIN?.trim();
    const mailgunBaseUrl = process.env.MAILGUN_BASE_URL?.trim();
    const mailgunFrom =
      process.env.MAILGUN_FROM?.trim() ||
      (mailgunDomain ? `ForRealBank <postmaster@${mailgunDomain}>` : undefined);

    if (mailgunApiKey && mailgunDomain && mailgunFrom) {
      this.logger.log(`Sending password reset email via Mailgun to ${input.to}`);
      const mailgun = new Mailgun(FormData);
      const client = mailgun.client({
        username: 'api',
        key: mailgunApiKey,
        ...(mailgunBaseUrl ? { url: mailgunBaseUrl } : {}),
      });

      await client.messages.create(mailgunDomain, {
        from: mailgunFrom,
        to: [input.to],
        subject: 'Reinitialisation de votre mot de passe ForRealBank',
        text: this.buildTextBody(input),
        html: this.buildHtmlBody(input),
      });
      this.logger.log(`Password reset email sent via Mailgun to ${input.to}`);
      return;
    }

    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER?.trim();
    const pass = resolveEnvSecret('SMTP_PASS');
    const from = process.env.SMTP_FROM?.trim() || 'ForRealBank <no-reply@for-real.cloud>';

    if (!host || !user || !pass) {
      this.logger.warn(
        `Email provider is not configured. Reset link for ${input.to}: ${input.resetUrl}`,
      );
      return;
    }

    this.logger.log(`Sending password reset email via SMTP to ${input.to}`);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: input.to,
      subject: 'Reinitialisation de votre mot de passe ForRealBank',
      text: this.buildTextBody(input),
      html: this.buildHtmlBody(input),
    });
    this.logger.log(`Password reset email sent via SMTP to ${input.to}`);
  }

  private buildTextBody(input: {
    firstName: string;
    resetUrl: string;
    expiresInMinutes: number;
  }): string {
    return [
      `Bonjour ${input.firstName},`,
      '',
      'Vous avez demande la reinitialisation de votre mot de passe ForRealBank.',
      `Ce lien expire dans ${input.expiresInMinutes} minutes:`,
      input.resetUrl,
      '',
      "Si vous n'etes pas a l'origine de cette demande, ignorez cet email.",
    ].join('\n');
  }

  private buildHtmlBody(input: {
    firstName: string;
    resetUrl: string;
    expiresInMinutes: number;
  }): string {
    return `
      <p>Bonjour ${escapeHtml(input.firstName)},</p>
      <p>Vous avez demande la reinitialisation de votre mot de passe ForRealBank.</p>
      <p><a href="${escapeHtml(input.resetUrl)}">Reinitialiser mon mot de passe</a></p>
      <p>Ce lien expire dans ${input.expiresInMinutes} minutes.</p>
      <p>Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>
    `;
  }
}
