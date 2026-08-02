export interface RingSettingColumn {
  index: number;
  key: string;
}

export const RING_SETTING_COLUMNS: readonly RingSettingColumn[] = Object.freeze([
  { index: 0, key: 'settingId' },
  { index: 1, key: 'settingType' },
  { index: 2, key: 'shape' },
  { index: 3, key: 'name' },
  { index: 4, key: 'material' },
  { index: 5, key: 'price' },
  { index: 6, key: 'imageJson' },
]);

export const RING_SETTING_SHEET_RANGE = 'A:G';
export const RING_SETTING_IMAGE_BASE_URL = 'https://pub-faf9cc273e034c5a93122663c0fff435.r2.dev/setting/';
