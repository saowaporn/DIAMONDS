import { Body, Controller, HttpCode, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ContactService } from './contact.service';

interface ContactRequestBody {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async send(@Body() body: ContactRequestBody) {
    const name = (body?.name || '').trim();
    if (!name) {
      throw new HttpException({ status: 'error', message: 'A name is required' }, HttpStatus.BAD_REQUEST);
    }

    const email = (body?.email || '').trim();
    if (!EMAIL_PATTERN.test(email)) {
      throw new HttpException({ status: 'error', message: 'A valid email is required' }, HttpStatus.BAD_REQUEST);
    }

    const phone = (body?.phone || '').trim();

    const subject = (body?.subject || '').trim();
    if (!subject) {
      throw new HttpException({ status: 'error', message: 'A subject is required' }, HttpStatus.BAD_REQUEST);
    }

    const message = (body?.message || '').trim();
    if (!message) {
      throw new HttpException({ status: 'error', message: 'A message is required' }, HttpStatus.BAD_REQUEST);
    }

    try {
      await this.contactService.sendContactMessage(name, email, phone, subject, message);
      return { status: 'success' };
    } catch (error) {
      const err = error as { message?: string };
      // eslint-disable-next-line no-console
      console.error('Error sending contact message:', err.message);

      throw new HttpException(
        { status: 'error', message: 'Unable to send your message right now. Please try again later.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
