import { SimulationState } from '../types/simulation';
import { createAdrenaline, createOxytocin, createFavor, createEntropy } from '../types/bondMatrix';

export const createInitialState = (): SimulationState => ({
  version: "3.5.1",
  timestamp: Date.now(),
  bondMatrix: {
    adrenaline: createAdrenaline(0),
    oxytocin: createOxytocin(0),
    favor: createFavor(0),
    entropy: createEntropy(-50),
  },
  configuration: { type: 'ASYMMETRIC', tensions: ['Initial Calibration'], description: "Nuanced partial alignments" },
  pc: {
    alignment: 0,
    alignmentState: { tag: 'LIMINAL', trajectory: 'VOLATILE' },
    awareness: 15,
    awarenessState: { tag: 'BLIND', canChooseNeed: false },
    obsession: 30,
    want: "Stability",
    need: "Growth"
  },
  reb: {
    alignment: 0,
    alignmentState: { tag: 'LIMINAL', trajectory: 'VOLATILE' },
    awareness: 20,
    awarenessState: { tag: 'DEFENDED', canChooseNeed: false },
    obsession: 35,
    want: "Control",
    need: "Connection"
  },
  act: {
    actNumber: 1,
    favorCap: 15,
    cruxAllowed: false,
    minIntimacyForGate: 2,
    entropyDecay: -50
  },
  crux: { status: 'INACTIVE' },
  turnCounter: 0,
  week: 1,
  densityTotal: 0,
  npcs: {},
  situations: [],
  anchors: [],
  pressures: [],
  cruxHistory: [],
  pendingCruxPressure: false
});
