import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DiamondApiData, ProductSelectionService } from '../../shared/product-selection.service';
import { SelectedSetting, SettingSelectionService } from '../../shared/setting-selection.service';
import {
  RING_IMAGE_ANGLES,
  RingImageAngle,
  colorLabel,
  materialLabel,
  resolveAngleImage,
} from '../../shared/ring-setting-filters';
import { CartService } from '../../shared/cart.service';
import { FavoriteService } from '../../shared/favorite.service';
import { SavedRingItem } from '../../shared/saved-ring-item';
import { ConsultModal } from '../../shared/consult-modal/consult-modal';

function parsePrice(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

const TRUST_BADGES = [
  { icon: 'bi-shield-check', label: '3-Year Warranty' },
  { icon: 'bi-truck', label: 'Free Insured Shipping' },
  { icon: 'bi-arrow-repeat', label: '7-Day Exchange' },
];

@Component({
  selector: 'app-engagement-summary',
  standalone: true,
  imports: [RouterLink, ConsultModal],
  templateUrl: './engagement-summary.html',
})
export class EngagementSummary {
  private readonly settingSelection = inject(SettingSelectionService);
  private readonly productSelection = inject(ProductSelectionService);
  private readonly cart = inject(CartService);
  private readonly favorites = inject(FavoriteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly cartItemId = signal(this.route.snapshot.queryParamMap.get('cartItemId'));
  private readonly favoriteItemId = signal(this.route.snapshot.queryParamMap.get('favoriteItemId'));

  readonly isEditingCartItem = computed(() => !!this.cartItemId());
  readonly isEditingFavoriteItem = computed(() => !!this.favoriteItemId());

  private buildChangeSettingQueryParams(): Record<string, string> {
    const params: Record<string, string> = { from: 'summary' };
    const cartItemId = this.cartItemId();
    const favoriteItemId = this.favoriteItemId();
    if (cartItemId) params['cartItemId'] = cartItemId;
    if (favoriteItemId) params['favoriteItemId'] = favoriteItemId;
    return params;
  }

  goToChangeSetting(): void {
    this.router.navigate(['/jewelry/setting-detail'], { queryParams: this.buildChangeSettingQueryParams() });
  }

  readonly angles = RING_IMAGE_ANGLES;
  readonly trustBadges = TRUST_BADGES;

  readonly setting = () => this.settingValue;
  readonly diamond = () => this.diamondValue;

  private readonly settingValue: SelectedSetting | null = this.settingSelection.getSelectedSetting();
  private readonly diamondValue: DiamondApiData | null = this.productSelection.getSelectedDiamondApiData();

  readonly activeAngle = signal<RingImageAngle>('front');
  readonly addedToCart = signal(false);
  readonly addedToFavorites = signal(false);

  readonly materialLabelText = computed(() => materialLabel(this.settingValue?.material));
  readonly colorLabelText = computed(() => colorLabel(this.settingValue?.color));

  readonly settingImage = computed(() => {
    const setting = this.settingValue;
    if (!setting) return '';
    return setting.images?.[setting.color]?.front || Object.values(setting.images || {})[0]?.front || '';
  });

  readonly activeImage = computed(
    () => this.angleImage(this.activeAngle()) || this.angleImage('front') || this.settingImage(),
  );

  readonly diamondImage = computed(() => {
    const media = this.diamondValue?.['media'] as { image?: string } | undefined;
    return media?.image || '/assets/img/favicon.png';
  });

  readonly diamondTitle = computed(() => {
    const data = this.diamondValue;
    if (!data) return '';
    return `${data['carat'] || '-'} ct ${String(data['shape'] || '').toUpperCase()}`;
  });

  readonly diamondPrice = computed(() => parsePrice(this.diamondValue?.['price']));

  readonly totalPrice = computed(() => {
    const total = parsePrice(this.settingValue?.price) + this.diamondPrice();
    return total.toLocaleString('th-TH');
  });

  readonly consultSummaryText = computed(() => {
    const setting = this.settingValue;
    const diamond = this.diamondValue;
    const lines: string[] = [];

    if (setting) {
      lines.push(
        `Setting: ${setting.name} (ID: ${setting.settingId})`,
        `  ${this.materialLabelText()} · ${this.colorLabelText()}${setting.ringSize ? ' · Size ' + setting.ringSize : ''}`,
        `  Price: THB ${this.formatPrice(setting.price)}`,
      );
    }

    if (diamond) {
      lines.push(
        '',
        `Diamond: ${this.diamondTitle()} (ID: ${diamond['id'] ?? '-'})`,
        `  Color: ${diamond['color'] ?? '-'} · Clarity: ${diamond['clarity'] ?? '-'} · Cut: ${diamond['cut'] ?? '-'}`,
        `  Price: THB ${this.formatPrice(diamond['price'])}`,
      );
    }

    lines.push('', `Total: THB ${this.totalPrice()}`);
    return lines.join('\n');
  });

  formatPrice(value: unknown): string {
    return parsePrice(value).toLocaleString('th-TH');
  }

  angleImage(angle: string): string | undefined {
    return resolveAngleImage(this.settingValue?.images, this.settingValue?.color, angle);
  }

  private buildSavedItemData(): Omit<SavedRingItem, 'id' | 'addedAt'> | null {
    const setting = this.settingValue;
    const diamond = this.diamondValue;
    if (!setting && !diamond) return null;

    return {
      settingId: setting?.settingId,
      settingName: setting?.name || '',
      settingImage: this.settingImage(),
      settingMaterialLabel: this.materialLabelText(),
      settingColorLabel: this.colorLabelText(),
      ringSize: setting?.ringSize,
      settingPrice: parsePrice(setting?.price),
      diamondId: diamond?.['id'] as string | undefined,
      diamondTitle: this.diamondTitle(),
      diamondImage: this.diamondImage(),
      diamondPrice: this.diamondPrice(),
      totalPrice: parsePrice(setting?.price) + this.diamondPrice(),
      settingSnapshot: setting ?? undefined,
      diamondSnapshot: diamond ?? undefined,
    };
  }

  addToCart(): void {
    const item = this.buildSavedItemData();
    if (!item) return;
    const existingId = this.cartItemId();
    if (existingId) {
      this.cart.update(existingId, item);
    } else {
      this.cartItemId.set(this.cart.add(item));
    }
    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 2500);
  }

  addToFavorites(): void {
    const item = this.buildSavedItemData();
    if (!item) return;
    const existingId = this.favoriteItemId();
    if (existingId) {
      this.favorites.update(existingId, item);
    } else {
      this.favoriteItemId.set(this.favorites.add(item));
    }
    this.addedToFavorites.set(true);
    setTimeout(() => this.addedToFavorites.set(false), 2500);
  }
}
