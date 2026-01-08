import { RawDelta } from '../validation/parser';

export interface CoherenceWarning {
  type: 'narrative_contradiction' | 'stat_claim_mismatch' | 'emotional_incoherence';
  severity: 'low' | 'medium' | 'high';
  narrative: string;
  actual: string;
  suggestion: string;
}

/**
 * Validates whether the narrative text contradicts the physical changes in the simulation.
 */
export function checkCoherence(narrativeText: string, appliedDelta: RawDelta): CoherenceWarning[] {
  const warnings: CoherenceWarning[] = [];
  if (!narrativeText) return warnings;

  // Helper to run regex checks
  const checkMatch = (regex: RegExp, severity: CoherenceWarning['severity'], actual: string, suggestion: string, type: CoherenceWarning['type'] = 'narrative_contradiction') => {
    const match = regex.exec(narrativeText);
    if (match) {
      warnings.push({
        type,
        severity,
        narrative: match[0],
        actual,
        suggestion
      });
    }
  };

  // 1. FAVOR (Trust/Connection)
  if (appliedDelta.fv < -10) {
    checkMatch(
      /trust.*grew|closer|connection.*deepened|bond.*strengthened|felt.*safe/i,
      'high',
      'Favor dropped significantly',
      'Revise to show distance, guardedness, or betrayal'
    );
  }
  if (appliedDelta.fv > 10) {
    checkMatch(
      /pulled away|distrust|guard.*up|cold.*shoulder/i,
      'medium',
      'Favor increased significantly',
      'Show vulnerability, openness, or risk-taking'
    );
  }

  // 2. ADRENALINE (Tension/Activation)
  if (appliedDelta.ar > 50) {
    checkMatch(
      /calm|peaceful|serene|relaxed|breath.*eased|at ease/i,
      'high',
      'Adrenaline spiked',
      'Show physiological arousal: pulse, breathing, alertness'
    );
  }
  if (appliedDelta.ar < -30) {
    checkMatch(
      /heart.*raced|pounded|breath.*caught|jolted|shocked/i,
      'medium',
      'Adrenaline dropped',
      'Scene resolved or de-escalated, show settling'
    );
  }

  // 3. OXYTOCIN (Safety/Warmth)
  if (appliedDelta.ox < -20) {
    checkMatch(
      /warm|tender|gentle|soft.*touch|care|comfort|soothing/i,
      'medium',
      'Oxytocin dropped',
      'Show withdrawal, coldness, or sterility'
    );
  }

  // 4. ALIGNMENT (Want vs Need)
  if (appliedDelta.pc_al < -10) {
    checkMatch(
      /real.*self|authentic|vulnerable|honesty|truth.*emerged/i,
      'medium',
      'PC moved toward WANT (Defense)',
      'PC is defending, not revealing. Show mask reinforcement'
    );
  }
  if (appliedDelta.pc_al > 10) {
    checkMatch(
      /mask|facade|pretense|defended|guarded/i,
      'low',
      'PC moved toward NEED (Growth)',
      'Show cracking mask, involuntary honesty'
    );
  }

  // 5. AWARENESS (Consciousness)
  if (appliedDelta.pc_aw > 5) {
    checkMatch(
      /oblivious|unaware|blind.*to/i,
      'high',
      'PC Awareness increased',
      'PC is SEEING something. Show dawning realization'
    );
  }

  // 6. OBSESSION (Intensity)
  if (appliedDelta.pc_ob > 10) {
    checkMatch(
      /indifferent|apathetic|didn't care|lost interest/i,
      'high',
      'PC Obsession increased',
      'PC is MORE fixated, not less. Show intensification'
    );
  }

  // 7. ENTROPY (Instability)
  if (appliedDelta.en > 20) {
    checkMatch(
      /routine|predictable|stable|control.*maintained|order.*restored/i,
      'medium',
      'Entropy increased (Chaos)',
      'Show unpredictability, loss of control, volatility'
    );
  }

  return warnings;
}

/**
 * Formats a coherence warning for user-facing display.
 */
export function formatCoherenceWarning(warning: CoherenceWarning): string {
  const emojiMap = {
    low: '⚠️',
    medium: '🟡',
    high: '🔴'
  };

  const emoji = emojiMap[warning.severity];
  return `${emoji} Coherence Mismatch: Narrative says "${warning.narrative}" but ${warning.actual}. ${warning.suggestion}`;
}
