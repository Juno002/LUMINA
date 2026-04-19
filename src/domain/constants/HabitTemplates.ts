/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HabitType } from '../entities';

export interface HabitTemplate {
  id: string;
  name: string;
  type: HabitType;
  targetValue?: number;
  unit?: string;
  frequency: 'daily' | 'weekly';
  description: string;
  category: 'mind' | 'body' | 'focus';
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // Mind / Clinical CBT
  {
    id: 'tpl_meditation',
    name: 'Meditate',
    type: 'timer',
    targetValue: 600, // 10 minutes in seconds
    unit: 'seconds',
    frequency: 'daily',
    description: '10 minutes of mindfulness or breathing to lower baseline anxiety.',
    category: 'mind'
  },
  {
    id: 'tpl_gratitude',
    name: 'Gratitude Log',
    type: 'yesno',
    frequency: 'daily',
    description: 'Write down 3 things you are grateful for today.',
    category: 'mind'
  },
  {
    id: 'tpl_journal',
    name: 'CBT Journal',
    type: 'yesno',
    frequency: 'daily',
    description: 'Complete at least one Level 1 cognitive journal entry.',
    category: 'mind'
  },
  
  // Body / Physiology
  {
    id: 'tpl_water',
    name: 'Hydration',
    type: 'numeric',
    targetValue: 8,
    unit: 'glasses',
    frequency: 'daily',
    description: 'Drink 8 glasses of water to maintain cognitive clarity.',
    category: 'body'
  },
  {
    id: 'tpl_sleep_hygiene',
    name: 'No Screens Before Bed',
    type: 'yesno',
    frequency: 'daily',
    description: 'Avoid screens for 60 minutes before sleeping (CBT-I).',
    category: 'body'
  },
  {
    id: 'tpl_exercise',
    name: 'Physical Activity',
    type: 'numeric',
    targetValue: 30,
    unit: 'minutes',
    frequency: 'daily',
    description: 'Engage in moderate physical activity to metabolize cortisol.',
    category: 'body'
  },

  // Focus / Momentum
  {
    id: 'tpl_deep_work',
    name: 'Deep Work',
    type: 'timer',
    targetValue: 3600, // 60 mins
    unit: 'seconds',
    frequency: 'daily',
    description: 'Uninterrupted focus session on a high-leverage task.',
    category: 'focus'
  },
  {
    id: 'tpl_reading',
    name: 'Reading',
    type: 'numeric',
    targetValue: 15,
    unit: 'pages',
    frequency: 'daily',
    description: 'Read a non-fiction book to expand mental models.',
    category: 'focus'
  }
];
