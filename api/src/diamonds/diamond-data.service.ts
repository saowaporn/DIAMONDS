import { Injectable } from '@nestjs/common';
import { sheets_v4 } from 'googleapis';
import { GoogleSheetsService } from '../common/google-sheets.service';
import { DIAMOND_COLUMN_MAP, DiamondColumnEntry } from './diamonds.config';

export type DiamondRow = Record<string, string>;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 ชั่วโมง

@Injectable()
export class DiamondDataService {
  private cache: DiamondRow[] | null = null;
  private cacheExpiresAt = 0;

  constructor(private readonly googleSheetsService: GoogleSheetsService) {}

  async loadDiamondRows(): Promise<DiamondRow[]> {
    const now = Date.now();
    if (this.cache && now < this.cacheExpiresAt) {
      return this.cache;
    }

    const rows = await this.fetchFromSheets();
    this.cache = rows;
    this.cacheExpiresAt = now + CACHE_TTL_MS;
    return rows;
  }

  clearCache(): void {
    this.cache = null;
    this.cacheExpiresAt = 0;
  }

  private async fetchFromSheets(): Promise<DiamondRow[]> {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.DIAMOND_SHEET_NAME;

    if (!spreadsheetId) {
      throw new Error('Missing GOOGLE_SHEET_ID in environment variables');
    }

    if (!sheetName) {
      throw new Error('Missing DIAMOND_SHEET_NAME in environment variables');
    }

    const sheets = await this.googleSheetsService.getClient();
    const ranges = DIAMOND_COLUMN_MAP.map(({ columnIndex }) => {
      const col = this.toA1ColumnLabel(columnIndex);
      return `${sheetName}!${col}:${col}`;
    });

    const response = await sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges });
    return this.buildObjectRowsFromColumnValueRanges(response.data.valueRanges || [], DIAMOND_COLUMN_MAP);
  }

  private toA1ColumnLabel(index: number): string {
    const safeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
    let n = safeIndex + 1;
    let label = '';

    while (n > 0) {
      const rem = (n - 1) % 26;
      label = String.fromCharCode(65 + rem) + label;
      n = Math.floor((n - 1) / 26);
    }

    return label;
  }

  private buildObjectRowsFromColumnValueRanges(
    valueRanges: sheets_v4.Schema$ValueRange[],
    columnMap: readonly DiamondColumnEntry[],
  ): DiamondRow[] {
    const columns = (valueRanges || []).map((range) => range.values || []);
    const maxRows = columns.reduce((max, col) => Math.max(max, col.length), 0);

    return Array.from({ length: Math.max(0, maxRows - 1) }, (_, rowIdx) => {
      const dataRowIdx = rowIdx + 1;
      const row: DiamondRow = {};
      columnMap.forEach((entry, colIdx) => {
        row[entry.key] = (columns[colIdx]?.[dataRowIdx]?.[0] || '').toString().trim();
      });
      return row;
    }).filter((row) => Object.values(row).some((value) => value !== ''));
  }
}
