import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { SettingSelectionService, SelectedSetting } from '../../shared/setting-selection.service';
import { colorLabel, materialLabel } from '../../shared/ring-setting-filters';

const ANGLES: { key: 'front' | 'side' | 'top1' | 'top2'; label: string }[] = [
  { key: 'front', label: 'Front' },
  { key: 'side', label: 'Side' },
  { key: 'top1', label: 'Top 1' },
  { key: 'top2', label: 'Top 2' },
];

function parsePrice(price: string): number {
  const cleaned = (price || '').replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

@Component({
  selector: 'app-setting-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './setting-detail.html',
})
export class SettingDetail {
  private readonly settingSelection = inject(SettingSelectionService);
  private readonly router = inject(Router);

  readonly angles = ANGLES;
  readonly setting = signal<SelectedSetting | null>(this.settingSelection.getSelectedSetting());
  readonly activeAngle = signal<'front' | 'side' | 'top1' | 'top2'>('front');

  readonly materialLabelText = computed(() => materialLabel(this.setting()?.material));
  readonly colorLabelText = computed(() => colorLabel(this.setting()?.color));
  readonly formattedPrice = computed(() => parsePrice(this.setting()?.price || '0').toLocaleString('th-TH'));

  readonly activeImage = computed(() => this.angleImage(this.activeAngle()) || this.angleImage('front') || '');

  angleImage(angle: string): string | undefined {
    const current = this.setting();
    if (!current) return undefined;
    return current.images?.[current.color]?.[angle as keyof typeof current.images[string]];
  }

  selectDiamond(): void {
    this.router.navigateByUrl('/jewelry/diamond-selection');
  }
}
