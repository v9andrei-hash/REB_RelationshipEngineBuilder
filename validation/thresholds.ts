
export type ThresholdType = 
  | 'AWARENESS_GLIMPSING' 
  | 'AWARENESS_SEEING' 
  | 'AWARENESS_LUCID'
  | 'ALIGNMENT_LOCKED'
  | 'OBSESSION_HIGH'
  | 'DUAL_PEAK';

export interface ThresholdEvent {
  type: ThresholdType;
  character: 'PC' | 'REB';
  previousValue: number;
  newValue: number;
}

export function detectThresholds(
  prev: { awareness: number; alignment: number; obsession: number },
  curr: { awareness: number; alignment: number; obsession: number },
  character: 'PC' | 'REB'
): ThresholdEvent[] {
  const events: ThresholdEvent[] = [];

  // Awareness Crossings
  if (prev.awareness < 40 && curr.awareness >= 40) events.push({ type: 'AWARENESS_GLIMPSING', character, previousValue: prev.awareness, newValue: curr.awareness });
  if (prev.awareness < 60 && curr.awareness >= 60) events.push({ type: 'AWARENESS_SEEING', character, previousValue: prev.awareness, newValue: curr.awareness });
  if (prev.awareness < 80 && curr.awareness >= 80) events.push({ type: 'AWARENESS_LUCID', character, previousValue: prev.awareness, newValue: curr.awareness });

  // Alignment Crossings
  if (Math.abs(prev.alignment) <= 70 && Math.abs(curr.alignment) > 70) {
    events.push({ type: 'ALIGNMENT_LOCKED', character, previousValue: prev.alignment, newValue: curr.alignment });
  }

  // Obsession Crossings
  if (prev.obsession <= 70 && curr.obsession > 70) {
    events.push({ type: 'OBSESSION_HIGH', character, previousValue: prev.obsession, newValue: curr.obsession });
  }

  return events;
}
