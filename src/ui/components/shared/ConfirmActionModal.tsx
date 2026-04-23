/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { EditorialModal } from './EditorialModal';
import { EditorialButton } from './EditorialButton';
import { useTranslation } from '../../../application/contexts/LanguageContext';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'default' | 'danger';
  isBusy?: boolean;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  isBusy = false
}) => {
  const { t } = useTranslation();

  return (
    <EditorialModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={t('common.confirmation')}
      maxWidth="sm"
      closeLabel={t('common.close')}
    >
      <div className="flex flex-col gap-8">
        <div className="flex items-start gap-4 rounded-[2rem] border border-ink/5 bg-ink/[0.02] p-6">
          <AlertTriangle
            size={18}
            className={tone === 'danger' ? 'text-red-500' : 'text-amber-500'}
          />
          <p className="text-sm font-serif italic leading-relaxed text-accent">
            {description}
          </p>
        </div>

        <div className="flex justify-between items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="editorial-meta text-accent hover:text-ink transition-colors"
            disabled={isBusy}
          >
            {cancelLabel}
          </button>
          <EditorialButton
            type="button"
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={isBusy}
          >
            {confirmLabel}
          </EditorialButton>
        </div>
      </div>
    </EditorialModal>
  );
};
