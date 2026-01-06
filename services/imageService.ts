
import { GoogleGenAI } from "@google/genai";
import { Portrait, PortraitRequest } from "../types";

// Portrait style presets based on the simulation's aesthetic
const STYLE_PRESETS = {
  base: "cinematic portrait photography, shallow depth of field, moody lighting, film grain, 35mm aesthetic, psychological intensity",
  
  quadrant: {
    Q1: "warm golden hour lighting, intimate atmosphere, soft focus background",
    Q2: "cold blue tones, clinical lighting, sterile environment, distant",
    Q3: "desaturated colors, grey overcast, flat lighting, emptiness",
    Q4: "harsh red and orange tones, high contrast, dramatic shadows, tension"
  },
  
  temperament: {
    Ascetic: "minimalist composition, controlled posture, precise grooming, architectural background",
    Wraith: "ethereal soft focus, pale skin, dark clothing, liminal spaces",
    Cynic: "sharp focus on eyes, guarded expression, urban environment, leather or denim",
    Manic: "dynamic composition, slight motion blur, vibrant but chaotic, expressive hands"
  },
  
  mood: {
    ACTING: "intense direct gaze, forward leaning, active hands",
    WATCHING: "sidelong glance, partially obscured, observing from threshold",
    DORMANT: "eyes downcast or closed, self-contained, withdrawn into shadow"
  }
};

export class PortraitService {
  private cache: Map<string, Portrait> = new Map();
  
  constructor() {}

  /**
   * Build a rich prompt from character data
   */
  private buildPrompt(request: PortraitRequest): string {
    const parts: string[] = [];
    parts.push(STYLE_PRESETS.base);
    
    // Fallback if physical description is missing
    const charName = request.name || "A mysterious character";
    const desc = request.physicalDescription || `${charName} with a ${request.temperament || 'complex'} aura`;
    parts.push(`Subject: ${desc}`);
    
    if (request.temperament && STYLE_PRESETS.temperament[request.temperament as keyof typeof STYLE_PRESETS.temperament]) {
      parts.push(STYLE_PRESETS.temperament[request.temperament as keyof typeof STYLE_PRESETS.temperament]);
    }
    
    if (request.currentQuadrant && STYLE_PRESETS.quadrant[request.currentQuadrant]) {
      parts.push(STYLE_PRESETS.quadrant[request.currentQuadrant]);
    }
    
    if (request.status && STYLE_PRESETS.mood[request.status]) {
      parts.push(STYLE_PRESETS.mood[request.status]);
    }
    
    if (request.era) parts.push(`${request.era} period detail`);
    
    if (request.wound) {
      const woundExpressions: Record<string, string> = {
        'Erasure': 'searching eyes, as if seeking recognition',
        'Abandonment': 'guarded posture, ready to flee',
        'Objectification': 'performative beauty, mask-like composure',
        'Betrayal': 'watchful jaw, distrustful gaze',
        'Suffocation': 'constrained neck tension',
        'Invisibility': 'fading edges, soft focus'
      };
      const woundKey = Object.keys(woundExpressions).find(w => 
        request.wound?.toLowerCase().includes(w.toLowerCase())
      );
      if (woundKey) parts.push(woundExpressions[woundKey]);
    }
    
    if (request.role === 'REB') {
      parts.push("magnetic, cinematic presence, high charisma");
    } else if (request.role === 'PC') {
      parts.push("observational perspective, nuanced expression");
    }
    
    parts.push("tasteful, non-explicit");
    return parts.join(", ");
  }

  async generatePortrait(request: PortraitRequest): Promise<Portrait | null> {
    const cacheKey = `${request.name || 'default'}-${request.currentQuadrant || 'default'}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.generatedAt < 1000 * 60 * 30) return cached;
    
    const prompt = this.buildPrompt(request);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ parts: [{ text: `Generate a character portrait for a narrative engine: ${prompt}` }] }],
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      
      let base64Data: string | undefined;
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            base64Data = part.inlineData.data;
            break;
          }
        }
      }
      
      if (!base64Data) return null;
      
      const portrait: Portrait = {
        id: Math.random().toString(36).substr(2, 9),
        characterName: request.name || "Unnamed",
        base64Data,
        generatedAt: Date.now(),
        quadrantAtGeneration: request.currentQuadrant || 'unknown',
        prompt
      };
      
      this.cache.set(cacheKey, portrait);
      return portrait;
    } catch (error) {
      console.error("Portrait generation failed:", error);
      return null;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const portraitService = new PortraitService();
