import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Knowledge } from './pages/knowledge/knowledge';
import { Contact } from './pages/contact/contact';
import { SettingSelection } from './pages/setting-selection/setting-selection';
import { SettingDetail } from './pages/setting-detail/setting-detail';
import { EngagementRing } from './pages/engagement-ring/engagement-ring';
import { DiamondDetail } from './pages/diamond-detail/diamond-detail';
import { DiamondSummary } from './pages/diamond-summary/diamond-summary';
import { EngagementSummary } from './pages/engagement-summary/engagement-summary';
import { SettingCustom } from './pages/setting-custom/setting-custom';
import { SettingBespoke } from './pages/setting-bespoke/setting-bespoke';
import { SettingSummary } from './pages/setting-summary/setting-summary';
import { Cart } from './pages/cart/cart';
import { Favorites } from './pages/favorites/favorites';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'knowledge', component: Knowledge },
  { path: 'contact', component: Contact },

  // Setting-first engagement ring configurator
  { path: 'jewelry/engagement-ring', component: SettingSelection },
  { path: 'jewelry/setting-detail', component: SettingDetail },
  { path: 'jewelry/diamond-selection', component: EngagementRing, data: { shapeLocked: true } },
  { path: 'jewelry/engagement-summary', component: EngagementSummary },

  // Standalone diamond browser (full shape filter, unrestricted)
  { path: 'diamonds', component: EngagementRing, data: { shapeLocked: false } },

  { path: 'jewelry/diamond-detail', component: DiamondDetail },
  { path: 'jewelry/diamond-summary', component: DiamondSummary, data: { hideChrome: true } },

  { path: 'cart', component: Cart },
  { path: 'favorites', component: Favorites },

  // Older ring-setting wizard (separate feature, untouched)
  { path: 'setting/custom', component: SettingCustom },
  { path: 'setting/bespoke', component: SettingBespoke },
  { path: 'setting/summary', component: SettingSummary },
];
