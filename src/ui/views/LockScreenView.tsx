/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';

interface LockScreenProps {
  onUnlock: (password: string) => Promise<boolean>;
  error: boolean;
  onOpenCrisis: () => void;
}

export default function LockScreenView({ onUnlock, error, onOpenCrisis }: LockScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password || isSubmitting) return;
    
    setIsSubmitting(true);
    const success = await onUnlock(password);
    if (!success) {
      setPassword('');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background λ Ritual */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.03 }}
        className="absolute inset-0 flex items-center justify-center font-serif text-[40rem] pointer-events-none select-none"
      >
        λ
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
        className="w-full max-w-sm flex flex-col gap-12 relative z-10"
      >
        <div className="text-center flex flex-col gap-2">
          <div className="editorial-meta">Security / Vault Locked</div>
          <h1 className="font-serif text-4xl">Welcome back.</h1>
          <p className="text-accent text-sm font-serif italic opacity-60">Enter your passphrase to access your sanctuary.</p>
        </div>

        <form onSubmit={handleUnlock} className="flex flex-col gap-6">
          <div className="relative group">
            <input 
              autoFocus
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your Passphrase"
              className={`w-full bg-transparent border-b py-4 font-serif italic text-2xl outline-none transition-all ${
                error ? 'border-red-400 text-red-500' : 'border-ink/10 focus:border-ink'
              }`}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-accent opacity-30 hover:opacity-100 transition-opacity"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {error && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] font-mono uppercase tracking-widest text-red-400 mt-2"
              >
                Passphrase incorrect. Access denied.
              </motion.p>
            )}
          </div>

          <button 
            type="submit"
            disabled={!password || isSubmitting}
            className="group relative flex items-center justify-center gap-3 bg-ink text-paper py-4 rounded-full font-mono text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] disabled:opacity-20 disabled:hover:scale-100 overflow-hidden"
          >
            <span className="relative z-10">
              {isSubmitting ? 'Opening Vault...' : 'Unlock Sanctuary'}
            </span>
            {!isSubmitting && <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />}
            
            {/* Subtle light sweep animation */}
            <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
            />
          </button>
        </form>

        <div className="editorial-rule"></div>

        <button 
          onClick={onOpenCrisis}
          className="flex items-center justify-center gap-2 text-accent/40 hover:text-red-400 transition-all text-[9px] font-mono uppercase tracking-widest"
        >
          <ShieldAlert size={12} /> Emergency Access / SOS
        </button>
      </motion.div>

      {/* Floating λ symbol in a corner */}
      <div className="absolute top-10 left-10 font-serif text-xl opacity-20">λ</div>
    </div>
  );
}
