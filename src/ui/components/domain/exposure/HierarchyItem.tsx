/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FearItem } from "../../../../domain/entities";

interface HierarchyItemProps {
  item: FearItem;
  onDelete: () => void;
  onStartExposure: () => void;
}

/**
 * HierarchyItem Component:
 * Representación de un 'Fear Anchor' en la jerarquía de exposición.
 */
const HierarchyItem: React.FC<HierarchyItemProps> = ({ item, onDelete, onStartExposure }) => {
  return (
    <div className="p-6 border border-ink/5 rounded-2xl flex justify-between items-center group hover:border-ink/20 transition-all">
      <div className="flex flex-col gap-1">
        <span className="font-serif text-xl">{item.text}</span>
        <button 
          onClick={onDelete} 
          className="editorial-meta text-[10px] md:text-[8px] text-red-500/50 md:text-red-500/0 md:group-hover:text-red-500/50 transition-all text-left uppercase"
        >
          Remove item
        </button>
      </div>
      <div className="flex items-center gap-4">
        <span className="editorial-meta text-lg font-bold w-10 text-center">{item.sud}</span>
        <button 
          onClick={onStartExposure}
          className="md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-ink text-paper px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-mono"
        >
          Cycle
        </button>
      </div>
    </div>
  );
};

export default HierarchyItem;
