import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { google, sheets_v4 } from 'googleapis';

function normalizePrivateKey(rawKey: string): string {
  let key = rawKey.trim();

  // Some env var UIs (including Vercel's) preserve literal wrapping quotes
  // if they were included when the value was pasted in.
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  // .env files with dotenv already unescape \n inside double-quoted values,
  // but plain env var stores (Vercel dashboard, shell exports) do not — so
  // the key can arrive as either literal "\n" sequences or real newlines.
  key = key.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r\n/g, '\n');

  return key;
}

@Injectable()
export class GoogleSheetsService {
  private async getGoogleAuthClient() {
    const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    const keyFilePath = path.join(process.cwd(), 'credentials.json');
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (clientEmail && privateKey) {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail.trim(),
          private_key: normalizePrivateKey(privateKey),
        },
        scopes,
      });
      return auth.getClient();
    }

    if (fs.existsSync(keyFilePath)) {
      const auth = new google.auth.GoogleAuth({ keyFile: keyFilePath, scopes });
      return auth.getClient();
    }

    throw new Error(
      'Missing Google credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY or add credentials.json locally',
    );
  }

  async getClient(): Promise<sheets_v4.Sheets> {
    const auth = await this.getGoogleAuthClient();
    return google.sheets({ version: 'v4', auth: auth as never });
  }
}
