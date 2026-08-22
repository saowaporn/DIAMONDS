import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { resolveApiBaseUrl } from '../../shared/api-base-url';

type ContactStatus = 'idle' | 'sending' | 'sent' | 'error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './contact.html',
})
export class Contact {
  private readonly platformId = inject(PLATFORM_ID);

  readonly name = signal('');
  readonly email = signal('');
  readonly phone = signal('');
  readonly subject = signal('');
  readonly message = signal('');
  readonly status = signal<ContactStatus>('idle');
  readonly errorMessage = signal('');

  onNameInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  onPhoneInput(event: Event): void {
    this.phone.set((event.target as HTMLInputElement).value);
  }

  onSubjectInput(event: Event): void {
    this.subject.set((event.target as HTMLInputElement).value);
  }

  onMessageInput(event: Event): void {
    this.message.set((event.target as HTMLTextAreaElement).value);
  }

  async submit(): Promise<void> {
    const nameValue = this.name().trim();
    if (!nameValue) {
      this.status.set('error');
      this.errorMessage.set('Please enter your name.');
      return;
    }

    const emailValue = this.email().trim();
    if (!EMAIL_PATTERN.test(emailValue)) {
      this.status.set('error');
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }

    const subjectValue = this.subject().trim();
    if (!subjectValue) {
      this.status.set('error');
      this.errorMessage.set('Please enter a subject.');
      return;
    }

    const messageValue = this.message().trim();
    if (!messageValue) {
      this.status.set('error');
      this.errorMessage.set('Please enter a message.');
      return;
    }

    this.status.set('sending');
    this.errorMessage.set('');

    try {
      const baseUrl = resolveApiBaseUrl(isPlatformBrowser(this.platformId));
      const response = await fetch(`${baseUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameValue,
          email: emailValue,
          phone: this.phone().trim(),
          subject: subjectValue,
          message: messageValue,
        }),
      });

      if (!response.ok) throw new Error('Request failed');
      this.status.set('sent');
    } catch {
      this.status.set('error');
      this.errorMessage.set('Something went wrong sending your message. Please try again.');
    }
  }
}
