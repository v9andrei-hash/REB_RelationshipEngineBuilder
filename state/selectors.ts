
import { SimulationState } from '../types/simulation';
import { AwarenessState, AlignmentState } from '../types/characterArc';
import { getActiveCrisis, CrisisState } from '../types/crisis';

export const selectAwarenessState = (value: number): AwarenessState => {
  if (value < 20) return { tag: 'BLIND', canChooseNeed: false };
  if (value < 40) return { tag: 'DEFENDED', canChooseNeed: false };
  if (value < 60) return { tag: 'GLIMPSING', canChooseNeed: true };
  if (value < 80) return { tag: 'SEEING', canChooseNeed: true };
  return { tag: 'LUCID', canChooseNeed: true };
};

export const selectAlignmentState = (value: number): AlignmentState => {
  if (value < -70) return { tag: 'WANT_LOCKED', trajectory: 'TRAGIC' };
  if (value <= -20) return { tag: 'WANT_LEANING', trajectory: 'STABLE' };
  if (value < 20) return { tag: 'LIMINAL', trajectory: 'VOLATILE' };
  if (value <= 70) return { tag: 'NEED_LEANING', trajectory: 'TRANSFORMING' };
  return { tag: 'NEED_AWAKENED', trajectory: 'ASCENDING' };
};

export const selectCrisis = (state: SimulationState): CrisisState => {
  return getActiveCrisis(state);
};

export const selectBondQuadrant = (state: SimulationState): 'Q1' | 'Q2' | 'Q3' | 'Q4' => {
  const { adrenaline, oxytocin } = state.bondMatrix;
  if (adrenaline >= 0 && oxytocin >= 0) return 'Q1';
  if (adrenaline < 0 && oxytocin >= 0) return 'Q2';
  if (adrenaline < 0 && oxytocin < 0) return 'Q3';
  return 'Q4';
};

export interface DashboardStats {
  adr: number;
  oxy: number;
  favor: number;
  entropy: number;
  pcAL: number;
  pcAW: number;
  pcOB: number;
  rebAL: number;
  rebAW: number;
  rebOB: number;
  week: number;
  turns: number;
  act: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
}

export const selectDashboardStats = (state: SimulationState): DashboardStats => ({
  adr: state.bondMatrix.adrenaline as number,
  oxy: state.bondMatrix.oxytocin as number,
  favor: state.bondMatrix.favor as number,
  entropy: state.bondMatrix.entropy as number,
  pcAL: state.pc.alignment,
  pcAW: state.pc.awareness,
  pcOB: state.pc.obsession,
  rebAL: state.reb.alignment,
  rebAW: state.reb.awareness,
  rebOB: state.reb.obsession,
  week: state.week,
  turns: state.turnCounter,
  act: state.act.actNumber,
  tokens: state.densityTotal,
  inputTokens: state.inputTokens,
  outputTokens: state.outputTokens
});
