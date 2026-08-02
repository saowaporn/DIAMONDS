import { Injectable } from '@nestjs/common';
import { RING_SETTING_IMAGE_BASE_URL } from './ring-settings.config';
import { RingSettingRow } from './ring-setting-data.service';

export interface FormattedRingSetting {
  id: string;
  settingType: string;
  shape: string;
  name: string;
  material: string;
  price: string;
  images: Record<string, Record<string, string>>;
}

interface RingSettingImageJson {
  shape?: string;
  colors?: Record<string, Record<string, string>>;
}

@Injectable()
export class RingSettingFormatService {
  formatRow(row: RingSettingRow): FormattedRingSetting {
    return {
      id: row['settingId'],
      settingType: row['settingType'],
      shape: row['shape'],
      name: row['name'],
      material: row['material'],
      price: row['price'],
      images: this.resolveImages(row['imageJson']),
    };
  }

  private resolveImages(imageJson: string): Record<string, Record<string, string>> {
    if (!imageJson) return {};

    let parsed: RingSettingImageJson;
    try {
      parsed = JSON.parse(imageJson);
    } catch {
      return {};
    }

    const colors = parsed?.colors || {};
    const resolved: Record<string, Record<string, string>> = {};

    Object.entries(colors).forEach(([colorKey, angles]) => {
      const resolvedAngles: Record<string, string> = {};
      Object.entries(angles || {}).forEach(([angleKey, relativePath]) => {
        if (typeof relativePath === 'string' && relativePath.trim()) {
          resolvedAngles[angleKey] = `${RING_SETTING_IMAGE_BASE_URL}${relativePath.trim()}`;
        }
      });
      if (Object.keys(resolvedAngles).length) {
        resolved[colorKey] = resolvedAngles;
      }
    });

    return resolved;
  }
}
