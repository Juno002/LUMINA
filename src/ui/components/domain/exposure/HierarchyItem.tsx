/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FearItem } from "../../../../domain/entities";
import { Trash2, Play } from 'lucide-react';
import { useTranslation } from '../../../../application/contexts/LanguageContext';

interface HierarchyItemProps {
  item: FearItem;
  onDelete: () => void;
  onStartExposure: () => void;
}

const HierarchyItem: React.FC<HierarchyItemProps> = ({ item, onDelete, onStartExposure }) => {
  const { t } = useTranslation();

  return (
    <div className="p-6 border border-ink/5 rounded-2xl flex justify-between items-center group hover:border-ink/20 hover:bg-ink/[0.01] transition-all">
      <div className="flex flex-col gap-1">
        <h4 className="font-serif text-xl italic text-ink/80">{item.text}</h4>
        <div className="flex gap-4">
           <span className="editorial-meta text-[8px] uppercase tracking-widest opacity-30">{t('exposure.fearAnchor')}</span>
           <button 
             onClick={onDelete} 
             className="editorial-meta text-[8px] text-red-500/0 md:group-hover:text-red-500/30 hover:!text-red-500 transition-all uppercase flex items-center gap-1"
           >
             <Trash2 size={10} /> {t('common.delete')}
           </button>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
           <span className="font-mono text-xl font-light">{item.sud}</span>
           <span className="text-[7px] editorial-meta uppercase opacity-30">SUDs</span>
        </div>
        <button 
          onClick={onStartExposure}
          className="bg-ink text-paper w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-ink/10"
        >
          <Play size={14} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};

export default HierarchyItem;
