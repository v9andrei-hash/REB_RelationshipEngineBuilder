
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
  
  constructor() {
    // Fresh instances should be created at call time
  }

  /**
   * Build a rich prompt from character data
   */
  private buildPrompt(request: PortraitRequest): string {
    const parts: string[] = [];
    
    // Base style
    parts.push(STYLE_PRESETS.base);
    
    // Physical description (from wizard or literary preset)
    if (request.physicalDescription) {
      parts.push(`Subject: ${request.physicalDescription}`);
    }
    
    // Temperament styling
    if (request.temperament && STYLE_PRESETS.temperament[request.temperament as keyof typeof STYLE_PRESETS.temperament]) {
      parts.push(STYLE_PRESETS.temperament[request.temperament as keyof typeof STYLE_PRESETS.temperament]);
    }
    
    // Quadrant mood lighting
    if (request.currentQuadrant && STYLE_PRESETS.quadrant[request.currentQuadrant]) {
      parts.push(STYLE_PRESETS.quadrant[request.currentQuadrant]);
    }
    
    // NPC status affects pose/gaze
    if (request.status && STYLE_PRESETS.mood[request.status]) {
      parts.push(STYLE_PRESETS.mood[request.status]);
    }
    
    // Era-specific styling
    if (request.era) {
      parts.push(`${request.era} period-appropriate clothing and setting`);
    }
    
    // Wound influences expression (subtle psychological tell)
    if (request.wound) {
      const woundExpressions: Record<string, string> = {
        'Erasure': 'searching eyes, as if seeking recognition',
        'Abandonment': 'guarded posture, ready to flee',
        'Objectification': 'performative beauty, mask-like composure',
        'Betrayal': 'watchful, trust withheld in the set of the jaw',
        'Suffocation': 'constrained, tension in shoulders and neck',
        'Invisibility': 'fading into background, soft edges'
      };
      const woundKey = Object.keys(woundExpressions).find(w => 
        request.wound?.toLowerCase().includes(w.toLowerCase())
      );
      if (woundKey) {
        parts.push(woundExpressions[woundKey]);
      }
    }
    
    // Role-specific framing
    if (request.role === 'REB') {
      parts.push("protagonist energy, magnetic presence, the one you can't look away from");
    } else if (request.role === 'PC') {
      parts.push("observer perspective, slight distance, witnessing");
    } else {
      parts.push("supporting character, defined relationship to unseen other");
    }
    
    // Safety: no explicit content
    parts.push("tasteful, non-explicit, suitable for general audiences");
    
    return parts.join(", ");
  }

  /**
   * Generate a portrait using Gemini's image generation
   */
  async generatePortrait(request: PortraitRequest): Promise<Portrait | null> {
    const cacheKey = `${request.name}-${request.currentQuadrant || 'default'}`;
    
    // Check cache first (avoid regenerating unchanged characters)
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.generatedAt < 1000 * 60 * 30) {
      // Cache valid for 30 minutes
      return cached;
    }
    
    const prompt = this.buildPrompt(request);
    
    try {
      // Create new instance right before call as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ 
          parts: [{ text: `Generate a character portrait for a psychological thriller: ${prompt}` }] 
        }],
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });
      
      // Safety iteration through parts to find the image data
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
      
      if (!base64Data) {
        console.error("No image data in response candidate parts");
        return null;
      }
      
      const portrait: Portrait = {
        id: Math.random().toString(36).substr(2, 9),
        characterName: request.name,
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

  /**
   * Generate a mood-shifted variant (when quadrant changes significantly)
   */
  async regenerateForMoodShift(
    existing: Portrait, 
    newQuadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    characterData: PortraitRequest
  ): Promise<Portrait | null> {
    if (existing.quadrantAtGeneration === newQuadrant) {
      return existing;
    }
    
    return this.generatePortrait({
      ...characterData,
      currentQuadrant: newQuadrant
    });
  }

  /**
   * Build prompt for literary preset (has rich canonical description)
   */
  buildLiteraryPresetPrompt(presetName: string, era: string): PortraitRequest {
    const presets: Record<string, Partial<PortraitRequest>> = {
      'Erika Kohut': {
        physicalDescription: "Late 30s woman, pale, austere, dark hair in severe style, professional piano instructor",
        temperament: 'Ascetic',
        wound: 'Erasure',
        era: '1980s Vienna'
      },
      'Catherine Earnshaw': {
        physicalDescription: "Young woman, wild dark hair, fierce energetic beauty, Yorkshire moors",
        temperament: 'Manic',
        wound: 'Suffocation',
        era: '19th century Yorkshire'
      },
      'Anna Karenina': {
        physicalDescription: "Elegant aristocratic woman, dark curls, luminous eyes, expensive restrained dress",
        temperament: 'Wraith',
        wound: 'Objectification',
        era: '1870s Russia'
      },
      'Amy Dunne': {
        physicalDescription: "Blonde woman, 30s, conventionally beautiful, cool blue eyes, perfect composure",
        temperament: 'Cynic',
        wound: 'Erasure',
        era: 'Contemporary America'
      },
      'O': {
        physicalDescription: "Young woman, dark hair, porcelain skin, elegant submissive bearing",
        temperament: 'Ascetic',
        wound: 'Objectification',
        era: '1950s Paris'
      },
      'Héloïse': {
        physicalDescription: "Medieval woman, modest veil, intelligent eyes, scholarly nun",
        temperament: 'Ascetic',
        wound: 'Suffocation',
        era: '12th century France'
      }
    };
    
    const preset = presets[presetName];
    if (!preset) {
      return { name: presetName, role: 'REB', era };
    }
    
    return {
      name: presetName,
      role: 'REB',
      ...preset,
      era: era || preset.era
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const portraitService = new PortraitService();
