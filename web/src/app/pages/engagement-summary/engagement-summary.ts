import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DiamondApiData, ProductSelectionService } from '../../shared/product-selection.service';
import { SelectedSetting, SettingSelectionService } from '../../shared/setting-selection.service';
import { colorLabel, materialLabel } from '../../shared/ring-setting-filters';

function parsePrice(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

@Component({
  selector: 'app-engagement-summary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './engagement-summary.html',
})
export class EngagementSummary {
  private readonly settingSelection = inject(SettingSelectionService);
  private readonly productSelection = inject(ProductSelectionService);

  readonly setting = () => this.settingValue;
  readonly diamond = () => this.diamondValue;

  private readonly settingValue: SelectedSetting | null = this.settingSelection.getSelectedSetting();
  private readonly diamondValue: DiamondApiData | null = this.productSelection.getSelectedDiamondApiData();

  readonly materialLabelText = computed(() => materialLabel(this.settingValue?.material));
  readonly colorLabelText = computed(() => colorLabel(this.settingValue?.color));

  readonly settingImage = computed(() => {
    const setting = this.settingValue;
    if (!setting) return '';
    const colorKey = setting.color;
    return setting.images?.[colorKey]?.front || Object.values(setting.images || {})[0]?.front || '';
  });

  readonly diamondImage = computed(() => {
    const media = this.diamondValue?.['media'] as { image?: string } | undefined;
    return media?.image || '/assets/img/favicon.png';
  });

  readonly diamondPrice = computed(() => parsePrice(this.diamondValue?.['price']));

  readonly totalPrice = computed(() => {
    const total = parsePrice(this.settingValue?.price) + this.diamondPrice();
    return total.toLocaleString('th-TH');
  });

  formatPrice(value: unknown): string {
    return parsePrice(value).toLocaleString('th-TH');
  }
}
