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
