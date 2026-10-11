import { ShopifyCatalogService } from './shopify-catalog.service';

describe('ShopifyCatalogService', () => {
  const originalToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
  const originalFlag = process.env.SHOPIFY_CATALOG_ENABLED;

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalToken === undefined) delete process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
    else process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN = originalToken;
    if (originalFlag === undefined) delete process.env.SHOPIFY_CATALOG_ENABLED;
    else process.env.SHOPIFY_CATALOG_ENABLED = originalFlag;
  });

  it('maps available Shopify variants and labeled descriptions to existing product API rows', async () => {
    process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN = 'test-private-token';
    process.env.SHOPIFY_CATALOG_ENABLED = 'true';
    const products = [
      {
        handle: 'yaniga-diamond-s0000001',
        title: '1 ct ROUND F VVS1 Diamond',
        productType: 'Natural Diamond',
        descriptionHtml: '<ul>\n<li>\n<strong>shape:</strong> ROUND</li>\n<li><strong>carat:</strong> 1</li>\n<li><strong>certificateNo:</strong> 1548671019</li>\n<li><strong>depth:</strong> 62.4</li></ul>',
        images: { nodes: [{ url: 'https://cdn.example/diamond.webp', altText: 'Diamond' }] },
        variants: { nodes: [
          { sku: 'YAN-D-S0000001', availableForSale: true,
            price: { amount: '211500.00', currencyCode: 'THB' }, selectedOptions: [] },
        ] },
      },
      {
        handle: 'yaniga-setting-st0000001',
        title: 'Solitaire Setting',
        productType: 'Ring Setting',
        descriptionHtml: '<ul>\n<li><strong>settingType:</strong> Solitaire</li>\n<li><strong>shape:</strong> ASSCHER</li>\n<li><strong>material:</strong> 18k</li></ul>',
        images: { nodes: [
          { url: 'https://cdn.example/gold-front.webp', altText: 'Solitaire Setting gold front' },
          { url: 'https://cdn.example/gold-side.webp', altText: 'Solitaire Setting gold side' },
          { url: 'https://cdn.example/white-front.webp', altText: 'Solitaire Setting white_gold front' },
        ] },
        variants: { nodes: [
          { sku: 'YAN-S-ST0000001-gold', availableForSale: false,
            price: { amount: '5900.00', currencyCode: 'THB' },
            selectedOptions: [{ name: 'Color', value: 'gold' }] },
          { sku: 'YAN-S-ST0000001-white_gold', availableForSale: true,
            price: { amount: '5900.00', currencyCode: 'THB' },
            selectedOptions: [{ name: 'Color', value: 'white_gold' }] },
        ] },
      },
    ];
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { products: {
        nodes: products, pageInfo: { hasNextPage: false, endCursor: null },
      } } }), { status: 200 }),
    );
    const service = new ShopifyCatalogService();
    expect(service.isConfigured).toBe(true);
    const diamonds = await service.loadDiamondRows();
    const settings = await service.loadRingSettingRows();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(diamonds).toHaveLength(1);
    expect(diamonds[0]).toMatchObject({
      id: 'S0000001', shape: 'ROUND', carat: '1',
      price: '211500.00', certificateNo: '1548671019', td: '62.4',
      image: 'https://cdn.example/diamond.webp',
    });
    expect(settings).toHaveLength(1);
    expect(settings[0]).toMatchObject({
      settingId: 'ST0000001', settingType: 'Solitaire',
      shape: 'ASSCHER', material: '18k', price: '5900.00',
    });
    expect(JSON.parse(settings[0].imageJson)).toEqual({
      colors: { white_gold: { front: 'https://cdn.example/white-front.webp' } },
    });
  });
});
