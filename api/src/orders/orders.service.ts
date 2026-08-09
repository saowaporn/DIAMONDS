import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { MailerService } from '../common/mailer.service';

export type PaymentMethod = 'bank_transfer' | 'credit_card';

export interface OrderItem {
  settingName?: string;
  settingMaterialLabel?: string;
  settingColorLabel?: string;
  ringSize?: string;
  diamondTitle?: string;
  totalPrice?: number;
}

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export interface OrderSlip {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function formatPrice(value: number | undefined): string {
  return Math.round(value || 0).toLocaleString('th-TH');
}

function paymentMethodLabel(paymentMethod: PaymentMethod): string {
  return paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Credit Card';
}

function buildItemsRowsHtml(items: OrderItem[]): string {
  return items
    .map((item) => {
      const title = [item.settingName, item.diamondTitle].filter(Boolean).join(' — ');
      const meta = [item.settingMaterialLabel, item.settingColorLabel, item.ringSize ? `Size ${item.ringSize}` : null]
        .filter(Boolean)
        .join(' &middot; ');

      return `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">
            <div style="font-weight: 600;">${escapeHtml(title || 'Item')}</div>
            ${meta ? `<div style="color: #666; font-size: 13px;">${meta}</div>` : ''}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; text-align: right; white-space: nowrap;">
            THB ${formatPrice(item.totalPrice)}
          </td>
        </tr>`;
    })
    .join('');
}

function buildOrderHtml(params: {
  orderRef: string;
  receivedAt: string;
  customer: OrderCustomer;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
}): string {
  const { orderRef, receivedAt, customer, paymentMethod, items, subtotal } = params;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
      <h2 style="margin-bottom: 4px;">New Order — YANIGA DIAMOND</h2>
      <p style="color: #666; margin-top: 0;">Order Reference: <strong>${escapeHtml(orderRef)}</strong> &middot; Received: ${escapeHtml(receivedAt)}</p>

      <h3 style="margin-bottom: 8px;">Customer Details</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding: 4px 0; color: #666; width: 120px;">Name</td><td>${escapeHtml(`${customer.firstName} ${customer.lastName}`)}</td></tr>
        <tr><td style="padding: 4px 0; color: #666;">Email</td><td>${escapeHtml(customer.email)}</td></tr>
        <tr><td style="padding: 4px 0; color: #666;">Phone</td><td>${escapeHtml(customer.phone)}</td></tr>
        <tr><td style="padding: 4px 0; color: #666;">Address</td><td>${escapeHtml(customer.address)}</td></tr>
        <tr><td style="padding: 4px 0; color: #666;">Payment Method</td><td>${escapeHtml(paymentMethodLabel(paymentMethod))}</td></tr>
      </table>

      <h3 style="margin-bottom: 8px;">Order Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${buildItemsRowsHtml(items)}
        <tr>
          <td style="padding: 12px; text-align: right; font-weight: 600;">Subtotal</td>
          <td style="padding: 12px; text-align: right; font-weight: 600; white-space: nowrap;">THB ${formatPrice(subtotal)}</td>
        </tr>
      </table>

      ${paymentMethod === 'bank_transfer' ? '<p style="color: #666;">Payment slip attached.</p>' : '<p style="color: #666;">Customer requires a secure payment link for credit card payment.</p>'}
    </div>`;
}

function buildOrderText(params: {
  orderRef: string;
  receivedAt: string;
  customer: OrderCustomer;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
}): string {
  const { orderRef, receivedAt, customer, paymentMethod, items, subtotal } = params;

  return [
    `Order Reference: ${orderRef}`,
    `Received: ${receivedAt}`,
    '',
    'Customer Details:',
    `Name: ${customer.firstName} ${customer.lastName}`,
    `Email: ${customer.email}`,
    `Phone: ${customer.phone}`,
    `Address: ${customer.address}`,
    `Payment Method: ${paymentMethodLabel(paymentMethod)}`,
    '',
    'Order Items:',
    ...items.map((item) => {
      const title = [item.settingName, item.diamondTitle].filter(Boolean).join(' — ');
      return `- ${title || 'Item'}: THB ${formatPrice(item.totalPrice)}`;
    }),
    '',
    `Subtotal: THB ${formatPrice(subtotal)}`,
  ].join('\n');
}

@Injectable()
export class OrdersService {
  constructor(private readonly mailerService: MailerService) {}

  async submitOrder(params: {
    customer: OrderCustomer;
    paymentMethod: PaymentMethod;
    items: OrderItem[];
    slip: OrderSlip | null;
  }): Promise<{ orderRef: string }> {
    const { customer, paymentMethod, items, slip } = params;

    const orderRef = `ORD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const receivedAt = new Date().toISOString();
    const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    const to = process.env.ORDER_TO_EMAIL || process.env.CONSULT_TO_EMAIL || 'info@yanigadiamond.com';
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await this.mailerService.sendMail({
      from,
      to,
      replyTo: customer.email,
      subject: `New order ${orderRef} — YANIGA DIAMOND`,
      html: buildOrderHtml({ orderRef, receivedAt, customer, paymentMethod, items, subtotal }),
      text: buildOrderText({ orderRef, receivedAt, customer, paymentMethod, items, subtotal }),
      attachments: slip
        ? [{ filename: slip.filename, content: slip.buffer, contentType: slip.mimetype }]
        : undefined,
    });

    return { orderRef };
  }
}
