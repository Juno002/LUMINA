/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { useTranslation } from '../../../application/contexts/LanguageContext';
import { cn } from '../../../shared/utils/TailwindMerge';
import type { NavItemConfig } from '../../navigation/menuItems';

interface AppNavItemProps {
  key?: string;
  item: NavItemConfig;
  isActive: boolean;
  isSidebarOpen: boolean;
  onClick: () => void;
}

export default function AppNavItem({
  item,
  isActive,
  isSidebarOpen,
  onClick
}: AppNavItemProps) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-center gap-4 rounded-2xl p-3 transition-all duration-300',
        isActive ? 'bg-ink text-paper' : 'text-accent hover:bg-ink/5 hover:text-ink'
      )}
    >
      <item.icon size={18} className="shrink-0" />
      {isSidebarOpen && (
        <span className="overflow-hidden whitespace-nowrap font-mono text-[9px] uppercase tracking-widest">
          {t(item.label)}
        </span>
      )}
      {!isSidebarOpen && isActive && (
        <motion.div layoutId="activeDot" className="absolute -right-2 h-4 w-1 rounded-full bg-ink" />
      )}
    </button>
  );
}
