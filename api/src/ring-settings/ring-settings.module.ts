import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ShopifyModule } from '../shopify/shopify.module';
import { RingSettingsController } from './ring-settings.controller';
import { RingSettingsService } from './ring-settings.service';
import { RingSettingDataService } from './ring-setting-data.service';
import { RingSettingFormatService } from './ring-setting-format.service';

@Module({
  imports: [CommonModule, ShopifyModule],
  controllers: [RingSettingsController],
  providers: [RingSettingsService, RingSettingDataService, RingSettingFormatService],
})
export class RingSettingsModule {}
