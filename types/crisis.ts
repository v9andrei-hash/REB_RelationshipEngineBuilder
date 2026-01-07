
import { SimulationState } from './simulation';

/**
 * Derived crisis states that trigger specific narrative overrides
 */
export type CrisisState = 
  | 'TRAGIC_LUCIDITY'     // Aw > 80, Al < -50
  | 'TRANSFORMATION'      // Aw > 80, Al > +50
  | 'COLLISION_IMMINENT'  // |PC_AL - REB_AL| > 120
  | 'MIRROR_MOMENT'       // PC_AL ≈ -REB_AL (±20)
  | 'KERNEL_PANIC'        // Missing Telemetry
  | 'STABLE';

/**
 * Logic to identify if a state matches a crisis condition
 */
export const getActiveCrisis = (state: SimulationState): CrisisState => {
  const { pc, reb } = state;
  const alignmentDiff = Math.abs(pc.alignment - reb.alignment);
  const isMirror = Math.abs(pc.alignment + reb.alignment) <= 20;

  if (pc.awareness > 80 && pc.alignment < -50) return 'TRAGIC_LUCIDITY';
  if (pc.awareness > 80 && pc.alignment > 50) return 'TRANSFORMATION';
  if (alignmentDiff > 120) return 'COLLISION_IMMINENT';
  if (isMirror && pc.awareness > 50 && reb.awareness > 50) return 'MIRROR_MOMENT';
  
  return 'STABLE';
};
