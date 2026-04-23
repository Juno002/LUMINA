/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { parseQuickCapture, parseTagInput } from './QuickCaptureParser';

describe('parseQuickCapture', () => {
  it('parses default text as an intention', () => {
    expect(parseQuickCapture('Walk for ten minutes')).toEqual({
      type: 'intention',
      cleanText: 'Walk for ten minutes'
    });
  });

  it('parses star-prefixed text as a habit', () => {
    expect(parseQuickCapture('* hydrate')).toEqual({
      type: 'habit',
      cleanText: 'hydrate'
    });
  });

  it('parses Spanish and English goal prefixes', () => {
    expect(parseQuickCapture('Meta: write chapter one')).toEqual({
      type: 'goal',
      cleanText: 'write chapter one'
    });
    expect(parseQuickCapture('Objetivo: dormir antes de medianoche')).toEqual({
      type: 'goal',
      cleanText: 'dormir antes de medianoche'
    });
    expect(parseQuickCapture('goal: complete exposure')).toEqual({
      type: 'goal',
      cleanText: 'complete exposure'
    });
  });

  it('parses greater-than text as a journal draft', () => {
    expect(parseQuickCapture('> I feel tense before the call')).toEqual({
      type: 'journal',
      cleanText: 'I feel tense before the call'
    });
  });

  it('trims empty input safely', () => {
    expect(parseQuickCapture('   ')).toEqual({
      type: 'intention',
      cleanText: ''
    });
  });
});

describe('parseTagInput', () => {
  it('normalizes comma-separated tags', () => {
    expect(parseTagInput('work, focus,  health  ,')).toEqual(['work', 'focus', 'health']);
  });
});
