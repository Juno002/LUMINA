/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CrisisView — Safety Protocol.
 * Accessible WITHOUT unlocking the vault.
 * Crisis config stored in a separate, unencrypted localforage key.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { X, Phone, Heart, Wind, Plus, Trash2, ArrowRight, Check } from 'lucide-react';
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';
import { CrisisContact } from '../../domain/entities';
import localforage from 'localforage';
import { 
  EditorialButton 
} from '../components/shared';

const CRISIS_KEY = 'lumina_crisis_config';

interface CrisisData {
  copingPhrase: string;
  contacts: CrisisContact[];
}

const HOTLINES = [
  { country: '🇺🇸', name: 'National Suicide Prevention Lifeline', number: '988' },
  { country: '🇪🇸', name: 'Línea de Ayuda', number: '024' },
  { country: '🇩🇴', name: 'Emergencias RD', number: '809-566-0100' },
  { country: '🌍', name: 'findahelpline.com', number: '', url: 'https://findahelpline.com' },
];

interface CrisisViewProps {
  onClose: () => void;
  isUnlocked?: boolean;
  onNavigate?: (tab: string) => void;
}

const BREATH_PHASES: Array<{ phase: 'inhale' | 'hold' | 'exhale'; seconds: number }> = [
  { phase: 'inhale', seconds: 4 },
  { phase: 'hold', seconds: 7 },
  { phase: 'exhale', seconds: 8 },
];

