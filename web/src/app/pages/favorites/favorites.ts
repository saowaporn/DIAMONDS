import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FavoriteService } from '../../shared/favorite.service';
import { CartService } from '../../shared/cart.service';
import { SettingSelectionService } from '../../shared/setting-selection.service';
import { ProductSelectionService } from '../../shared/product-selection.service';
import { loadItemIntoSelection } from '../../shared/view-edit-selection';
import { FlyToTargetService } from '../../shared/fly-to-target.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './favorites.html',
})
export class Favorites {
  readonly favorites = inject(FavoriteService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly settingSelection = inject(SettingSelectionService);
  private readonly productSelection = inject(ProductSelectionService);
  private readonly flyToTarget = inject(FlyToTargetService);

  formatPrice(value: number): string {
    return Math.round(value).toLocaleString('th-TH');
  }

  remove(id: string): void {
    this.favorites.remove(id);
  }

  moveToCart(id: string, event: MouseEvent): void {
    const item = this.favorites.items().find((i) => i.id === id);
    if (!item) return;

    const rowEl = (event.currentTarget as HTMLElement).closest('[data-fly-row]');
    const imgEl = rowEl?.querySelector('img');
    if (imgEl) {
      this.flyToTarget.fly(imgEl, imgEl.src, 'bag');
    }

    const { id: _id, addedAt: _addedAt, ...rest } = item;
    this.cart.add(rest);
    this.favorites.remove(id);
  }

  viewOrEdit(id: string): void {
    const item = this.favorites.items().find((i) => i.id === id);
    if (!item) return;
    loadItemIntoSelection(item, this.settingSelection, this.productSelection);
    this.router.navigate(['/jewelry/engagement-summary'], { queryParams: { favoriteItemId: item.id } });
  }
}
