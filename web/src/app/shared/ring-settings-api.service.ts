import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { resolveApiBaseUrl } from './api-base-url';

export interface RingSettingImageSet {
  front?: string;
  side?: string;
  top1?: string;
  top2?: string;
}

export interface RingSetting {
  id: string;
  settingType: string;
  shape: string;
  name: string;
  material: string;
  price: string;
  images: Record<string, RingSettingImageSet>;
}

interface RingSettingsApiResponse {
  status: string;
  count: number;
  data: RingSetting[];
}

@Injectable({ providedIn: 'root' })
export class RingSettingsApiService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiBaseUrl = resolveApiBaseUrl(isPlatformBrowser(this.platformId));
  private cached: Promise<RingSetting[]> | null = null;

  async getAllSettings(): Promise<RingSetting[]> {
    if (!this.cached) {
      this.cached = this.fetchAll().catch((err) => {
        this.cached = null;
        throw err;
      });
    }

    return this.cached;
  }

  private async fetchAll(): Promise<RingSetting[]> {
    const response = await fetch(`${this.apiBaseUrl}/products/settings`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = (await response.json()) as Partial<RingSettingsApiResponse>;
    return Array.isArray(result.data) ? result.data : [];
  }
}
