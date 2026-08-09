import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SavedRingItem } from './saved-ring-item';

const FAVORITE_STORAGE_KEY = 'favoriteItems';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private readonly itemsSignal = signal<SavedRingItem[]>(this.readFromStorage());
  readonly items = this.itemsSignal.asReadonly();
  readonly count = computed(() => this.itemsSignal().length);

  add(item: Omit<SavedRingItem, 'id' | 'addedAt'>): string {
    const newItem: SavedRingItem = { ...item, id: crypto.randomUUID(), addedAt: Date.now() };
    const next = [...this.itemsSignal(), newItem];
    this.itemsSignal.set(next);
    this.persist(next);
    return newItem.id;
  }

  update(id: string, item: Omit<SavedRingItem, 'id' | 'addedAt'>): void {
    const next = this.itemsSignal().map((existing) =>
      existing.id === id ? { ...item, id: existing.id, addedAt: existing.addedAt } : existing,
    );
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
      const raw = localStorage.getItem(FAVORITE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SavedRingItem[]) : [];
    } catch {
      return [];
    }
  }

  private persist(items: SavedRingItem[]): void {
    if (!this.isBrowser) return;
    localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(items));
  }
}
