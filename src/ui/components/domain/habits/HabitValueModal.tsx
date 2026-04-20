/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Habit } from '../../../../domain/entities';
import { useTranslation } from '../../../../application/contexts/LanguageContext';
import { EditorialButton, EditorialModal } from '../../shared';

interface HabitValueModalProps {
  key?: string | number;
  currentValue: number;
  habit?: Habit;
  isOpen: boolean;
  onCancel: () => void;
  onSave: (value: number) => void;
}

export default function HabitValueModal({
  currentValue,
  habit,
  isOpen,
  onCancel,
  onSave
}: HabitValueModalProps) {
  const { t, language } = useTranslation();
  const [value, setValue] = useState(currentValue.toString());

  return (
    <EditorialModal
      isOpen={isOpen}
      onClose={onCancel}
      title={habit?.name || ''}
      subtitle={`${t('habits.log_action')} ${habit?.unit || t('habits.unit_default')}`}
      maxWidth="sm"
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <input
            autoFocus
            type="number"
            className="w-full border-b border-ink/20 bg-transparent py-4 text-center font-serif text-5xl italic outline-none focus:border-ink"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <div className="editorial-meta text-center uppercase tracking-widest opacity-40">
            {habit?.unit || 'Units'} / Target {habit?.targetValue}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <button onClick={onCancel} className="editorial-meta">
            {t('common.cancel')}
          </button>
          <EditorialButton onClick={() => onSave(Number(value))}>
            {language === 'es' ? 'Actualizar Registro' : 'Update Log'}
          </EditorialButton>
        </div>
      </div>
    </EditorialModal>
  );
}
