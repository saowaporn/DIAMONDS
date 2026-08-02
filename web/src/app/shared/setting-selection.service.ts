import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RingSetting } from './ring-settings-api.service';

export interface SelectedSetting {
  settingId: string;
  settingType: string;
  name: string;
  shape: string;
  material: string;
  color: string;
  price: string;
  images: RingSetting['images'];
  ringSize?: string;
}

const SELECTED_SETTING_KEY = 'selectedSetting';

@Injectable({ providedIn: 'root' })
export class SettingSelectionService {
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getSelectedSetting(): SelectedSetting | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(SELECTED_SETTING_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SelectedSetting;
    } catch {
      return null;
    }
  }

  setSelectedSetting(setting: SelectedSetting): void {
    if (!this.isBrowser) return;
    localStorage.setItem(SELECTED_SETTING_KEY, JSON.stringify(setting));
  }

  updateSelectedColor(color: string): void {
    const current = this.getSelectedSetting();
    if (!current) return;
    this.setSelectedSetting({ ...current, color });
  }

  updateRingSize(ringSize: string): void {
    const current = this.getSelectedSetting();
    if (!current) return;
    this.setSelectedSetting({ ...current, ringSize });
  }

  clear(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(SELECTED_SETTING_KEY);
  }
}
