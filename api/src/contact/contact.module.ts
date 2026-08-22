import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [CommonModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
