
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
export interface OptionalMechanics {
  enabled: boolean;
  
  thriller?: {
    intelAsymmetry?: { pc: number; reb: number };
    coverIntegrity?: number; // 0-100
    dualTrust?: { operational: number; personal: number }; // 0-100 each
  };
  
  action?: {
    combatSync?: number; // 0-100
    momentum?: 'NONE' | 'BUILDING' | 'HIGH' | 'PEAK';
    injuries?: { pc: number; reb: number }; // severity 0-100
    roles?: { pc: string; reb: string }; // e.g., "Point", "Cover"
  };
  
  scifi?: {
    timeDilation?: { pc: number; reb: number }; // subjective age
    identityContinuity?: { pc: string; reb: string }; // "Original", "Clone_6mo"
    mortalityAsymmetry?: { pc: string; reb: string }; // "Mortal", "Immortal"
  };
  
  horror?: {
    corruption?: { pc: number; reb: number }; // 0-100%
    sanity?: { pc: number; reb: number }; // 0-100%
    trustVsParanoia?: number; // -100 (paranoid) to +100 (trusting)
  };
  
  comedy?: {
    awkwardnessLevel?: number; // 0-100
    setupCallbacks?: string[]; // Pending callback identifiers
    chemistryFlow?: number; // 0-100
  };
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
  anchors: AnchorPoint[];
  pressures: PressureSource[];

  // Internal Engine Metadata
  cruxHistory: ('WANT' | 'NEED')[];
  pendingCruxPressure: boolean;
  optionalMechanics?: OptionalMechanics;
}
