import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoriteService } from '../../shared/favorite.service';
import { CartService } from '../../shared/cart.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './favorites.html',
})
export class Favorites {
  readonly favorites = inject(FavoriteService);
  private readonly cart = inject(CartService);

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
}
