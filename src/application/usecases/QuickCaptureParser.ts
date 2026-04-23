/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuickCaptureIntent = 'intention' | 'habit' | 'goal' | 'journal';

export interface ParsedQuickCapture {
  type: QuickCaptureIntent;
  cleanText: string;
}

export interface QuickCapturePayload extends ParsedQuickCapture {
  notes?: string;
  tags?: string[];
}

const GOAL_PREFIX_RE = /^(meta|objetivo|goal|objective)\s*:/i;

export function parseQuickCapture(input: string): ParsedQuickCapture {
  const text = input.trim();

  if (!text) {
    return { type: 'intention', cleanText: '' };
  }

  if (text.startsWith('>')) {
    return {
      type: 'journal',
      cleanText: text.slice(1).trim()
    };
  }

  if (text.startsWith('*')) {
    return {
      type: 'habit',
      cleanText: text.slice(1).trim()
    };
  }

  const goalMatch = text.match(GOAL_PREFIX_RE);
  if (goalMatch) {
    return {
      type: 'goal',
      cleanText: text.slice(goalMatch[0].length).trim()
    };
  }

  return {
    type: 'intention',
    cleanText: text
  };
}

export function parseTagInput(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}
