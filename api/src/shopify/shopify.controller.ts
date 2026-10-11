import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ShopifyCheckoutService } from './shopify-checkout.service';

@Controller('shopify')
export class ShopifyController {
  constructor(private readonly checkout: ShopifyCheckoutService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async createCheckout(@Body() body: { items?: unknown }) {
    return this.checkout.createCheckout(body?.items);
  }
}
