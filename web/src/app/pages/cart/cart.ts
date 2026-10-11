import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../shared/cart.service';
import { resolveApiBaseUrl } from '../../shared/api-base-url';
import { SettingSelectionService } from '../../shared/setting-selection.service';
import { ProductSelectionService } from '../../shared/product-selection.service';
import { loadItemIntoSelection } from '../../shared/view-edit-selection';
import { GoodToKnow } from '../../shared/good-to-know/good-to-know';
import { TRUST_BADGES } from '../../shared/trust-badges';

type CheckoutStatus = 'idle' | 'submitting' | 'error';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, GoodToKnow],
  templateUrl: './cart.html',
})
export class Cart {
  readonly cart = inject(CartService);
  readonly trustBadges = TRUST_BADGES;
  private readonly router = inject(Router);
  private readonly settingSelection = inject(SettingSelectionService);
  private readonly productSelection = inject(ProductSelectionService);

  readonly status = signal<CheckoutStatus>('idle');
  readonly errorMessage = signal('');

  formatPrice(value: number): string {
    return Math.round(value).toLocaleString('th-TH');
  }

  remove(id: string): void {
    this.cart.remove(id);
  }

  viewOrEdit(id: string): void {
    const item = this.cart.items().find((candidate) => candidate.id === id);
    if (!item) return;
    loadItemIntoSelection(item, this.settingSelection, this.productSelection);
    this.router.navigate(['/jewelry/engagement-summary'], { queryParams: { cartItemId: item.id } });
  }

  async submit(): Promise<void> {
    if (this.status() === 'submitting' || this.cart.items().length === 0) return;
    this.status.set('submitting');
    this.errorMessage.set('');
    try {
      const items = this.cart.items().map((item) => ({
        settingId: item.settingId,
        diamondId: item.diamondId,
        ringSize: item.ringSize,
        settingSnapshot: item.settingSnapshot
          ? { color: item.settingSnapshot.color }
          : undefined,
      }));
      const response = await fetch(resolveApiBaseUrl(true) + '/shopify/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('A selected item is unavailable. Please review your bag.');
        }
        if (response.status === 503) {
          throw new Error('Secure checkout is being configured. Please contact us before ordering.');
        }
        throw new Error('Could not open secure checkout. Please try again.');
      }
      const result = await response.json() as { checkoutUrl?: string };
      if (!result.checkoutUrl || new URL(result.checkoutUrl).protocol !== 'https:') {
        throw new Error('Could not open secure checkout. Please try again.');
      }
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      this.status.set('error');
      this.errorMessage.set(error instanceof Error ? error.message : 'Could not open secure checkout.');
    }
  }
}
