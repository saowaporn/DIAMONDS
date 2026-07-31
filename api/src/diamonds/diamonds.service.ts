import { Injectable } from '@nestjs/common';
import { DiamondDataService, DiamondRow } from './diamond-data.service';
import { DiamondFilterService } from './diamond-filter.service';
import { DiamondFormatService } from './diamond-format.service';
import { DiamondFilters } from './dto/diamond-filter.dto';

@Injectable()
export class DiamondsService {
  constructor(
    private readonly diamondDataService: DiamondDataService,
    private readonly diamondFilterService: DiamondFilterService,
    private readonly diamondFormatService: DiamondFormatService,
  ) {}

  async getFilteredDiamonds(shape: string, filters: DiamondFilters): Promise<DiamondRow[]> {
    const diamonds = await this.diamondDataService.loadDiamondRows();
    return this.diamondFilterService.filterRows(diamonds, { ...(filters || {}), shape });
  }

  formatRow(row: DiamondRow): Record<string, unknown> {
    return this.diamondFormatService.formatRow(row);
  }

  clearCache(): void {
    this.diamondDataService.clearCache();
  }
}
