import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RingSetting, RingSettingsApiService } from '../../shared/ring-settings-api.service';
import { SettingSelectionService } from '../../shared/setting-selection.service';
import { HintButton } from '../../shared/hint-button/hint-button';
import {
  COLOR_GUIDE,
  MATERIAL_GUIDE,
  RING_SETTING_MATERIALS,
  RING_SETTING_SHAPES,
  getDefaultColorKey,
  groupBySettingType,
  materialLabel,
  resolveGroupRow,
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
  imports: [HintButton],
  templateUrl: './setting-selection.html',
})
export class SettingSelection {
  private readonly ringSettingsApi = inject(RingSettingsApiService);
  private readonly settingSelection = inject(SettingSelectionService);
  private readonly router = inject(Router);

  readonly shapes = RING_SETTING_SHAPES;
  readonly materials = RING_SETTING_MATERIALS;
  readonly colorOptions = COLOR_FILTER_OPTIONS;
  readonly materialGuide = MATERIAL_GUIDE;
  readonly colorGuide = COLOR_GUIDE;

  readonly loading = signal(true);
  readonly allSettings = signal<RingSetting[]>([]);

  readonly shapeFilter = signal<string>('Asscher');
  readonly materialFilter = signal<string | null>('silver');
  readonly colorFilter = signal<string | null>('gold');

  readonly settingGroups = computed(() => groupBySettingType(this.allSettings()));

  readonly cards = computed(() => {
    const shape = this.shapeFilter();
    const material = this.materialFilter();
    const color = this.colorFilter();

    return this.settingGroups()
      .map((group) => {
        const row = resolveGroupRow(group, { shape, material });
        if (!row) return null;
        const colorKey = material === 'platinum' ? 'platinum' : color || getDefaultColorKey(row);
        return { row, colorKey };
      })
      .filter((card): card is { row: RingSetting; colorKey: string } => card !== null);
  });

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

  setShape(shape: string): void {
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

  previewImage(row: RingSetting, colorKey: string): string {
    return row.images?.[colorKey]?.front || row.images?.[getDefaultColorKey(row)]?.front || '';
  }

  selectSetting(row: RingSetting, colorKey: string): void {
    this.settingSelection.setSelectedSetting({
      settingId: row.id,
      settingType: row.settingType,
      name: row.name,
      shape: row.shape,
      material: row.material,
      color: colorKey,
      price: row.price,
      images: row.images,
    });

    this.router.navigateByUrl('/jewelry/setting-detail');
  }
}
