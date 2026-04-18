/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { IAIAnalysisService, JournalInsight } from "../../domain/services/IAIAnalysisService";

export class GeminiAnalysisService implements IAIAnalysisService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async analyzeJournalEntries(thoughts: string[]): Promise<JournalInsight | null> {
    if (thoughts.length === 0) return null;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze these automatic thoughts for cognitive distortions (e.g., all-or-nothing, catastrophizing, etc.) and provide a compassionate summary. \n\nTHOUGHTS:\n${thoughts.join('\n')}`,
        config: {
          systemInstruction: "You are a world-class CBT (Cognitive Behavioral Therapy) specialist. Your tone is academic yet compassionate, like a high-end mental health journal. Analyze the user's thoughts and provide structured feedback in JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              commonDistortions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of identified cognitive distortions."
              },
              summary: {
                type: Type.STRING,
                description: "A 2-3 sentence overview of the psychological patterns."
              },
              reframingTip: {
                type: Type.STRING,
                description: "A specific, actionable tip for rational reframing."
              }
            },
            required: ["commonDistortions", "summary", "reframingTip"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      return result as JournalInsight;
    } catch (error) {
      console.error("Gemini Analysis failed:", error);
      return null;
    }
  }
}

export const aiAnalysisService = new GeminiAnalysisService();
