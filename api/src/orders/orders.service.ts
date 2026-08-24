import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { MailerService } from '../common/mailer.service';

export type PaymentMethod = 'bank_transfer' | 'credit_card';

export interface OrderItem {
  id?: string;
  settingId?: string;
  settingName?: string;
  settingImage?: string;
  settingMaterialLabel?: string;
  settingColorLabel?: string;
  ringSize?: string;
  settingPrice?: number;
  settingSnapshot?: Record<string, unknown>;
  diamondId?: string;
  diamondTitle?: string;
  diamondImage?: string;
  diamondPrice?: number;
  diamondSnapshot?: Record<string, unknown>;
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

function parsePriceValue(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

function paymentMethodLabel(paymentMethod: PaymentMethod): string {
  return paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Credit Card';
}

interface DetailRow {
  label: string;
  value: string;
}

const DETAIL_LABEL_OVERRIDES: Record<string, string> = { td: 'Depth', measurement: 'Measurements' };

function formatDetailKeyLabel(key: string): string {
  const override = DETAIL_LABEL_OVERRIDES[key.toLowerCase()];
  if (override) return override;
  return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function toDetailRows(obj: Record<string, unknown> | undefined, excludeKeys: string[] = []): DetailRow[] {
  if (!obj) return [];
  const excluded = new Set(excludeKeys.map((key) => key.toLowerCase()));
  return Object.entries(obj)
    .filter(
      ([key, value]) =>
        !excluded.has(key.toLowerCase()) &&
        value !== null &&
        value !== undefined &&
        typeof value !== 'object' &&
        String(value).trim() !== '',
    )
    .map(([key, value]) => ({ label: formatDetailKeyLabel(key), value: String(value) }));
}

function buildSettingRows(item: OrderItem): DetailRow[] {
  const snapshot = item.settingSnapshot || {};
  const rows: DetailRow[] = [];

  const settingId = item.settingId || (snapshot['settingId'] as string | undefined);
  rows.push({ label: 'Setting ID', value: settingId ? String(settingId) : '-' });

  const name = (snapshot['name'] as string | undefined) || item.settingName;
  if (name) rows.push({ label: 'Name', value: String(name) });

  const settingType = snapshot['settingType'] as string | undefined;
  if (settingType) rows.push({ label: 'Type', value: String(settingType) });

  const shape = snapshot['shape'] as string | undefined;
  if (shape) rows.push({ label: 'Shape', value: String(shape) });

  const material = (snapshot['material'] as string | undefined) || item.settingMaterialLabel;
  if (material) rows.push({ label: 'Material', value: String(material) });

  const color = (snapshot['color'] as string | undefined) || item.settingColorLabel;
  if (color) rows.push({ label: 'Color', value: String(color) });

  const ringSize = (snapshot['ringSize'] as string | undefined) || item.ringSize;
  if (ringSize) rows.push({ label: 'Ring Size', value: String(ringSize) });

  const price = item.settingPrice ?? snapshot['price'];
  if (price !== undefined && price !== null && price !== '') {
    rows.push({ label: 'Price', value: `THB ${formatPrice(parsePriceValue(price))}` });
  }

  return rows;
}

function buildDiamondRows(item: OrderItem): DetailRow[] {
  const snapshot = item.diamondSnapshot || {};
  const rows: DetailRow[] = [];

  const diamondId = item.diamondId || (snapshot['id'] as string | number | undefined);
  rows.push({ label: 'Diamond ID', value: diamondId !== undefined && diamondId !== null ? String(diamondId) : '-' });

  const title = item.diamondTitle;
  if (title) rows.push({ label: 'Title', value: String(title) });

  const shape = snapshot['shape'];
  if (shape) rows.push({ label: 'Shape', value: String(shape) });

  const carat = snapshot['carat'];
  if (carat !== undefined && carat !== null && carat !== '') rows.push({ label: 'Carat', value: String(carat) });

  const color = snapshot['color'];
  if (color) rows.push({ label: 'Color', value: String(color) });

  const clarity = snapshot['clarity'];
  if (clarity) rows.push({ label: 'Clarity', value: String(clarity) });

  const cut = snapshot['cut'];
  if (cut) rows.push({ label: 'Cut', value: String(cut) });

  const certificate = snapshot['certificate'] as Record<string, unknown> | undefined;
  const certLab = certificate?.['lab'];
  if (certLab) rows.push({ label: 'Certificate Lab', value: String(certLab) });

  const price = item.diamondPrice ?? snapshot['price'];
  if (price !== undefined && price !== null && price !== '') {
    rows.push({ label: 'Price', value: `THB ${formatPrice(parsePriceValue(price))}` });
  }

  const excludeKeys = ['id', 'shape', 'carat', 'color', 'clarity', 'cut', 'price', 'title'];
  rows.push(...toDetailRows(snapshot['quality'] as Record<string, unknown> | undefined, excludeKeys));
  rows.push(...toDetailRows(snapshot['details'] as Record<string, unknown> | undefined, excludeKeys));
  rows.push(...toDetailRows(snapshot['notes'] as Record<string, unknown> | undefined, excludeKeys));

  return rows;
}

function buildDetailRowsHtml(rows: DetailRow[]): string {
  return rows
    .map(
      (row) => `
          <tr>
            <td style="padding: 2px 8px 2px 0; color: #666; width: 130px; vertical-align: top; font-size: 13px;">${escapeHtml(row.label)}</td>
            <td style="padding: 2px 0; vertical-align: top; font-size: 13px;">${escapeHtml(row.value)}</td>
          </tr>`,
    )
    .join('');
}

function buildDetailSectionHtml(heading: string, rows: DetailRow[]): string {
  if (rows.length === 0) return '';
  return `
        <div style="margin: 10px 0 4px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.03em; color: #a67c00;">${escapeHtml(heading)}</div>
        <table style="width: 100%; border-collapse: collapse;">
          ${buildDetailRowsHtml(rows)}
        </table>`;
}

function buildItemsHtml(items: OrderItem[]): string {
  return items
    .map((item) => {
      const title = [item.settingName, item.diamondTitle].filter(Boolean).join(' — ');
      const settingRows = buildSettingRows(item);
      const diamondRows = buildDiamondRows(item);

      return `
      <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="font-weight: 600;">${escapeHtml(title || 'Item')}</td>
            <td style="text-align: right; font-weight: 600; white-space: nowrap;">THB ${formatPrice(item.totalPrice)}</td>
          </tr>
        </table>
        ${buildDetailSectionHtml('Setting', settingRows)}
        ${buildDetailSectionHtml('Diamond', diamondRows)}
      </div>`;
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
      ${buildItemsHtml(items)}
      <table style="width: 100%; border-collapse: collapse;">
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
    ...items.flatMap((item) => {
      const title = [item.settingName, item.diamondTitle].filter(Boolean).join(' — ');
      const settingRows = buildSettingRows(item);
      const diamondRows = buildDiamondRows(item);

      return [
        `- ${title || 'Item'}: THB ${formatPrice(item.totalPrice)}`,
        ...(settingRows.length
          ? ['  Setting:', ...settingRows.map((row) => `    ${row.label}: ${row.value}`)]
          : []),
        ...(diamondRows.length
          ? ['  Diamond:', ...diamondRows.map((row) => `    ${row.label}: ${row.value}`)]
          : []),
      ];
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
