import { Component, ElementRef, PLATFORM_ID, inject, input, signal, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { resolveApiBaseUrl } from '../api-base-url';

type ConsultStatus = 'idle' | 'sending' | 'sent' | 'error';

@Component({
  selector: 'app-consult-modal',
  standalone: true,
  templateUrl: './consult-modal.html',
})
export class ConsultModal {
  readonly summaryText = input<string>('');

  private readonly platformId = inject(PLATFORM_ID);
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');

  readonly email = signal('');
  readonly message = signal('');
  readonly status = signal<ConsultStatus>('idle');
  readonly errorMessage = signal('');

  open(): void {
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

  onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  onMessageInput(event: Event): void {
    this.message.set((event.target as HTMLTextAreaElement).value);
  }

  async submit(): Promise<void> {
    const emailValue = this.email().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }

    this.status.set('sending');
    this.errorMessage.set('');

    try {
      const baseUrl = resolveApiBaseUrl(isPlatformBrowser(this.platformId));
      const response = await fetch(`${baseUrl}/consult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue, message: this.message().trim(), summary: this.summaryText() }),
      });

      if (!response.ok) throw new Error('Request failed');
      this.status.set('sent');
    } catch {
      this.status.set('error');
      this.errorMessage.set('Something went wrong sending your request. Please try again.');
    }
  }
}
