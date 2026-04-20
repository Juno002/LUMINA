/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FormEvent } from 'react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Clock, Hash, Plus } from 'lucide-react';
import { HABIT_TEMPLATES, HabitTemplate } from '../../../../domain/constants/HabitTemplates';
import { Goal, Habit } from '../../../../domain/entities';
import { useTranslation } from '../../../../application/contexts/LanguageContext';
import { EditorialButton, EditorialInput, EditorialModal } from '../../shared';

interface AddHabitModalProps {
  key?: string | number;
  goals: Goal[];
  isOpen: boolean;
  onCancel: () => void;
  onSave: (habit: Habit) => void;
}

export default function AddHabitModal({
  goals,
  isOpen,
  onCancel,
  onSave
}: AddHabitModalProps) {
  const [showTemplates, setShowTemplates] = useState(true);
  const [name, setName] = useState('');
  const [type, setType] = useState<Habit['type']>('yesno');
  const [target, setTarget] = useState('1');
  const [unit, setUnit] = useState('');
  const [linkedGoalId, setLinkedGoalId] = useState('');
  const { t, language } = useTranslation();

  const selectTemplate = (template: HabitTemplate) => {
    setName(template.name);
    setType(template.type);
    if (template.targetValue) {
      setTarget(template.targetValue.toString());
    }
    if (template.unit) {
      setUnit(template.unit);
    }
    setShowTemplates(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name) {
      return;
    }

    onSave({
      id: crypto.randomUUID(),
      name,
      type,
      targetValue: type !== 'yesno' ? Number(target) : undefined,
      unit: type !== 'yesno' ? unit : undefined,
      frequency: 'daily',
      isActive: true,
      linkedGoalId: linkedGoalId || undefined,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <EditorialModal
      isOpen={isOpen}
      onClose={onCancel}
      title={showTemplates ? t('habits.templates') : t('habits.new_habit')}
      subtitle="Creation / Architecture"
    >
      {showTemplates ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {HABIT_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => selectTemplate(template)}
                className="group flex flex-col gap-2 rounded-2xl border border-ink/5 p-4 text-left transition-all hover:border-ink/20 hover:bg-ink/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-serif text-lg italic group-hover:text-ink">{template.name}</span>
                  <span className="rounded-full bg-ink/5 px-2 py-1 font-mono text-[10px] uppercase text-ink/40">
                    {template.category}
                  </span>
                </div>
                <span className="text-xs leading-relaxed opacity-50">{template.description}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setShowTemplates(false)}
              className="border-b border-transparent pb-1 font-mono text-xs uppercase tracking-widest text-accent transition-colors hover:border-ink hover:text-ink"
            >
              {language === 'es' ? 'O crear desde cero' : 'Or create from scratch'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <EditorialInput
            label={language === 'es' ? 'Nombre del Habito' : 'Habit Name'}
            required
            autoFocus
            placeholder={language === 'es' ? 'ej. Reflexion Matutina' : 'e.g., Morning Reflection'}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <div className="flex flex-col gap-3">
            <label className="editorial-meta">
              {language === 'es' ? 'Tipo de Medicion' : 'Measurement Type'}
            </label>
            <div className="flex gap-4">
              {[
                { id: 'yesno', icon: Check, label: language === 'es' ? 'Si/No' : 'Yes/No' },
                { id: 'numeric', icon: Hash, label: language === 'es' ? 'Valor' : 'Value' },
                { id: 'timer', icon: Clock, label: language === 'es' ? 'Reloj' : 'Timer' }
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setType(option.id as Habit['type'])}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
                    type === option.id
                      ? 'border-ink bg-ink text-paper'
                      : 'border-ink/5 text-accent hover:border-ink/20'
                  }`}
                >
                  <option.icon size={18} />
                  <span className="font-mono text-[9px] uppercase tracking-tighter">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {type !== 'yesno' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-3">
                <label className="editorial-meta">
                  {language === 'es' ? 'Meta Objetivo' : 'Target Goal'}
                </label>
                <div className="flex items-end gap-4">
                  <EditorialInput
                    type="number"
                    required
                    className="flex-1"
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                  />
                  <EditorialInput
                    className="w-24"
                    variant="mono"
                    placeholder={language === 'es' ? 'Unidad' : 'Unit'}
                    value={unit}
                    onChange={(event) => setUnit(event.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {goals.length > 0 && (
            <div className="flex flex-col gap-3">
              <label className="editorial-meta">
                {language === 'es' ? 'Anclar a un Objetivo (Opcional)' : 'Anchor to a Goal (Optional)'}
              </label>
              <select
                className="w-full cursor-pointer appearance-none border-b border-ink/20 bg-transparent py-3 font-serif text-lg italic outline-none focus:border-ink"
                value={linkedGoalId}
                onChange={(event) => setLinkedGoalId(event.target.value)}
              >
                <option value="" className="text-sm not-italic">
                  -- {language === 'es' ? 'Sin objetivo' : 'No goal'} --
                </option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id} className="text-sm not-italic">
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-ink/5 pt-4">
            <button
              type="button"
              onClick={() => setShowTemplates(true)}
              className="editorial-meta transition-colors hover:text-ink"
            >
              {t('common.back')}
            </button>
            <EditorialButton type="submit" icon={<Plus size={14} />}>
              {language === 'es' ? 'Establecer Habito' : 'Establish Habit'}
            </EditorialButton>
          </div>
        </form>
      )}
    </EditorialModal>
  );
}
