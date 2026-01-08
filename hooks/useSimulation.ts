
import { useContext, useCallback } from 'react';
import { SimulationContext } from '../context/SimulationContext';
import { processLLMResponse, ProcessResult as BaseProcessResult } from '../services/narrativeProcessor';
import { validateDelta } from '../validation/validator';
import { RawDelta } from '../validation/parser';

export interface ProcessResult extends BaseProcessResult {
  violations: any[];
  appliedDelta: RawDelta | null;
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
    
    // 3. Extract violations and appliedDelta if valid
    const violations = validation.valid ? (validation as any).violations : [];
    const appliedDelta = validation.valid ? (validation as any).appliedDelta : null;
    
    return {
      ...result,
      violations,
      appliedDelta
    };
  }, [state, dispatch]);

  return {
    state,
    dispatch,
    applyRawResponse,
    isInitialized: state.version === "3.5.1"
  };
}
