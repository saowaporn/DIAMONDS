import { RingSetting } from './ring-settings-api.service';

export const RING_SETTING_SHAPES = [
  'Asscher',
  'Cushion',
  'Emerald',
  'Heart',
  'Marquise',
  'Oval',
  'Princess',
  'Radiant',
  'Round',
  'Pear',
];

export interface MaterialOption {
  value: string;
  label: string;
}

export const RING_SETTING_MATERIALS: MaterialOption[] = [
  { value: 'silver', label: 'Silver' },
  { value: '9k', label: 'Gold 9K' },
  { value: '14k', label: 'Gold 14K' },
  { value: '18k', label: 'Gold 18K' },
  { value: 'platinum', label: 'Platinum' },
];

export interface ColorOption {
  key: string;
  label: string;
}

const COLOR_LABELS: Record<string, string> = {
  gold: 'Yellow Gold',
  pink_gold: 'Pink Gold',
  white_gold: 'White Gold',
  platinum: 'Platinum',
};

export function isPlatinumMaterial(material: string | undefined): boolean {
  return (material || '').toLowerCase() === 'platinum';
}

/** Platinum settings use only the images.platinum render and hide the color selector entirely. */
export function getAvailableColorOptions(setting: RingSetting): ColorOption[] {
  if (isPlatinumMaterial(setting.material)) return [];

  return Object.keys(setting.images || {})
    .filter((key) => key !== 'platinum')
    .map((key) => ({ key, label: COLOR_LABELS[key] || key }));
}

export function getDefaultColorKey(setting: RingSetting): string {
  if (isPlatinumMaterial(setting.material)) return 'platinum';
  return getAvailableColorOptions(setting)[0]?.key || 'gold';
}

export interface GuideEntry {
  key: string;
  label: string;
  description: string;
}

export const MATERIAL_GUIDE: GuideEntry[] = [
  {
    key: 'silver',
    label: 'Silver',
    description: 'Sterling silver (925). Bright white shine at the most affordable price point. Softer than gold or platinum, so it may need occasional polishing.',
  },
  {
    key: '9k',
    label: 'Gold 9K',
    description: '37.5% pure gold. The most durable and affordable gold option — a good everyday choice.',
  },
  {
    key: '14k',
    label: 'Gold 14K',
    description: '58.5% pure gold. A popular balance between durability and a richer gold color.',
  },
  {
    key: '18k',
    label: 'Gold 18K',
    description: '75% pure gold. Deeper, more saturated color with a premium feel; slightly softer than 14K.',
  },
  {
    key: 'platinum',
    label: 'Platinum',
    description: 'A naturally white, dense, hypoallergenic metal. Very durable and holds gemstones especially securely — a premium choice.',
  },
];

export const COLOR_GUIDE: GuideEntry[] = [
  {
    key: 'gold',
    label: 'Yellow Gold',
    description: 'The classic warm gold tone. A traditional look that complements warm skin tones.',
  },
  {
    key: 'pink_gold',
    label: 'Pink Gold',
    description: 'Gold alloyed with copper for a romantic rose/pink hue. A popular modern choice that suits most skin tones.',
  },
  {
    key: 'white_gold',
    label: 'White Gold',
    description: 'Gold plated with rhodium for a bright, silvery-white finish. Modern look; the rhodium plating can be refreshed over time.',
  },
  {
    key: 'platinum',
    label: 'Platinum',
    description: 'Naturally white without any plating, so the color never fades. Hypoallergenic and long-lasting.',
  },
];

export function materialLabel(value: string | undefined): string {
  const match = RING_SETTING_MATERIALS.find((m) => m.value === (value || '').toLowerCase());
  return match?.label || value || '';
}

export function colorLabel(key: string | undefined): string {
  return COLOR_LABELS[(key || '').toLowerCase()] || key || '';
}

export interface RingSettingFilters {
  shape: string | null;
  material: string | null;
  color: string | null;
}

export function matchesFilters(setting: RingSetting, filters: RingSettingFilters): boolean {
  if (filters.shape && (setting.shape || '').toLowerCase() !== filters.shape.toLowerCase()) {
    return false;
  }

  if (filters.material && (setting.material || '').toLowerCase() !== filters.material.toLowerCase()) {
    return false;
  }

  if (filters.color) {
    if (isPlatinumMaterial(setting.material)) {
      return filters.color === 'platinum';
    }
    return Boolean(setting.images?.[filters.color]);
  }

  return true;
}

export function filterRingSettings(settings: RingSetting[], filters: RingSettingFilters): RingSetting[] {
  return settings.filter((setting) => matchesFilters(setting, filters));
}

export interface SettingTypeGroup {
  settingType: string;
  rows: RingSetting[];
}

export function groupBySettingType(settings: RingSetting[]): SettingTypeGroup[] {
  const groups: SettingTypeGroup[] = [];
  const indexByType = new Map<string, number>();

  settings.forEach((setting) => {
    const key = setting.settingType;
    let index = indexByType.get(key);
    if (index === undefined) {
      index = groups.length;
      indexByType.set(key, index);
      groups.push({ settingType: key, rows: [] });
    }
    groups[index].rows.push(setting);
  });

  return groups;
}

export interface GroupResolveFilters {
  shape: string;
  material: string | null;
}

export function resolveGroupRow(group: SettingTypeGroup, filters: GroupResolveFilters): RingSetting | null {
  const shapeMatches = group.rows.filter((row) => (row.shape || '').toLowerCase() === filters.shape.toLowerCase());
  if (!shapeMatches.length) return null;

  if (filters.material) {
    return shapeMatches.find((row) => (row.material || '').toLowerCase() === filters.material!.toLowerCase()) || null;
  }

  for (const material of RING_SETTING_MATERIALS) {
    const match = shapeMatches.find((row) => (row.material || '').toLowerCase() === material.value.toLowerCase());
    if (match) return match;
  }

  return shapeMatches[0];
}
