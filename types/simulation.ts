
import { BondMatrix } from './bondMatrix';
import { CharacterArc } from './characterArc';
import { Act } from './act';
import { RelationshipConfiguration } from './configuration';
import { CruxState, ConflictTier } from './conflict';

export interface Portrait {
  id: string;
  characterName: string;
  base64Data: string;
  generatedAt: number;
  quadrantAtGeneration: string;
  prompt: string;
}

export interface NPCState {
  name: string;
  role: 'Anchor' | 'Rival' | 'Enabler' | 'Catalyst';
  status: 'ACTING' | 'WATCHING' | 'DORMANT';
  influence: number;
  portrait?: Portrait;
}

export type NPC = NPCState;

export interface SituationState {
  id: string;
  label: string;
  status: 'IN_DECK' | 'TRIGGERED' | 'RESOLVED';
  triggerCondition: string;
  resolutionSummary?: string;
}

export type Situation = SituationState;

export interface AnchorPoint {
  id: string;
  timestamp: number;
  act: number;
  week: number;
  label: string;
  description: string;
  dominantAlignment: number;
}

export interface PressureSource {
  id: string;
  tier: ConflictTier;
  source: string;
  active: boolean;
}

export interface SceneSnapshot {
  id: string;
  timestamp: number;
  summary: string;
  delta?: string;
}

export interface Chronicle {
  id: string;
  title: string;
  anchors: AnchorPoint[];
  situations: SituationState[];
  timestamp: number;
}

export interface PlayerCharacter extends CharacterArc {
  name: string;
  origin?: string;
  wound?: string;
  drive?: string;
  skills?: string[];
  portrait?: Portrait | null;
}

export interface RebCharacter extends CharacterArc {
  name: string;
  origin?: string;
  wound?: string;
  drive?: string;
  temperament?: string;
  portrait?: Portrait | null;
}

export interface WorldState {
  era: string;
  genre: string;
  location?: string;
  powerDynamics?: string;
}

export interface SimulationState {
  version: "3.5.1";
  timestamp: number;
  
  // Phase Tracking
  phase: 'wizard' | 'narrative';
  wizardStep: number | null;

  // Relationship State
  bondMatrix: BondMatrix;
  configuration: RelationshipConfiguration;
  
  // Character States
  pc: PlayerCharacter;
  reb: RebCharacter;

  // World Context
  world: WorldState;
  
  // System State
  act: Act;
  crux: CruxState;
  
  // Timing
  turnCounter: number;
  week: number;
  densityTotal: number;
  
  // Usage tracking
  inputTokens: number;
  outputTokens: number;

  // Narrative Tracking
  npcs: Record<string, NPCState>;
  situations: SituationState[];
  anchors: AnchorPoint[];
  pressures: PressureSource[];

  // Internal Engine Metadata
  cruxHistory: ('WANT' | 'NEED')[];
  pendingCruxPressure: boolean;
}
