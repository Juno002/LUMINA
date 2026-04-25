/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '../../../shared/utils/TailwindMerge';

interface EditorialButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
}

export const EditorialButton: React.FC<EditorialButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  className,
  ...props 
}) => {
  const baseStyles = "group/button relative flex items-center justify-center gap-2 rounded-full font-mono uppercase tracking-[0.2em] transition-all duration-300 overflow-hidden disabled:opacity-20";
  
  const variants = {
    primary: "bg-ink text-paper hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-ink/5",
    secondary: "bg-paper text-ink border border-ink/10 hover:border-ink/30",
    outline: "bg-transparent border border-ink/20 text-ink hover:border-ink hover:bg-ink/5",
    ghost: "bg-transparent text-accent hover:text-ink hover:bg-ink/5",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
  };

  const sizes = {
    sm: "px-6 py-2 text-[8px]",
    md: "px-8 py-3 text-[9px]",
    lg: "px-10 py-4 text-[10px]",
    xl: "px-12 py-6 text-xs"
  };

  return (
    <motion.button
      whileHover={{ scale: props.disabled ? 1 : 1.02 }}
      whileTap={{ scale: props.disabled ? 1 : 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="relative z-10">{children}</span>
      
      {variant === 'primary' && !props.disabled && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition duration-700 ease-out group-hover/button:translate-x-[120%] group-hover/button:opacity-100"
        />
      )}
    </motion.button>
  );
};
