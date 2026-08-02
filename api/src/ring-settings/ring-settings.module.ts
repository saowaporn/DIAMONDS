import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { RingSettingsController } from './ring-settings.controller';
import { RingSettingsService } from './ring-settings.service';
import { RingSettingDataService } from './ring-setting-data.service';
import { RingSettingFormatService } from './ring-setting-format.service';

@Module({
  imports: [CommonModule],
  controllers: [RingSettingsController],
  providers: [RingSettingsService, RingSettingDataService, RingSettingFormatService],
})
export class RingSettingsModule {}
