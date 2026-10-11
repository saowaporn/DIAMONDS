function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export function parseShopifySpecs(html: string): Record<string, string> {
  const specs: Record<string, string> = {};
  const pattern = /<li\b[^>]*>\s*<strong\b[^>]*>\s*([^<:]+):\s*<\/strong>\s*([\s\S]*?)<\/li>/gi;
  for (const match of html.matchAll(pattern)) {
    const key = decodeHtml(match[1]).trim();
    const value = decodeHtml(match[2].replace(/<[^>]*>/g, '')).trim();
    if (key) specs[key] = value;
  }
  return specs;
}
