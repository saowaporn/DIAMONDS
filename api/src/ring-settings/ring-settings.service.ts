import { Injectable } from '@nestjs/common';
import { RingSettingDataService } from './ring-setting-data.service';
import { RingSettingFormatService, FormattedRingSetting } from './ring-setting-format.service';

@Injectable()
export class RingSettingsService {
  constructor(
    private readonly dataService: RingSettingDataService,
    private readonly formatService: RingSettingFormatService,
  ) {}

  async getAllFormatted(): Promise<FormattedRingSetting[]> {
    const rows = await this.dataService.loadRingSettingRows();
    return rows.map((row) => this.formatService.formatRow(row));
  }

  clearCache(): void {
    this.dataService.clearCache();
  }
}
