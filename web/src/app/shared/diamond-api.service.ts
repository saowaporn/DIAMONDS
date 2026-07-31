import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DiamondFilters } from './diamond-filters.model';

const CACHE_VERSION_KEY = 'yaniga_diamond_cache_version';

export interface DiamondApiResponse<T = Record<string, unknown>> {
  status: string;
  data: T[];
  total: number;
  count: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FetchDiamondsOptions {
  page?: number;
  limit?: number;
  signal?: AbortSignal;
  forceRefresh?: boolean;
  cacheVersion?: string;
}

@Injectable({ providedIn: 'root' })
export class DiamondApiService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly apiBaseUrl = this.resolveApiBaseUrl();

  private resolveApiBaseUrl(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return 'https://diamonds-api.vercel.app/api';
    }

    const win = window as typeof window & { YANIGA_API_BASE_URL?: string };
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return win.YANIGA_API_BASE_URL || (isLocal ? 'http://localhost:3001/api' : 'https://diamonds-api.vercel.app/api');
  }

  getCacheVersion(): string {
    if (!isPlatformBrowser(this.platformId)) return '1';

    const existing = localStorage.getItem(CACHE_VERSION_KEY);
    if (existing) return existing;
    localStorage.setItem(CACHE_VERSION_KEY, '1');
    return '1';
  }

  bumpCacheVersion(): string {
    if (!isPlatformBrowser(this.platformId)) return '1';

    const current = Number.parseInt(this.getCacheVersion(), 10) || 1;
    const next = String(current + 1);
    localStorage.setItem(CACHE_VERSION_KEY, next);
    return next;
  }

  async fetchDiamondsByShape(
    shape: string,
    filters: DiamondFilters,
    options: FetchDiamondsOptions = {},
  ): Promise<DiamondApiResponse> {
    const shapeParam = String(shape || 'ROUND').trim().toUpperCase();
    const page = Number.parseInt(String(options.page), 10) || 1;
    const limit = Number.parseInt(String(options.limit), 10) || 50;
    const forceRefresh = Boolean(options.forceRefresh);
    const cacheVersion = String(options.cacheVersion || this.getCacheVersion());

    const endpoint = new URL(`${this.apiBaseUrl}/products/diamonds/${encodeURIComponent(shapeParam)}`);
    endpoint.searchParams.set('page', String(page));
    endpoint.searchParams.set('limit', String(limit));
    endpoint.searchParams.set('_cv', cacheVersion);
    if (forceRefresh) {
      endpoint.searchParams.set('_cb', String(Date.now()));
    }

    const response = await fetch(endpoint.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
      signal: options.signal,
      cache: forceRefresh ? 'no-store' : 'default',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = (await response.json()) as Partial<DiamondApiResponse>;
    return {
      status: result.status || 'success',
      data: Array.isArray(result.data) ? result.data : [],
      total: Number.isFinite(result.total) ? (result.total as number) : 0,
      count: Number.isFinite(result.count) ? (result.count as number) : 0,
      page: Number.isFinite(result.page) ? (result.page as number) : page,
      limit: Number.isFinite(result.limit) ? (result.limit as number) : limit,
      totalPages: Number.isFinite(result.totalPages) ? (result.totalPages as number) : 0,
      hasNextPage: Boolean(result.hasNextPage),
      hasPrevPage: Boolean(result.hasPrevPage),
    };
  }
}
