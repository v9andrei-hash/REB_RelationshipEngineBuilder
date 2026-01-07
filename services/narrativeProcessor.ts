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
  return 'INT';
}

function detectWizardCompletion(response: string): boolean {
  // Look for CHAR tags which signal wizard completion
  const hasCharTags = response.includes('<!-- CHAR|PC') && 
                      response.includes('<!-- CHAR|REB');
  return hasCharTags;
}

export function processLLMResponse(
  responseText: string,
  currentState: SimulationState,
  dispatch: Dispatch<SimulationAction>
): ProcessResult {
  const errors: string[] = [];
  
  // Extract all HTML comments as tags for meta visualization
  const extractedTags = (responseText.match(/<!--[\s\S]*?-->/g) || []).map(t => t.trim());

  // 1. Process Delta (Physics)
  const validation = validateDelta(responseText, currentState);
  if (validation.valid === false) {
    errors.push(...validation.errors.map(e => e.message));
  } else if (validation.valid === true && validation.delta !== null) {
    dispatch({ 
      type: 'APPLY_DELTA', 
      payload: validation.delta, 
      thresholdEvents: validation.thresholdEvents 
    });
  }

  // 2. Process SESSION (World Context)
  const sessionMatch = responseText.match(/<!-- SESSION\|(.*?)\|(.*?) -->/i);
  if (sessionMatch) {
    dispatch({
      type: 'WORLD_SET',
      payload: { era: sessionMatch[1].trim(), genre: sessionMatch[2].trim() }
    });
  }

  // 3. Process CHAR (Profile Hydration)
  const charMatches = Array.from(responseText.matchAll(/<!-- CHAR\|(PC|REB)\|(.*?) -->/gi));
  charMatches.forEach(m => {
    const role = m[1].toUpperCase() as 'PC' | 'REB';
    const pairs = m[2].split('|');
    const data: any = {};
    pairs.forEach(p => {
      const parts = p.split(':');
      if (parts.length < 2) return;
      const key = parts[0].trim().toUpperCase();
      const val = parts.slice(1).join(':').trim();
      
      if (key === 'N') data.name = val;
      if (key === 'O') data.origin = val;
      if (key === 'W') data.wound = val;
      if (key === 'T') data.temperament = val;
      if (key === 'D') data.drive = val;
      if (key === 'WANT') data.want = val;
      if (key === 'NEED') data.need = val;
      if (key === 'S') data.skills = val.split(',').map(s => s.trim()).filter(Boolean);
    });
    if (Object.keys(data).length > 0) {
      dispatch({ type: 'PROFILE_UPDATED', role, data });
    }
  });

  // 4. Process SITUATION
  const situationMatch = responseText.match(/<!-- SITUATION\|(.*?)\|(.*?) -->/i);
  if (situationMatch) {
    dispatch({
      type: 'SITUATION_DRAWN',
      situation: {
        id: `sit-${Date.now()}`,
        label: situationMatch[1].trim(),
        triggerCondition: situationMatch[2].trim(),
        status: 'TRIGGERED'
      }
    });
  }

  // 5. Process PRESSURE
  const pressureMatch = responseText.match(/<!-- PRESSURE\|(.*?)\|(.*?) -->/i);
  if (pressureMatch) {
    dispatch({
      type: 'PRESSURE_ADDED',
      tier: normalizeTier(pressureMatch[1]),
      source: pressureMatch[2].trim()
    });
  }

  // 6. Process CRUX Moments
  const cruxMatch = responseText.match(/<!-- CRUX\|(.*?)\|(.*?)\|(.*?)\|(.*?) -->/i);
  if (cruxMatch) {
    const [_, tierRaw, desc, want, need] = cruxMatch;
    dispatch({
      type: 'CRUX_TRIGGERED',
      definition: {
        label: cruxMatch[2].trim().substring(0, 30),
        tier: normalizeTier(tierRaw),
        description: cruxMatch[2].trim(),
        wantPath: { action: want.trim(), stakes: "Pursue conscious goal" },
        needPath: { action: need.trim(), stakes: "Embrace unconscious truth" }
      }
    });
  }

  // 7. Process Configuration Shifts
  const configMatch = responseText.match(/<!-- CONFIG\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?) -->/i);
  if (configMatch) {
    const [_, configType, pcWant, pcNeed, rebWant, rebNeed] = configMatch;
    const type = configType.trim().toUpperCase();
    
    let newConfig: RelationshipConfiguration = { 
      type: 'ASYMMETRIC', 
      description: "Nuanced partial alignments", 
      tensions: [`${pcWant} vs ${rebWant}`] 
    };
    
    if (['ALLIED_WANTS', 'ALLIED_NEEDS', 'CHIASTIC', 'CONVERGENT', 'DIVERGENT', 'ASYMMETRIC'].includes(type)) {
      if (type === 'ALLIED_WANTS') newConfig = { type: 'ALLIED_WANTS', description: "Aligned goals, opposed truths" };
      else if (type === 'ALLIED_NEEDS') newConfig = { type: 'ALLIED_NEEDS', description: "Opposed goals, aligned truths" };
      else if (type === 'CHIASTIC') newConfig = { type: 'CHIASTIC', description: "Cross-mirrored pursuit" };
      else if (type === 'CONVERGENT') newConfig = { type: 'CONVERGENT', description: "Harmonious but fragile" };
      else if (type === 'DIVERGENT') newConfig = { type: 'DIVERGENT', description: "Fundamental incompatibility" };
      
      dispatch({ type: 'CONFIGURATION_SHIFT', newConfig });
    }
  }

  // 8. Process NPC Updates
  const npcMatches = Array.from(responseText.matchAll(/<!-- NPC\|(.*?):(.*?)\|(.*?) -->/gi));
  npcMatches.forEach(m => {
    dispatch({
      type: 'NPC_STATUS_CHANGED',
      npcName: m[2].trim(),
      status: m[3].trim().toUpperCase() as any
    });
  });

  // 9. Wizard Progression
  if (detectWizardCompletion(responseText) && currentState.phase === 'wizard') {
    dispatch({ type: 'WIZARD_COMPLETE' });
  } else if (currentState.phase === 'wizard') {
    dispatch({ type: 'WIZARD_ADVANCE' });
  }

  // Strip all tags for the UI
  const cleanText = responseText.replace(/<!--[\s\S]*?-->/g, '').trim();

  return { cleanText, errors, extractedTags };
}