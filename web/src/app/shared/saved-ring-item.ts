export interface SavedRingItem {
  id: string;
  addedAt: number;
  settingId?: string;
  settingName: string;
  settingImage: string;
  settingMaterialLabel: string;
  settingColorLabel: string;
  ringSize?: string;
  settingPrice: number;
  diamondId?: string;
  diamondTitle: string;
  diamondImage: string;
  diamondPrice: number;
  totalPrice: number;
}
