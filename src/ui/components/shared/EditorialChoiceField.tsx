/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';
import { triggerHaptic } from '../../../shared/utils/Haptics';
import { cn } from '../../../shared/utils/TailwindMerge';

export interface EditorialChoiceOption {
  value: string;
  label: string;
  meta?: string;
}

interface EditorialChoiceFieldProps {
  label?: string;
  options: EditorialChoiceOption[];
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
}

export function EditorialChoiceField({
  label,
  options,
  placeholder,
  value,
  onChange,
  emptyLabel,
}: EditorialChoiceFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const hasOptions = options.length > 0;

  const handleToggle = () => {
    if (!hasOptions) {
      return;
    }

    triggerHaptic('light');
    setIsOpen((current) => !current);
  };

  const handleSelect = (nextValue: string) => {
    triggerHaptic('light');
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {label && <label className="editorial-meta">{label}</label>}

      <button
        type="button"
        onClick={handleToggle}
        disabled={!hasOptions}
        className={cn(
          'group/choice flex w-full items-center justify-between rounded-[1.75rem] border border-ink/10 bg-paper px-5 py-4 text-left transition-all',
          hasOptions
            ? 'hover:border-ink/20 hover:bg-ink/[0.02]'
            : 'cursor-default opacity-50'
        )}
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 flex-col gap-1">
          <span className={cn(
            'truncate font-serif italic text-lg',
            selectedOption ? 'text-ink' : 'text-accent/70'
          )}>
            {selectedOption?.label || placeholder}
          </span>
          {selectedOption?.meta && (
            <span className="editorial-meta opacity-40">{selectedOption.meta}</span>
          )}
          {!selectedOption && emptyLabel && (
            <span className="editorial-meta opacity-30">{emptyLabel}</span>
          )}
        </div>

        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-accent transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && hasOptions && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="max-h-56 overflow-y-auto rounded-[1.75rem] border border-ink/5 bg-ink/[0.02] p-2">
              {emptyLabel && (
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className={cn(
                    'flex w-full items-center justify-between rounded-[1.25rem] px-4 py-3 text-left transition-all',
                    !value
                      ? 'bg-ink text-paper'
                      : 'text-accent hover:bg-paper hover:text-ink'
                  )}
                >
                  <span className="font-serif italic">{emptyLabel}</span>
                  {!value && <Check size={14} />}
                </button>
              )}

              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'mt-2 flex w-full items-center justify-between rounded-[1.25rem] px-4 py-3 text-left transition-all first:mt-0',
                      isSelected
                        ? 'bg-ink text-paper'
                        : 'text-accent hover:bg-paper hover:text-ink'
                    )}
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-serif italic">{option.label}</span>
                      {option.meta && (
                        <span className={cn(
                          'editorial-meta',
                          isSelected ? 'text-paper/50' : 'opacity-30'
                        )}>
                          {option.meta}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
