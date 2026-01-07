
// Re-export state model types
export * from './types/simulation';
export * from './types/bondMatrix';
export * from './types/characterArc';
export * from './types/act';
export * from './types/configuration';
export * from './types/conflict';
export * from './types/crisis';

// UI-specific types (not part of state model)
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

// Removed Portrait definition from here as it now lives in types/simulation.ts 
// to avoid circular dependency issues when imported by state-aware types.

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

export interface SimulationIntervention {
  id: string;
  type: 'Physics' | 'Narrative' | 'Situation' | 'Telemetry';
  severity: 'Low' | 'Medium' | 'High' | 'CRITICAL';
  description: string;
  proposedFix: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  property: 'Static' | 'Consumable' | 'Relic';
  owner: string;
}
