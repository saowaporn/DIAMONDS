import { Injectable } from '@nestjs/common';
import { DIAMOND_RESPONSE_GROUPS } from './diamonds.config';
import { DiamondRow } from './diamond-data.service';

@Injectable()
export class DiamondFormatService {
  formatRow(row: DiamondRow): Record<string, unknown> {
    const formatted: Record<string, unknown> = { ...row };

    Object.entries(DIAMOND_RESPONSE_GROUPS).forEach(([groupName, keys]) => {
      const group: Record<string, unknown> = {};

      keys.forEach((key) => {
        const value = formatted[key];
        if (value === undefined || value === null || value === '') {
          return;
        }

        group[key] = value;
        delete formatted[key];
      });

      if (Object.keys(group).length > 0) {
        formatted[groupName] = group;
      }
    });

    return formatted;
  }
}
