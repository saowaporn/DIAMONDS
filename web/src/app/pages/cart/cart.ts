import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../shared/cart.service';
import { resolveApiBaseUrl } from '../../shared/api-base-url';
import { BANK_ACCOUNTS } from '../../shared/bank-details';
import { SettingSelectionService } from '../../shared/setting-selection.service';
import { ProductSelectionService } from '../../shared/product-selection.service';
import { loadItemIntoSelection } from '../../shared/view-edit-selection';
import { GoodToKnow } from '../../shared/good-to-know/good-to-know';
import { TRUST_BADGES } from '../../shared/trust-badges';

type PaymentMethod = 'bank_transfer' | 'credit_card';
type CheckoutStatus = 'idle' | 'submitting' | 'success' | 'error';
type CheckoutStep = 'information' | 'payment';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, GoodToKnow],
  templateUrl: './cart.html',
})
export class Cart {
  readonly cart = inject(CartService);
  readonly trustBadges = TRUST_BADGES;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly settingSelection = inject(SettingSelectionService);
  private readonly productSelection = inject(ProductSelectionService);

  readonly bankAccounts = BANK_ACCOUNTS;

  readonly step = signal<CheckoutStep>('information');

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly email = signal('');
  readonly phone = signal('');
  readonly address = signal('');
  readonly paymentMethod = signal<PaymentMethod>('bank_transfer');
  readonly slipFile = signal<File | null>(null);
  readonly status = signal<CheckoutStatus>('idle');
  readonly errorMessage = signal('');
  readonly orderRef = signal('');

  // UI-only placeholders until a payment gateway is wired up; never submitted to the backend.
  readonly cardName = signal('');
  readonly cardNumber = signal('');
  readonly cardExpiry = signal('');
  readonly cardCvv = signal('');

  formatPrice(value: number): string {
    return Math.round(value).toLocaleString('th-TH');
  }

  remove(id: string): void {
    this.cart.remove(id);
  }

  viewOrEdit(id: string): void {
    const item = this.cart.items().find((i) => i.id === id);
    if (!item) return;
    loadItemIntoSelection(item, this.settingSelection, this.productSelection);
    this.router.navigate(['/jewelry/engagement-summary'], { queryParams: { cartItemId: item.id } });
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.paymentMethod.set(method);
  }

  onFirstNameInput(event: Event): void {
    this.firstName.set((event.target as HTMLInputElement).value);
  }

  onLastNameInput(event: Event): void {
    this.lastName.set((event.target as HTMLInputElement).value);
  }

  onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  onPhoneInput(event: Event): void {
    this.phone.set((event.target as HTMLInputElement).value);
  }

  onAddressInput(event: Event): void {
    this.address.set((event.target as HTMLTextAreaElement).value);
  }

  onSlipChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.slipFile.set(input.files?.[0] || null);
  }

  onCardNameInput(event: Event): void {
    this.cardName.set((event.target as HTMLInputElement).value);
  }

  onCardNumberInput(event: Event): void {
    this.cardNumber.set((event.target as HTMLInputElement).value);
  }

  onCardExpiryInput(event: Event): void {
    this.cardExpiry.set((event.target as HTMLInputElement).value);
  }

  onCardCvvInput(event: Event): void {
    this.cardCvv.set((event.target as HTMLInputElement).value);
  }

  continueToPayment(): void {
    const error = this.validateInformation();
    if (error) {
      this.errorMessage.set(error);
      return;
    }
    this.errorMessage.set('');
    this.step.set('payment');
  }

  backToInfo(): void {
    this.errorMessage.set('');
    this.step.set('information');
  }

  private validateInformation(): string | null {
    const firstNameValue = this.firstName().trim();
    const lastNameValue = this.lastName().trim();
    const emailValue = this.email().trim();
    const phoneValue = this.phone().trim();
    const addressValue = this.address().trim();

    if (!firstNameValue || !lastNameValue || !phoneValue || !addressValue) {
      return 'Please fill in your first name, last name, phone, and address.';
    }

    if (!EMAIL_PATTERN.test(emailValue)) {
      return 'Please enter a valid email address.';
    }

    return null;
  }

  async submit(): Promise<void> {
    const infoError = this.validateInformation();
    if (infoError) {
      this.errorMessage.set(infoError);
      return;
    }

    if (this.paymentMethod() === 'bank_transfer' && !this.slipFile()) {
      this.errorMessage.set('Please upload your payment slip.');
      return;
    }

    this.status.set('submitting');
    this.errorMessage.set('');

    try {
      const baseUrl = resolveApiBaseUrl(isPlatformBrowser(this.platformId));
      const formData = new FormData();
      formData.append('firstName', this.firstName().trim());
      formData.append('lastName', this.lastName().trim());
      formData.append('email', this.email().trim());
      formData.append('phone', this.phone().trim());
      formData.append('address', this.address().trim());
      formData.append('paymentMethod', this.paymentMethod());
      formData.append('items', JSON.stringify(this.cart.items()));

      const slip = this.slipFile();
      if (slip) {
        formData.append('slip', slip);
      }

      const response = await fetch(`${baseUrl}/orders`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Request failed');

      const data = (await response.json()) as { orderRef?: string };
      this.orderRef.set(data.orderRef || '');
      this.cart.clear();
      this.status.set('success');
    } catch {
      this.status.set('error');
      this.errorMessage.set('Something went wrong placing your order. Please try again.');
    }
  }
}
