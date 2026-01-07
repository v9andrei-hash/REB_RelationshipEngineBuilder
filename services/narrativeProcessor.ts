
import { Dispatch } from 'react';
import { SimulationAction } from '../state/actions';
import { SimulationState } from '../types/simulation';
import { validateDelta } from '../validation/validator';
import { ConflictTier } from '../types/conflict';

export interface ProcessResult {
  cleanText: string;
  errors: string[];
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

  // 1. Process Delta (Physics)
  const validation = validateDelta(responseText, currentState);
  // Using explicit literal comparison to fix narrowing issues in some TypeScript environments
  // This ensures 'validation' is correctly narrowed to the error or success branch
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
  // Format: <!-- CRUX|[Tier]|[Description]|[Want_Path]|[Need_Path] -->
  const cruxMatch = responseText.match(/<!-- CRUX\|(.*?)\|(.*?)\|(.*?)\|(.*?) -->/);
  if (cruxMatch) {
    const [_, tier, desc, want, need] = cruxMatch;
    dispatch({
      type: 'CRUX_TRIGGERED',
      definition: {
        label: "CRITICAL CHOICE",
        tier: tier as ConflictTier,
        description: desc,
        wantPath: { action: want, stakes: "Sacrifice growth for stability" },
        needPath: { action: need, stakes: "Embrace transformation" }
      }
    });
  }

  // 3. Process Configuration Shifts
  const configMatch = responseText.match(/<!-- CONFIG\|(.*?)\|/);
  if (configMatch) {
    // Note: Simple implementation for prototype - casting to any to bypass strict literal description checks 
    // defined in the RelationshipConfiguration union types.
    dispatch({
      type: 'CONFIGURATION_SHIFT',
      newConfig: { type: configMatch[1], description: "Dynamic reconfiguration", tensions: [] } as any
    });
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

  return { cleanText, errors };
}