export default function CrisisView({ onClose, isUnlocked, onNavigate }: CrisisViewProps) {
  const [data, setData] = useState<CrisisData>({ copingPhrase: '', contacts: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    localforage.getItem<CrisisData>(CRISIS_KEY).then(saved => {
      if (saved) setData(saved);
    });
  }, []);

  const saveData = async (updated: CrisisData) => {
    setData(updated);
    await localforage.setItem(CRISIS_KEY, updated);
  };

  const addContact = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    const contact: CrisisContact = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      phone: newPhone.trim()
    };
    saveData({ ...data, contacts: [...data.contacts, contact] });
    setNewName('');
    setNewPhone('');
  };

  const removeContact = (id: string) => {
    saveData({ ...data, contacts: data.contacts.filter(c => c.id !== id) });
  };

  const updateCopingPhrase = (phrase: string) => {
    saveData({ ...data, copingPhrase: phrase });
  };

  // Simple 4-7-8 breathing timer
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(4);
  const phaseRef = useRef(0);
  const secondsRef = useRef(4);

  const startBreathing = useCallback(() => {
    phaseRef.current = 0;
    secondsRef.current = BREATH_PHASES[0].seconds;
    setBreathPhase(BREATH_PHASES[0].phase);
    setBreathCount(BREATH_PHASES[0].seconds);
    setBreathingActive(true);
  }, []);

  useEffect(() => {
    if (!breathingActive) return;

    const interval = setInterval(() => {
      secondsRef.current--;
      if (secondsRef.current <= 0) {
        phaseRef.current = (phaseRef.current + 1) % BREATH_PHASES.length;
        secondsRef.current = BREATH_PHASES[phaseRef.current].seconds;
        setBreathPhase(BREATH_PHASES[phaseRef.current].phase);
      }
      setBreathCount(secondsRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, [breathingActive]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: AnimationSpeeds.fluid }}
      className="fixed inset-0 bg-ink text-paper z-50 overflow-y-auto"
    >
      <div className="max-w-lg mx-auto px-6 py-10 flex flex-col gap-10">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-paper/40 mb-2">Safety Protocol</div>
            <h1 className="font-serif text-3xl">You are not alone.</h1>
          </div>
          <button onClick={onClose} className="text-paper/40 hover:text-paper transition-colors duration-200">
            <X size={20} />
          </button>
        </div>

        {/* Coping Phrase */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-paper/40">
            <Heart size={14} />
            <span className="font-mono text-[10px] uppercase tracking-widest">Your Coping Phrase</span>
          </div>
          {isEditing ? (
            <textarea
              value={data.copingPhrase}
              onChange={e => updateCopingPhrase(e.target.value)}
              onBlur={() => setIsEditing(false)}
              autoFocus
              placeholder="Write something that grounds you..."
              rows={3}
              className="bg-paper/5 border border-paper/10 rounded-2xl p-4 text-paper font-serif italic text-lg outline-none placeholder:text-paper/20 resize-none"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-left p-4 border border-paper/10 rounded-2xl hover:border-paper/20 transition-colors duration-200"
            >
              <p className="font-serif italic text-lg leading-relaxed">
                {data.copingPhrase || 'Tap to write your coping phrase...'}
              </p>
            </button>
          )}
        </div>

        {/* Personal Contacts */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-paper/40">
            <Phone size={14} />
            <span className="font-mono text-[10px] uppercase tracking-widest">Emergency Contacts</span>
          </div>

          {data.contacts.map(contact => (
            <div key={contact.id} className="flex items-center justify-between p-4 border border-paper/10 rounded-2xl">
              <div>
                <div className="font-serif">{contact.name}</div>
                <a href={`tel:${contact.phone}`} className="text-paper/60 text-sm font-mono">{contact.phone}</a>
              </div>
              <div className="flex gap-2">
                <EditorialButton
                  onClick={() => window.location.href = `tel:${contact.phone}`}
                  size="sm"
                  variant="ink"
                >
                  Call
                </EditorialButton>
                <button
                  onClick={() => removeContact(contact.id)}
                  className="text-paper/30 hover:text-red-400 transition-colors duration-200"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Add contact form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Name"
              className="flex-1 bg-transparent border-b border-paper/20 focus:border-paper/50 py-2 text-sm font-serif text-paper placeholder:text-paper/20 outline-none transition-colors duration-200"
            />
            <input
              type="tel"
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              placeholder="Phone"
              className="flex-1 bg-transparent border-b border-paper/20 focus:border-paper/50 py-2 text-sm font-mono text-paper placeholder:text-paper/20 outline-none transition-colors duration-200"
            />
            <button
              onClick={addContact}
              disabled={!newName.trim() || !newPhone.trim()}
              className="text-paper/40 hover:text-paper disabled:opacity-20 transition-all duration-200"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Crisis Hotlines */}
        <div className="flex flex-col gap-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-paper/40">Crisis Hotlines</div>
          {HOTLINES.map(hotline => (
            <div key={hotline.name} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-lg">{hotline.country}</span>
                <span className="text-sm text-paper/70">{hotline.name}</span>
              </div>
              {hotline.number ? (
                <a href={`tel:${hotline.number}`} className="font-mono text-sm text-paper/90 hover:text-paper">
                  {hotline.number}
                </a>
              ) : (
                <a href={hotline.url} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-paper/90 hover:text-paper underline">
                  Visit
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Breathing Exercise */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-paper/40">
            <Wind size={14} />
            <span className="font-mono text-[10px] uppercase tracking-widest">Breathing Exercise (4-7-8)</span>
          </div>
          {breathingActive ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-8 border border-paper/10 rounded-2xl"
            >
              <motion.div
                animate={{
                  scale: breathPhase === 'inhale' ? 1.3 : breathPhase === 'exhale' ? 0.8 : 1.1,
                }}
                transition={{ duration: 1, ease: EasingCurves.editorial }}
                className="w-24 h-24 rounded-full border-2 border-paper/30 flex items-center justify-center"
              >
                <span className="font-mono text-3xl">{breathCount}</span>
              </motion.div>
              <span className="font-serif italic text-paper/60 capitalize">{breathPhase}</span>
              <button
                onClick={() => setBreathingActive(false)}
                className="text-paper/30 text-xs font-mono hover:text-paper/60 transition-colors duration-200 mt-2"
              >
                Stop
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-2">
              <EditorialButton
                onClick={startBreathing}
                variant="outline"
                className="w-full py-6 border-paper/10 text-paper hover:bg-paper/5"
              >
                Start Breathing Exercise
              </EditorialButton>
              {isUnlocked && onNavigate && (
                <button
                  onClick={() => onNavigate('breathing')}
                  className="flex items-center justify-center gap-2 py-3 text-paper/40 hover:text-paper transition-colors duration-200 text-xs font-mono uppercase tracking-widest"
                >
                  Open Full Breathing View
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
