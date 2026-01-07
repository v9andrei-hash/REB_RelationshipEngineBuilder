import { BondMatrix } from './bondMatrix';
import { CharacterArc } from './characterArc';
import { Act } from './act';
import { RelationshipConfiguration } from './configuration';
import { CruxState, ConflictTier } from './conflict';

/**
 * Defining Portrait here to avoid circular dependencies with types.ts
 * while allowing Simulation-related types to reference it.
 */
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

// Added NPC alias for compatibility with external services
export type NPC = NPCState;

export interface SituationState {
  id: string;
  label: string;
  status: 'IN_DECK' | 'TRIGGERED' | 'RESOLVED';
  triggerCondition: string;
  resolutionSummary?: string;
}

// Added Situation alias for compatibility with external services
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

// Added missing SceneSnapshot type referenced in Dashboard and App
export interface SceneSnapshot {
  id: string;
  timestamp: number;
  summary: string;
  delta?: string;
}

// Added missing Chronicle type referenced in GeminiService and App
export interface Chronicle {
  id: string;
  title: string;
  anchors: AnchorPoint[];
  situations: SituationState[];
  timestamp: number;
}

// Added missing PlayerCharacter and RebCharacter types referenced in GeminiService and Dashboard
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
