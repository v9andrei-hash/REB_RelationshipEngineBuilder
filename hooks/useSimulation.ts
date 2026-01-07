
import { useContext, useCallback } from 'react';
import { SimulationContext } from '../context/SimulationContext';
import { processLLMResponse, ProcessResult } from '../services/narrativeProcessor';

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }

  const { state, dispatch } = context;

  const applyRawResponse = useCallback((responseText: string): ProcessResult => {
    return processLLMResponse(responseText, state, dispatch);
  }, [state, dispatch]);

  return {
    state,
    dispatch,
    applyRawResponse,
    isInitialized: state.version === "3.5.1"
  };
}
