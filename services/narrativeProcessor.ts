
import { Dispatch } from 'react';
import { SimulationAction } from '../state/actions';
import { SimulationState } from '../types/simulation';
import { validateDelta } from '../validation/validator';
import { ConflictTier } from '../types/conflict';
import { RelationshipConfiguration } from '../types/configuration';

export interface ProcessResult {
  cleanText: string;
  errors: string[];
  extractedTags: string[];
}

const VALID_TIERS: ConflictTier[] = ['INT', 'PER', 'EXT', 'INT_PER', 'PER_EXT', 'INT_EXT', 'INT_PER_EXT'];

function normalizeTier(raw: string): ConflictTier {
  const normalized = raw.trim().replace(/\+/g, '_').toUpperCase();
  if (VALID_TIERS.includes(normalized as ConflictTier)) {
    return normalized as ConflictTier;
  }
  console.warn(`Invalid conflict tier: ${raw}, defaulting to INT`);
  return 'INT';
}

/**
 * Strips all telemetry tags and dispatches corresponding state changes
 */
export function processLLMResponse(
  responseText: string,
  currentState: SimulationState,
  dispatch: Dispatch<SimulationAction>
): ProcessResult {
  const errors: string[] = [];
  let cleanText = responseText;
  
  // Extract all HTML comments as tags for meta visualization
  const extractedTags = (responseText.match(/<!--[\s\S]*?-->/g) || []).map(t => t.trim());

  // 1. Process Delta (Physics)
  const validation = validateDelta(responseText, currentState);
  if (validation.valid === false) {
    errors.push(...validation.errors.map(e => e.message));
  } else if (validation.valid === true) {
    dispatch({ 
      type: 'APPLY_DELTA', 
      payload: validation.delta, 
      thresholdEvents: validation.thresholdEvents 
    });
  }

  // 2. Process CRUX Moments
  const cruxMatch = responseText.match(/<!-- CRUX\|(.*?)\|(.*?)\|(.*?)\|(.*?) -->/);
  if (cruxMatch) {
    const [_, tierRaw, desc, want, need] = cruxMatch;
    dispatch({
      type: 'CRUX_TRIGGERED',
      definition: {
        label: desc.substring(0, 30),
        tier: normalizeTier(tierRaw),
        description: desc,
        wantPath: { action: want, stakes: "Pursue conscious goal" },
        needPath: { action: need, stakes: "Embrace unconscious truth" }
      }
    });
  }

  // 3. Process Configuration Shifts
  const configMatch = responseText.match(/<!-- CONFIG\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?) -->/);
  if (configMatch) {
    const [_, configType, pcWant, pcNeed, rebWant, rebNeed] = configMatch;
    const validTypes = ['ALLIED_WANTS', 'ALLIED_NEEDS', 'CHIASTIC', 'CONVERGENT', 'DIVERGENT', 'ASYMMETRIC'];
    
    if (validTypes.includes(configType)) {
      let newConfig: RelationshipConfiguration;
      
      switch (configType) {
        case 'ALLIED_WANTS':
          newConfig = { type: 'ALLIED_WANTS', description: "Aligned goals, opposed truths" };
          break;
        case 'ALLIED_NEEDS':
          newConfig = { type: 'ALLIED_NEEDS', description: "Opposed goals, aligned truths" };
          break;
        case 'CHIASTIC':
          newConfig = { type: 'CHIASTIC', description: "Cross-mirrored pursuit" };
          break;
        case 'CONVERGENT':
          newConfig = { type: 'CONVERGENT', description: "Harmonious but fragile" };
          break;
        case 'DIVERGENT':
          newConfig = { type: 'DIVERGENT', description: "Fundamental incompatibility" };
          break;
        case 'ASYMMETRIC':
        default:
          newConfig = { type: 'ASYMMETRIC', description: "Nuanced partial alignments", tensions: [`${pcWant} vs ${rebWant}`] };
          break;
      }
      
      dispatch({ type: 'CONFIGURATION_SHIFT', newConfig });
    }
  }

  // 4. Process NPC Updates
  const npcMatches = Array.from(responseText.matchAll(/<!-- NPC\|(.*?):(.*?)\|(.*?) -->/g));
  npcMatches.forEach(m => {
    dispatch({
      type: 'NPC_STATUS_CHANGED',
      npcName: m[2],
      status: m[3] as any
    });
  });

  // Strip all tags for the UI
  cleanText = cleanText.replace(/<!--[\s\S]*?-->/g, '').trim();

  return { cleanText, errors, extractedTags };
}
