/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '../../../shared/utils/TailwindMerge';

interface EditorialTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const EditorialTextArea: React.FC<EditorialTextAreaProps> = ({ 
  label, 
  error, 
  className,
  ...props 
}) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {label && <label className="editorial-meta">{label}</label>}
      <textarea 
        className={cn(
          "bg-transparent border-b border-ink/10 focus:border-ink outline-none py-2 font-serif italic text-xl transition-all resize-none",
          error && "border-red-400 text-red-500",
          className
        )}
        {...props}
      />
      {error && <span className="text-[9px] font-mono text-red-400 uppercase tracking-tighter">{error}</span>}
    </div>
  );
};
