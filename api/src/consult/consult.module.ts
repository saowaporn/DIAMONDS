import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ConsultController } from './consult.controller';
import { ConsultService } from './consult.service';

@Module({
  imports: [CommonModule],
  controllers: [ConsultController],
  providers: [ConsultService],
})
export class ConsultModule {}
