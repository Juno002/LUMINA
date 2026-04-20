/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Flame,
  Heart,
  Home,
  Moon,
  Settings,
  Shield,
  Target,
  Wind
} from 'lucide-react';

export type AppTab =
  | 'dashboard'
  | 'journal'
  | 'habits'
  | 'mood'
  | 'exposure'
  | 'activation'
  | 'breathing'
  | 'analysis'
  | 'goals'
  | 'sleep'
  | 'settings';

export interface NavItemConfig {
  id: AppTab;
  icon: LucideIcon;
  label: string;
}

export const mainMenuItems: NavItemConfig[] = [
  { id: 'dashboard', icon: Home, label: 'nav.sanctuary' },
  { id: 'journal', icon: BookOpen, label: 'nav.chronicle' },
  { id: 'habits', icon: Flame, label: 'nav.architecture' },
  { id: 'mood', icon: Heart, label: 'nav.emotional_flux' },
  { id: 'exposure', icon: Activity, label: 'nav.facing' },
  { id: 'activation', icon: Target, label: 'nav.momentum' },
  { id: 'breathing', icon: Wind, label: 'nav.breathe' },
  { id: 'goals', icon: Shield, label: 'nav.fortress' },
  { id: 'sleep', icon: Moon, label: 'nav.nightfall' },
  { id: 'analysis', icon: BarChart3, label: 'nav.resilience' }
];

export const settingsNavItem: NavItemConfig = {
  id: 'settings',
  icon: Settings,
  label: 'nav.settings'
};

export const mobilePrimaryNavItems: NavItemConfig[] = [
  { id: 'dashboard', icon: Home, label: 'nav.sanctuary' },
  { id: 'journal', icon: BookOpen, label: 'nav.chronicle' },
  { id: 'activation', icon: Target, label: 'nav.momentum' },
  { id: 'habits', icon: Flame, label: 'nav.architecture' }
];
