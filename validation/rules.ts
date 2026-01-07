
import { SimulationState } from '../types/simulation';
import { RawDelta } from './parser';
import { ValidationError } from './errors';

export function checkBounds(delta: RawDelta, state: SimulationState): ValidationError[] {
  const errors: ValidationError[] = [];

  // Favor Cap by Act
  const favorCap = state.act.favorCap;
  if (Math.abs(delta.fv) > favorCap) {
    errors.push({
      type: 'ACT_CONSTRAINT_VIOLATED',
      stat: 'Favor',
      value: delta.fv,
      limit: favorCap,
      message: `Favor change of ${delta.fv} exceeds Act ${state.act.actNumber} cap of ${favorCap}.`
    });
  }

  // Oxytocin vs Adrenaline Physics
  if (delta.ox > 0 && state.bondMatrix.adrenaline > 200) {
    errors.push({
      type: 'FORBIDDEN_COMBINATION',
      message: "Safety cannot be built in a burning building. Oxytocin gain blocked while Adrenaline > 200."
    });
  }

  // Entropy must remain negative
  const newEntropy = state.bondMatrix.entropy + delta.en;
  if (newEntropy >= 0) {
    errors.push({
      type: 'BOUNDS_EXCEEDED',
      stat: 'Entropy',
      value: newEntropy,
      limit: -1,
      message: "Entropy must remain negative. System stability compromised."
    });
  }

  return errors;
}
