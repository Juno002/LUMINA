/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ThoughtEntry } from '../../../../domain/entities';
import { formatDate } from '../../../../shared/utils/DateFormatter';

interface EntryCardProps {
  entry: ThoughtEntry;
  onDelete: () => void;
  onEdit: () => void;
}

/**
 * EntryCard Component:
 * Desacoplado de la vista principal para facilitar el mantenimiento y cumplir con SRP.
 */
const EntryCard: React.FC<EntryCardProps> = ({ entry, onDelete, onEdit }) => {
  return (
    <div className="group py-8 md:py-10 border-b border-ink/5 hover:bg-ink/[0.01] transition-colors flex flex-col md:flex-row gap-4 md:gap-10">
      <div className="editorial-meta md:w-32 shrink-0 pt-1">
        {formatDate(entry.date)}
      </div>
      <div className="flex-grow flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="editorial-meta px-3 py-1 bg-ink/5 rounded-full">
              {entry.primaryEmotion} / {entry.intensity}%
            </span>
            <div className="editorial-rule w-10 opacity-20 hidden md:block"></div>
          </div>
          <div className="flex items-center gap-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="editorial-meta text-[9px] uppercase hover:text-ink">
              Edit
            </button>
            <button onClick={onDelete} className="editorial-meta text-[9px] uppercase text-red-500/50 hover:text-red-500">
              Delete
            </button>
          </div>
        </div>
        <h3 className="font-serif text-xl md:text-2xl italic leading-tight group-hover:translate-x-2 transition-transform duration-200">
          {entry.automaticThought}
        </h3>
        <p className="text-accent text-sm leading-relaxed line-clamp-2 italic">
          Context: {entry.situation}
        </p>
      </div>
      <div className="hidden md:flex items-center" onClick={onEdit}>
        <ChevronRight size={20} className="text-accent group-hover:text-ink transition-colors cursor-pointer" />
      </div>
    </div>
  );
};

export default EntryCard;
