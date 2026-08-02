import { Injectable } from '@nestjs/common';
import { GoogleSheetsService } from '../common/google-sheets.service';
import { RING_SETTING_COLUMNS, RING_SETTING_SHEET_RANGE } from './ring-settings.config';

export type RingSettingRow = Record<string, string>;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RingSettingDataService {
  private cache: RingSettingRow[] | null = null;
  private cacheExpiresAt = 0;

  constructor(private readonly googleSheetsService: GoogleSheetsService) {}

  async loadRingSettingRows(): Promise<RingSettingRow[]> {
    const now = Date.now();
    if (this.cache && now < this.cacheExpiresAt) {
      return this.cache;
    }

    const rows = await this.fetchFromSheet();
    this.cache = rows;
    this.cacheExpiresAt = now + CACHE_TTL_MS;
    return rows;
  }

  clearCache(): void {
    this.cache = null;
    this.cacheExpiresAt = 0;
  }

  private async fetchFromSheet(): Promise<RingSettingRow[]> {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.RING_SETTING_SHEET_NAME;

    if (!spreadsheetId) {
      throw new Error('Missing GOOGLE_SHEET_ID in environment variables');
    }

    if (!sheetName) {
      throw new Error('Missing RING_SETTING_SHEET_NAME in environment variables');
    }

    const sheets = await this.googleSheetsService.getClient();
    const range = `${sheetName}!${RING_SETTING_SHEET_RANGE}`;
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const values = response.data.values || [];

    return values
      .slice(1)
      .map((row) => {
        const record: RingSettingRow = {};
        RING_SETTING_COLUMNS.forEach(({ index, key }) => {
          record[key] = (row[index] || '').toString().trim();
        });
        return record;
      })
      .filter((row) => Object.values(row).some((value) => value !== ''));
  }
}
