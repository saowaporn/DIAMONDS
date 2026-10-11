import { HttpException } from '@nestjs/common';
import { ShopifyCheckoutService } from './shopify-checkout.service';

describe('ShopifyCheckoutService', () => {
  const originalToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
  const originalDomain = process.env.SHOPIFY_STORE_DOMAIN;

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalToken === undefined) delete process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
    else process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN = originalToken;
    if (originalDomain === undefined) delete process.env.SHOPIFY_STORE_DOMAIN;
    else process.env.SHOPIFY_STORE_DOMAIN = originalDomain;
  });

  it('creates paired lines with server-resolved variants and configuration details', async () => {
    process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN = 'test-private-token';
    process.env.SHOPIFY_STORE_DOMAIN = 'pyesre-rc.myshopify.com';
    const requests: Array<{ query: string; variables: Record<string, unknown> }> = [];
    jest.spyOn(global, 'fetch').mockImplementation(async (_url, options) => {
      const payload = JSON.parse(String(options?.body)) as {
        query: string; variables: Record<string, unknown>
      };
      requests.push(payload);
      if (payload.query.includes('ProductForCheckout')) {
        const handle = payload.variables.handle;
        const product = handle === 'yaniga-setting-st0000001'
          ? {
              handle, title: 'Solitaire Setting',
              descriptionHtml: '<ul>\n<li>\n<strong>settingType:</strong> Solitaire</li>\n<li>\n<strong>material:</strong> 18k</li></ul>',
              variants: { nodes: [{ id: 'gid://shopify/ProductVariant/setting', availableForSale: true,
                selectedOptions: [{ name: 'Color', value: 'white_gold' }] }] },
            }
          : {
              handle, title: '1 ct ROUND F VVS1 Diamond',
              descriptionHtml: '<ul>\n<li>\n<strong>carat:</strong> 1</li>\n<li>\n<strong>certificateNo:</strong> 1548671019</li>\n<li><strong>depth:</strong> 62.1</li>\n<li><strong>comment:</strong> Eye clean</li></ul>',
              variants: { nodes: [{ id: 'gid://shopify/ProductVariant/diamond', availableForSale: true,
                selectedOptions: [] }] },
            };
        return new Response(JSON.stringify({ data: { product } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: { cartCreate: {
        cart: { checkoutUrl: 'https://checkout.shopify.com/checkouts/example',
          lines: { nodes: [{ id: '1' }, { id: '2' }] } },
        userErrors: [],
      } } }), { status: 200 });
    });

    const result = await new ShopifyCheckoutService().createCheckout([{
      settingId: 'ST0000001', diamondId: 'S0000001', ringSize: '6.5',
      settingSnapshot: { color: 'white_gold' }, totalPrice: 1,
    }]);
    expect(result.checkoutUrl).toBe('https://checkout.shopify.com/checkouts/example');
    const cartRequest = requests.find((request) => request.query.includes('CreateYanigaCart'));
    const lines = (cartRequest!.variables.input as { lines: Array<{
      merchandiseId: string; attributes: Array<{ key: string; value: string }>
    }> }).lines;
    expect(lines.map((line) => line.merchandiseId)).toEqual([
      'gid://shopify/ProductVariant/setting', 'gid://shopify/ProductVariant/diamond',
    ]);
    const settingAttributes = Object.fromEntries(lines[0].attributes.map(({ key, value }) => [key, value]));
    const diamondAttributes = Object.fromEntries(lines[1].attributes.map(({ key, value }) => [key, value]));
    expect(settingAttributes['Ring Size']).toBe('6.5');
    expect(settingAttributes.Material).toBe('18k');
    expect(Object.keys(diamondAttributes).some((key) => key.startsWith('Certificate'))).toBe(false);
    expect(diamondAttributes.Origin).toBe('Natural');
    expect(diamondAttributes.Depth).toBe('62.1');
    expect(diamondAttributes.Comment).toBe('Eye clean');
    expect(settingAttributes['Configuration ID']).toBe(diamondAttributes['Configuration ID']);
    expect(cartRequest!.variables).not.toHaveProperty('totalPrice');
  });

  it('rejects unavailable variants before creating a Shopify cart', async () => {
    process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN = 'test-private-token';
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { product: {
        handle: 'yaniga-diamond-s0000001', title: 'Diamond', descriptionHtml: '',
        variants: { nodes: [{ id: 'gid://shopify/ProductVariant/diamond',
          availableForSale: false, selectedOptions: [] }] },
      } } }), { status: 200 }),
    );
    await expect(new ShopifyCheckoutService().createCheckout([{ diamondId: 'S0000001' }]))
      .rejects.toBeInstanceOf(HttpException);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
