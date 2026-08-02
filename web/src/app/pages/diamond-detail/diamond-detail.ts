import { AfterViewInit, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DiamondApiData, ProductSelectionService } from '../../shared/product-selection.service';
import { SettingSelectionService } from '../../shared/setting-selection.service';
import { VendorLibsService } from '../../shared/vendor-libs.service';

function parsePriceNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value).replace(/,/g, '').trim();
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getDiamondImages(apiData: DiamondApiData): string[] {
  const images: string[] = [];
  const add = (value: unknown) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!images.includes(trimmed)) images.push(trimmed);
  };

  const media = apiData['media'] as { image?: unknown; images?: unknown[] } | undefined;
  add(media?.image);
  if (Array.isArray(media?.images)) media.images.forEach(add);
  if (Array.isArray(apiData['images'])) (apiData['images'] as unknown[]).forEach(add);
  add(apiData['image']);

  return images;
}

@Component({
  selector: 'app-diamond-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './diamond-detail.html',
})
export class DiamondDetail implements AfterViewInit {
  private readonly mainImage = viewChild<ElementRef<HTMLImageElement>>('mainImage');
  private readonly productSelection = inject(ProductSelectionService);
  private readonly settingSelection = inject(SettingSelectionService);
  private readonly vendorLibs = inject(VendorLibsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly inEngagementFlow = this.route.snapshot.queryParamMap.get('flow') === 'engagement';

  private readonly selected = this.productSelection.getSelectedProduct();

  readonly apiData = signal<DiamondApiData | null>(
    this.selected?.fullData && typeof this.selected.fullData === 'object'
      ? (this.selected.fullData as DiamondApiData)
      : null,
  );

  readonly title = computed(() => {
    const data = this.apiData();
    if (data) {
      return `${data['carat'] || '-'} Carat ${String(data['shape'] || 'Diamond').toUpperCase()} Diamond`;
    }
    return this.selected?.name || 'Diamond';
  });

  private readonly basePrice = computed(() => {
    const data = this.apiData();
    if (data) {
      return parsePriceNumber(data['price'] ?? this.selected?.price);
    }
    return parsePriceNumber(this.selected?.price);
  });

  readonly priceDisplay = computed(() => `THB ${this.basePrice().toLocaleString('th-TH')}`);

  readonly quality = computed(() => this.apiData()?.['quality'] as Record<string, unknown> | undefined);
  readonly details = computed(() => this.apiData()?.['details'] as Record<string, unknown> | undefined);
  readonly notes = computed(() => this.apiData()?.['notes'] as Record<string, unknown> | undefined);
  readonly certificateLab = computed(() => {
    const certificate = this.apiData()?.['certificate'] as Record<string, unknown> | undefined;
    return (certificate?.['lab'] as string) || '';
  });

  private readonly primaryImage = computed(() => {
    const data = this.apiData();
    const images = data ? getDiamondImages(data) : [];
    return images[0] || this.selected?.image || '/assets/img/favicon.png';
  });

  ngAfterViewInit(): void {
    const img = this.mainImage()?.nativeElement;
    if (!img) return;

    const src = this.primaryImage();
    img.src = src;
    img.setAttribute('data-zoom', src);

    this.vendorLibs.initProductImageZoom(img);
  }

  formatOther(value: unknown): string {
    return value === null || value === undefined || String(value).trim() === '' ? '-' : String(value);
  }

  continueButtonLabel(): string {
    return this.inEngagementFlow && this.settingSelection.getSelectedSetting() ? 'Select this diamond' : 'Continue' ;
  }

  selectThisDiamond(): void {
    const apiData = this.apiData();
    if (apiData) {
      this.productSelection.setSelectedDiamondApiData(apiData);
    }

    const hasSetting = this.inEngagementFlow && Boolean(this.settingSelection.getSelectedSetting());
    this.router.navigateByUrl(hasSetting ? '/jewelry/engagement-summary' : '/jewelry/diamond-summary');
  }
}
