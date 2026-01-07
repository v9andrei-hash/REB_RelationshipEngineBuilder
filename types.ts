
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
  origin?: string;
  wound?: string;
  drive?: string;
  want?: string;
  need?: string;
  initialState: string;
  currentState: string;
  progressionNote: string;
  momentum: 'Ascending' | 'Descending' | 'Stagnant';
}

export type ConfigurationType = 'ALLIED_WANTS' | 'ALLIED_NEEDS' | 'CHIASTIC' | 'CONVERGENT' | 'DIVERGENT' | 'ASYMMETRIC';

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
    pc?: PlayerCharacter | null;
    reb?: RebCharacter | null;
    systemContext?: string;
    configuration?: ConfigurationType;
  };
  log: Message[];
  resumptionPayload: string;
}

export interface SimulationIntervention {
  id: string;
  type: 'Physics' | 'Narrative' | 'Situation' | 'Telemetry';
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
  portrait?: Portrait;
  temperament?: string;
  physicalDescription?: string;
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
  stats: SimulationState['stats'];
}

export interface SimulationState {
  isInitialized: boolean;
  contextLoaded: boolean;
  activeAct: number;
  pc?: PlayerCharacter;
  reb?: RebCharacter;
  configuration?: ConfigurationType;
  stats: {
    adr: number;
    oxy: number;
    favor: number;
    entropy: number;
    willpower: number;
    clarity: number;
    pcAL: number; // Alignment
    pcAW: number; // Awareness
    pcOB: number; // Obsession
    rebAL: number;
    rebAW: number;
    rebOB: number;
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

export interface PlayerCharacter {
  name: string;
  origin: string;
  wound: string;
  drive: string;
  want?: string;
  need?: string;
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
  want?: string;
  need?: string;
  portrait?: Portrait;
  physicalDescription?: string;
  literaryPreset?: string;
}

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
