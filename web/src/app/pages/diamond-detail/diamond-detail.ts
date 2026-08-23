import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DiamondApiData, ProductSelectionService } from '../../shared/product-selection.service';
import { SettingSelectionService } from '../../shared/setting-selection.service';
import { RingFlowHeader } from '../../shared/ring-flow-header/ring-flow-header';
import { CartService } from '../../shared/cart.service';
import { FavoriteService } from '../../shared/favorite.service';
import { SavedRingItem } from '../../shared/saved-ring-item';
import { FlyTargetKey, FlyToTargetService } from '../../shared/fly-to-target.service';
import { ConsultModal } from '../../shared/consult-modal/consult-modal';
import { GoodToKnow } from '../../shared/good-to-know/good-to-know';
import { TRUST_BADGES } from '../../shared/trust-badges';

function parsePriceNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value).replace(/,/g, '').trim();
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

interface Row {
  key: string;
  value: string;
}

const LABEL_OVERRIDES: Record<string, string> = { td: 'Depth', measurement: 'Measurements' };

function formatKeyLabel(key: string): string {
  const override = LABEL_OVERRIDES[key.toLowerCase()];
  if (override) return override;
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function toRows(obj: Record<string, unknown> | undefined): Row[] {
  if (!obj) return [];
  return Object.entries(obj)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
    .map(([key, value]) => ({ key: formatKeyLabel(key), value: String(value) }));
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
  imports: [RouterLink, RingFlowHeader, ConsultModal, GoodToKnow],
  templateUrl: './diamond-detail.html',
})
export class DiamondDetail {
  private readonly productSelection = inject(ProductSelectionService);
  private readonly settingSelection = inject(SettingSelectionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cart = inject(CartService);
  private readonly favorites = inject(FavoriteService);
  private readonly flyToTarget = inject(FlyToTargetService);

  private readonly diamondImageRef = viewChild<ElementRef<HTMLImageElement>>('diamondImage');

  readonly inEngagementFlow = this.route.snapshot.queryParamMap.get('flow') === 'engagement';
  private readonly cartItemId = this.route.snapshot.queryParamMap.get('cartItemId');
  private readonly favoriteItemId = this.route.snapshot.queryParamMap.get('favoriteItemId');

  readonly hasSetting = computed(() => this.inEngagementFlow && Boolean(this.settingSelection.getSelectedSetting()));
  readonly addedToCart = signal(false);
  readonly addedToFavorites = signal(false);
  readonly trustBadges = TRUST_BADGES;

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

  readonly consultSummaryText = computed(() => {
    const data = this.apiData();
    if (!data) return '';
    return [
      `Diamond: ${this.title()} (ID: ${data['id'] ?? '-'})`,
      `  Color: ${data['color'] ?? '-'} · Clarity: ${data['clarity'] ?? '-'} · Cut: ${data['cut'] ?? '-'}`,
      `  Price: ${this.priceDisplay()}`,
    ].join('\n');
  });

  readonly quality = computed(() => this.apiData()?.['quality'] as Record<string, unknown> | undefined);
  readonly details = computed(() => this.apiData()?.['details'] as Record<string, unknown> | undefined);
  readonly notes = computed(() => this.apiData()?.['notes'] as Record<string, unknown> | undefined);
  readonly certificateLab = computed(() => {
    const certificate = this.apiData()?.['certificate'] as Record<string, unknown> | undefined;
    return (certificate?.['lab'] as string) || '';
  });

  readonly allRows = computed<Row[]>(() => [
    ...toRows(this.quality()),
    ...toRows(this.details()),
    ...toRows(this.notes()),
  ]);

  readonly leftRows = computed<Row[]>(() => {
    const rows = this.allRows();
    return rows.slice(0, Math.ceil(rows.length / 2));
  });

  readonly rightRows = computed<Row[]>(() => {
    const rows = this.allRows();
    return rows.slice(Math.ceil(rows.length / 2));
  });

  readonly primaryImage = computed(() => {
    const data = this.apiData();
    const images = data ? getDiamondImages(data) : [];
    return images[0] || this.selected?.image || '/assets/img/favicon.png';
  });

  readonly isZooming = signal(false);
  readonly zoomOrigin = signal('50% 50%');

  onImageMouseMove(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.zoomOrigin.set(`${x}% ${y}%`);
  }

  onImageMouseLeave(): void {
    this.isZooming.set(false);
    this.zoomOrigin.set('50% 50%');
  }

  primaryButtonLabel(): string {
    if (this.hasSetting()) return 'Select this diamond';
    return this.addedToCart() ? 'Added to Bag ✓' : 'Add to Shopping Bag';
  }

  selectThisDiamond(): void {
    const apiData = this.apiData();
    if (apiData) {
      this.productSelection.setSelectedDiamondApiData(apiData);
    }

    if (!this.hasSetting()) {
      this.addDiamondToCart();
      return;
    }

    const queryParams: Record<string, string> = {};
    if (this.cartItemId) queryParams['cartItemId'] = this.cartItemId;
    if (this.favoriteItemId) queryParams['favoriteItemId'] = this.favoriteItemId;
    this.router.navigate(['/jewelry/engagement-summary'], { queryParams });
  }

  addToFavorites(): void {
    const apiData = this.apiData();
    if (!apiData) return;

    this.favorites.add(this.buildDiamondItem(apiData));
    this.addedToFavorites.set(true);
    setTimeout(() => this.addedToFavorites.set(false), 2500);
    this.triggerFly('favorites');
  }

  private addDiamondToCart(): void {
    const apiData = this.apiData();
    if (!apiData) return;

    this.cart.add(this.buildDiamondItem(apiData));
    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 2500);
    this.triggerFly('bag');
  }

  private buildDiamondItem(apiData: DiamondApiData): Omit<SavedRingItem, 'id' | 'addedAt'> {
    return {
      settingName: '',
      settingImage: '',
      settingMaterialLabel: '',
      settingColorLabel: '',
      settingPrice: 0,
      diamondId: apiData['id'] as string | undefined,
      diamondTitle: this.title(),
      diamondImage: this.primaryImage(),
      diamondPrice: this.basePrice(),
      totalPrice: this.basePrice(),
      diamondSnapshot: apiData,
    };
  }

  private triggerFly(target: FlyTargetKey): void {
    const imgEl = this.diamondImageRef()?.nativeElement;
    if (imgEl) this.flyToTarget.fly(imgEl, this.primaryImage(), target);
  }
}
