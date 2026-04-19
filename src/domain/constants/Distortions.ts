/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CognitiveDistortionDef {
  id: string;
  name: string;           // "All-or-Nothing Thinking"
  description: string;
  example: string;
  keywords: string[];     // ["always", "never", "everything", "nothing", "completely"]
}

export const COGNITIVE_DISTORTIONS: CognitiveDistortionDef[] = [
  {
    id: 'all_or_nothing',
    name: 'All-or-Nothing Thinking',
    description: 'Seeing things in black-or-white categories.',
    example: '"If I don\'t do this perfectly, I\'m a total failure."',
    keywords: ['always', 'never', 'everything', 'nothing', 'completely', 'totally', 'perfect', 'ruined']
  },
  {
    id: 'overgeneralization',
    name: 'Overgeneralization',
    description: 'Viewing a single negative event as a never-ending pattern.',
    example: '"This always happens to me."',
    keywords: ['always', 'everybody', 'nobody', 'every time', 'everyone']
  },
  {
    id: 'mental_filter',
    name: 'Mental Filter',
    description: 'Dwelling on negatives while ignoring positives.',
    example: '"The whole day was ruined because of that one mistake."',
    keywords: ['only', 'ruined', 'terrible', 'horrible', 'worst']
  },
  {
    id: 'discounting_positives',
    name: 'Discounting the Positive',
    description: 'Insisting positive experiences don\'t count.',
    example: '"That doesn\'t count, anyone could have done that."',
    keywords: ['doesn\'t count', 'but', 'just lucky', 'anyone could', 'not a big deal']
  },
  {
    id: 'jumping_to_conclusions',
    name: 'Jumping to Conclusions',
    description: 'Making negative interpretations without definite facts.',
    example: '"They must think I\'m stupid."',
    keywords: ['must think', 'probably', 'i know they', 'i bet', 'they think']
  },
  {
    id: 'magnification',
    name: 'Magnification / Catastrophizing',
    description: 'Blowing things out of proportion.',
    example: '"This is the worst thing that could ever happen."',
    keywords: ['worst', 'catastrophe', 'disaster', 'unbearable', 'can\'t stand', 'end of the world']
  },
  {
    id: 'emotional_reasoning',
    name: 'Emotional Reasoning',
    description: 'Assuming negative emotions reflect reality.',
    example: '"I feel like a failure, therefore I must be one."',
    keywords: ['i feel like', 'i feel that', 'feels like', 'must be']
  },
  {
    id: 'should_statements',
    name: 'Should Statements',
    description: 'Criticizing yourself or others with "shoulds" and "musts".',
    example: '"I should have known better."',
    keywords: ['should', 'must', 'have to', 'ought to', 'supposed to']
  },
  {
    id: 'labeling',
    name: 'Labeling',
    description: 'Attaching a fixed label to yourself or others.',
    example: '"I\'m a loser." / "He\'s a jerk."',
    keywords: ['i\'m a', 'he\'s a', 'she\'s a', 'they\'re', 'loser', 'idiot', 'failure', 'worthless']
  },
  {
    id: 'personalization',
    name: 'Personalization',
    description: 'Blaming yourself for something that wasn\'t your fault.',
    example: '"It\'s all my fault that the project failed."',
    keywords: ['my fault', 'because of me', 'i caused', 'i\'m to blame', 'if only i']
  }
];

// Distortions prioritized by clinical profile
export const PROFILE_DISTORTION_PRIORITY: Record<string, string[]> = {
  anxiety: ['magnification', 'jumping_to_conclusions', 'emotional_reasoning'],
  depression: ['mental_filter', 'overgeneralization', 'personalization', 'should_statements'],
  anger: ['personalization', 'labeling', 'should_statements'],
  unspecified: []
};
