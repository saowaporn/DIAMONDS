import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const AUTH_TOKEN_STORAGE_KEY = 'authToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private readonly tokenSignal = signal<string | null>(this.readFromStorage());
  readonly isLoggedIn = computed(() => this.tokenSignal() !== null);

  login(token: string): void {
    this.tokenSignal.set(token);
    this.persist(token);
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.persist(null);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  private readFromStorage(): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private persist(token: string | null): void {
    if (!this.isBrowser) return;
    if (token) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  }
}
