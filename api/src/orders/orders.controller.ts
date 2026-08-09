import { Body, Controller, HttpCode, HttpException, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OrderItem, OrdersService, PaymentMethod } from './orders.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SLIP_SIZE = 5 * 1024 * 1024;
const ALLOWED_SLIP_MIME_PATTERN = /^(image\/|application\/pdf$)/;

interface OrderRequestBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentMethod?: string;
  items?: string;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('slip', { storage: memoryStorage(), limits: { fileSize: MAX_SLIP_SIZE } }))
  async send(@Body() body: OrderRequestBody, @UploadedFile() slip?: Express.Multer.File) {
    const firstName = (body?.firstName || '').trim();
    const lastName = (body?.lastName || '').trim();
    const email = (body?.email || '').trim();
    const phone = (body?.phone || '').trim();
    const address = (body?.address || '').trim();
    const paymentMethod = (body?.paymentMethod || '') as PaymentMethod;

    if (!firstName || !lastName || !phone || !address) {
      throw new HttpException(
        { status: 'error', message: 'First name, last name, phone, and address are required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      throw new HttpException({ status: 'error', message: 'A valid email is required' }, HttpStatus.BAD_REQUEST);
    }

    if (paymentMethod !== 'bank_transfer' && paymentMethod !== 'credit_card') {
      throw new HttpException(
        { status: 'error', message: 'paymentMethod must be "bank_transfer" or "credit_card"' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (paymentMethod === 'bank_transfer') {
      if (!slip) {
        throw new HttpException(
          { status: 'error', message: 'A payment slip is required for bank transfer orders' },
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!ALLOWED_SLIP_MIME_PATTERN.test(slip.mimetype)) {
        throw new HttpException(
          { status: 'error', message: 'Payment slip must be an image or PDF file' },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    let items: OrderItem[];
    try {
      items = JSON.parse(body?.items || '[]');
      if (!Array.isArray(items) || items.length === 0) throw new Error('empty');
    } catch {
      throw new HttpException(
        { status: 'error', message: 'items must be a non-empty JSON array' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const { orderRef } = await this.ordersService.submitOrder({
        customer: { firstName, lastName, email, phone, address },
        paymentMethod,
        items,
        slip: slip ? { buffer: slip.buffer, filename: slip.originalname, mimetype: slip.mimetype } : null,
      });

      return { status: 'success', orderRef };
    } catch (error) {
      const err = error as { message?: string };
      // eslint-disable-next-line no-console
      console.error('Error submitting order:', err.message);

      throw new HttpException(
        { status: 'error', message: 'Unable to submit your order right now. Please try again later.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
