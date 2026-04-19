import { describe, it, expect } from 'vitest';
import { detectDistortions } from './DetectDistortionsUseCase';

describe('DetectDistortionsUseCase', () => {
  it('detects simple keywords', () => {
    const text = "I should have known better, I am a total failure.";
    const detected = detectDistortions(text);
    const ids = detected.map(d => d.id);
    
    expect(ids).toContain('should_statements'); // "should"
    expect(ids).toContain('labeling'); // "failure"
  });

  it('detects multiple distortions in complex text', () => {
    const text = "This always happens to me because I am totally incompetent. They must think I am an idiot.";
    const detected = detectDistortions(text);
    const ids = detected.map(d => d.id);
    
    expect(ids).toContain('overgeneralization'); // "always"
    expect(ids).toContain('labeling'); // "idiot"
    expect(ids).toContain('jumping_to_conclusions'); // "must think"
  });

  it('prioritizes based on clinical profile', () => {
    const text = "I should probably not go because it might be a disaster and I feel like a loser.";
    // Keywords: should (should_statements), disaster (magnification), feel like (emotional_reasoning), loser (labeling)
    
    // For anxiety: magnification and emotional_reasoning are priority
    const detectedAnxiety = detectDistortions(text, 'anxiety');
    expect(detectedAnxiety[0].id).toBe('magnification');
    
    // For depression: should_statements and labeling are higher
    const detectedDepression = detectDistortions(text, 'depression');
    expect(detectedDepression[0].id).toBe('should_statements');
  });

  it('returns empty array for empty or short text', () => {
    expect(detectDistortions("")).toEqual([]);
    expect(detectDistortions("hi")).toEqual([]);
  });
});
