/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, lazy, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AnimationSpeeds, EasingCurves } from './domain/constants/Theme';
import {
  Settings,
  Menu,
  X,
  Target,
  BookOpen,
  Activity,
  BarChart3,
  Moon,
  Home,
  Shield,
  Heart,
  Wind,
  Flame,
  LayoutGrid
} from "lucide-react";
import MobileNavHub from "./ui/components/shared/MobileNavHub";
import QuickActionFAB from "./ui/components/shared/QuickActionFAB";
import { cn } from './shared/utils/TailwindMerge';
import { triggerHaptic } from './shared/utils/Haptics';
import { useVault } from "./application/hooks/useVault";
import { ThoughtEntry, MoodEntry, ExposureData, ActivationActivity, Goal, SleepEntry, DayClosure } from './domain/entities';
import { awardXP } from './application/usecases/GamificationEngine';
import { audioFeedback } from './infrastructure/services/WebAudioFeedbackService';
import { LanguageProvider } from "./application/contexts/LanguageContext";
import { Language } from "./shared/i18n/translations";

// Lazy loaded Views
const LockScreenView = lazy(() => import('./ui/views/LockScreenView'));
const CrisisView = lazy(() => import('./ui/views/CrisisView'));
const WelcomeView = lazy(() => import('./ui/views/WelcomeView'));
const DashboardView = lazy(() => import('./ui/views/DashboardView'));
const JournalView = lazy(() => import('./ui/views/JournalView'));
const ExposureView = lazy(() => import('./ui/views/ExposureView'));
const ActivationView = lazy(() => import('./ui/views/ActivationView'));
const AnalysisView = lazy(() => import('./ui/views/AnalysisView'));
const GoalsView = lazy(() => import('./ui/views/GoalsView'));
const SleepView = lazy(() => import('./ui/views/SleepView'));
const SettingsView = lazy(() => import('./ui/views/SettingsView'));
const MoodView = lazy(() => import('./ui/views/MoodView'));
const BreathingView = lazy(() => import('./ui/views/BreathingView'));
const HabitsView = lazy(() => import('./ui/views/HabitsView'));
const DayClosureView = lazy(() => import('./ui/views/DayClosureView'));
const LevelUpModal = lazy(() => import('./ui/components/shared/LevelUpModal'));

