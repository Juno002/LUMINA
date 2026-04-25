/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, Check, Clock, Hash, Plus } from 'lucide-react';
import { HABIT_TEMPLATES, HabitTemplate } from '../../../../domain/constants/HabitTemplates';
import { Goal, Habit, HabitReminderCadence } from '../../../../domain/entities';
import { useTranslation } from '../../../../application/contexts/LanguageContext';
import { EditorialButton, EditorialChoiceField, EditorialInput, EditorialModal } from '../../shared';

interface AddHabitModalProps {
  key?: string | number;
  goals: Goal[];
  initialHabit?: Habit | null;
  isOpen: boolean;
  onCancel: () => void;
  onSave: (habit: Habit) => void | Promise<void>;
}

export default function AddHabitModal({
  goals,
  initialHabit,
  isOpen,
  onCancel,
  onSave
}: AddHabitModalProps) {
  const [showTemplates, setShowTemplates] = useState(!initialHabit);
  const [name, setName] = useState('');
  const [type, setType] = useState<Habit['type']>('yesno');
  const [target, setTarget] = useState('1');
  const [unit, setUnit] = useState('');
  const [linkedGoalId, setLinkedGoalId] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderCadence, setReminderCadence] = useState<HabitReminderCadence>('daily');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [reminderWeekdays, setReminderWeekdays] = useState<number[]>([new Date().getDay()]);
  const { t } = useTranslation();
  const goalOptions = useMemo(
    () => goals.map((goal) => ({ value: goal.id, label: goal.title })),
    [goals]
  );
  const reminderCadenceOptions = useMemo(
    () => ([
      { value: 'daily', label: t('habits.reminder_daily') },
      { value: 'weekly', label: t('habits.reminder_weekly') },
      { value: 'custom', label: t('habits.reminder_custom') }
    ]),
    [t]
  );

  useEffect(() => {
    const reminder = initialHabit?.reminder;

    setShowTemplates(!initialHabit);
    setName(initialHabit?.name ?? '');
    setType(initialHabit?.type ?? 'yesno');
    setTarget(initialHabit?.targetValue?.toString() ?? '1');
    setUnit(initialHabit?.unit ?? '');
    setLinkedGoalId(initialHabit?.linkedGoalId ?? '');
    setReminderEnabled(Boolean(reminder?.enabled));
    setReminderCadence(reminder?.cadence ?? 'daily');
    setReminderTime(reminder?.time ?? '08:00');
    setReminderWeekdays(
      reminder?.weekdays && reminder.weekdays.length > 0
        ? reminder.weekdays
        : [new Date().getDay()]
    );
  }, [initialHabit, isOpen]);
  const weekdayOptions = useMemo(
    () => ([
      { value: 0, label: t('habits.weekday_short_sunday') },
      { value: 1, label: t('habits.weekday_short_monday') },
      { value: 2, label: t('habits.weekday_short_tuesday') },
      { value: 3, label: t('habits.weekday_short_wednesday') },
      { value: 4, label: t('habits.weekday_short_thursday') },
      { value: 5, label: t('habits.weekday_short_friday') },
      { value: 6, label: t('habits.weekday_short_saturday') }
    ]),
    [t]
  );

  const selectTemplate = (template: HabitTemplate) => {
    setName(t(`habits.templates_data.${template.id}.name`));
    setType(template.type);
    if (template.targetValue) {
      setTarget(template.targetValue.toString());
    }
    if (template.unit) {
      setUnit(t(`habits.templates_data.${template.id}.unit`));
    }
    setShowTemplates(false);
  };

  const toggleReminderWeekday = (weekday: number) => {
    if (reminderCadence === 'weekly') {
      setReminderWeekdays([weekday]);
      return;
    }

    setReminderWeekdays((current) => {
      if (current.includes(weekday)) {
        if (current.length === 1) {
          return current;
        }

        return current.filter((day) => day !== weekday);
      }

      return [...current, weekday].sort((left, right) => left - right);
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name) {
      return;
    }

    await onSave({
      id: initialHabit?.id ?? crypto.randomUUID(),
      name,
      type,
      targetValue: type !== 'yesno' ? Number(target) : undefined,
      unit: type !== 'yesno' ? unit : undefined,
      frequency: initialHabit?.frequency ?? 'daily',
      isActive: initialHabit?.isActive ?? true,
      linkedGoalId: linkedGoalId || undefined,
      reminder: reminderEnabled ? {
        enabled: true,
        cadence: reminderCadence,
        time: reminderTime,
        weekdays: reminderCadence === 'daily'
          ? []
          : reminderCadence === 'weekly'
            ? [reminderWeekdays[0] ?? new Date().getDay()]
            : reminderWeekdays
      } : undefined,
      createdAt: initialHabit?.createdAt ?? new Date().toISOString(),
      archivedAt: initialHabit?.archivedAt
    });
  };

  return (
    <EditorialModal
      isOpen={isOpen}
      onClose={onCancel}
      title={
        initialHabit
          ? t('habits.edit_habit')
          : showTemplates
            ? t('habits.templates')
            : t('habits.new_habit')
      }
      subtitle={t('habits.creation_subtitle')}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!initialHabit && showTemplates ? (
          <motion.div
            key="habit-templates"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {HABIT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => selectTemplate(template)}
                  className="group flex flex-col gap-2 rounded-2xl border border-ink/5 p-4 text-left transition-all hover:border-ink/20 hover:bg-ink/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-serif text-lg italic group-hover:text-ink">
                      {t(`habits.templates_data.${template.id}.name`)}
                    </span>
                    <span className="rounded-full bg-ink/5 px-2 py-1 font-mono text-[10px] uppercase text-ink/40">
                      {t(`habits.template_category_${template.category}`)}
                    </span>
                  </div>
                  <span className="text-xs leading-relaxed opacity-50">
                    {t(`habits.templates_data.${template.id}.description`)}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowTemplates(false)}
                className="border-b border-transparent pb-1 font-mono text-xs uppercase tracking-widest text-accent transition-colors hover:border-ink hover:text-ink"
              >
                {t('habits.create_from_scratch')}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="habit-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-8"
          >
            <EditorialInput
              label={t('habits.name')}
              required
              autoFocus
              placeholder={t('habits.name_placeholder')}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

            <div className="flex flex-col gap-3">
              <label className="editorial-meta">
                {t('habits.measurement_type')}
              </label>
              <div className="flex gap-4">
                {[
                  { id: 'yesno', icon: Check, label: t('habits.type_yesno') },
                  { id: 'numeric', icon: Hash, label: t('habits.type_numeric') },
                  { id: 'timer', icon: Clock, label: t('habits.type_timer') }
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
                    {t('habits.target_goal')}
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
                      placeholder={t('habits.unit')}
                      value={unit}
                      onChange={(event) => setUnit(event.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {goals.length > 0 && (
              <EditorialChoiceField
                label={t('habits.anchor_goal_optional')}
                placeholder={t('habits.anchor_goal_optional')}
                emptyLabel={t('habits.no_goal')}
                options={goalOptions}
                value={linkedGoalId}
                onChange={setLinkedGoalId}
              />
            )}

            <div className="flex flex-col gap-4">
              <label className="editorial-meta">
                {t('habits.reminder_title')}
              </label>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setReminderEnabled(false)}
                  className={`flex items-center justify-between rounded-[1.75rem] border px-5 py-4 text-left transition-all ${
                    !reminderEnabled
                      ? 'border-ink bg-ink text-paper'
                      : 'border-ink/10 text-accent hover:border-ink/20'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-serif italic">{t('habits.reminder_off')}</span>
                    <span className={`editorial-meta ${!reminderEnabled ? 'text-paper/50' : 'opacity-30'}`}>
                      {t('habits.reminder_off_hint')}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReminderEnabled(true)}
                  className={`flex items-center justify-between rounded-[1.75rem] border px-5 py-4 text-left transition-all ${
                    reminderEnabled
                      ? 'border-ink bg-ink text-paper'
                      : 'border-ink/10 text-accent hover:border-ink/20'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-serif italic">{t('habits.reminder_on')}</span>
                    <span className={`editorial-meta ${reminderEnabled ? 'text-paper/50' : 'opacity-30'}`}>
                      {t('habits.reminder_on_hint')}
                    </span>
                  </div>
                  <Bell size={16} className={reminderEnabled ? 'text-paper' : 'text-accent'} />
                </button>
              </div>

              <AnimatePresence initial={false}>
                {reminderEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: 8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: 8 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-5 rounded-[2rem] border border-ink/5 bg-ink/[0.02] p-5">
                      <EditorialChoiceField
                        label={t('habits.reminder_frequency')}
                        placeholder={t('habits.reminder_frequency')}
                        options={reminderCadenceOptions}
                        value={reminderCadence}
                        onChange={(value) => {
                          const nextCadence = value as HabitReminderCadence;
                          setReminderCadence(nextCadence);
                          if (nextCadence === 'weekly' && reminderWeekdays.length !== 1) {
                            setReminderWeekdays([reminderWeekdays[0] ?? new Date().getDay()]);
                          }
                        }}
                      />

                      <div className="flex flex-col gap-3">
                        <label className="editorial-meta">
                          {t('habits.reminder_time')}
                        </label>
                        <input
                          type="time"
                          value={reminderTime}
                          onChange={(event) => setReminderTime(event.target.value)}
                          className="w-full rounded-[1.75rem] border border-ink/10 bg-paper px-5 py-4 font-serif text-lg italic outline-none transition-colors focus:border-ink/25"
                        />
                      </div>

                      {reminderCadence !== 'daily' && (
                        <div className="flex flex-col gap-3">
                          <label className="editorial-meta">
                            {reminderCadence === 'weekly'
                              ? t('habits.reminder_weekday')
                              : t('habits.reminder_custom_days')}
                          </label>
                          <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                            {weekdayOptions.map((weekday) => {
                              const isSelected = reminderWeekdays.includes(weekday.value);

                              return (
                                <button
                                  key={weekday.value}
                                  type="button"
                                  onClick={() => toggleReminderWeekday(weekday.value)}
                                  className={`rounded-[1.1rem] border px-3 py-3 font-mono text-[10px] uppercase tracking-widest transition-all ${
                                    isSelected
                                      ? 'border-ink bg-ink text-paper'
                                      : 'border-ink/10 text-accent hover:border-ink/20'
                                  }`}
                                >
                                  {weekday.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <p className="text-xs leading-relaxed text-accent/70">
                        {t('habits.reminder_clinical_note')}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between border-t border-ink/5 pt-4">
              {!initialHabit ? (
                <button
                  type="button"
                  onClick={() => setShowTemplates(true)}
                  className="editorial-meta transition-colors hover:text-ink"
                >
                  {t('common.back')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onCancel}
                  className="editorial-meta transition-colors hover:text-ink"
                >
                  {t('common.cancel')}
                </button>
              )}
              <EditorialButton
                type="submit"
                icon={initialHabit ? undefined : <Plus size={14} />}
              >
                {initialHabit ? t('habits.save_habit') : t('habits.establish_habit')}
              </EditorialButton>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </EditorialModal>
  );
}
