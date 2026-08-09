import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FavoriteService } from '../../shared/favorite.service';
import { CartService } from '../../shared/cart.service';
import { SettingSelectionService } from '../../shared/setting-selection.service';
import { ProductSelectionService } from '../../shared/product-selection.service';
import { loadItemIntoSelection } from '../../shared/view-edit-selection';

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

  formatPrice(value: number): string {
    return Math.round(value).toLocaleString('th-TH');
  }

  remove(id: string): void {
    this.favorites.remove(id);
  }

  moveToCart(id: string): void {
    const item = this.favorites.items().find((i) => i.id === id);
    if (!item) return;
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