type Tab = 'dashboard' | 'journal' | 'habits' | 'mood' | 'exposure' | 'activation' | 'breathing' | 'analysis' | 'goals' | 'sleep' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showCrisis, setShowCrisis] = useState(false);
  const [showDayClosure, setShowDayClosure] = useState(false);
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const [isNavHubOpen, setIsNavHubOpen] = useState(false);

  const {
    vault, isReady, isLocked, vaultExists, unlockError,
    unlockVault, createVault, lockVault, updateVault, wipeAllData
  } = useVault();

  // Sync audio and theme state
  useEffect(() => {
    if (vault) {
      audioFeedback.setEnabled(vault.profile.soundEnabled !== false);
      
      // Apply theme
      const theme = vault.profile.theme || 'default';
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [vault]);

  const handleTabChange = (newTab: Tab) => {
    if (newTab !== activeTab) {
      triggerHaptic('light');
      setActiveTab(newTab);
    }
  };

  const handleJournalUpdate = (entries: ThoughtEntry[]) => {
    // Check if a new entry was added (length increased)
    const isNewEntry = entries.length > (vault.journal || []).length;
    
    let updatedVault = { ...vault, journal: entries };
    
    if (isNewEntry) {
      const lastEntry = entries[0];
      const xpType = lastEntry.level === 3 ? 'JOURNAL_L3' : 'JOURNAL_ENTRY';
      const { vault: xpVault, event } = awardXP(updatedVault, xpType);
      updatedVault = xpVault;
      
      if (event.didLevelUp) {
        setNewLevel(event.newLevel!);
      }
    }
    
    updateVault(updatedVault);
  };

  const handleDayClosure = (closure: DayClosure) => {
    const updatedVault = {
      ...vault!,
      closedDays: [closure, ...(vault!.closedDays || [])]
    };
    updateVault(updatedVault);
    setShowDayClosure(false);
    triggerHaptic('success');
  };

  const menuItems: { id: Tab; icon: React.ComponentType<{ size?: number | string; className?: string }>; label: string }[] = [
    { id: 'dashboard', icon: Home, label: 'nav.sanctuary' },
    { id: 'journal', icon: BookOpen, label: 'nav.chronicle' },
    { id: 'habits', icon: Flame, label: 'nav.architecture' },
    { id: 'mood', icon: Heart, label: 'nav.emotional_flux' },
    { id: 'exposure', icon: Activity, label: 'nav.facing' },
    { id: 'activation', icon: Target, label: 'nav.momentum' },
    { id: 'breathing', icon: Wind, label: 'nav.breathe' },
    { id: 'goals', icon: Shield, label: 'nav.fortress' },
    { id: 'sleep', icon: Moon, label: 'nav.nightfall' },
    { id: 'analysis', icon: BarChart3, label: 'nav.resilience' },
  ];

  function AppNavItem({ item, isActive, isSidebarOpen, onClick }: { 
    item: { id: string, icon: any, label: string }, 
    isActive: boolean, 
    isSidebarOpen: boolean, 
    onClick: () => void 
  }) {
    const { t } = useTranslation();
    return (
      <button
        onClick={onClick}
        className={cn(
          "group flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 relative w-full",
          isActive ? "bg-ink text-paper" : "text-accent hover:bg-ink/5 hover:text-ink"
        )}
      >
        <item.icon size={18} className="shrink-0" />
        {isSidebarOpen && (
          <span className="font-mono text-[9px] uppercase tracking-widest overflow-hidden whitespace-nowrap">
            {t(item.label)}
          </span>
        )}
        {!isSidebarOpen && isActive && (
          <motion.div layoutId="activeDot" className="absolute -right-2 w-1 h-4 bg-ink rounded-full" />
        )}
      </button>
    );
  }

  if (!isReady) return null;

  if (!vaultExists) {
    return (
      <Suspense fallback={null}>
        <WelcomeView onCreateVault={createVault} />
      </Suspense>
    );
  }

  if (isLocked) {
    return (
      <Suspense fallback={null}>
        <LockScreenView 
          onUnlock={unlockVault} 
          error={unlockError} 
          onOpenCrisis={() => setShowCrisis(true)}
        />
        {showCrisis && (
          <CrisisView 
            onClose={() => setShowCrisis(false)} 
            isUnlocked={false}
          />
        )}
      </Suspense>
    );
  }

  const crisisOverlay = showCrisis ? (
    <Suspense fallback={null}>
      <CrisisView 
        onClose={() => setShowCrisis(false)} 
        isUnlocked={true}
        onNavigate={(tab) => {
          handleTabChange(tab as Tab);
          setShowCrisis(false);
        }}
      />
    </Suspense>
  ) : null;

  const currentLanguage = (vault?.profile.language || 'en') as Language;

  const handleLanguageChange = (lang: Language) => {
    if (vault) {
      updateVault({
        ...vault,
        profile: { ...vault.profile, language: lang }
      });
    }
  };

  const handleQuickAction = (action: 'journal' | 'mood' | 'habits' | 'crisis') => {
    if (action === 'crisis') {
      setShowCrisis(true);
    } else {
      handleTabChange(action as Tab);
    }
  };

  return (
    <LanguageProvider language={currentLanguage} onLanguageChange={handleLanguageChange}>
      <div className="flex h-screen bg-paper text-ink selection:bg-ink selection:text-paper overflow-hidden">
        {crisisOverlay}
        
        <AnimatePresence>
          {newLevel && (
            <Suspense fallback={null}>
              <LevelUpModal level={newLevel} onClose={() => setNewLevel(null)} />
            </Suspense>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar / Mobile Drawer */}
        <motion.aside
          initial={false}
          animate={{ width: isSidebarOpen ? 280 : 80 }}
          className="relative z-40 bg-paper border-r border-ink/5 hidden md:flex flex-col py-10 px-6 transition-all duration-500 ease-editorial"
        >
          <div className="flex items-center gap-4 mb-20 px-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full border border-ink flex items-center justify-center font-serif text-lg">λ</div>
            {isSidebarOpen && (
              <motion.h1 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="font-mono text-[10px] uppercase tracking-[0.3em]"
              >
                Lumina
              </motion.h1>
            )}
          </div>

          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <AppNavItem 
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                isSidebarOpen={isSidebarOpen}
                onClick={() => handleTabChange(item.id)}
              />
            ))}
          </nav>

          <div className="mt-auto pt-10">
            <AppNavItem 
              item={{ id: 'settings', icon: Settings, label: 'nav.settings' }}
              isActive={activeTab === 'settings'}
              isSidebarOpen={isSidebarOpen}
              onClick={() => handleTabChange('settings')}
            />
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-paper border border-ink/5 rounded-full flex items-center justify-center shadow-sm hover:bg-ink hover:text-paper transition-all"
          >
            {isSidebarOpen ? <X size={12} /> : <Menu size={12} />}
          </button>
        </motion.aside>

        {/* Main Content Area */}
        <main className="flex-grow relative overflow-y-auto px-6 md:px-16 py-10 md:py-16 scroll-smooth">
          <div className="max-w-6xl mx-auto pb-32 md:pb-0">
            <AnimatePresence mode="wait">
              <motion.section
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -15, filter: 'blur(10px)' }}
                transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
              >
              <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-accent font-mono text-[10px] uppercase tracking-widest">Loading...</div>}>
                {!vault && <div className="h-full w-full flex items-center justify-center text-accent font-mono text-[10px] uppercase tracking-widest">Securing...</div>}
                {vault && activeTab === 'dashboard' && (
                  <DashboardView 
                    vault={vault} 
                    onUpdate={updateVault} 
                    onOpenCrisis={() => setShowCrisis(true)}
                    onOpenDayClosure={() => setShowDayClosure(true)}
                  />
                )}
                {vault && activeTab === 'journal' && <JournalView clinicalProfile={vault.profile.clinicalProfile} entries={vault.journal || []} onUpdate={handleJournalUpdate} />}
                {vault && activeTab === 'habits' && <HabitsView vault={vault} onUpdate={updateVault} onLevelUp={setNewLevel} />}
                {vault && activeTab === 'mood' && <MoodView entries={vault.wellness.moodEntries || []} onUpdate={(m: MoodEntry[]) => updateVault({ ...vault, wellness: { ...vault.wellness, moodEntries: m } })} />}
                {vault && activeTab === 'exposure' && <ExposureView data={vault.exposure || { hierarchy: [], logs: [] }} onUpdate={(data: ExposureData) => updateVault({ ...vault, exposure: data })} />}
                {vault && activeTab === 'activation' && <ActivationView activities={vault.activations || []} habits={vault.habits || []} goals={vault.goals || []} onUpdate={(acts: ActivationActivity[]) => updateVault({ ...vault, activations: acts })} />}
                {vault && activeTab === 'breathing' && <BreathingView />}
                {vault && activeTab === 'analysis' && <AnalysisView vault={vault} />}
                {vault && activeTab === 'goals' && <GoalsView goals={vault.goals || []} onUpdate={(goals: Goal[]) => updateVault({ ...vault, goals })} />}
                {vault && activeTab === 'sleep' && <SleepView entries={vault.sleep || []} onUpdate={(entries: SleepEntry[]) => updateVault({ ...vault, sleep: entries })} />}
                {vault && activeTab === 'settings' && <SettingsView vault={vault} onUpdate={updateVault} onWipe={wipeAllData} onLock={lockVault} onOpenCrisis={() => setShowCrisis(true)} />}
              </Suspense>
              </motion.section>
            </AnimatePresence>

            <AnimatePresence>
              {showDayClosure && vault && (
                <Suspense fallback={null}>
                  <DayClosureView 
                    vault={vault} 
                    onClose={() => setShowDayClosure(false)}
                    onSave={handleDayClosure}
                  />
                </Suspense>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-paper/80 backdrop-blur-md border-t border-ink/5 px-6 py-4 flex justify-between items-center md:hidden z-50">
          {[
            { id: 'dashboard', icon: Home },
            { id: 'journal', icon: BookOpen },
            { id: 'activation', icon: Target },
            { id: 'habits', icon: Flame },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id as Tab)}
              className={cn("p-2 transition-all", activeTab === item.id ? "text-ink scale-110" : "text-accent")}
            >
              <item.icon size={22} />
            </button>
          ))}
          <button
            onClick={() => {
              triggerHaptic('medium');
              setIsNavHubOpen(true);
            }}
            className="p-2 text-accent hover:text-ink transition-all"
          >
            <LayoutGrid size={22} />
          </button>
        </nav>

        <MobileNavHub 
          isOpen={isNavHubOpen}
          onClose={() => setIsNavHubOpen(false)}
          items={menuItems}
          activeTab={activeTab}
          onNavigate={handleTabChange}
        />

        <QuickActionFAB onAction={handleQuickAction} />

        {/* SOS Global Trigger - Desktop Only */}
        <button 
          onClick={() => setShowCrisis(true)}
          className="fixed bottom-10 right-10 w-12 h-12 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 hidden md:flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-40 group"
          title="Emergency Protocol"
        >
          <Shield size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </LanguageProvider>
  );
}
