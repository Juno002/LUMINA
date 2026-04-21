/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Plus, Search } from 'lucide-react';
import { ClinicalProfile, ThoughtEntry, Vault } from '../../domain/entities';
import { triggerHaptic } from '../../shared/utils/Haptics';
import EntryCard from '../components/domain/journal/EntryCard';
import JournalForm from '../components/domain/journal/JournalForm';
import { 
  ConfirmActionModal,
  EditorialButton
} from '../components/shared';
import { useTranslation } from '../../application/contexts/LanguageContext';

interface JournalViewProps {
  entries: ThoughtEntry[];
  onUpdate: (e: ThoughtEntry[]) => void;
  clinicalProfile?: ClinicalProfile;
}

export default function JournalView({ entries, onUpdate, clinicalProfile }: JournalViewProps) {
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingEntry, setEditingEntry] = useState<ThoughtEntry | null>(null);
  const [entryToDeleteId, setEntryToDeleteId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => entries.filter(e => 
    e.situation?.toLowerCase().includes(search.toLowerCase()) ||
    e.automaticThought?.toLowerCase().includes(search.toLowerCase())
  ), [entries, search]);

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

  const handleDelete = () => {
    if (!entryToDeleteId) return;
    triggerHaptic('heavy');
    onUpdate(entries.filter(e => e.id !== entryToDeleteId));
    setEntryToDeleteId(null);
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">{t('journal.breadcrumb')}</div>
          <h2 className="font-serif text-3xl md:text-4xl">{t('journal.title')}.</h2>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <EditorialButton 
            onClick={() => { setEditingEntry(null); setIsFormOpen(true); }}
            icon={<Plus size={14} />}
          >
            {t('journal.new_entry')}
          </EditorialButton>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-accent opacity-30 group-focus-within:opacity-100 transition-opacity" size={14} />
        <input 
          type="text"
          placeholder={t('journal.search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-b border-ink/5 focus:border-ink rounded-none py-4 pl-6 pr-4 transition-all outline-none text-sm italic font-serif"
        />
      </div>

      <AnimatePresence mode="wait">
        {isFormOpen ? (
          <JournalForm 
            clinicalProfile={clinicalProfile}
            initialData={editingEntry || undefined}
            onCancel={() => { setIsFormOpen(false); setEditingEntry(null); }} 
            onSave={handleSave} 
            vault={{ habits: [], habitLogs: [], journal: entries, profile: { clinicalProfile } } as Vault}
          />
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            {filteredEntries.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-4 border-2 border-dashed border-ink/5 rounded-3xl">
                <BookOpen className="opacity-10" size={40} strokeWidth={1} />
                <p className="editorial-meta">{t('journal.empty_state')}</p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry} 
                  onDelete={() => setEntryToDeleteId(entry.id)} 
                  onEdit={() => { setEditingEntry(entry); setIsFormOpen(true); }}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmActionModal
        isOpen={!!entryToDeleteId}
        onClose={() => setEntryToDeleteId(null)}
        onConfirm={handleDelete}
        title={t('journal.delete_title')}
        description={t('journal.delete_description')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
