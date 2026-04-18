export type ForgingIntent = 'task' | 'habit' | 'goal' | 'journal';

export interface ParsedIntent {
  type: ForgingIntent;
  cleanText: string;
}

export function parseIntent(input: string): ParsedIntent {
  const text = input.trim();
  
  // Reflexión / Journaling
  if (text.startsWith('>')) {
    return {
      type: 'journal',
      cleanText: text.substring(1).trim()
    };
  }
  
  // Objetivo / Meta
  if (text.toLowerCase().startsWith('meta:') || text.toLowerCase().startsWith('objetivo:')) {
    const splitIndex = text.indexOf(':') + 1;
    return {
      type: 'goal',
      cleanText: text.substring(splitIndex).trim()
    };
  }

  // Hábito / Recurring
  if (text.startsWith('* ')) {
    return {
      type: 'habit',
      cleanText: text.substring(2).trim()
    };
  }

  // Fallback: Tarea Regular
  return {
    type: 'task',
    cleanText: text
  };
}
