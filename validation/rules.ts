
import { SimulationState } from '../types/simulation';
import { RawDelta } from './parser';
import { ValidationError } from './errors';

export interface BoundsResult {
  clampedDelta: RawDelta;
  violations: ValidationError[];
}

export function checkBounds(delta: RawDelta, state: SimulationState): BoundsResult {
  const violations: ValidationError[] = [];
  const clampedDelta = { ...delta };

  // 1. Favor Cap by Act
  const favorCap = state.act.favorCap;
  if (Math.abs(delta.fv) > favorCap) {
    const applied = Math.sign(delta.fv) * favorCap;
    violations.push({
      type: 'ACT_CONSTRAINT_VIOLATED',
      stat: 'Favor',
      requested: delta.fv,
      applied: applied,
      limit: favorCap,
      message: `Act ${state.act.actNumber} Favor cap: ±${favorCap}/scene`
    });
    clampedDelta.fv = applied;
  }

  // 2. Bond Matrix Ceilings (±500)
  const checkBondCeiling = (stat: 'Ar' | 'Ox', current: number, requestedDelta: number) => {
    const newVal = current + requestedDelta;
    if (Math.abs(newVal) > 500) {
      const clampedTotal = Math.sign(newVal) * 500;
      const applied = clampedTotal - current;
      violations.push({
        type: 'BOUNDS_EXCEEDED',
        stat: stat === 'Ar' ? 'Adrenaline' : 'Oxytocin',
        requested: requestedDelta,
        applied: applied,
        limit: 500,
        message: `${stat === 'Ar' ? 'Adrenaline' : 'Oxytocin'} ceiling: ±500`
      });
      return applied;
    }
    return requestedDelta;
  };

  clampedDelta.ar = checkBondCeiling('Ar', state.bondMatrix.adrenaline, delta.ar);
  clampedDelta.ox = checkBondCeiling('Ox', state.bondMatrix.oxytocin, delta.ox);

  // 3. Oxytocin vs Adrenaline Physics
  if (clampedDelta.ox > 0 && state.bondMatrix.adrenaline > 200) {
    violations.push({
      type: 'FORBIDDEN_COMBINATION',
      stat: 'Oxytocin',
      requested: delta.ox,
      applied: 0,
      message: "Safety cannot be built in a burning building. Oxytocin gain blocked while Adrenaline > 200."
    });
    clampedDelta.ox = 0;
  }

  // 4. Character Arc Bounds (-100 to +100 for Alignment, 0 to 100 for Awareness/Obsession)
  const checkCharBound = (statName: string, current: number, requestedDelta: number, min: number, max: number) => {
    const newVal = current + requestedDelta;
    if (newVal < min || newVal > max) {
      const clampedTotal = Math.max(min, Math.min(max, newVal));
      const applied = clampedTotal - current;
      violations.push({
        type: 'BOUNDS_EXCEEDED',
        stat: statName,
        requested: requestedDelta,
        applied: applied,
        limit: max,
        message: `${statName} bounds: ${min} to ${max}`
      });
      return applied;
    }
    return requestedDelta;
  };

  clampedDelta.pc_al = checkCharBound('PC Alignment', state.pc.alignment, delta.pc_al, -100, 100);
  clampedDelta.pc_aw = checkCharBound('PC Awareness', state.pc.awareness, delta.pc_aw, 0, 100);
  clampedDelta.pc_ob = checkCharBound('PC Obsession', state.pc.obsession, delta.pc_ob, 0, 100);

  clampedDelta.reb_al = checkCharBound('Reb Alignment', state.reb.alignment, delta.reb_al, -100, 100);
  clampedDelta.reb_aw = checkCharBound('Reb Awareness', state.reb.awareness, delta.reb_aw, 0, 100);
  clampedDelta.reb_ob = checkCharBound('Reb Obsession', state.reb.obsession, delta.reb_ob, 0, 100);

  // 5. Entropy must remain negative
  const newEntropy = state.bondMatrix.entropy + delta.en;
  if (newEntropy >= 0) {
    const maxPossibleEntropyChange = -1 - state.bondMatrix.entropy; 
    const applied = Math.min(delta.en, maxPossibleEntropyChange);
    violations.push({
      type: 'BOUNDS_EXCEEDED',
      stat: 'Entropy',
      requested: delta.en,
      applied: applied,
      limit: -1,
      message: "Entropy must remain negative. Delta clamped to prevent stability collapse."
    });
    clampedDelta.en = applied;
  }

  return { clampedDelta, violations };
}
