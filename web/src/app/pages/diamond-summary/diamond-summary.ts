import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DiamondApiData, ProductSelectionService } from '../../shared/product-selection.service';

interface Row {
  key: string;
  value: string;
}

function toRows(obj: unknown): Row[] {
  if (!obj || typeof obj !== 'object') return [];

  return Object.entries(obj as Record<string, unknown>)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
    .map(([key, value]) => ({ key, value: String(value) }));
}

@Component({
  selector: 'app-diamond-summary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './diamond-summary.html',
  styleUrl: './diamond-summary.css',
})
export class DiamondSummary {
  readonly apiData: DiamondApiData | null;

  readonly title = computed(() => {
    if (!this.apiData) return 'No Diamond Data Found';
    return `${this.apiData['carat'] || '-'} Carat ${String(this.apiData['shape'] || 'Diamond').toUpperCase()} Diamond`;
  });

  readonly subtitle = computed(() => {
    if (!this.apiData) return 'Please select a diamond from Engagement page first.';
    const priceNumber = Number(String(this.apiData['price'] || 0).replace(/,/g, '') || 0);
    return `ID: ${this.apiData['id'] || '-'} | Price: THB ${priceNumber.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  });

  readonly image = computed(() => {
    const media = this.apiData?.['media'] as { image?: string } | undefined;
    return media?.image || '/assets/img/favicon.png';
  });

  readonly generalRows = computed<Row[]>(() =>
    this.apiData
      ? toRows({
          id: this.apiData['id'],
          shape: this.apiData['shape'],
          carat: this.apiData['carat'],
          color: this.apiData['color'],
          clarity: this.apiData['clarity'],
          cut: this.apiData['cut'],
          price: this.apiData['price'],
        })
      : [],
  );

  readonly qualityRows = computed<Row[]>(() => toRows(this.apiData?.['quality']));
  readonly detailsRows = computed<Row[]>(() => toRows(this.apiData?.['details']));
  readonly notesRows = computed<Row[]>(() => toRows(this.apiData?.['notes']));
  readonly certificateRows = computed<Row[]>(() => toRows(this.apiData?.['certificate']));

  readonly certificateUrl = computed(() => {
    const certificate = this.apiData?.['certificate'] as Record<string, unknown> | undefined;
    const url = certificate?.['certificate'];
    return typeof url === 'string' && url.trim() ? url : null;
  });

  readonly rawPayload = computed(() => (this.apiData ? JSON.stringify(this.apiData, null, 2) : ''));

  constructor(productSelection: ProductSelectionService) {
    this.apiData = productSelection.getSelectedDiamondApiData();
  }
}
