import { Module } from '@nestjs/common';
import { ShopifyCheckoutService } from './shopify-checkout.service';
import { ShopifyController } from './shopify.controller';
import { ShopifyCatalogService } from './shopify-catalog.service';

@Module({
  controllers: [ShopifyController],
  providers: [ShopifyCheckoutService, ShopifyCatalogService],
  exports: [ShopifyCatalogService],
})
export class ShopifyModule {}
