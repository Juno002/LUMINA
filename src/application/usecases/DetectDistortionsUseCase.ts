/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { COGNITIVE_DISTORTIONS, PROFILE_DISTORTION_PRIORITY, CognitiveDistortionDef } from '../../domain/constants/Distortions';
import { ClinicalProfile } from '../../domain/entities';

/**
 * Pattern matching engine for cognitive distortions.
 * Uses keywords to identify potential thinking errors in automatic thoughts.
 * Results are prioritized based on the user's clinical profile.
 */
export function detectDistortions(text: string, clinicalProfile?: ClinicalProfile): CognitiveDistortionDef[] {
  if (!text || text.trim().length < 5) return [];

  const lowerText = text.toLowerCase();
  const detected: CognitiveDistortionDef[] = [];
  const ids = new Set<string>();

  // Check against all definitions
  for (const distortion of COGNITIVE_DISTORTIONS) {
    for (const keyword of distortion.keywords) {
      if (lowerText.includes(keyword.toLowerCase()) && !ids.has(distortion.id)) {
        detected.push(distortion);
        ids.add(distortion.id);
        break; // Found one keyword, move to next distortion
      }
    }
  }

  // Sort by clinical relevance if profile is known
  if (clinicalProfile && clinicalProfile !== 'unspecified') {
    const priority = PROFILE_DISTORTION_PRIORITY[clinicalProfile] || [];
    detected.sort((a, b) => {
      const aIdx = priority.indexOf(a.id);
      const bIdx = priority.indexOf(b.id);
      
      // If both are in priority list, sort by list order
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      
      // If only one is in priority list, it comes first
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      
      // Otherwise keep current order
      return 0;
    });
  }

  return detected;
}
