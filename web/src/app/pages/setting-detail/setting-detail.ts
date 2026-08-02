import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { SettingSelectionService, SelectedSetting } from '../../shared/setting-selection.service';
import { RingSetting, RingSettingsApiService } from '../../shared/ring-settings-api.service';
import { HintButton } from '../../shared/hint-button/hint-button';
import {
  COLOR_GUIDE,
  MATERIAL_GUIDE,
  RING_SETTING_MATERIALS,
  RING_SETTING_SHAPES,
  SettingTypeGroup,
  getAvailableColorOptions,
  getDefaultColorKey,
  groupBySettingType,
  resolveGroupRow,
} from '../../shared/ring-setting-filters';

const ANGLES: { key: 'front' | 'side' | 'top1' | 'top2'; label: string }[] = [
  { key: 'front', label: 'Front' },
  { key: 'side', label: 'Side' },
  { key: 'top1', label: 'Top 1' },
  { key: 'top2', label: 'Top 2' },
];

const RING_SIZES: string[] = Array.from({ length: 59 - 44 + 1 }, (_, i) => String(44 + i));

function parsePrice(price: string): number {
  const cleaned = (price || '').replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function formatCircumferenceCm(size: string): string {
  return (Number(size) / 10).toFixed(1);
}

@Component({
  selector: 'app-setting-detail',
  standalone: true,
  imports: [RouterLink, HintButton],
  templateUrl: './setting-detail.html',
})
export class SettingDetail {
  private readonly settingSelection = inject(SettingSelectionService);
  private readonly ringSettingsApi = inject(RingSettingsApiService);
  private readonly router = inject(Router);

  private group: SettingTypeGroup | null = null;

  readonly angles = ANGLES;
  readonly ringSizes = RING_SIZES;
  readonly materials = RING_SETTING_MATERIALS;
  readonly materialGuide = MATERIAL_GUIDE;
  readonly colorGuide = COLOR_GUIDE;
  readonly setting = signal<SelectedSetting | null>(this.settingSelection.getSelectedSetting());
  readonly activeAngle = signal<'front' | 'side' | 'top1' | 'top2'>('front');
  readonly ringSize = signal<string | null>(this.setting()?.ringSize ?? null);
  readonly currentRow = signal<RingSetting | null>(null);
  readonly availableShapes = signal<string[]>([]);

  readonly formattedPrice = computed(() => parsePrice(this.setting()?.price || '0').toLocaleString('th-TH'));

  readonly colorOptions = computed(() => {
    const row = this.currentRow();
    return row ? getAvailableColorOptions(row) : [];
  });

  readonly activeImage = computed(() => this.angleImage(this.activeAngle()) || this.angleImage('front') || '');

  constructor() {
    const current = this.setting();
    if (!current) return;

    this.ringSettingsApi
      .getAllSettings()
      .then((settings) => {
        const groups = groupBySettingType(settings);
        this.group = groups.find((g) => g.settingType === current.settingType) || null;
        if (!this.group) return;

        const groupShapes = new Set(this.group.rows.map((row) => (row.shape || '').toLowerCase()));
        this.availableShapes.set(RING_SETTING_SHAPES.filter((shape) => groupShapes.has(shape.toLowerCase())));

        const row = resolveGroupRow(this.group, { shape: current.shape, material: current.material });
        if (row) this.currentRow.set(row);
      })
      .catch((err) => console.error('Error loading ring settings:', err));
  }

  angleImage(angle: string): string | undefined {
    const current = this.setting();
    if (!current) return undefined;
    return current.images?.[current.color]?.[angle as keyof typeof current.images[string]];
  }

  circumferenceCm(size: string): string {
    return formatCircumferenceCm(size);
  }

  setShape(shape: string): void {
    const current = this.setting();
    if (!current || !this.group) return;

    const row = resolveGroupRow(this.group, { shape, material: current.material });
    if (!row) return;

    this.currentRow.set(row);
    const availableColors = getAvailableColorOptions(row);
    const colorKey =
      row.material === 'platinum'
        ? 'platinum'
        : availableColors.some((c) => c.key === current.color)
          ? current.color
          : getDefaultColorKey(row);

    const updated: SelectedSetting = {
      ...current,
      settingId: row.id,
      shape: row.shape,
      material: row.material,
      color: colorKey,
      price: row.price,
      images: row.images,
    };
    this.setting.set(updated);
    this.settingSelection.setSelectedSetting(updated);
    this.activeAngle.set('front');
  }

  setMaterial(material: string): void {
    const current = this.setting();
    if (!current || !this.group) return;

    const row = resolveGroupRow(this.group, { shape: current.shape, material });
    if (!row) return;

    this.currentRow.set(row);
    const availableColors = getAvailableColorOptions(row);
    const colorKey =
      material === 'platinum'
        ? 'platinum'
        : availableColors.some((c) => c.key === current.color)
          ? current.color
          : getDefaultColorKey(row);

    const updated: SelectedSetting = {
      ...current,
      settingId: row.id,
      material: row.material,
      color: colorKey,
      price: row.price,
      images: row.images,
    };
    this.setting.set(updated);
    this.settingSelection.setSelectedSetting(updated);
  }

  setColor(color: string): void {
    const current = this.setting();
    if (!current) return;

    const updated: SelectedSetting = { ...current, color };
    this.setting.set(updated);
    this.settingSelection.setSelectedSetting(updated);
  }

  selectRingSize(size: string): void {
    this.ringSize.set(size);
    this.settingSelection.updateRingSize(size);
    const current = this.setting();
    if (current) this.setting.set({ ...current, ringSize: size });
  }

  selectDiamond(): void {
    if (!this.ringSize()) return;
    this.router.navigateByUrl('/jewelry/diamond-selection');
  }
}
