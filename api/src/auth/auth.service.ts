import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GoogleSheetsService } from '../common/google-sheets.service';
import { JWT_EXPIRES_IN, USER_SHEET_RANGE } from './auth.config';

interface UserRow {
  id: string;
  owner: string;
  username: string;
  password: string;
  expireDate: string;
}

function isExpired(expireDate: string): boolean {
  if (!expireDate) return false;

  const parsed = new Date(expireDate);
  if (Number.isNaN(parsed.getTime())) return false;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return parsed.getTime() < todayStart.getTime();
}

@Injectable()
export class AuthService {
  constructor(
    private readonly googleSheetsService: GoogleSheetsService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string): Promise<{ token: string }> {
    // No caching here (unlike the product-catalog services): login is low-traffic,
    // and credential changes in the sheet (e.g. a password update) must take effect
    // immediately rather than waiting out a cache window.
    const users = await this.fetchFromSheet();
    const match = users.find((user) => user.username === username && user.password === password);

    if (!match) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (isExpired(match.expireDate)) {
      throw new UnauthorizedException('Account has expired');
    }

    const token = await this.jwtService.signAsync(
      { sub: match.username, owner: match.owner },
      { secret: process.env.JWT_SECRET, expiresIn: JWT_EXPIRES_IN },
    );
    return { token };
  }

  private async fetchFromSheet(): Promise<UserRow[]> {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.USER_SHEET_NAME;

    if (!spreadsheetId) {
      throw new Error('Missing GOOGLE_SHEET_ID in environment variables');
    }

    if (!sheetName) {
      throw new Error('Missing USER_SHEET_NAME in environment variables');
    }

    const sheets = await this.googleSheetsService.getClient();
    const range = `${sheetName}!${USER_SHEET_RANGE}`;
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const values = response.data.values || [];

    return values
      .slice(1)
      .map((row) => ({
        id: (row[0] || '').toString().trim(),
        owner: (row[1] || '').toString().trim(),
        username: (row[2] || '').toString().trim(),
        password: (row[3] || '').toString().trim(),
        expireDate: (row[5] || '').toString().trim(),
      }))
      .filter((row) => row.username !== '');
  }
}
