
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
