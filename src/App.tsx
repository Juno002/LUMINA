/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Wind
} from "lucide-react";
import { cn, todayISO, triggerHaptic } from "./shared/lib/utils";
import { useVault } from "./application/hooks/useVault";

// Views
import WelcomeView from "./ui/views/WelcomeView";
import DashboardView from "./ui/views/DashboardView";
import JournalView from "./ui/views/JournalView";
import ExposureView from "./ui/views/ExposureView";
import ActivationView from "./ui/views/ActivationView";
import AnalysisView from "./ui/views/AnalysisView";
import GoalsView from "./ui/views/GoalsView";
import SleepView from "./ui/views/SleepView";
import SettingsView from "./ui/views/SettingsView";
import MoodView from "./ui/views/MoodView";
import BreathingView from "./ui/views/BreathingView";

type Tab = 'dashboard' | 'journal' | 'mood' | 'exposure' | 'activation' | 'breathing' | 'analysis' | 'goals' | 'sleep' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { vault, isReady, updateVault, initializeUser, wipeAllData } = useVault();

  // Gesture Handling for Mobile
  const handleTabChange = (newTab: Tab) => {
    if (newTab !== activeTab) {
      triggerHaptic('light');
      setActiveTab(newTab);
    }
  };

  const tabs: Tab[] = [
    'dashboard', 'journal', 'mood', 'breathing', 'activation', 'exposure', 'goals', 'sleep', 'settings'
  ];

  const swipeLeft = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      handleTabChange(tabs[currentIndex + 1]);
    }
  };

  const swipeRight = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      handleTabChange(tabs[currentIndex - 1]);
    }
  };

  if (!isReady || !vault) return null;

  if (!vault.profile.initialized) {
    return <WelcomeView onComplete={initializeUser} />;
  }

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Overview' },
    { id: 'journal', icon: BookOpen, label: 'Journal' },
    { id: 'mood', icon: Heart, label: 'Mood' },
    { id: 'exposure', icon: Shield, label: 'Exposure' },
    { id: 'activation', icon: Activity, label: 'Activation' },
    { id: 'breathing', icon: Wind, label: 'Breathing' },
    { id: 'analysis', icon: BarChart3, label: 'Analysis' },
    { id: 'goals', icon: Target, label: 'Goals' },
    { id: 'sleep', icon: Moon, label: 'Sleep' },
    { id: 'settings', icon: Settings, label: 'System' },
  ];

  return (
    <div className="flex h-screen w-screen bg-paper text-ink overflow-hidden font-sans flex-col md:flex-row">
      {/* Desktop Navigation Sidebar */}
      <aside className={cn(
        "hidden md:flex relative flex-col border-r border-ink/5 transition-all duration-500 ease-in-out z-50 bg-paper",
        isSidebarOpen ? "w-[240px]" : "w-[80px]"
      )}>
        <div className="p-8 flex items-center justify-between">
          <motion.div 
            initial={false}
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
            className="font-serif text-2xl tracking-tighter"
          >
            Lumina
          </motion.div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hover:opacity-50 transition-opacity"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-grow pt-10 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id as Tab)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group text-left",
                activeTab === item.id ? "bg-ink text-paper" : "hover:bg-ink/[0.03]"
              )}
            >
              <item.icon size={18} className={cn("shrink-0", activeTab === item.id ? "" : "text-accent group-hover:text-ink")} />
              {isSidebarOpen && (
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium pt-0.5">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-ink/5">
          <div className="flex flex-col gap-1">
            <div className="editorial-meta">Vault Status</div>
            <div className="text-[9px] font-mono text-accent">LOCKED</div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-6 border-b border-ink/5 bg-paper z-50">
          <div className="font-serif text-2xl tracking-tighter">Lumina</div>
          <div className="editorial-meta text-[8px] tracking-[0.3em]">Hardware Vault</div>
      </div>

      {/* Main Content Area */}
      <main 
        className="relative flex-grow overflow-y-auto px-6 md:px-[5vw] py-10 md:py-[8vh] flex flex-col"
      >
        <motion.div 
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x < -100) swipeLeft();
            if (info.offset.x > 100) swipeRight();
          }}
          className="flex flex-col gap-12 md:gap-20 max-w-[1200px] mx-auto w-full touch-pan-y"
        >
          {/* Universal Header */}
          <header className="flex flex-col gap-4">
            <div className="flex items-center gap-4 editorial-meta">
              <span>{todayISO()}</span>
              <span className="h-[1px] w-10 md:w-20 bg-ink/10"></span>
              <span>{activeTab.toUpperCase()}</span>
            </div>
            <motion.h1 
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="editorial-title"
            >
              {activeTab === 'dashboard' ? `Welcome back, ${vault.profile.name}.` : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}.`}
            </motion.h1>
          </header>

          <AnimatePresence mode="wait">
            <motion.section
              key={activeTab}
              initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -15, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex-grow pb-32 md:pb-20"
            >
              {activeTab === 'dashboard' && <DashboardView vault={vault} onUpdate={updateVault} />}
              {activeTab === 'journal' && <JournalView entries={vault.journal || []} onUpdate={(entries: any) => updateVault({ ...vault, journal: entries })} />}
              {activeTab === 'mood' && <MoodView entries={vault.wellness.moodEntries || []} onUpdate={(m: any) => updateVault({ ...vault, wellness: { ...vault.wellness, moodEntries: m } })} />}
              {activeTab === 'exposure' && <ExposureView data={vault.exposure || { hierarchy: [], logs: [] }} onUpdate={(data: any) => updateVault({ ...vault, exposure: data })} />}
              {activeTab === 'activation' && <ActivationView activations={vault.activations || []} onUpdate={(acts: any) => updateVault({ ...vault, activations: acts })} />}
              {activeTab === 'breathing' && <BreathingView />}
              {activeTab === 'analysis' && <AnalysisView vault={vault} />}
              {activeTab === 'goals' && <GoalsView goals={vault.goals || []} onUpdate={(goals: any) => updateVault({ ...vault, goals })} />}
              {activeTab === 'sleep' && <SleepView entries={vault.sleep || []} onUpdate={(entries: any) => updateVault({ ...vault, sleep: entries })} />}
              {activeTab === 'settings' && <SettingsView onWipe={wipeAllData} />}
            </motion.section>
          </AnimatePresence>
        </motion.div>

        {/* Global Footer (Desktop) */}
        <footer className="mt-auto hidden md:flex px-[5vw] py-10 border-t border-ink/5 justify-between editorial-meta">
          <div className="max-w-[1200px] mx-auto w-full flex justify-between">
            <div>AES. {vault.profile.name.toUpperCase()} / SESSION ACTIVE</div>
            <div>{new Date().getFullYear()} © LUMINA SYSTEM</div>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Navigation Bar: Ergonomic Consolidation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-paper/95 backdrop-blur-xl border-t border-ink/5 px-8 pt-4 pb-8 flex justify-between items-center z-50">
        {[
          { id: 'dashboard', icon: Home, label: 'Home' },
          { id: 'journal', icon: BookOpen, label: 'Log' },
          { id: 'mood', icon: Heart, label: 'Mood' },
          { id: 'activation', icon: Activity, label: 'Work' },
          { id: 'analysis', icon: BarChart3, label: 'Data' },
          { id: 'settings', icon: Settings, label: 'Sys' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id as Tab)}
            className={cn(
              "flex flex-col items-center gap-2 transition-all duration-500",
              activeTab === item.id ? "text-ink translate-y-[-4px]" : "text-accent opacity-60"
            )}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2 : 1.5} />
            <span className="text-[7px] uppercase tracking-[0.2em] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
