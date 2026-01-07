
import { SimulationState, NPCState, SituationState, PressureSource } from '../types/simulation';
import { SimulationAction } from './actions';
import { selectAlignmentState, selectAwarenessState } from './selectors';
import { createAdrenaline, createOxytocin, createFavor, createEntropy } from '../types/bondMatrix';
import { amplifyChange, calculateCruxEffects } from './effects';
import { Act1, Act2, Act3 } from '../types/act';

// Extend SimulationState to track metadata internally for the reducer
interface ExtendedSimulationState extends SimulationState {
  cruxHistory: ('WANT' | 'NEED')[];
  pendingCruxPressure: boolean;
}

export function simulationReducer(
  state: ExtendedSimulationState,
  action: SimulationAction
): ExtendedSimulationState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...(action.payload as ExtendedSimulationState),
        cruxHistory: (action.payload as any).cruxHistory || [],
        pendingCruxPressure: (action.payload as any).pendingCruxPressure || false
      };

    case 'WORLD_SET':
      return { ...state, world: action.payload };

    case 'PROFILE_UPDATED':
      const roleKey = action.role.toLowerCase() as 'pc' | 'reb';
      return {
        ...state,
        [roleKey]: { ...state[roleKey], ...action.data }
      };

    case 'APPLY_DELTA': {
      const { payload: d } = action;
      
      const updateArc = (char: 'pc' | 'reb') => {
        const arc = state[char];
        const newAlRaw = arc.alignment + d[`${char}_al` as 'pc_al' | 'reb_al'];
        const newAwRaw = arc.awareness + d[`${char}_aw` as 'pc_aw' | 'reb_aw'];
        const newObRaw = arc.obsession + d[`${char}_ob` as 'pc_ob' | 'reb_ob'];

        const alignment = Math.min(100, Math.max(-100, newAlRaw));
        const awareness = Math.min(100, Math.max(0, newAwRaw));
        const obsession = Math.min(100, Math.max(0, newObRaw));

        return {
          ...arc,
          alignment,
          alignmentState: selectAlignmentState(alignment),
          awareness,
          awarenessState: selectAwarenessState(awareness),
          obsession
        };
      };

      return {
        ...state,
        timestamp: Date.now(),
        bondMatrix: {
          adrenaline: createAdrenaline(Math.min(500, Math.max(-500, state.bondMatrix.adrenaline + d.ar))),
          oxytocin: createOxytocin(Math.min(500, Math.max(-500, state.bondMatrix.oxytocin + d.ox))),
          favor: createFavor(Math.min(state.act.favorCap, Math.max(-state.act.favorCap, state.bondMatrix.favor + d.fv))),
          entropy: createEntropy(Math.min(-1, state.bondMatrix.entropy + d.en)),
        },
        pc: updateArc('pc'),
        reb: updateArc('reb'),
        turnCounter: state.turnCounter + 1, // Incremented locally now TRN is removed from telemetry
        densityTotal: state.densityTotal + Math.abs(d.vt_mag)
      };
    }

    case 'CRUX_TRIGGERED':
      return {
        ...state,
        crux: {
          status: 'ACTIVE',
          definition: action.definition,
          startTime: Date.now()
        }
      };

    case 'CRUX_RESOLVED': {
      if (state.crux.status !== 'ACTIVE' && state.crux.status !== 'RESOLVING') return state;
      
      const effects = calculateCruxEffects(action.path, state.pc.awareness, state.cruxHistory.length);
      
      const pcAlignment = Math.min(100, Math.max(-100, state.pc.alignment + amplifyChange(effects.alignmentDelta, state.pc.obsession)));
      const pcAwareness = Math.min(100, Math.max(0, state.pc.awareness + effects.awarenessDelta));
      const pcObsession = Math.min(100, Math.max(0, state.pc.obsession + effects.obsessionDelta));

      return {
        ...state,
        crux: { status: 'INACTIVE' },
        cruxHistory: [action.path, ...state.cruxHistory].slice(0, 5),
        pc: {
          ...state.pc,
          alignment: pcAlignment,
          alignmentState: selectAlignmentState(pcAlignment),
          awareness: pcAwareness,
          awarenessState: selectAwarenessState(pcAwareness),
          obsession: pcObsession
        },
        bondMatrix: {
          ...state.bondMatrix,
          favor: createFavor(Math.min(state.act.favorCap, Math.max(-state.act.favorCap, state.bondMatrix.favor + effects.favorDelta))),
          entropy: createEntropy(Math.min(-1, state.bondMatrix.entropy + effects.entropyDelta))
        },
        pendingCruxPressure: false
      };
    }

    case 'CRUX_AVOIDED':
      return {
        ...state,
        crux: { status: 'INACTIVE' },
        pc: {
          ...state.pc,
          awareness: Math.max(0, state.pc.awareness - 8),
          awarenessState: selectAwarenessState(Math.max(0, state.pc.awareness - 8))
        },
        bondMatrix: {
          ...state.bondMatrix,
          entropy: createEntropy(Math.min(-1, state.bondMatrix.entropy + 20)),
          favor: createFavor(Math.max(-state.act.favorCap, state.bondMatrix.favor - 15))
        },
        pendingCruxPressure: true
      };

    case 'ACT_GATE_CROSSED': {
      let nextAct: Act2 | Act3;
      if (action.newActNumber === 2) {
        nextAct = { actNumber: 2, favorCap: 25, cruxAllowed: true, minIntimacyForGate: 4, entropyDecay: -60 };
      } else {
        nextAct = { actNumber: 3, favorCap: 40, cruxAllowed: true, noGate: true, entropyDecay: -75 };
      }
      return {
        ...state,
        act: nextAct
      };
    }

    case 'CONFIGURATION_SHIFT':
      return {
        ...state,
        configuration: action.newConfig
      };

    case 'WEEK_ADVANCED':
      return {
        ...state,
        week: state.week + 1,
        densityTotal: 0,
        turnCounter: 0,
        bondMatrix: {
          ...state.bondMatrix,
          entropy: createEntropy(
            Math.min(-1, state.bondMatrix.entropy + state.act.entropyDecay)
          )
        }
      };

    case 'SITUATION_DRAWN':
      return {
        ...state,
        situations: [
          ...state.situations,
          {
            id: action.situation.id,
            label: action.situation.label,
            status: 'TRIGGERED' as const,
            triggerCondition: action.situation.triggerCondition
          }
        ]
      };

    case 'SITUATION_RESOLVED':
      return {
        ...state,
        situations: state.situations.map(s =>
          s.label === action.label
            ? { ...s, status: 'RESOLVED' as const, resolutionSummary: action.synopsis }
            : s
        )
      };

    case 'NPC_STATUS_CHANGED':
      return {
        ...state,
        npcs: {
          ...state.npcs,
          [action.npcName]: {
            ...state.npcs[action.npcName],
            name: action.npcName,
            status: action.status
          }
        }
      };

    case 'PRESSURE_ADDED':
      return {
        ...state,
        pressures: [
          ...state.pressures,
          {
            id: `${action.tier}-${Date.now()}`,
            tier: action.tier,
            source: action.source,
            active: true
          }
        ]
      };

    case 'PRESSURE_RESOLVED':
      return {
        ...state,
        pressures: state.pressures.map(p =>
          p.source === action.source ? { ...p, active: false } : p
        )
      };

    case 'UPDATE_USAGE':
      return {
        ...state,
        inputTokens: action.inputTokens,
        outputTokens: state.outputTokens + action.outputTokens
      };

    default:
      return state;
  }
}
