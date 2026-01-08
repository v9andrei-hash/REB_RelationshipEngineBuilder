
import { SimulationState } from '../types/simulation';
import { parseDelta, RawDelta } from './parser';
import { checkBounds } from './rules';
import { ValidationError } from './errors';
import { detectThresholds, ThresholdEvent } from './thresholds';

export type ValidationResult = 
  | { 
      valid: true; 
      delta: RawDelta | null; 
      appliedDelta: RawDelta | null; // The version after physics overrides
      violations: ValidationError[];  // Non-fatal physics adjustments
      thresholdEvents: ThresholdEvent[] 
    }
  | { valid: false; errors: ValidationError[] };

export function validateDelta(
  rawResponse: string, 
  currentState: SimulationState
): ValidationResult {
  // 1. Parse
  const parseResult = parseDelta(rawResponse);
  
  if (parseResult.success === false) {
    return { valid: false, errors: [parseResult.error] };
  }

  const delta = parseResult.data;
  
  // If no Delta tag was found, it's technically "valid" but has no physics impact
  if (delta === null) {
    return { valid: true, delta: null, appliedDelta: null, violations: [], thresholdEvents: [] };
  }

  // 2. Check Physics Rules & Perform Clamping
  const { clampedDelta, violations } = checkBounds(delta, currentState);

  // 3. Act 1 CRUX Constraint (Fatal Error)
  const cruxTagPresent = rawResponse.includes('<!-- CRUX|');
  if (currentState.act.actNumber === 1 && cruxTagPresent) {
    return { 
      valid: false, 
      errors: [{
        type: 'ACT_CONSTRAINT_VIOLATED',
        message: "CRUX moments are forbidden in Act 1. Establish the Tether first."
      }] 
    };
  }

  // 4. Detect Thresholds based on APPLIED delta
  const pcEvents = detectThresholds(
    { awareness: currentState.pc.awareness, alignment: currentState.pc.alignment, obsession: currentState.pc.obsession },
    { 
      awareness: Math.min(100, Math.max(0, currentState.pc.awareness + clampedDelta.pc_aw)),
      alignment: Math.min(100, Math.max(-100, currentState.pc.alignment + clampedDelta.pc_al)),
      obsession: Math.min(100, Math.max(0, currentState.pc.obsession + clampedDelta.pc_ob))
    },
    'PC'
  );

  const rebEvents = detectThresholds(
    { awareness: currentState.reb.awareness, alignment: currentState.reb.alignment, obsession: currentState.reb.obsession },
    { 
      awareness: Math.min(100, Math.max(0, currentState.reb.awareness + clampedDelta.reb_aw)),
      alignment: Math.min(100, Math.max(-100, currentState.reb.alignment + clampedDelta.reb_al)),
      obsession: Math.min(100, Math.max(0, currentState.reb.obsession + clampedDelta.reb_ob))
    },
    'REB'
  );

  const thresholdEvents = [...pcEvents, ...rebEvents];
  
  // Dual Peak Obsession check
  const pcOb = currentState.pc.obsession + clampedDelta.pc_ob;
  const rebOb = currentState.reb.obsession + clampedDelta.reb_ob;
  if (pcOb > 70 && rebOb > 70) {
    thresholdEvents.push({ type: 'DUAL_PEAK', character: 'PC', previousValue: 0, newValue: 0 }); 
  }

  return {
    valid: true,
    delta,
    appliedDelta: clampedDelta,
    violations,
    thresholdEvents
  };
}
