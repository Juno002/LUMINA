/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Shield, User, Heart, Lock } from 'lucide-react';
import { ClinicalProfile } from '../../domain/entities';

interface WelcomeViewProps {
  onCreateVault: (name: string, password: string, clinicalProfile: ClinicalProfile) => void;
}

type SetupStep = 'intro' | 'name' | 'profile' | 'security';

export default function WelcomeView({ onCreateVault }: WelcomeViewProps) {
  const [step, setStep] = useState<SetupStep>('intro');
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<ClinicalProfile>('unspecified');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);

  const handleFinalize = async () => {
    if (password && password === confirmPassword) {
      setIsInitializing(true);
      // Give UI a frame to show loading state
      await new Promise(r => setTimeout(r, 100));
      try {
        await onCreateVault(name.trim(), password, profile);
      } catch (e) {
        console.error("Initialization failed", e);
        setIsInitializing(false);
      }
    }
  };

  const containerVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] w-full p-6 bg-paper selection:bg-ink selection:text-paper">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div 
            key="intro"
            variants={containerVariants}
            initial="initial" animate="animate" exit="exit"
            className="max-w-xl w-full flex flex-col gap-10 text-center"
          >
            <div className="flex flex-col gap-4">
              <div className="editorial-meta">Lumina Core / Welcome</div>
              <h1 className="font-serif text-7xl md:text-8xl font-light">Lumina.</h1>
              <p className="font-serif italic text-xl text-accent max-w-md mx-auto leading-relaxed">
                An editorial space for cognitive clarity and emotional sovereignty.
              </p>
            </div>
            <button 
              onClick={() => setStep('name')}
              className="mx-auto flex items-center gap-4 bg-ink text-paper px-10 py-5 rounded-full font-mono text-[10px] uppercase tracking-[0.3em] hover:opacity-80 transition-all"
            >
              Begin Initialization <ArrowRight size={14} />
            </button>
          </motion.div>
        )}

        {step === 'name' && (
          <motion.div 
            key="name"
            variants={containerVariants}
            initial="initial" animate="animate" exit="exit"
            className="max-w-md w-full flex flex-col gap-12"
          >
            <div className="flex flex-col gap-2">
              <div className="editorial-meta">Step 01 / Identity</div>
              <h2 className="font-serif text-4xl">How should we address you?</h2>
            </div>
            <div className="flex flex-col gap-8">
              <input 
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Identity name..."
                className="bg-transparent border-b border-ink/20 focus:border-ink outline-none py-4 font-serif text-3xl italic transition-all"
              />
              <button 
                disabled={!name.trim()}
                onClick={() => setStep('profile')}
                className="self-end flex items-center gap-2 bg-ink text-paper px-8 py-3 rounded-full font-mono text-[10px] uppercase tracking-widest disabled:opacity-20 transition-all"
              >
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'profile' && (
          <motion.div 
            key="profile"
            variants={containerVariants}
            initial="initial" animate="animate" exit="exit"
            className="max-w-xl w-full flex flex-col gap-12"
          >
            <div className="flex flex-col gap-2">
              <div className="editorial-meta">Step 02 / Clinical Context</div>
              <h2 className="font-serif text-4xl">Define your primary focus.</h2>
              <p className="text-sm text-accent italic">This calibrates Lambda's distortion detection engine.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'anxiety', label: 'Anxiety & Worry', icon: Heart },
                { id: 'depression', label: 'Mood & Energy', icon: Heart },
                { id: 'anger', label: 'Irritability & Anger', icon: Heart },
                { id: 'unspecified', label: 'General Exploration', icon: User }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setProfile(opt.id as ClinicalProfile)}
                  className={`p-6 rounded-3xl border transition-all text-left flex flex-col gap-4 ${
                    profile === opt.id ? 'bg-ink border-ink text-paper' : 'border-ink/10 hover:border-ink/30 text-accent'
                  }`}
                >
                  <opt.icon size={20} className={profile === opt.id ? 'text-paper' : 'text-accent'} />
                  <span className="font-serif text-xl">{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setStep('name')} className="editorial-meta hover:text-ink transition-colors">Back</button>
              <button 
                onClick={() => setStep('security')}
                className="flex items-center gap-2 bg-ink text-paper px-8 py-3 rounded-full font-mono text-[10px] uppercase tracking-widest transition-all"
              >
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'security' && (
          <motion.div 
            key="security"
            variants={containerVariants}
            initial="initial" animate="animate" exit="exit"
            className="max-w-md w-full flex flex-col gap-12"
          >
            <div className="flex flex-col gap-2">
              <div className="editorial-meta">Step 03 / Sovereignty</div>
              <h2 className="font-serif text-4xl">Secure your local vault.</h2>
              <p className="text-sm text-accent italic">Lumina uses zero-knowledge encryption. If you lose this passphrase, your data is unrecoverable.</p>
            </div>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="editorial-meta flex items-center gap-2"><Lock size={12} /> Set Master Passphrase</label>
                <input 
                  autoFocus
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-b border-ink/20 focus:border-ink outline-none py-4 font-mono text-lg transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="editorial-meta flex items-center gap-2"><Shield size={12} /> Confirm Passphrase</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-transparent border-b border-ink/20 focus:border-ink outline-none py-4 font-mono text-lg transition-all"
                />
              </div>

              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 italic">Passphrases do not match.</p>
              )}

              <div className="flex justify-between items-center mt-6">
                <button onClick={() => setStep('profile')} className="editorial-meta hover:text-ink transition-colors">Back</button>
                <button 
                  disabled={!password || password !== confirmPassword || isInitializing}
                  onClick={handleFinalize}
                  className="flex items-center gap-2 bg-ink text-paper px-10 py-4 rounded-full font-mono text-[10px] uppercase tracking-widest disabled:opacity-20 transition-all hover:scale-105"
                >
                  {isInitializing ? (
                    <>Calibrating Engine...</>
                  ) : (
                    <>Create Secure Vault <Shield size={14} /></>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
