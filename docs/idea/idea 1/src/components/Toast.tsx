import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X } from 'lucide-react';

interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'level-up';
}

export function Toast({ isOpen, onClose, title, message, type = 'info' }: ToastProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4"
        >
          <div className="bg-bg-secondary border-accent/20 flex items-center gap-4 rounded-[24px] border p-4 shadow-2xl dark:bg-[--dark-bg-secondary]">
            <div className="bg-accent/10 text-accent flex h-12 w-12 items-center justify-center rounded-[16px]">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold">{title}</h4>
              <p className="text-text-muted text-xs dark:text-[--dark-text-muted]">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-accent p-2 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
