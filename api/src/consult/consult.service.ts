import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class ConsultService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return this.transporter;
  }

  async sendConsultRequest(customerEmail: string, message: string, summary: string): Promise<void> {
    const to = process.env.CONSULT_TO_EMAIL || 'info@yanigadiamond.com';
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await this.getTransporter().sendMail({
      from,
      to,
      replyTo: customerEmail,
      subject: 'New consultation request — YANIGA DIAMOND',
      text: [
        `Customer email: ${customerEmail}`,
        '',
        'Message:',
        message || '(no message provided)',
        '',
        'Selection:',
        summary || '(no selection details provided)',
      ].join('\n'),
    });
  }
}
