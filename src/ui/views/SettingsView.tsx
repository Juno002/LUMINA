/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Key, Database, RefreshCcw, Trash2, Globe, Palette } from 'lucide-react';
export default function SettingsView({ onWipe }: { onWipe: () => void }) {
  const handleWipe = async () => {
    if (confirm("Are you certain? This will permanently erase your local vault and all recorded observations.")) {
      onWipe();
    }
  };

  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-2">
        <div className="editorial-meta">Configurations / Sovereignty</div>
        <h2 className="font-serif text-4xl">System Control.</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-12">
          <section className="flex flex-col gap-8 pb-10 border-b border-ink/5">
            <div className="flex items-center gap-4">
              <Shield size={20} className="text-accent" />
              <div className="editorial-meta uppercase tracking-widest">Security Protocol</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="flex flex-col gap-4">
                <h4 className="font-serif text-xl italic">Data Sovereignty</h4>
                <p className="text-sm text-accent leading-relaxed italic">
                  Your data is stored using browser-native IndexedDB via the Lumina Vault protocol. 
                  No metrics, observations, or identifiers ever leave your hardware environment.
                </p>
              </div>
              <div className="flex flex-col gap-6 justify-center">
                <button className="flex items-center justify-between w-full py-4 border-b border-ink/10 group">
                   <span className="font-mono text-[11px] uppercase tracking-widest">Review AES-256 Logs</span>
                   <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>
                <button className="flex items-center justify-between w-full py-4 border-b border-ink/10 group">
                   <span className="font-mono text-[11px] uppercase tracking-widest">Export Vault Identity</span>
                   <Database size={14} />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-6">
          <section className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <Palette size={20} className="text-accent" />
              <div className="editorial-meta uppercase tracking-widest">Aesthetic Synthesis</div>
            </div>
            <div className="flex flex-col gap-4">
               {['Editorial Night', 'Paper White (Default)', 'Ink Deep'].map((theme) => (
                 <button key={theme} className="flex justify-between items-center py-4 px-6 border border-ink/5 rounded-2xl hover:bg-ink/[0.02] transition-all">
                    <span className="font-serif italic">{theme}</span>
                    <div className="w-4 h-4 rounded-full border border-ink/20"></div>
                 </button>
               ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-6">
          <section className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <Trash2 size={20} className="text-red-500/50" />
              <div className="editorial-meta uppercase tracking-widest text-red-500/50">Critical Termination</div>
            </div>
            <div className="p-8 border border-red-500/10 rounded-3xl bg-red-500/[0.02] flex flex-col gap-4">
               <h4 className="font-serif text-xl italic text-red-500/80">Wipe Local Vault</h4>
               <p className="text-xs text-red-500/60 leading-relaxed italic">
                 This action is irreversible. It will dismantle the encryption keys and delete 
                 all stored objects from the Lumina engine.
               </p>
               <button 
                onClick={handleWipe}
                className="mt-4 bg-red-500/10 text-red-500 px-6 py-3 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-paper transition-all"
               >
                 Execute Wipe Protocol
               </button>
            </div>
          </section>
        </div>
      </div>
      
      <footer className="pt-10 flex border-t border-ink/5 justify-between items-center opacity-30">
        <div className="editorial-meta">Hardware ID: {crypto.randomUUID().split('-')[0].toUpperCase()}</div>
        <div className="editorial-meta">Lumina Core / 0.8.2-R</div>
      </footer>
    </div>
  );
}
