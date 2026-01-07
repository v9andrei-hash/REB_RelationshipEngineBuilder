
export type ConflictTier = 
  | 'INT' 
  | 'PER' 
  | 'EXT' 
  | 'INT_PER' 
  | 'PER_EXT' 
  | 'INT_EXT' 
  | 'INT_PER_EXT';

export interface CruxDefinition {
  label: string;
  tier: ConflictTier;
  description: string;
  wantPath: {
    action: string;
    stakes: string;
  };
  needPath: {
    action: string;
    stakes: string;
  };
}

export type CruxInactive = { status: 'INACTIVE' };
export type CruxActive = { 
  status: 'ACTIVE'; 
  definition: CruxDefinition; 
  startTime: number;
};
export type CruxAwaitingResolution = { 
  status: 'RESOLVING'; 
  definition: CruxDefinition; 
  chosenPath: 'WANT' | 'NEED' 
};

export type CruxState = 
  | CruxInactive 
  | CruxActive 
  | CruxAwaitingResolution;
