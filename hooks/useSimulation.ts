
import { useContext, useCallback } from 'react';
import { SimulationContext } from '../context/SimulationContext';
import { processLLMResponse, ProcessResult as BaseProcessResult } from '../services/narrativeProcessor';
import { validateDelta, ValidationResult } from '../validation/validator';
import { SimulationAction } from '../state/actions';

export interface ProcessResult extends BaseProcessResult {
  violations: any[];
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }

  const { state, dispatch } = context;

  const applyRawResponse = useCallback((responseText: string): ProcessResult => {
    // 1. Validate first to get applied delta and violations
    const validation = validateDelta(responseText, state);
    
    // 2. Call narrative processor
    const result = processLLMResponse(responseText, state, dispatch);
    
    // 3. Extract violations if valid
    const violations = (validation as any).violations || [];
    
    return {
      ...result,
      violations
    };
  }, [state, dispatch]);

  return {
    state,
    dispatch,
    applyRawResponse,
    isInitialized: state.version === "3.5.1"
  };
}
