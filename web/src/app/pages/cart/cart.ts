import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../shared/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cart.html',
})
export class Cart {
  readonly cart = inject(CartService);

  formatPrice(value: number): string {
    return Math.round(value).toLocaleString('th-TH');
  }

  remove(id: string): void {
    this.cart.remove(id);
  }
}
