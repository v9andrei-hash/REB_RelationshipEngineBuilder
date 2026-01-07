
import React, { createContext, useReducer, ReactNode, useMemo, Dispatch } from 'react';
import { SimulationState } from '../types/simulation';
import { SimulationAction } from '../state/actions';
import { simulationReducer } from '../state/reducer';
import { createInitialState } from '../state/initial';

interface SimulationContextValue {
  state: SimulationState;
  dispatch: Dispatch<SimulationAction>;
}

export const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use casting because initial state needs to satisfy the ExtendedSimulationState in reducer
  const [state, dispatch] = useReducer(simulationReducer, createInitialState() as any);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};
