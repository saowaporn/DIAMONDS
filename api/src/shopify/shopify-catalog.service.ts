import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { DiamondRow } from '../diamonds/diamond-data.service';
import type { RingSettingRow } from '../ring-settings/ring-setting-data.service';
import { parseShopifySpecs } from './shopify-description';

interface StorefrontProduct {
  handle: string;
  title: string;
  productType: string;
  descriptionHtml: string;
  images: { nodes: Array<{ url: string; altText: string | null }> };
  variants: {
    nodes: Array<{
      sku: string | null;
      availableForSale: boolean;
      price: { amount: string; currencyCode: string };
      selectedOptions: Array<{ name: string; value: string }>;
    }>;
  };
}

interface ProductPage {
  products: {
    nodes: StorefrontProduct[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

const CATALOG_QUERY = [
  'query YanigaCatalog($after: String) {',
  '  products(first: 100, after: $after) {',
  '    pageInfo { hasNextPage endCursor }',
  '    nodes {',
  '      handle title productType descriptionHtml',
  '      images(first: 100) { nodes { url altText } }',
  '      variants(first: 100) {',
  '        nodes { sku availableForSale price { amount currencyCode } selectedOptions { name value } }',
  '      }',
  '    }',
  '  }',
  '}',
].join('\n');

const SHOPIFY_REQUEST_TIMEOUT_MS = 8_000;

@Injectable()
export class ShopifyCatalogService {
  private readonly domain = process.env.SHOPIFY_STORE_DOMAIN || 'pyesre-rc.myshopify.com';
  private readonly token = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN || '';
  private cached: StorefrontProduct[] | null = null;
  private expiresAt = 0;

  get isConfigured(): boolean {
    return Boolean(this.token) && process.env.SHOPIFY_CATALOG_ENABLED === 'true';
  }

  clearCache(): void {
    this.cached = null;
    this.expiresAt = 0;
  }

  private async request(after: string | null): Promise<ProductPage> {
    if (!/^[a-z0-9][a-z0-9.-]*\.myshopify\.com$/.test(this.domain)) {
      throw new HttpException('Invalid Shopify store domain', HttpStatus.SERVICE_UNAVAILABLE);
    }
    let response: Response;
    try {
      response = await fetch('https://' + this.domain + '/api/2026-10/graphql.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Shopify-Storefront-Private-Token': this.token,
        },
        body: JSON.stringify({ query: CATALOG_QUERY, variables: { after } }),
        signal: AbortSignal.timeout(SHOPIFY_REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new HttpException('Shopify catalog is temporarily unavailable', HttpStatus.BAD_GATEWAY);
    }
    if (!response.ok) {
      throw new HttpException('Shopify catalog returned HTTP ' + response.status, HttpStatus.BAD_GATEWAY);
    }
    let result: { data?: ProductPage; errors?: Array<{ message: string }> };
    try {
      result = await response.json() as { data?: ProductPage; errors?: Array<{ message: string }> };
    } catch {
      throw new HttpException('Shopify catalog returned an invalid response', HttpStatus.BAD_GATEWAY);
    }
    if (result.errors?.length || !result.data) {
      throw new HttpException(
        'Shopify catalog could not complete the request',
        HttpStatus.BAD_GATEWAY,
      );
    }
    return result.data;
  }

  private async products(): Promise<StorefrontProduct[]> {
    if (this.cached && Date.now() < this.expiresAt) return this.cached;
    const products: StorefrontProduct[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 20; page++) {
      const result = await this.request(cursor);
      products.push(...result.products.nodes);
      if (!result.products.pageInfo.hasNextPage) {
        this.cached = products;
        this.expiresAt = Date.now() + 60_000;
        return products;
      }
      cursor = result.products.pageInfo.endCursor;
      if (!cursor) break;
    }
    throw new HttpException('Shopify catalog pagination is incomplete', HttpStatus.BAD_GATEWAY);
  }

  async loadDiamondRows(): Promise<DiamondRow[]> {
    const products = await this.products();
    return products.flatMap((product) => {
      const variant = product.variants.nodes.find((candidate) =>
        candidate.availableForSale && candidate.sku?.startsWith('YAN-D-'));
      if (!variant || variant.price.currencyCode !== 'THB') return [];
      const specs = parseShopifySpecs(product.descriptionHtml);
      const row: DiamondRow = {
        id: variant.sku!.slice('YAN-D-'.length),
        image: product.images.nodes[0]?.url || '',
        video: specs.video || '',
        certificate: specs.certificate || '',
        shape: specs.shape || '',
        carat: specs.carat || '',
        color: specs.color || '',
        clarity: specs.clarity || '',
        price: variant.price.amount,
        cut: specs.cut || '',
        polish: specs.polish || '',
        symmetry: specs.symmetry || '',
        fluorescence: specs.fluorescence || '',
        lab: specs.lab || '',
        certificateNo: specs.certificateNo || '',
        table: specs.table || '',
        td: specs.depth || '',
        measurement: specs.measurement || '',
        bit: specs.bit || '',
        bc: specs.bc || '',
        wt: specs.wt || '',
        wc: specs.wc || '',
        milky: specs.milky || '',
        'l/w ratio': specs.lengthWidthRatio || '',
        comment: specs.comment || '',
      };
      return [row];
    });
  }

  async loadRingSettingRows(): Promise<RingSettingRow[]> {
    const products = await this.products();
    return products.flatMap((product) => {
      const variants = product.variants.nodes.filter((candidate) =>
        candidate.availableForSale && candidate.sku?.startsWith('YAN-S-'));
      if (!variants.length || variants[0].price.currencyCode !== 'THB') return [];
      const id = variants[0].sku!.slice('YAN-S-'.length).split('-')[0];
      const specs = parseShopifySpecs(product.descriptionHtml);
      const colors: Record<string, Record<string, string>> = {};
      const availableColors = new Set(variants.flatMap((variant) =>
        variant.selectedOptions.filter((option) => option.name.toLowerCase() === 'color')
          .map((option) => option.value)));
      for (const image of product.images.nodes) {
        const parts = (image.altText || '').trim().split(/\s+/);
        const angle = parts.at(-1) || '';
        const color = parts.at(-2) || '';
        if (availableColors.has(color) && /^(front|side|top1|top2)$/.test(angle)) {
          (colors[color] ||= {})[angle] = image.url;
        }
      }
      return [{
        settingId: id,
        settingType: specs.settingType || '',
        shape: specs.shape || '',
        name: product.title,
        material: specs.material || '',
        price: variants[0].price.amount,
        imageJson: JSON.stringify({ colors }),
      }];
    });
  }
}
