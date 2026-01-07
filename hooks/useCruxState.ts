
import { useContext } from 'react';
import { SimulationContext } from '../context/SimulationContext';

export function useCruxState() {
  const context = useContext(SimulationContext);
  if (!context) throw new Error('SimulationContext missing');

  const { state, dispatch } = context;
  const crux = state.crux;

  return {
    isActive: crux.status === 'ACTIVE' || crux.status === 'RESOLVING',
    isResolving: crux.status === 'RESOLVING',
    crux: crux.status !== 'INACTIVE' ? crux.definition : null,
    resolve: (path: 'WANT' | 'NEED') => dispatch({ type: 'CRUX_RESOLVED', path }),
    avoid: () => dispatch({ type: 'CRUX_AVOIDED' })
  };
}
