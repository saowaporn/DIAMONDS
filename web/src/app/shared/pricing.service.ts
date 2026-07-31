import { Injectable } from '@angular/core';
import { SelectedProduct, SelectedRing } from './product-selection.service';

@Injectable({ providedIn: 'root' })
export class PricingService {
  /** Base price with the price -> fullData -> folder fallback chain (used by Setting_Custom / Setting_Bespoke). */
  resolveBasePriceWithFallback(selected: SelectedProduct | null): number {
    if (!selected) return 0;

    if (selected.price) {
      return parseInt(String(selected.price), 10) || 0;
    }

    if (selected.fullData && typeof selected.fullData === 'string') {
      const parts = selected.fullData.split('_');
      if (parts.length >= 2) {
        return parseInt(parts[parts.length - 2], 10) || 0;
      }
    }

    if (selected.folder) {
      const parts = selected.folder.split('_');
      if (parts.length >= 2) {
        return parseInt(parts[parts.length - 2], 10) || 0;
      }
    }

    return 0;
  }

  /** Base price with no fallback (used by Setting_Summary). */
  resolveBasePriceStrict(selected: SelectedProduct | null): number {
    if (!selected?.price) return 0;
    return parseInt(String(selected.price), 10) || 0;
  }

  resolveGemstonePrice(ring: SelectedRing): number {
    if (!ring.gemstone) return 0;
    const parts = ring.gemstone.split(' ');
    if (parts.length < 2) return 0;
    return parseInt(parts[1], 10) || 0;
  }

  resolveBespokePrice(ring: SelectedRing): number {
    if (!ring.bespoke) return 0;
    const parts = ring.bespoke.split(' ');
    if (parts.length < 2) return 0;
    return parseInt(parts[parts.length - 1], 10) || 0;
  }
}
