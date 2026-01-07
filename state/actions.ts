
import { RawDelta } from '../validation/parser';
import { ThresholdEvent } from '../validation/thresholds';
import { ConflictTier, CruxDefinition } from '../types/conflict';
import { RelationshipConfiguration } from '../types/configuration';
import { Situation } from '../types';
import { SimulationState } from '../types/simulation';

export type SimulationAction =
  | { type: 'INITIALIZE'; payload: SimulationState }
  | { type: 'APPLY_DELTA'; payload: RawDelta; thresholdEvents: ThresholdEvent[] }
  | { type: 'CRUX_TRIGGERED'; definition: CruxDefinition }
  | { type: 'CRUX_RESOLVED'; path: 'WANT' | 'NEED' }
  | { type: 'CRUX_AVOIDED' }
  | { type: 'WEEK_ADVANCED' }
  | { type: 'SITUATION_DRAWN'; situation: Situation }
  | { type: 'SITUATION_RESOLVED'; label: string; synopsis: string }
  | { type: 'ACT_GATE_CROSSED'; newActNumber: 2 | 3 }
  | { type: 'CONFIGURATION_SHIFT'; newConfig: RelationshipConfiguration }
  | { type: 'NPC_STATUS_CHANGED'; npcName: string; status: 'ACTING' | 'WATCHING' | 'DORMANT' }
  | { type: 'PRESSURE_ADDED'; tier: ConflictTier; source: string }
  | { type: 'PRESSURE_RESOLVED'; source: string }
  | { type: 'UPDATE_USAGE'; inputTokens: number; outputTokens: number };
