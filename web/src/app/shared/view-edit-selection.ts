import { SavedRingItem } from './saved-ring-item';
import { SettingSelectionService } from './setting-selection.service';
import { ProductSelectionService } from './product-selection.service';

export function loadItemIntoSelection(
  item: SavedRingItem,
  settingSelection: SettingSelectionService,
  productSelection: ProductSelectionService,
): void {
  if (item.settingSnapshot) {
    settingSelection.setSelectedSetting(item.settingSnapshot);
  } else {
    settingSelection.clear();
  }

  if (item.diamondSnapshot) {
    productSelection.setSelectedDiamondApiData(item.diamondSnapshot);
  } else {
    productSelection.clearSelectedDiamondApiData();
  }
}
