import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SettingSelectionService } from '../setting-selection.service';
import { ProductSelectionService } from '../product-selection.service';

function formatPrice(price: number | string): string {
  const num = typeof price === 'number' ? price : Number(String(price).replace(/,/g, '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(num) ? num.toLocaleString('th-TH') : String(price);
}

@Component({
  selector: 'app-ring-flow-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './ring-flow-header.html',
})
export class RingFlowHeader {
  readonly activeStep = input.required<number>();

  private readonly settingSelection = inject(SettingSelectionService);
  private readonly productSelection = inject(ProductSelectionService);

  readonly settingMeta = computed(() => {
    const selected = this.settingSelection.getSelectedSetting();
    return selected ? `${selected.name} - THB ${formatPrice(selected.price)}` : 'Select a setting to begin';
  });

  readonly diamondMeta = computed(() => {
    const selected = this.productSelection.getSelectedProduct();
    return selected ? `${selected.name} - THB ${formatPrice(selected.price)}` : '—';
  });
}
