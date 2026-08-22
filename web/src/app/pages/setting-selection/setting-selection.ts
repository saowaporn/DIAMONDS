import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RingSetting, RingSettingsApiService } from '../../shared/ring-settings-api.service';
import { SettingSelectionService } from '../../shared/setting-selection.service';
import { HintButton } from '../../shared/hint-button/hint-button';
import { RingFlowHeader } from '../../shared/ring-flow-header/ring-flow-header';
import {
  COLOR_GUIDE,
  MATERIAL_GUIDE,
  RING_SETTING_MATERIALS,
  RING_SETTING_SHAPES,
  getDefaultColorKey,
  groupBySettingType,
  materialLabel,
  resolveAngleImage,
  resolveGroupRow,
  settingStyleIconPath,
  shapeIconPath,
} from '../../shared/ring-setting-filters';

type SortOption = 'featured' | 'price-asc' | 'price-desc';

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
  imports: [HintButton, RingFlowHeader],
  templateUrl: './setting-selection.html',
})
export class SettingSelection {
  private readonly ringSettingsApi = inject(RingSettingsApiService);
  private readonly settingSelection = inject(SettingSelectionService);
  private readonly router = inject(Router);

  readonly shapes = RING_SETTING_SHAPES;
  readonly shapeIconPath = shapeIconPath;
  readonly settingStyleIconPath = settingStyleIconPath;
  readonly materials = RING_SETTING_MATERIALS;
  readonly colorOptions = COLOR_FILTER_OPTIONS;
  readonly materialGuide = MATERIAL_GUIDE;
  readonly colorGuide = COLOR_GUIDE;

  readonly loading = signal(true);
  readonly allSettings = signal<RingSetting[]>([]);

  readonly shapeFilter = signal<string | null>(null);
  readonly materialFilter = signal<Set<string>>(new Set(['silver']));
  readonly colorFilter = signal<string | null>('gold');
  readonly settingTypeFilter = signal<string | null>('Solitaire');
  readonly sortBy = signal<SortOption>('featured');

  readonly settingGroups = computed(() => groupBySettingType(this.allSettings()));
  readonly settingTypes = computed(() => this.settingGroups().map((g) => g.settingType));

  readonly cards = computed(() => {
    const shapeFilter = this.shapeFilter();
    const selectedMaterials = this.materialFilter();
    const color = this.colorFilter();
    const settingType = this.settingTypeFilter();
    const shapesToShow = shapeFilter ? [shapeFilter] : this.shapes;
    const materialsToShow = selectedMaterials.size
      ? Array.from(selectedMaterials)
      : this.materials.map((m) => m.value);

    const groups = settingType
      ? this.settingGroups().filter((g) => g.settingType.toLowerCase() === settingType.toLowerCase())
      : this.settingGroups();

    const seen = new Set<string>();
    const result: { row: RingSetting; colorKey: string }[] = [];

    groups.forEach((group) => {
      shapesToShow.forEach((shape) => {
        materialsToShow.forEach((material) => {
          const row = resolveGroupRow(group, { shape, material });
          if (!row || seen.has(row.id)) return;
          seen.add(row.id);

          const colorKey = row.material === 'platinum' ? 'platinum' : color || getDefaultColorKey(row);
          result.push({ row, colorKey });
        });
      });
    });

    const sortBy = this.sortBy();
    if (sortBy === 'price-asc') {
      result.sort((a, b) => parsePrice(a.row.price) - parsePrice(b.row.price));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => parsePrice(b.row.price) - parsePrice(a.row.price));
    }

    return result;
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

  toggleMaterial(material: string): void {
    const next = new Set(this.materialFilter());
    if (next.has(material)) next.delete(material);
    else next.add(material);
    this.materialFilter.set(next);
  }

  isMaterialSelected(material: string): boolean {
    return this.materialFilter().has(material);
  }

  setColor(color: string | null): void {
    this.colorFilter.set(color);
  }

  setSettingType(settingType: string | null): void {
    this.settingTypeFilter.set(settingType);
  }

  setSortBy(value: string): void {
    this.sortBy.set(value as SortOption);
  }

  materialLabelFor(value: string): string {
    return materialLabel(value);
  }

  availableColorKeys(row: RingSetting): string[] {
    return Object.keys(row.images || {});
  }

  formatPrice(price: string): string {
    return parsePrice(price).toLocaleString('th-TH');
  }

  previewImage(row: RingSetting, colorKey: string): string {
    return row.images?.[colorKey]?.front || row.images?.[getDefaultColorKey(row)]?.front || '';
  }

  hoverImage(row: RingSetting, colorKey: string): string {
    return resolveAngleImage(row.images, colorKey, 'top1') || this.previewImage(row, colorKey);
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
