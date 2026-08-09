import { Module } from '@nestjs/common';
import { GoogleSheetsService } from './google-sheets.service';
import { MailerService } from './mailer.service';

@Module({
  providers: [GoogleSheetsService, MailerService],
  exports: [GoogleSheetsService, MailerService],
})
export class CommonModule {}
