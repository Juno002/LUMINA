/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '../../../shared/utils/TailwindMerge';

interface EditorialInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'serif' | 'mono';
}

export const EditorialInput: React.FC<EditorialInputProps> = ({ 
  label, 
  error, 
  variant = 'serif',
  className,
  ...props 
}) => {
  const generatedId = React.useId();
  const inputId = props.id ?? generatedId;

  return (
    <div className="flex flex-col gap-3 w-full">
      {label && <label htmlFor={inputId} className="editorial-meta">{label}</label>}
      <input 
        id={inputId}
        className={cn(
          "bg-transparent border-b outline-none py-2 transition-all",
          variant === 'serif' ? "font-serif italic text-xl" : "font-mono text-sm uppercase tracking-widest",
          error ? "border-red-400 text-red-500" : "border-ink/10 focus:border-ink",
          className
        )}
        {...props}
      />
      {error && <span className="text-[9px] font-mono text-red-400 uppercase tracking-tighter">{error}</span>}
    </div>
  );
};
