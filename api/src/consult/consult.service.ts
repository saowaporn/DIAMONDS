import { Injectable } from '@nestjs/common';
import { MailerService } from '../common/mailer.service';

@Injectable()
export class ConsultService {
  constructor(private readonly mailerService: MailerService) {}

  async sendConsultRequest(customerEmail: string, customerPhone: string, message: string, summary: string): Promise<void> {
    const to = process.env.CONSULT_TO_EMAIL || 'info@yanigadiamond.com';
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await this.mailerService.sendMail({
      from,
      to,
      replyTo: customerEmail,
      subject: 'New consultation request — YANIGA DIAMOND',
      text: [
        `Customer email: ${customerEmail}`,
        `Phone: ${customerPhone}`,
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
