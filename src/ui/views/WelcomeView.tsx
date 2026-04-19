/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Shield, User, Heart, Lock, Globe, ShieldAlert, Zap, Moon, CloudRain } from 'lucide-react';
import { ClinicalProfile } from '../../domain/entities';
import { useTranslation } from '../../application/contexts/LanguageContext';
import { cn } from '../../shared/utils/TailwindMerge';

interface WelcomeViewProps {
  onCreateVault: (name: string, password: string, clinicalProfile: ClinicalProfile, language: string) => void;
}

type SetupStep = 'language' | 'disclaimer' | 'intro' | 'name' | 'profile' | 'security';

export default function WelcomeView({ onCreateVault }: WelcomeViewProps) {
  const { t, language, setLanguage } = useTranslation();
  const [step, setStep] = useState<SetupStep>('language');
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
        await onCreateVault(name.trim(), password, profile, language);
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
        {step === 'language' && (
          <motion.div 
            key="language"
            variants={containerVariants}
            initial="initial" animate="animate" exit="exit"
            className="max-w-xl w-full flex flex-col gap-12 text-center"
          >
            <div className="flex flex-col gap-4">
              <div className="editorial-meta">Lumina Core / Initialize</div>
              <h1 className="font-serif text-5xl md:text-6xl font-light">Linguistic Architecture.</h1>
              <p className="font-serif italic text-lg text-accent max-w-xs mx-auto opacity-60">
                Choose your primary linguistic environment.
              </p>
            </div>

            <div className="flex flex-col gap-4 items-center">
              <div className="flex justify-center gap-12 py-8 border-y border-ink/5 w-full max-w-xs mx-auto">
                <button 
                  onClick={() => setLanguage('en')}
                  className={cn(
                    "flex flex-col items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] transition-all",
                    language === 'en' ? "text-ink scale-110" : "text-accent opacity-30 hover:opacity-100"
                  )}
                >
                  <span className="text-2xl font-serif italic mb-1">En</span>
                  English
                </button>
                <div className="w-[1px] h-12 bg-ink/5" />
                <button 
                  onClick={() => setLanguage('es')}
                  className={cn(
                    "flex flex-col items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] transition-all",
                    language === 'es' ? "text-ink scale-110" : "text-accent opacity-30 hover:opacity-100"
                  )}
                >
                  <span className="text-2xl font-serif italic mb-1">Es</span>
                  Español
                </button>
              </div>

              <button 
                onClick={() => setStep('disclaimer')}
                className="mt-8 flex items-center gap-4 bg-ink text-paper px-12 py-5 rounded-full font-mono text-[10px] uppercase tracking-[0.3em] hover:opacity-80 transition-all hover:scale-105"
              >
                {language === 'es' ? 'Continuar' : 'Continue'} <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'disclaimer' && (
          <motion.div 
            key="disclaimer"
            variants={containerVariants}
            initial="initial" animate="animate" exit="exit"
            className="max-w-xl w-full flex flex-col gap-10 text-center"
          >
            <div className="flex flex-col gap-8 items-center">
              <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center text-ink">
                <ShieldAlert size={32} />
              </div>
              <div className="flex flex-col gap-4">
                <h1 className="font-serif text-4xl md:text-5xl">{t('welcome.disclaimer_title')}</h1>
                <p className="font-serif italic text-lg text-accent leading-relaxed">
                  {t('welcome.disclaimer_body')}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setStep('intro')}
              className="mx-auto flex items-center gap-4 bg-ink text-paper px-10 py-5 rounded-full font-mono text-[10px] uppercase tracking-[0.3em] hover:opacity-80 transition-all"
            >
              {t('welcome.disclaimer_button')} <ArrowRight size={14} />
            </button>
          </motion.div>
        )}

        {step === 'intro' && (
          <motion.div 
            key="intro"
            variants={containerVariants}
            initial="initial" animate="animate" exit="exit"
            className="max-w-xl w-full flex flex-col gap-10 text-center"
          >
            <div className="flex flex-col gap-4">
              <div className="editorial-meta">Lumina Core / Welcome</div>
              <h1 className="font-serif text-7xl md:text-8xl font-light">{t('welcome.title')}</h1>
              <p className="font-serif italic text-xl text-accent max-w-md mx-auto leading-relaxed">
                {t('welcome.subtitle')}
              </p>
            </div>

            <div className="flex justify-center gap-6 mt-2 opacity-20 pointer-events-none">
              <span className="font-mono text-[9px] uppercase tracking-widest">{language === 'en' ? 'English Architecture' : 'Arquitectura Española'}</span>
            </div>
            <button 
              onClick={() => setStep('name')}
              className="mx-auto flex items-center gap-4 bg-ink text-paper px-10 py-5 rounded-full font-mono text-[10px] uppercase tracking-[0.3em] hover:opacity-80 transition-all"
            >
              {t('welcome.begin')} <ArrowRight size={14} />
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
              <div className="editorial-meta">{t('welcome.step_identity')}</div>
              <h2 className="font-serif text-4xl">{t('welcome.ask_name')}</h2>
            </div>
            <div className="flex flex-col gap-8">
              <input 
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('welcome.name_placeholder')}
                className="bg-transparent border-b border-ink/20 focus:border-ink outline-none py-4 font-serif text-3xl italic transition-all"
              />
              <button 
                disabled={!name.trim()}
                onClick={() => setStep('profile')}
                className="self-end flex items-center gap-2 bg-ink text-paper px-8 py-3 rounded-full font-mono text-[10px] uppercase tracking-widest disabled:opacity-20 transition-all"
              >
                {t('common.continue')} <ArrowRight size={14} />
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
              <div className="editorial-meta">{t('welcome.step_clinical')}</div>
              <h2 className="font-serif text-4xl">{t('welcome.define_focus')}</h2>
              <p className="text-sm text-accent italic">{t('welcome.calibrate_lambda')}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'anxiety', label: t('welcome.focus_anxiety'), desc: t('welcome.focus_anxiety_desc'), icon: Shield },
                { id: 'depression', label: t('welcome.focus_mood'), desc: t('welcome.focus_mood_desc'), icon: Heart },
                { id: 'ocd', label: t('welcome.focus_ocd'), desc: t('welcome.focus_ocd_desc'), icon: Zap },
                { id: 'sleep', label: t('welcome.focus_sleep'), desc: t('welcome.focus_sleep_desc'), icon: Moon },
                { id: 'unspecified', label: t('welcome.focus_general'), desc: t('welcome.focus_general_desc'), icon: Globe }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setProfile(opt.id as ClinicalProfile)}
                  className={`p-6 rounded-3xl border transition-all text-left flex items-start gap-6 group ${
                    profile === opt.id ? 'bg-ink border-ink text-paper' : 'border-ink/10 hover:border-ink/30 text-accent'
                  }`}
                >
                  <div className={`p-4 rounded-2xl transition-colors ${
                    profile === opt.id ? 'bg-paper/10 text-paper' : 'bg-ink/5 text-ink'
                  }`}>
                    <opt.icon size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-serif text-xl">{opt.label}</span>
                    <span className={`text-xs italic opacity-60 ${profile === opt.id ? 'text-paper' : 'text-accent'}`}>
                      {opt.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setStep('name')} className="editorial-meta hover:text-ink transition-colors">{t('common.back')}</button>
              <button 
                onClick={() => setStep('security')}
                className="flex items-center gap-2 bg-ink text-paper px-8 py-3 rounded-full font-mono text-[10px] uppercase tracking-widest transition-all"
              >
                {t('common.continue')} <ArrowRight size={14} />
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
              <div className="editorial-meta">{t('welcome.step_sovereignty')}</div>
              <h2 className="font-serif text-4xl">{t('welcome.secure_vault')}</h2>
              <p className="text-sm text-accent italic">{t('welcome.zero_knowledge_warning')}</p>
            </div>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="editorial-meta flex items-center gap-2"><Lock size={12} /> {t('welcome.set_passphrase')}</label>
                <input 
                  autoFocus
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-b border-ink/20 focus:border-ink outline-none py-4 font-mono text-lg transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="editorial-meta flex items-center gap-2"><Shield size={12} /> {t('welcome.confirm_passphrase')}</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-transparent border-b border-ink/20 focus:border-ink outline-none py-4 font-mono text-lg transition-all"
                />
              </div>

              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 italic">{t('welcome.mismatch')}</p>
              )}

              <div className="flex justify-between items-center mt-6">
                <button onClick={() => setStep('profile')} className="editorial-meta hover:text-ink transition-colors">{t('common.back')}</button>
                <button 
                  disabled={!password || password !== confirmPassword || isInitializing}
                  onClick={handleFinalize}
                  className="flex items-center gap-2 bg-ink text-paper px-10 py-4 rounded-full font-mono text-[10px] uppercase tracking-widest disabled:opacity-20 transition-all hover:scale-105"
                >
                  {isInitializing ? (
                    <>{t('welcome.calibrating')}</>
                  ) : (
                    <>{t('welcome.create_vault')} <Shield size={14} /></>
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
