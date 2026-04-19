/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { ThoughtEntry } from '../../../../domain/entities';
import { formatDate } from '../../../../shared/utils/DateFormatter';
import { calculateICC } from '../../../../domain/services/ICCCalculator';
import { useTranslation } from '../../../../application/contexts/LanguageContext';

interface EntryCardProps {
  entry: ThoughtEntry;
  onDelete: () => void;
  onEdit: () => void;
}

/**
 * EntryCard Component:
 * Displays a summary of a thought entry with level and ICC badges.
 */
const EntryCard: React.FC<EntryCardProps> = ({ entry, onDelete, onEdit }) => {
  const { t, language } = useTranslation();
  const icc = useMemo(() => {
    if (entry.level === 3 && entry.originalIntensity !== undefined && entry.finalCredibility !== undefined) {
      return calculateICC(entry.originalIntensity, entry.finalCredibility);
    }
    return null;
  }, [entry]);

  return (
    <div className="group py-8 md:py-10 border-b border-ink/5 hover:bg-ink/[0.01] transition-colors flex flex-col md:flex-row gap-4 md:gap-10">
      <div className="editorial-meta md:w-32 shrink-0 pt-1">
        {formatDate(entry.date)}
      </div>
      <div className="flex-grow flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="editorial-meta px-3 py-1 bg-ink/5 rounded-full text-[9px]">
              {entry.primaryEmotion} · {entry.intensity}/10
            </span>
            <span className="editorial-meta px-2 py-1 border border-ink/10 rounded-md text-[8px] bg-paper">
              L{entry.level}
            </span>
            {icc && (
              <span className={`editorial-meta px-2 py-1 rounded-md text-[8px] font-bold ${
                icc.label === 'excellent' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                icc.label === 'moderate' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                'bg-red-50 text-red-600 border border-red-100'
              }`}>
                ICC {icc.value.toFixed(2)}
              </span>
            )}
            <div className="editorial-rule w-10 opacity-20 hidden md:block"></div>
          </div>
          <div className="flex items-center gap-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="editorial-meta text-[9px] uppercase hover:text-ink">
              {language === 'es' ? 'Editar' : 'Edit'}
            </button>
            <button onClick={onDelete} className="editorial-meta text-[9px] uppercase text-red-500/50 hover:text-red-500">
              {t('common.delete')}
            </button>
          </div>
        </div>
        
        <h3 className="font-serif text-xl md:text-2xl italic leading-tight group-hover:translate-x-2 transition-transform duration-200">
          {entry.automaticThought}
        </h3>
        
        <div className="flex flex-col gap-2">
          <p className="text-accent text-sm leading-relaxed line-clamp-2 italic">
            {entry.situation}
          </p>
          
          {entry.distortions && entry.distortions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {entry.distortions.map(dId => (
                <span key={dId} className="text-[8px] font-mono opacity-40 uppercase tracking-wider bg-ink/[0.03] px-2 py-0.5 rounded">
                  {dId.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="hidden md:flex items-center" onClick={onEdit}>
        <ChevronRight size={20} className="text-accent group-hover:text-ink transition-colors cursor-pointer" />
      </div>
    </div>
  );
};

export default EntryCard;
