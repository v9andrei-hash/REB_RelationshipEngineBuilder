
import { CharacterArc } from '../types/characterArc';

/**
 * All Alignment changes are amplified by Obsession
 */
export const amplifyChange = (baseChange: number, obsession: number): number => {
  return baseChange * (1 + obsession / 100);
};

export interface CruxResults {
  alignmentDelta: number;
  awarenessDelta: number;
  obsessionDelta: number;
  entropyDelta: number;
  favorDelta: number;
}

export const calculateCruxEffects = (
  path: 'WANT' | 'NEED', 
  currentAwareness: number,
  cruxHistoryCount: number
): CruxResults => {
  if (path === 'WANT') {
    return {
      alignmentDelta: -14,
      awarenessDelta: 5,
      obsessionDelta: 8,
      entropyDelta: currentAwareness > 50 ? 10 : 0,
      favorDelta: currentAwareness > 70 ? -10 : 0
    };
  } else {
    // NEED path alternates obsession delta based on history parity
    const obsessionSign = cruxHistoryCount % 2 === 0 ? -1 : 1;
    return {
      alignmentDelta: 15,
      awarenessDelta: 10,
      obsessionDelta: 5 * obsessionSign,
      entropyDelta: -10,
      favorDelta: 12
    };
  }
};
