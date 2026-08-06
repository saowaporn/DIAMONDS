export function resolveCorsOrigin(rawAllowedOrigin: string | undefined): boolean | string[] {
  const origins = (rawAllowedOrigin || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : true;
}
