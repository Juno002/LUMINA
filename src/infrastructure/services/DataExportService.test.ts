/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { DataExportService } from './DataExportService';
import { Vault } from '../../domain/entities';

describe('DataExportService', () => {
  const mockVault: Vault = {
    profile: { name: 'Junior', initialized: true },
    createdAt: '2026-01-01',
    journal: [
      {
        id: '1',
        date: '2026-04-18',
        level: 3,
        situation: 'Work meeting',
        primaryEmotion: 'Anxiety',
        intensity: 8,
        automaticThought: 'I will fail',
        rationalResponse: 'I have prepared',
        distortions: ['magnification'],
        originalIntensity: 80,
        finalCredibility: 20,
        outcomeMood: 'Calm',
        outcomeIntensity: 3,
        tags: []
      }
    ],
    exposure: { hierarchy: [], logs: [] },
    activations: [],
    goals: [],
    sleep: [],
    wellness: { gratitudeEntries: [], moodEntries: [] },
    habits: [],
    habitLogs: [],
    stats: {
      discipline: { exp: 0, level: 1 },
      consistency: { exp: 0, level: 1 },
      totalExp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0
    },
    closedDays: []
  };

  it('generates a valid markdown report', () => {
    const report = DataExportService.exportMarkdownReport(mockVault);
    expect(report).toContain('# Lumina Clinical Report');
    expect(report).toContain('Junior');
    expect(report).toContain('magnification');
  });

  it('generates a valid CSV', () => {
    const csv = DataExportService.exportCSV(mockVault);
    expect(csv).toContain('date,emotion,intensity,level,distortions');
    expect(csv).toContain('2026-04-18,"Anxiety",8,3,"magnification",3');
  });

  it('handles empty vault gracefully', () => {
    const emptyVault: Vault = { ...mockVault, journal: [], goals: [] };
    const report = DataExportService.exportMarkdownReport(emptyVault);
    expect(report).toContain('No cognitive patterns detected yet');
  });
});
