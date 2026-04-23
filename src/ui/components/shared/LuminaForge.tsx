/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Check, Flame, Plus, Target, X } from 'lucide-react';
import {
  parseQuickCapture,
  parseTagInput,
  QuickCapturePayload
} from '../../../application/usecases/QuickCaptureParser';
import { sensoryFeedback } from '../../../infrastructure/services/SensoryFeedbackService';
import { cn } from '../../../shared/utils/TailwindMerge';
import { useTranslation } from '../../../application/contexts/LanguageContext';

interface LuminaForgeProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (payload: QuickCapturePayload) => void;
}

const INTENT_STYLES = {
  intention: {
    icon: Plus,
    dot: 'bg-ink/40',
    shell: 'border-ink/10 bg-paper shadow-2xl shadow-ink/10'
  },
  habit: {
    icon: Flame,
    dot: 'bg-amber-500',
    shell: 'border-amber-500/20 bg-paper shadow-2xl shadow-amber-500/10'
  },
  goal: {
    icon: Target,
    dot: 'bg-ink',
    shell: 'border-ink/20 bg-paper shadow-2xl shadow-ink/10'
  },
  journal: {
    icon: BookOpen,
    dot: 'bg-sky-500',
    shell: 'border-sky-500/20 bg-ink text-paper shadow-2xl shadow-sky-950/20'
  }
} as const;

export default function LuminaForge({ isOpen, onOpenChange, onSubmit }: LuminaForgeProps) {
  const { language } = useTranslation();
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [tagText, setTagText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousIntentRef = useRef(parseQuickCapture('').type);

  const parsed = useMemo(() => parseQuickCapture(text), [text]);
  const styles = INTENT_STYLES[parsed.type];
  const IntentIcon = styles.icon;
  const isJournalIntent = parsed.type === 'journal';

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (parsed.type !== previousIntentRef.current) {
      sensoryFeedback.intentShift();
      previousIntentRef.current = parsed.type;
    }
  }, [parsed.type]);

  useEffect(() => {
    if (!isOpen || isExpanded || text.trim().length < 4) {
      return;
    }

    const timeout = window.setTimeout(() => setIsExpanded(true), 1500);
    return () => window.clearTimeout(timeout);
  }, [isExpanded, isOpen, text]);

  const reset = () => {
    setText('');
    setNotes('');
    setTagText('');
    setIsExpanded(false);
  };

  const close = () => {
    sensoryFeedback.undo();
    reset();
    onOpenChange(false);
  };

  const submit = () => {
    const cleanText = parsed.cleanText.trim();
    if (!cleanText) {
      sensoryFeedback.error();
      return;
    }

    sensoryFeedback.success();
    onSubmit({
      type: parsed.type,
      cleanText,
      notes: notes.trim() || undefined,
      tags: parseTagInput(tagText)
    });
    reset();
    onOpenChange(false);
  };

  const injectPrefix = (prefix: string) => {
    sensoryFeedback.intentShift();
    setText(prefix);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      setIsExpanded((value) => !value);
      sensoryFeedback.tap();
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const helperText = {
    intention: language === 'es' ? 'Guardar intención para hoy' : 'Save intention for today',
    habit: language === 'es' ? 'Crear hábito diario' : 'Create daily habit',
    goal: language === 'es' ? 'Crear objetivo activo' : 'Create active goal',
    journal: language === 'es' ? 'Abrir Crónica prellenada' : 'Open prefilled Chronicle'
  }[parsed.type];

  return (
    <div data-guide-target="forge" className="fixed bottom-24 right-6 z-[70] md:bottom-8 md:right-8">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[-1] bg-ink/10 backdrop-blur-[2px]"
            onClick={close}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="fab"
            layoutId="lumina-forge"
            onClick={() => {
              sensoryFeedback.tap();
              onOpenChange(true);
            }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-paper shadow-2xl shadow-ink/15 transition-colors"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            aria-label={language === 'es' ? 'Abrir Lumen' : 'Open Lumen'}
            title="Lumen"
          >
            <Plus size={28} />
          </motion.button>
        ) : (
          <motion.div
            key="palette"
            layoutId="lumina-forge"
            className={cn(
              'w-[calc(100vw-3rem)] max-w-xl overflow-hidden rounded-[2rem] border p-4 transition-colors md:w-[32rem]',
              styles.shell
            )}
          >
            <AnimatePresence>
              {!text.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mb-4 flex flex-wrap gap-2"
                >
                  {[
                    { label: language === 'es' ? '* Hábito' : '* Habit', value: '* ' },
                    { label: language === 'es' ? 'Meta:' : 'Goal:', value: language === 'es' ? 'Meta: ' : 'Goal: ' },
                    { label: language === 'es' ? '> Diario' : '> Journal', value: '> ' }
                  ].map((chip) => (
                    <button
                      key={chip.value}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => injectPrefix(chip.value)}
                      className="rounded-full border border-current/10 px-4 py-2 font-mono text-[9px] uppercase tracking-widest opacity-70 transition-all hover:opacity-100 active:scale-95"
                    >
                      {chip.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex min-h-14 items-center gap-3">
              <div className={cn('h-3 w-3 shrink-0 rounded-full', styles.dot)} />
              <input
                ref={inputRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  language === 'es'
                    ? 'Lumen: intención, * hábito, Meta: objetivo o > diario'
                    : 'Lumen: intention, * habit, Goal: objective or > journal'
                }
                className={cn(
                  'min-w-0 flex-1 bg-transparent font-serif text-lg italic outline-none md:text-xl',
                  isJournalIntent ? 'text-paper placeholder:text-paper/65' : 'text-ink placeholder:text-ink/40'
                )}
                spellCheck={false}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={close}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-100',
                  isJournalIntent ? 'text-paper/70 hover:text-paper' : 'text-ink/50 hover:text-ink'
                )}
                aria-label={language === 'es' ? 'Cerrar' : 'Close'}
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-4">
              <div
                className={cn(
                  'flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest',
                  isJournalIntent ? 'text-paper/70' : 'text-ink/55'
                )}
              >
                <IntentIcon size={12} />
                <span>{helperText}</span>
              </div>
              <button
                type="button"
                disabled={!parsed.cleanText.trim()}
                onClick={submit}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[9px] uppercase tracking-widest transition-all disabled:opacity-30 active:scale-95',
                  isJournalIntent ? 'bg-paper text-ink' : 'bg-ink text-paper'
                )}
              >
                <Check size={12} />
                {language === 'es' ? 'Guardar' : 'Save'}
              </button>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 flex flex-col gap-4 overflow-hidden border-t border-current/10 pt-4"
                >
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={language === 'es' ? 'Notas suaves sobre esta intención...' : 'Soft notes around this intention...'}
                    className={cn(
                      'min-h-16 resize-none bg-transparent text-sm outline-none',
                      isJournalIntent ? 'text-paper placeholder:text-paper/60' : 'text-ink placeholder:text-ink/40'
                    )}
                  />
                  <input
                    value={tagText}
                    onChange={(event) => setTagText(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={language === 'es' ? 'Etiquetas separadas por comas' : 'Comma-separated tags'}
                    className={cn(
                      'bg-transparent font-mono text-xs outline-none',
                      isJournalIntent ? 'text-paper placeholder:text-paper/60' : 'text-ink placeholder:text-ink/40'
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
