
import { RawDelta } from '../validation/parser';
import { ThresholdEvent } from '../validation/thresholds';
import { ValidationError } from '../validation/errors';
import { ConflictTier, CruxDefinition } from '../types/conflict';
import { RelationshipConfiguration } from '../types/configuration';
import { Situation } from '../types';
import { SimulationState, WorldState, PlayerCharacter, RebCharacter } from '../types/simulation';

export type SimulationAction =
  | { type: 'INITIALIZE'; payload: SimulationState }
  | { 
      type: 'APPLY_DELTA'; 
      payload: RawDelta; 
      violations?: ValidationError[]; 
      thresholdEvents: ThresholdEvent[] 
    }
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
  | { type: 'UPDATE_USAGE'; inputTokens: number; outputTokens: number }
  | { type: 'WORLD_SET'; payload: WorldState }
  | { type: 'PROFILE_UPDATED'; role: 'PC' | 'REB'; data: Partial<PlayerCharacter | RebCharacter> }
  | { type: 'WIZARD_ADVANCE' }
  | { type: 'WIZARD_COMPLETE' };
