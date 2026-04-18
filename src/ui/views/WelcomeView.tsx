import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';
import { ArrowRight } from 'lucide-react';

export default function WelcomeView({ onComplete }: { onComplete: (name: string) => void }) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete(name.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full p-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }} transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
        className="max-w-md w-full flex flex-col gap-10"
      >
        <div className="flex flex-col gap-2 text-center">
          <div className="editorial-meta">Initialization Sequence</div>
          <h1 className="font-serif text-5xl">Lumina.</h1>
          <p className="text-accent italic mt-4">
            A private space for your thoughts. 
            All data remains strictly on your device.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <input 
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="How should we address you?"
            className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-4 text-center font-serif text-2xl italic transition-colors"
            autoFocus
          />
          <button 
            type="submit"
            disabled={!name.trim()}
            className="flex items-center justify-center gap-2 bg-ink text-paper py-4 rounded-full font-mono text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all hover:opacity-80"
          >
            Initialize Vault <ArrowRight size={14} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
