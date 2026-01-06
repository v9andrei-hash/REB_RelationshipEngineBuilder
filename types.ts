

export interface Message {
  role: 'user' | 'model';
  content: string;
  hiddenStats?: string;
  isMeta?: boolean;
  compliance?: {
    isPassed: boolean;
    violations: string[];
  };
}

export interface CharacterArc {
  name: string;
  initialState: string;
  currentState: string;
  progressionNote: string;
  momentum: 'Ascending' | 'Descending' | 'Stagnant';
}

/**
 * Interface representing a generated character portrait
 */
export interface Portrait {
  id: string;
  characterName: string;
  base64Data: string;
  generatedAt: number;
  quadrantAtGeneration: string;
  prompt: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  property: 'Static' | 'Consumable' | 'Relic';
  owner: string;
}

export interface Chronicle {
  version: string;
  timestamp: string;
  summary: {
    actTitle: string;
    narrativeArc: string;
    themes: string[];
  };
  characters: {
    pc: CharacterArc;
    reb: CharacterArc;
    npcs: CharacterArc[];
  };
  telemetry: {
    finalStats: SimulationState['stats'];
    history: SceneSnapshot[];
    anchors: AnchorPoint[];
    npcs: NPC[];
    situations: Situation[];
    inventory: Item[];
    // Fix: Include PC and REB profile data in telemetry for export/import persistence
    pc?: PlayerCharacter | null;
    reb?: RebCharacter | null;
    systemContext?: string;
  };
  log: Message[];
  resumptionPayload: string;
}

export interface SimulationIntervention {
  id: string;
  type: 'Physics' | 'Narrative' | 'Situation';
  severity: 'Low' | 'Medium' | 'High' | 'CRITICAL';
  description: string;
  proposedFix: string;
  targetStats?: Partial<SimulationState['stats']>;
}

export interface NPC {
  name: string;
  status: string;
  role: string;
  proximity: 'High' | 'Medium' | 'Low';
  portrait?: Portrait; // Portait is now defined in this file
  temperament?: string; // NEW - for portrait generation
  physicalDescription?: string; // NEW - wizard input
}

export interface Situation {
  id: string;
  label: string;
  status: 'In Deck' | 'Triggered' | 'Resolved';
  triggerCondition: string;
  resolutionSummary?: string;
}

export interface AnchorPoint {
  id: string;
  timestamp: number;
  act: number;
  week: number;
  label: string;
  description: string;
  obsessionAtTime: number;
  dominantForce: 'PC' | 'REB';
}

export interface SceneSnapshot {
  id: string;
  timestamp: number;
  act: number;
  week: number;
  stats: {
    adr: number;
    oxy: number;
    favor: number;
    entropy: number;
    willpower: number;
    clarity: number;
    pcObsession: number;
    rebObsession: number;
  };
}

export interface SimulationState {
  isInitialized: boolean;
  contextLoaded: boolean;
  activeAct: number;
  pc?: PlayerCharacter; // NEW
  reb?: RebCharacter; // NEW
  stats: {
    adr: number;
    oxy: number;
    favor: number;
    entropy: number;
    willpower: number;
    clarity: number;
    pcObsession: number;
    rebObsession: number;
    week: number;
    tokens: number;
    act: number;
    turns: number;
  };
  anchors: AnchorPoint[];
  npcs: NPC[];
  situations: Situation[];
  inventory: Item[];
  sceneHistory: SceneSnapshot[];
}
// Add PC and REB character types for dashboard
export interface PlayerCharacter {
  name: string;
  origin: string;
  wound: string;
  drive: string;
  skills: string[];
  portrait?: Portrait;
  physicalDescription?: string;
}

export interface RebCharacter {
  name: string;
  origin: string;
  temperament: string;
  wound: string;
  drive: string;
  portrait?: Portrait;
  physicalDescription?: string;
  literaryPreset?: string; // If using canonical character
}

// Portrait generation request (mirrors service interface)
export interface PortraitRequest {
  name: string;
  role: 'PC' | 'REB' | 'NPC';
  physicalDescription?: string;
  temperament?: string;
  origin?: string;
  wound?: string;
  currentQuadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  status?: 'ACTING' | 'WATCHING' | 'DORMANT';
  era?: string;
}
