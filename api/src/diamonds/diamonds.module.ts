import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { DiamondsController } from './diamonds.controller';
import { DiamondsService } from './diamonds.service';
import { DiamondDataService } from './diamond-data.service';
import { DiamondFilterService } from './diamond-filter.service';
import { DiamondFormatService } from './diamond-format.service';

@Module({
  imports: [CommonModule],
  controllers: [DiamondsController],
  providers: [DiamondsService, DiamondDataService, DiamondFilterService, DiamondFormatService],
})
export class DiamondsModule {}
