
import { useContext } from 'react';
import { SimulationContext } from '../context/SimulationContext';
import { selectBondQuadrant } from '../state/selectors';

export function useBondMatrix() {
  const context = useContext(SimulationContext);
  if (!context) throw new Error('SimulationContext missing');

  const { state } = context;
  const matrix = state.bondMatrix;

  return {
    adrenaline: matrix.adrenaline,
    oxytocin: matrix.oxytocin,
    favor: matrix.favor,
    entropy: matrix.entropy,
    quadrant: selectBondQuadrant(state),
    favorCap: state.act.favorCap,
    isCritical: Math.abs(matrix.adrenaline) > 350 || Math.abs(matrix.oxytocin) > 400
  };
}
