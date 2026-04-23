/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, ReactNode } from 'react';
import {
  translations,
  Language,
  TranslationGroup,
  TranslationTree,
  TranslationValue
} from '../../shared/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
  tGroup: <T extends TranslationGroup = TranslationGroup>(path: string) => T;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const missingTranslationWarnings = new Set<string>();

function warnMissingTranslation(language: Language, path: string, reason: 'missing' | 'expected-string' | 'expected-group') {
  const warningKey = `${language}:${path}:${reason}`;
  if (missingTranslationWarnings.has(warningKey)) {
    return;
  }

  missingTranslationWarnings.add(warningKey);
  console.warn(`[i18n] ${reason} translation for "${path}" in language "${language}".`);
}

function resolveTranslationNode(language: Language, path: string): TranslationValue | undefined {
  const keys = path.split('.');
  let result: TranslationValue = translations[language] as TranslationTree;

  for (const key of keys) {
    if (typeof result === 'string') {
      return undefined;
    }

    if (!(key in result)) {
      return undefined;
    }

    result = result[key];
  }

  return result;
}

function humanizeMissingPath(path: string): string {
  const fallbackToken = path.split('.').filter(Boolean).pop() || path;
  return fallbackToken
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function LanguageProvider({
  children,
  language,
  onLanguageChange
}: {
  children: ReactNode,
  language: Language,
  onLanguageChange: (lang: Language) => void
}) {
  const t = (path: string): string => {
    const result = resolveTranslationNode(language, path);

    if (typeof result === 'string') {
      return result;
    }

    const englishFallback = language === 'en' ? undefined : resolveTranslationNode('en', path);
    if (typeof englishFallback === 'string') {
      warnMissingTranslation(language, path, result === undefined ? 'missing' : 'expected-string');
      return englishFallback;
    }

    warnMissingTranslation(language, path, result === undefined ? 'missing' : 'expected-string');
    return humanizeMissingPath(path);
  };

  const tGroup = <T extends TranslationGroup = TranslationGroup>(path: string): T => {
    const result = resolveTranslationNode(language, path);

    if (!result || typeof result === 'string') {
      warnMissingTranslation(language, path, result === undefined ? 'missing' : 'expected-group');
      return {} as T;
    }

    return result as T;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: onLanguageChange, t, tGroup }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
