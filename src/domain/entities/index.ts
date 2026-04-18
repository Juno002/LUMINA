/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ThoughtEntry {
  id: string;
  date: string;
  situation: string;
  primaryEmotion: string;
  intensity: number;
  automaticThought: string;
  distortions: string[];
  rationalResponse: string;
  outcomeMood: string;
  outcomeIntensity: number;
  tags: string[];
}

export type CognitiveDistortion = 
  | 'all_or_nothing'
  | 'overgeneralization'
  | 'mental_filter'
  | 'discounting_positives'
  | 'jumping_to_conclusions'
  | 'magnification'
  | 'emotional_reasoning'
  | 'should_statements'
  | 'labeling'
  | 'personalization';

export interface FearItem {
  id: string;
  text: string;
  sud: number; // Subjective Units of Distress (0-100)
}

export interface ExposureLog {
  id: string;
  fearItemId: string;
  date: string;
  preSud: number;
  postSud: number;
  duration: number; // minutes
  notes: string;
}

export interface ActivationActivity {
  id: string;
  title: string;
  value: number; // Importance/Joy (0-10)
  difficulty: number;
  plannedDate: string;
  completed: boolean;
  subtasks: string[];
}

export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  isSmart: boolean;
  recurrence: RecurrencePattern;
  lastCompletedDate?: string;
}

export interface MoodEntry {
  id: string;
  date: string;
  mood: string;
  intensity: number;
  note: string;
}

export interface wellness {
  gratitudeEntries: { id: string; text: string; date: string }[];
  moodEntries: MoodEntry[];
}

export interface SleepEntry {
  id: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  quality: number;
  efficiency: number;
}

export interface UserProfile {
  name: string;
  initialized: boolean;
  avatarSeed?: string;
}

export interface ExposureData {
  hierarchy: FearItem[];
  logs: ExposureLog[];
}

export interface Vault {
  profile: UserProfile;
  createdAt: string;
  journal: ThoughtEntry[];
  exposure: ExposureData;
  activations: ActivationActivity[];
  goals: Goal[];
  sleep: SleepEntry[];
  wellness: wellness;
  identity?: string; // Fingerprint
}
