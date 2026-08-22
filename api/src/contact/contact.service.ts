import { Injectable } from '@nestjs/common';
import { MailerService } from '../common/mailer.service';

@Injectable()
export class ContactService {
  constructor(private readonly mailerService: MailerService) {}

  async sendContactMessage(name: string, email: string, phone: string, subject: string, message: string): Promise<void> {
    const to = process.env.CONTACT_TO_EMAIL || 'info@yanigadiamond.com';
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await this.mailerService.sendMail({
      from,
      to,
      replyTo: email,
      subject: `New contact form message: ${subject}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || '(not provided)'}`,
        '',
        'Message:',
        message,
      ].join('\n'),
    });
  }
}
