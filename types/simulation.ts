
import { BondMatrix } from './bondMatrix';
import { CharacterArc } from './characterArc';
import { Act } from './act';
import { RelationshipConfiguration } from './configuration';
import { CruxState } from './conflict';

export interface SimulationState {
  version: "3.5.1";
  timestamp: number;
  
  // Relationship State
  bondMatrix: BondMatrix;
  configuration: RelationshipConfiguration;
  
  // Character States
  pc: CharacterArc;
  reb: CharacterArc;
  
  // System State
  act: Act;
  crux: CruxState;
  
  // History & Telemetry
  turnCounter: number; // 0-5 until Situation Deck
  week: number;
  densityTotal: number; // 0-40 until Week Advance
}
