/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ThoughtEntry {
  id: string;
  date: string;
  level: 1 | 2 | 3; // CBT Level
  
  // L1 — Observation
  situation: string;
  primaryEmotion: string;
  intensity: number; // 1-10
  automaticThought: string;
  
  // L2 — Displacement
  friendResponse?: string;
  creativeLink?: string;
  
  // L3 — Restructuring
  evidenceFor?: string;
  evidenceAgainst?: string;
  originalIntensity?: number; // Initial credibility
  finalCredibility?: number; // Final credibility
  rationalResponse: string;
  
  // Metadata
  distortions: string[];
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
  preSud: number;                     // 0-100 (SUDS before)
  postSud: number;                    // 0-100 (SUDS after)
  duration: number;                   // minutes
  notes: string;
  // NEW: ERP Phase 2 fields
  catastrophicPrediction?: string;    // "I think I will faint"
  realOutcome?: string;               // "I felt anxious but nothing happened"
  safetyBehaviorsAvoided?: string;    // "I didn't check my phone for reassurance"
}

export interface ActivationActivity {
  id: string;
  title: string;
  value: number; // Importance/Joy (0-10)
  difficulty: number;
  plannedDate: string;
  completed: boolean;
  subtasks: string[];
  linkedHabitId?: string;
  linkedGoalId?: string;
  completedAt?: string; // ISO timestamp
  completedDate?: string; // YYYY-MM-DD for daily filtering
}

export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  isSmart: boolean;
  recurrence: RecurrencePattern;
  lastCompletedDate?: string;
  // NEW Phase 7 fields
  measurement?: string;          // "Read 20 books this year"
  progress: number;              // 0-100
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'overdue';
  milestones: Milestone[];       // Sub-goals
  linkedJournalEntryId?: string; // Link to a CBT journal entry
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
  bedTime: string;              // HH:mm
  wakeTime: string;             // HH:mm
  quality: number;              // 1-5 stars (clinical standard)
  // NEW: CBT-I fields
  latencyMin: number;           // Minutes to fall asleep
  awakenings: number;           // Number of times woken up
  awakeMinutes: number;         // Total minutes awake during the night
  notes?: string;
  // Calculated (filled automatically on save)
  timeInBedMin: number;         // Total minutes from bedTime to wakeTime
  timeAsleepMin: number;        // timeInBedMin - latencyMin - awakeMinutes
  sleepEfficiencyPct: number;   // (timeAsleepMin / timeInBedMin) * 100
}

export type ClinicalProfile = 'anxiety' | 'depression' | 'anger' | 'unspecified';

export interface CrisisContact {
  id: string;
  name: string;
  phone: string;
}

export interface CrisisConfig {
  copingPhrase: string;
  contacts: CrisisContact[];
}

export interface UserProfile {
  name: string;
  initialized: boolean;
  avatarSeed?: string;
  clinicalProfile?: ClinicalProfile;
  crisisConfig?: CrisisConfig;
  autoLockMinutes?: number; // 1, 3, 5, 10, 30
  soundEnabled?: boolean; // NEW: Audio feedback preference
  theme?: 'default' | 'night' | 'ink-deep'; // NEW: Visual theme preference
}

// --- Habits ---
export type HabitType = 'yesno' | 'numeric' | 'timer';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  type: HabitType;
  targetValue?: number; // For numeric: target count. For timer: target seconds.
  unit?: string; // "glasses", "minutes", "pages"
  frequency: 'daily' | 'weekly';
  color?: string; // Hex color for visual identity
  isActive: boolean;
  createdAt: string;
  archivedAt?: string;
  linkedGoalId?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number; // Actual value for numeric/timer habits
  note?: string;
  createdAt: string;
}

export interface DayClosure {
  id: string;
  date: string;         // YYYY-MM-DD
  summary: string;      // User reflection (one sentence)
  gratitude: string[];  // 3 things grateful for
  closedAt: string;     // ISO timestamp
}

// --- Gamification ---
export interface UserStats {
  discipline: { exp: number; level: number };
  consistency: { exp: number; level: number };
  totalExp: number;
  level: number;
  currentStreak: number; // Consecutive days with all habits completed
  longestStreak: number;
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
  habits: Habit[]; 
  habitLogs: HabitLog[]; 
  stats: UserStats; 
  closedDays: DayClosure[];
  identity?: string; // Fingerprint
}
