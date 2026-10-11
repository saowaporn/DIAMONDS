import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { parseShopifySpecs } from './shopify-description';

interface CheckoutItem {
  settingId?: string;
  diamondId?: string;
  ringSize?: string;
  settingSnapshot?: { color?: string };
}

interface ShopifyVariant {
  id: string;
  availableForSale: boolean;
  selectedOptions: Array<{ name: string; value: string }>;
}

interface ShopifyProduct {
  handle: string;
  title: string;
  descriptionHtml: string;
  variants: { nodes: ShopifyVariant[] };
}

interface GraphqlResult<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface CartLine {
  merchandiseId: string;
  quantity: number;
  attributes: Array<{ key: string; value: string }>;
}

const PRODUCT_QUERY = [
  'query ProductForCheckout($handle: String!) {',
  '  product(handle: $handle) {',
  '    handle title descriptionHtml',
  '    variants(first: 100) { nodes { id availableForSale selectedOptions { name value } } }',
  '  }',
  '}',
].join('\n');

const CREATE_CART_MUTATION = [
  'mutation CreateYanigaCart($input: CartInput!) {',
  '  cartCreate(input: $input) {',
  '    cart { id checkoutUrl lines(first: 50) { nodes { id } } }',
  '    userErrors { field message }',
  '    warnings { message }',
  '  }',
  '}',
].join('\n');

const SHOPIFY_REQUEST_TIMEOUT_MS = 8_000;

function validatedId(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(value)) {
    throw new HttpException(label + ' is invalid', HttpStatus.BAD_REQUEST);
  }
  return value;
}

