
import { useContext } from 'react';
import { SimulationContext } from '../context/SimulationContext';

export function useCharacterArc(role: 'pc' | 'reb') {
  const context = useContext(SimulationContext);
  if (!context) throw new Error('SimulationContext missing');

  const arc = context.state[role];

  return {
    stats: {
      alignment: arc.alignment,
      awareness: arc.awareness,
      obsession: arc.obsession
    },
    thresholds: {
      awareness: arc.awarenessState,
      alignment: arc.alignmentState
    },
    identity: {
      want: arc.want,
      need: arc.need
    },
    isLucid: arc.awareness >= 80,
    isLocked: Math.abs(arc.alignment) >= 70
  };
}
