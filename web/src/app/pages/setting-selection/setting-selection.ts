import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RingSetting, RingSettingsApiService } from '../../shared/ring-settings-api.service';
import { SettingSelectionService } from '../../shared/setting-selection.service';
import {
  RING_SETTING_MATERIALS,
  RING_SETTING_SHAPES,
  filterRingSettings,
  getDefaultColorKey,
  materialLabel,
} from '../../shared/ring-setting-filters';

const COLOR_FILTER_OPTIONS = [
  { key: 'gold', label: 'Yellow Gold' },
  { key: 'pink_gold', label: 'Pink Gold' },
  { key: 'white_gold', label: 'White Gold' },
];

function parsePrice(price: string): number {
  const cleaned = (price || '').replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

@Component({
  selector: 'app-setting-selection',
  standalone: true,
  templateUrl: './setting-selection.html',
})
export class SettingSelection {
  private readonly ringSettingsApi = inject(RingSettingsApiService);
  private readonly settingSelection = inject(SettingSelectionService);
  private readonly router = inject(Router);

  readonly shapes = RING_SETTING_SHAPES;
  readonly materials = RING_SETTING_MATERIALS;
  readonly colorOptions = COLOR_FILTER_OPTIONS;

  readonly loading = signal(true);
  readonly allSettings = signal<RingSetting[]>([]);

  readonly shapeFilter = signal<string | null>(null);
  readonly materialFilter = signal<string | null>(null);
  readonly colorFilter = signal<string | null>(null);

  readonly filteredSettings = computed(() =>
    filterRingSettings(this.allSettings(), {
      shape: this.shapeFilter(),
      material: this.materialFilter(),
      color: this.materialFilter() === 'platinum' ? null : this.colorFilter(),
    }),
  );

  readonly selectedSettingLabel = computed(() => {
    const selected = this.settingSelection.getSelectedSetting();
    return selected ? `${selected.name} - THB ${this.formatPrice(selected.price)}` : 'Select a setting to begin';
  });

  constructor() {
    this.ringSettingsApi
      .getAllSettings()
      .then((settings) => this.allSettings.set(settings))
      .catch((err) => console.error('Error loading ring settings:', err))
      .finally(() => this.loading.set(false));
  }

  setShape(shape: string | null): void {
    this.shapeFilter.set(shape);
  }

  setMaterial(material: string | null): void {
    this.materialFilter.set(material);
    if (material === 'platinum') {
      this.colorFilter.set(null);
    }
  }

  setColor(color: string | null): void {
    this.colorFilter.set(color);
  }

  materialLabelFor(value: string): string {
    return materialLabel(value);
  }

  formatPrice(price: string): string {
    return parsePrice(price).toLocaleString('th-TH');
  }

  previewImage(setting: RingSetting): string {
    const colorKey = this.colorFilter() || getDefaultColorKey(setting);
    return setting.images?.[colorKey]?.front || setting.images?.[getDefaultColorKey(setting)]?.front || '';
  }

  selectSetting(setting: RingSetting): void {
    const colorKey = this.colorFilter() || getDefaultColorKey(setting);

    this.settingSelection.setSelectedSetting({
      settingId: setting.id,
      settingType: setting.settingType,
      name: setting.name,
      shape: setting.shape,
      material: setting.material,
      color: colorKey,
      price: setting.price,
      images: setting.images,
    });

    this.router.navigateByUrl('/jewelry/setting-detail');
  }
}
