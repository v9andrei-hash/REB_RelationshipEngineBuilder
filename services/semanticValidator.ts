import { SimulationState } from '../types/simulation';
import { selectCurrentQuadrant } from '../state/selectors';

export interface DriftWarning {
  type: 'perspective' | 'meta_leak' | 'style' | 'quadrant_mismatch';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export function checkSemanticDrift(
  narrative: string, 
  currentState: SimulationState
): DriftWarning[] {
  const warnings: DriftWarning[] = [];
  if (!narrative) return warnings;
  
  const isWizard = currentState.phase === 'wizard';

  // 1. SKIP meta-term check during wizard phase
  if (!isWizard) {
    const metaTerms = ['Favor', 'Entropy', 'Alignment', 'Tier 3', 'Bond Matrix', 'Quadrant'];
    for (const term of metaTerms) {
      if (narrative.includes(term)) {
        warnings.push({
          type: 'meta_leak',
          message: `Meta-term "${term}" found in narrative`,
          severity: 'high'
        });
      }
    }
  }
  
  // 2. SKIP quadrant mismatch during wizard (no quadrant established yet)
  if (!isWizard) {
    const quadrant = selectCurrentQuadrant(currentState);
    if (quadrant === 'Q3' && /warm|eager|flushed|excited/i.test(narrative)) {
      warnings.push({
        type: 'quadrant_mismatch',
        message: 'Void quadrant (Q3) but warm/eager behavior described',
        severity: 'medium'
      });
    }
  }
  
  // 3. ALWAYS check perspective violations
  if (/\b(I feel|I think|I want|My heart)\b/i.test(narrative)) {
    warnings.push({
      type: 'perspective',
      message: 'Possible first-person Reb narration detected',
      severity: 'medium'
    });
  }
  
  // 4. ALWAYS check style violations (emotion naming)
  const emotionWords = /\b(felt sad|felt happy|was angry|was scared|felt love)\b/i;
  if (emotionWords.test(narrative)) {
    warnings.push({
      type: 'style',
      message: 'Direct emotion naming detected (should show, not tell)',
      severity: 'low'
    });
  }
  
  return warnings;
}