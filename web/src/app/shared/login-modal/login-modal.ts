import { Component, ElementRef, PLATFORM_ID, inject, signal, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { resolveApiBaseUrl } from '../api-base-url';
import { AuthService } from '../auth.service';

type LoginStatus = 'idle' | 'sending' | 'error';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  templateUrl: './login-modal.html',
})
export class LoginModal {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');

  readonly username = signal('');
  readonly password = signal('');
  readonly status = signal<LoginStatus>('idle');
  readonly errorMessage = signal('');

  open(): void {
    this.username.set('');
    this.password.set('');
    this.status.set('idle');
    this.errorMessage.set('');
    this.dialogRef()?.nativeElement.showModal();
  }

  close(): void {
    this.dialogRef()?.nativeElement.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogRef()?.nativeElement) {
      this.close();
    }
  }

  onUsernameInput(event: Event): void {
    this.username.set((event.target as HTMLInputElement).value);
  }

  onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  async submit(): Promise<void> {
    const usernameValue = this.username().trim();
    if (!usernameValue) {
      this.errorMessage.set('Please enter your username.');
      return;
    }

    const passwordValue = this.password();
    if (!passwordValue) {
      this.errorMessage.set('Please enter your password.');
      return;
    }

    this.status.set('sending');
    this.errorMessage.set('');

    try {
      const baseUrl = resolveApiBaseUrl(isPlatformBrowser(this.platformId));
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameValue, password: passwordValue }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.token) {
        throw new Error(data?.message || 'Invalid username or password');
      }

      this.auth.login(data.token);
      this.status.set('idle');
      this.close();
      this.router.navigateByUrl('/admin');
    } catch (error) {
      this.status.set('error');
      this.errorMessage.set(error instanceof Error ? error.message : 'Invalid username or password');
    }
  }
}
