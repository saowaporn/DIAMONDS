import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface SelectedProduct {
  name: string;
  id?: string;
  price: number;
  image?: string;
  source?: string;
  fullData: Record<string, unknown> | string;
  folder?: string;
  color?: string;
}

export interface SelectedRing {
  color?: string;
  metal?: string;
  ringsize?: string;
  gemstone?: string;
  bespoke?: string;
}

export type DiamondApiData = Record<string, unknown>;

const KEYS = {
  selectedProduct: 'selectedProduct',
  selectedDiamondApiData: 'selectedDiamondApiData',
  selectedDiamondApiDataForSettingSummary: 'selectedDiamondApiDataForSettingSummary',
  selectedRing: 'selectedRing',
  finalPrices: 'finalPrices',
} as const;

@Injectable({ providedIn: 'root' })
export class ProductSelectionService {
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private read<T>(key: string): T | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private write(key: string, value: unknown): void {
    if (!this.isBrowser) return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  getSelectedProduct(): SelectedProduct | null {
    return this.read<SelectedProduct>(KEYS.selectedProduct);
  }

  setSelectedProduct(product: SelectedProduct): void {
    this.write(KEYS.selectedProduct, product);
  }

  getSelectedDiamondApiData(): DiamondApiData | null {
    return (
      this.read<DiamondApiData>(KEYS.selectedDiamondApiData) ??
      this.read<DiamondApiData>(KEYS.selectedDiamondApiDataForSettingSummary)
    );
  }

  setSelectedDiamondApiData(data: DiamondApiData): void {
    this.write(KEYS.selectedDiamondApiData, data);
    this.write(KEYS.selectedDiamondApiDataForSettingSummary, data);
  }

  clearSelectedDiamondApiData(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(KEYS.selectedDiamondApiData);
    localStorage.removeItem(KEYS.selectedDiamondApiDataForSettingSummary);
  }

  getSelectedRing(): SelectedRing {
    return this.read<SelectedRing>(KEYS.selectedRing) || {};
  }

  setSelectedRing(ring: SelectedRing): void {
    this.write(KEYS.selectedRing, ring);
  }

  patchSelectedRing(patch: Partial<SelectedRing>): SelectedRing {
    const next = { ...this.getSelectedRing(), ...patch };
    this.setSelectedRing(next);
    return next;
  }

  getFinalPrices(): Record<string, unknown> {
    return this.read<Record<string, unknown>>(KEYS.finalPrices) || {};
  }
}
