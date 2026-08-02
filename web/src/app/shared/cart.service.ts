import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SavedRingItem } from './saved-ring-item';

const CART_STORAGE_KEY = 'cartItems';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private readonly itemsSignal = signal<SavedRingItem[]>(this.readFromStorage());
  readonly items = this.itemsSignal.asReadonly();
  readonly count = computed(() => this.itemsSignal().length);
  readonly subtotal = computed(() => this.itemsSignal().reduce((sum, item) => sum + item.totalPrice, 0));

  add(item: Omit<SavedRingItem, 'id' | 'addedAt'>): void {
    const newItem: SavedRingItem = { ...item, id: crypto.randomUUID(), addedAt: Date.now() };
    const next = [...this.itemsSignal(), newItem];
    this.itemsSignal.set(next);
    this.persist(next);
  }

  remove(id: string): void {
    const next = this.itemsSignal().filter((item) => item.id !== id);
    this.itemsSignal.set(next);
    this.persist(next);
  }

  private readFromStorage(): SavedRingItem[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SavedRingItem[]) : [];
    } catch {
      return [];
    }
  }

  private persist(items: SavedRingItem[]): void {
    if (!this.isBrowser) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }
}