function productHandle(kind: 'diamond' | 'setting', id: string): string {
  return 'yaniga-' + kind + '-' + id.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

function lineAttribute(key: string, value: unknown): { key: string; value: string } | null {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  return { key, value: String(value).trim().slice(0, 240) };
}

function attributes(entries: Array<[string, unknown]>): Array<{ key: string; value: string }> {
  return entries.map(([key, value]) => lineAttribute(key, value))
    .filter((entry): entry is { key: string; value: string } => entry !== null);
}

@Injectable()
export class ShopifyCheckoutService {
  private readonly domain = process.env.SHOPIFY_STORE_DOMAIN || 'pyesre-rc.myshopify.com';
  private readonly token = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN || '';

  private async graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    if (!this.token) {
      throw new HttpException('Shopify checkout is not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }
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
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(SHOPIFY_REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new HttpException('Shopify is temporarily unavailable', HttpStatus.BAD_GATEWAY);
    }
    if (!response.ok) {
      throw new HttpException('Shopify returned HTTP ' + response.status, HttpStatus.BAD_GATEWAY);
    }
    let payload: GraphqlResult<T>;
    try {
      payload = await response.json() as GraphqlResult<T>;
    } catch {
      throw new HttpException('Shopify returned an invalid response', HttpStatus.BAD_GATEWAY);
    }
    if (payload.errors?.length || !payload.data) {
      throw new HttpException(
        'Shopify could not complete the request',
        HttpStatus.BAD_GATEWAY,
      );
    }
    return payload.data;
  }

  private async product(handle: string): Promise<ShopifyProduct> {
    const result = await this.graphql<{ product: ShopifyProduct | null }>(
      PRODUCT_QUERY, { handle },
    );
    if (!result.product) {
      throw new HttpException('Product is not published to the YANIGA storefront: ' + handle, HttpStatus.CONFLICT);
    }
    return result.product;
  }

  private availableVariant(product: ShopifyProduct, color?: string): ShopifyVariant {
    const variants = product.variants.nodes;
    const variant = color
      ? variants.find((item) => item.selectedOptions.some((option) =>
          option.name.toLowerCase() === 'color' && option.value.toLowerCase() === color.toLowerCase()))
      : variants[0];
    if (!variant || !variant.availableForSale) {
      throw new HttpException('A selected item is unavailable: ' + product.title, HttpStatus.CONFLICT);
    }
    return variant;
  }

  async createCheckout(rawItems: unknown): Promise<{ checkoutUrl: string }> {
    if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 20) {
      throw new HttpException('Cart must have 1 to 20 items', HttpStatus.BAD_REQUEST);
    }
    const cache = new Map<string, ShopifyProduct>();
    const getProduct = async (handle: string) => {
      if (!cache.has(handle)) cache.set(handle, await this.product(handle));
      return cache.get(handle)!;
    };
    const lines: CartLine[] = [];
    for (const rawItem of rawItems) {
      if (!rawItem || typeof rawItem !== 'object') {
        throw new HttpException('Invalid cart item', HttpStatus.BAD_REQUEST);
      }
      const item = rawItem as CheckoutItem;
      if (!item.settingId && !item.diamondId) {
        throw new HttpException('Cart item requires a setting or diamond', HttpStatus.BAD_REQUEST);
      }
      const configurationId = randomUUID();
      let setting: ShopifyProduct | undefined;
      let diamond: ShopifyProduct | undefined;
      let settingVariant: ShopifyVariant | undefined;
      if (item.settingId) {
        const id = validatedId(item.settingId, 'Setting ID');
        const color = item.settingSnapshot?.color;
        if (typeof color !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(color)) {
          throw new HttpException('Setting color is required', HttpStatus.BAD_REQUEST);
        }
        setting = await getProduct(productHandle('setting', id));
        settingVariant = this.availableVariant(setting, color);
      }
      if (item.diamondId) {
        const id = validatedId(item.diamondId, 'Diamond ID');
        diamond = await getProduct(productHandle('diamond', id));
      }
      if (setting && settingVariant) {
        const specs = parseShopifySpecs(setting.descriptionHtml);
        const color = settingVariant.selectedOptions.find((option) =>
          option.name.toLowerCase() === 'color')?.value || '';
        const size = typeof item.ringSize === 'string' ? item.ringSize.trim() : '';
        if (!size || size.length > 20 || !/^[A-Za-z0-9 .-]+$/.test(size)) {
          throw new HttpException('Ring size is required', HttpStatus.BAD_REQUEST);
        }
        lines.push({
          merchandiseId: settingVariant.id,
          quantity: 1,
          attributes: attributes([
            ['Configuration ID', configurationId],
            ['Setting ID', item.settingId],
            ['Setting', setting.title],
            ['Setting type', specs.settingType],
            ['Shape', specs.shape],
            ['Material', specs.material],
            ['Color', color],
            ['Ring Size', size],
            ['Diamond ID', item.diamondId],
            ['Diamond', diamond?.title],
          ]),
        });
      }
      if (diamond) {
        const specs = parseShopifySpecs(diamond.descriptionHtml);
        const variant = this.availableVariant(diamond);
        lines.push({
          merchandiseId: variant.id,
          quantity: 1,
          attributes: attributes([
            ['Configuration ID', configurationId],
            ['Diamond ID', item.diamondId],
            ['Diamond', diamond.title],
            ['Setting ID', item.settingId],
            ['Setting', setting?.title],
            ['Carat', specs.carat],
            ['Shape', specs.shape],
            ['Color', specs.color],
            ['Clarity', specs.clarity],
            ['Cut', specs.cut],
            ['Origin', 'Natural'],
            ['Polish', specs.polish],
            ['Symmetry', specs.symmetry],
            ['Fluorescence', specs.fluorescence],
            ['Table', specs.table],
            ['Depth', specs.depth],
            ['Measurements', specs.measurement],
            ['L/W Ratio', specs.lengthWidthRatio],
            ['Bit', specs.bit],
            ['BC', specs.bc],
            ['WT', specs.wt],
            ['WC', specs.wc],
            ['Milky', specs.milky],
            ['Comment', specs.comment],
            ['Stock No', specs.stockNo],
          ]),
        });
      }
    }
    const result = await this.graphql<{
      cartCreate: {
        cart: { checkoutUrl: string; lines: { nodes: Array<{ id: string }> } } | null;
        userErrors: Array<{ message: string }>;
      };
    }>(CREATE_CART_MUTATION, {
      input: {
        buyerIdentity: { countryCode: 'TH' },
        lines,
      },
    });
    const payload = result.cartCreate;
    if (payload.userErrors.length || !payload.cart?.checkoutUrl) {
      throw new HttpException(
        payload.userErrors.map((error) => error.message).join('; ') || 'Shopify could not create checkout',
        HttpStatus.CONFLICT,
      );
    }
    if (payload.cart.lines.nodes.length !== lines.length) {
      throw new HttpException('Shopify cart did not include every selected item', HttpStatus.CONFLICT);
    }
    const checkout = new URL(payload.cart.checkoutUrl);
    if (checkout.protocol !== 'https:' || !checkout.hostname) {
      throw new HttpException('Shopify returned an invalid checkout URL', HttpStatus.BAD_GATEWAY);
    }
    return { checkoutUrl: checkout.href };
  }
}
