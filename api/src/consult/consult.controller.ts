import { Body, Controller, HttpCode, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ConsultService } from './consult.service';

interface ConsultRequestBody {
  email?: string;
  message?: string;
  summary?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Controller('consult')
export class ConsultController {
  constructor(private readonly consultService: ConsultService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async send(@Body() body: ConsultRequestBody) {
    const email = (body?.email || '').trim();
    if (!EMAIL_PATTERN.test(email)) {
      throw new HttpException({ status: 'error', message: 'A valid email is required' }, HttpStatus.BAD_REQUEST);
    }

    try {
      await this.consultService.sendConsultRequest(email, (body.message || '').trim(), (body.summary || '').trim());
      return { status: 'success' };
    } catch (error) {
      const err = error as { message?: string };
      // eslint-disable-next-line no-console
      console.error('Error sending consult request:', err.message);

      throw new HttpException(
        { status: 'error', message: 'Unable to send your request right now. Please try again later.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
