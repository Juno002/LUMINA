/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface JournalInsight {
  commonDistortions: string[];
  summary: string;
  reframingTip: string;
}

export interface IAIAnalysisService {
  analyzeJournalEntries(thoughts: string[]): Promise<JournalInsight | null>;
}
