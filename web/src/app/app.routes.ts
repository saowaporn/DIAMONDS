import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Knowledge } from './pages/knowledge/knowledge';
import { EngagementRing } from './pages/engagement-ring/engagement-ring';
import { DiamondDetail } from './pages/diamond-detail/diamond-detail';
import { DiamondSummary } from './pages/diamond-summary/diamond-summary';
import { SettingCustom } from './pages/setting-custom/setting-custom';
import { SettingBespoke } from './pages/setting-bespoke/setting-bespoke';
import { SettingSummary } from './pages/setting-summary/setting-summary';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'knowledge', component: Knowledge },
  { path: 'jewelry/engagement-ring', component: EngagementRing },
  { path: 'jewelry/diamond-detail', component: DiamondDetail },
  { path: 'jewelry/diamond-summary', component: DiamondSummary, data: { hideChrome: true } },
  { path: 'setting/custom', component: SettingCustom },
  { path: 'setting/bespoke', component: SettingBespoke },
  { path: 'setting/summary', component: SettingSummary },
];
