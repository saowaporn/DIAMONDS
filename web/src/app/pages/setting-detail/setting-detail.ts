import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { SettingSelectionService, SelectedSetting } from '../../shared/setting-selection.service';
import { RingSetting, RingSettingsApiService } from '../../shared/ring-settings-api.service';
import { HintButton } from '../../shared/hint-button/hint-button';
import { RingFlowHeader } from '../../shared/ring-flow-header/ring-flow-header';
import {
  COLOR_GUIDE,
  MATERIAL_GUIDE,
  RING_IMAGE_ANGLES,
  RING_SETTING_MATERIALS,
  RING_SETTING_SHAPES,
  RingImageAngle,
  SettingTypeGroup,
  getAvailableColorOptions,
  getDefaultColorKey,
  groupBySettingType,
  resolveAngleImage,
  resolveGroupRow,
  shapeIconPath,
} from '../../shared/ring-setting-filters';

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
  imports: [RouterLink, HintButton, RingFlowHeader],
  templateUrl: './setting-detail.html',
})
export class SettingDetail {
  private readonly settingSelection = inject(SettingSelectionService);
  private readonly ringSettingsApi = inject(RingSettingsApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly fromSummary = this.route.snapshot.queryParamMap.get('from') === 'summary';
  private readonly cartItemId = this.route.snapshot.queryParamMap.get('cartItemId');
  private readonly favoriteItemId = this.route.snapshot.queryParamMap.get('favoriteItemId');

  private group: SettingTypeGroup | null = null;

  readonly angles = RING_IMAGE_ANGLES;
  readonly ringSizes = RING_SIZES;
  readonly shapeIconPath = shapeIconPath;
  readonly materials = RING_SETTING_MATERIALS;
  readonly materialGuide = MATERIAL_GUIDE;
  readonly colorGuide = COLOR_GUIDE;
  readonly setting = signal<SelectedSetting | null>(this.settingSelection.getSelectedSetting());
  private readonly originalShape = this.setting()?.shape ?? null;
  readonly activeAngle = signal<RingImageAngle>('front');
  readonly ringSize = signal<string | null>(this.setting()?.ringSize ?? null);
  readonly currentRow = signal<RingSetting | null>(null);
  readonly availableShapes = signal<string[]>([]);
  readonly shapeExpanded = signal(false);
  readonly zoomOrigin = signal('50% 50%');
  readonly isZooming = signal(false);

  readonly formattedPrice = computed(() => parsePrice(this.setting()?.price || '0').toLocaleString('th-TH'));

  readonly selectedShapeLabel = computed(() => {
    const current = this.setting()?.shape || '';
    return RING_SETTING_SHAPES.find((s) => s.toLowerCase() === current.toLowerCase()) || current;
  });

  readonly continueButtonLabel = computed(() => {
    if (!this.fromSummary) return 'Select This Setting';
    return this.setting()?.shape === this.originalShape ? 'Save Changes' : 'Continue to Choose Diamond';
  });

  readonly colorOptions = computed(() => {
    const row = this.currentRow();
    return row ? getAvailableColorOptions(row) : [];
  });

  readonly activeImage = computed(() => this.angleImage(this.activeAngle()) || this.angleImage('front') || '');

  readonly availableAngles = computed(() => this.angles.filter((angle) => !!this.angleImage(angle.key)));

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

  prevAngle(): void {
    const list = this.availableAngles();
    if (list.length < 2) return;
    const idx = list.findIndex((a) => a.key === this.activeAngle());
    const nextIdx = (idx - 1 + list.length) % list.length;
    this.activeAngle.set(list[nextIdx].key);
  }

  nextAngle(): void {
    const list = this.availableAngles();
    if (list.length < 2) return;
    const idx = list.findIndex((a) => a.key === this.activeAngle());
    const nextIdx = (idx + 1) % list.length;
    this.activeAngle.set(list[nextIdx].key);
  }

  private readonly zoomEdgeMargin = 56; // px reserved on each side for the nav arrows

  onImageMouseMove(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const px = event.clientX - rect.left;
    const x = (px / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.zoomOrigin.set(`${x}% ${y}%`);
    const inDeadZone = px < this.zoomEdgeMargin || px > rect.width - this.zoomEdgeMargin;
    this.isZooming.set(!inDeadZone);
  }

  onImageMouseLeave(): void {
    this.isZooming.set(false);
    this.zoomOrigin.set('50% 50%');
  }

  angleImage(angle: string): string | undefined {
    const current = this.setting();
    if (!current) return undefined;
    return resolveAngleImage(current.images, current.color, angle);
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

    const queryParams: Record<string, string> = {};
    if (this.cartItemId) queryParams['cartItemId'] = this.cartItemId;
    if (this.favoriteItemId) queryParams['favoriteItemId'] = this.favoriteItemId;

    const shapeUnchanged = this.setting()?.shape === this.originalShape;
    if (this.fromSummary && shapeUnchanged) {
      this.router.navigate(['/jewelry/engagement-summary'], { queryParams });
      return;
    }

    this.router.navigate(['/jewelry/diamond-selection'], { queryParams });
  }
}
