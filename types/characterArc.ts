
import { Adrenaline, Oxytocin } from './bondMatrix';

/**
 * AWARENESS THRESHOLDS (0-100)
 */
export type BlindState = { tag: 'BLIND'; canChooseNeed: false };         // 0-19
export type DefendedState = { tag: 'DEFENDED'; canChooseNeed: false };   // 20-39
export type GlimpsingState = { tag: 'GLIMPSING'; canChooseNeed: true };   // 40-59
export type SeeingState = { tag: 'SEEING'; canChooseNeed: true };       // 60-79
export type LucidState = { tag: 'LUCID'; canChooseNeed: true };         // 80-100

export type AwarenessState = 
  | BlindState 
  | DefendedState 
  | GlimpsingState 
  | SeeingState 
  | LucidState;

/**
 * ALIGNMENT THRESHOLDS (-100 to +100)
 */
export type WantLocked = { tag: 'WANT_LOCKED'; trajectory: 'TRAGIC' };        // < -70
export type WantLeaning = { tag: 'WANT_LEANING'; trajectory: 'STABLE' };      // -70 to -21
export type Liminal = { tag: 'LIMINAL'; trajectory: 'VOLATILE' };             // -20 to +20
export type NeedLeaning = { tag: 'NEED_LEANING'; trajectory: 'TRANSFORMING' }; // +21 to +70
export type NeedAwakened = { tag: 'NEED_AWAKENED'; trajectory: 'ASCENDING' }; // > +70

export type AlignmentState = 
  | WantLocked 
  | WantLeaning 
  | Liminal 
  | NeedLeaning 
  | NeedAwakened;

export interface CharacterArc {
  alignment: number;
  alignmentState: AlignmentState;
  awareness: number;
  awarenessState: AwarenessState;
  obsession: number; // 0-100
  want: string;
  need: string;
}
