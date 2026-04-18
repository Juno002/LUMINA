/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Calendar, ChevronRight, BookOpen, Sparkles, Loader2, X } from 'lucide-react';
import { ThoughtEntry, CognitiveDistortion } from '../../domain/entities';
import { cn, todayISO, formatDate, triggerHaptic } from '../../shared/lib/utils';
import { aiAnalysisService } from '../../infrastructure/services/GeminiAnalysisService';
import { JournalInsight } from '../../domain/services/IAIAnalysisService';
import EntryCard from '../components/domain/journal/EntryCard';

export default function JournalView({ entries, onUpdate }: { entries: ThoughtEntry[], onUpdate: (e: ThoughtEntry[]) => void }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insight, setInsight] = useState<JournalInsight | null>(null);
  const [editingEntry, setEditingEntry] = useState<ThoughtEntry | null>(null);

  const filteredEntries = entries.filter(e => 
    e.situation?.toLowerCase().includes(search.toLowerCase()) ||
    e.automaticThought?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePulseCheck = async () => {
    if (entries.length === 0) return;
    triggerHaptic('medium');
    setIsAnalyzing(true);
    const thoughts = entries.slice(0, 5).map(e => e.automaticThought);
    const result = await aiAnalysisService.analyzeJournalEntries(thoughts);
    setInsight(result);
    setIsAnalyzing(false);
  };

  const handleSave = (entry: ThoughtEntry) => {
    triggerHaptic('success');
    if (editingEntry) {
      onUpdate(entries.map(e => e.id === entry.id ? entry : e));
    } else {
      onUpdate([entry, ...entries]);
    }
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Erase this observation summary?")) {
      triggerHaptic('heavy');
      onUpdate(entries.filter(e => e.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Library / Logs</div>
          <h2 className="font-serif text-3xl md:text-4xl">Chronicle of Thoughts.</h2>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <button 
            onClick={handlePulseCheck}
            disabled={entries.length === 0 || isAnalyzing}
            className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 border border-ink/10 px-6 py-3 rounded-full hover:bg-ink/[0.02] transition-all font-mono text-[10px] uppercase tracking-widest disabled:opacity-30 group"
          >
            {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="group-hover:text-accent" />}
            Pulse Check
          </button>
          <button 
            onClick={() => { setEditingEntry(null); setIsFormOpen(true); }}
            className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 bg-ink text-paper px-6 py-3 rounded-full hover:opacity-80 transition-all font-mono text-[10px] uppercase tracking-widest"
          >
            <Plus size={14} /> New Entry
          </button>
        </div>
      </div>

      <AnimatePresence>
        {insight && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 bg-ink text-paper rounded-[2rem] flex flex-col gap-6 relative"
          >
            <button onClick={() => setInsight(null)} className="absolute top-6 right-6 opacity-50 hover:opacity-100">
              <X size={16} />
            </button>
            <div className="flex items-center gap-4">
              <Sparkles className="text-accent" size={20} />
              <div className="editorial-meta opacity-50 uppercase tracking-widest">Observation Insights</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="flex flex-col gap-4">
                <p className="text-xl font-serif italic leading-relaxed opacity-90">"{insight.summary}"</p>
                <div className="flex flex-wrap gap-2">
                  {insight.commonDistortions.map(d => (
                    <span key={d} className="editorial-meta text-[9px] bg-paper/10 px-2 py-0.5 rounded italic">{d}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-4 border-l border-paper/10 pl-10">
                 <div className="editorial-meta opacity-50">Reframing Strategy</div>
                 <p className="text-sm italic text-accent leading-relaxed">{insight.reframingTip}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative group">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-accent opacity-30 group-focus-within:opacity-100 transition-opacity" size={14} />
        <input 
          type="text"
          placeholder="Search archives..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-b border-ink/5 focus:border-ink rounded-none py-4 pl-6 pr-4 transition-all outline-none text-sm italic font-serif"
        />
      </div>

      {isFormOpen ? (
        <JournalForm 
          initialData={editingEntry || undefined}
          onCancel={() => { setIsFormOpen(false); setEditingEntry(null); }} 
          onSave={handleSave} 
        />
      ) : (
        <div className="flex flex-col">
          {filteredEntries.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 border-2 border-dashed border-ink/5 rounded-3xl">
              <BookOpenIcon />
              <p className="editorial-meta">No records found in current timeline.</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <EntryCard 
                key={entry.id} 
                entry={entry} 
                onDelete={() => handleDelete(entry.id)} 
                onEdit={() => { setEditingEntry(entry); setIsFormOpen(true); }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function JournalForm({ initialData, onCancel, onSave }: { initialData?: ThoughtEntry, onCancel: () => void, onSave: (e: ThoughtEntry) => void }) {
  const [formData, setFormData] = useState<Partial<ThoughtEntry>>(initialData || {
    date: todayISO(),
    intensity: 50,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData as ThoughtEntry,
      id: formData.id || crypto.randomUUID(),
      tags: formData.tags || [],
      distortions: formData.distortions || [],
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-10 border border-ink/10 rounded-3xl bg-paper shadow-2xl shadow-ink/5"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-2">
            <label className="editorial-meta">Situation</label>
            <textarea 
              required
              className="bg-transparent border-b border-ink/20 focus:border-ink outline-none py-2 resize-none h-24 italic"
              placeholder="What happened? Where? When?"
              value={formData.situation || ''}
              onChange={(e) => setFormData({...formData, situation: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="editorial-meta">Automatic Thought</label>
            <textarea 
              required
              className="bg-transparent border-b border-ink/20 focus:border-ink outline-none py-2 resize-none h-24 italic"
              placeholder="What was going through your mind?"
              value={formData.automaticThought || ''}
              onChange={(e) => setFormData({...formData, automaticThought: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-2">
            <label className="editorial-meta">Emotion</label>
            <input 
              type="text"
              required
              className="bg-transparent border-b border-ink/20 focus:border-ink outline-none py-2 italic"
              placeholder="Sad, Anxious, Angry..."
              value={formData.primaryEmotion || ''}
              onChange={(e) => setFormData({...formData, primaryEmotion: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="editorial-meta">Intensity ({formData.intensity}%)</label>
            <input 
              type="range"
              min="0"
              max="100"
              className="accent-ink h-10"
              value={formData.intensity}
              onChange={(e) => setFormData({...formData, intensity: parseInt(e.target.value)})}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="editorial-meta">Date</label>
            <input 
              type="date"
              className="bg-transparent border-b border-ink/20 focus:border-ink outline-none py-2 italic"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="editorial-meta">Rational Response</label>
          <textarea 
            className="bg-transparent border-b border-ink/20 focus:border-ink outline-none py-2 resize-none h-32 italic"
            placeholder="Challenge your thoughts with evidence..."
            value={formData.rationalResponse || ''}
            onChange={(e) => setFormData({...formData, rationalResponse: e.target.value})}
          />
        </div>

        <div className="flex justify-end gap-4 pt-10 border-t border-ink/5">
          <button type="button" onClick={onCancel} className="editorial-meta hover:text-ink">Cancel</button>
          <button type="submit" className="bg-ink text-paper px-10 py-4 rounded-full font-mono text-[10px] uppercase tracking-widest">
            {initialData ? 'Update Observation' : 'Register Observation'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function BookOpenIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-20">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}
