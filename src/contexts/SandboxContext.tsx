import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

// Types
export interface Scenario {
  id: string;
  name: string;
  description?: string;
  modifications: Record<string, unknown>;
  results?: Record<string, unknown>;
  createdAt: Date;
  isBaseline?: boolean;
}

interface SandboxState {
  isActive: boolean;
  baselineData: Record<string, unknown>;
  scenarios: Scenario[];
  activeScenarioId: string | null;
}

type SandboxAction =
  | { type: 'ACTIVATE_SANDBOX'; payload: { baselineData: Record<string, unknown> } }
  | { type: 'DEACTIVATE_SANDBOX' }
  | { type: 'CREATE_SCENARIO'; payload: { name: string; description?: string } }
  | { type: 'DELETE_SCENARIO'; payload: { id: string } }
  | { type: 'SET_ACTIVE_SCENARIO'; payload: { id: string | null } }
  | { type: 'UPDATE_SCENARIO'; payload: { id: string; modifications: Record<string, unknown> } }
  | { type: 'SET_SCENARIO_RESULTS'; payload: { id: string; results: Record<string, unknown> } }
  | { type: 'RENAME_SCENARIO'; payload: { id: string; name: string; description?: string } }
  | { type: 'RESET' };

// Initial state
const initialState: SandboxState = {
  isActive: false,
  baselineData: {},
  scenarios: [],
  activeScenarioId: null,
};

// Reducer
function sandboxReducer(state: SandboxState, action: SandboxAction): SandboxState {
  switch (action.type) {
    case 'ACTIVATE_SANDBOX':
      return {
        ...state,
        isActive: true,
        baselineData: action.payload.baselineData,
        scenarios: [{
          id: 'baseline',
          name: 'Baseline',
          modifications: {},
          createdAt: new Date(),
          isBaseline: true,
        }],
        activeScenarioId: 'baseline',
      };

    case 'DEACTIVATE_SANDBOX':
      return initialState;

    case 'CREATE_SCENARIO':
      const newScenario: Scenario = {
        id: `scenario-${Date.now()}`,
        name: action.payload.name,
        description: action.payload.description,
        modifications: state.activeScenarioId && state.activeScenarioId !== 'baseline'
          ? { ...state.scenarios.find(s => s.id === state.activeScenarioId)?.modifications }
          : {},
        createdAt: new Date(),
      };
      return {
        ...state,
        scenarios: [...state.scenarios, newScenario],
        activeScenarioId: newScenario.id,
      };

    case 'DELETE_SCENARIO':
      if (action.payload.id === 'baseline') return state; // Can't delete baseline
      const filteredScenarios = state.scenarios.filter(s => s.id !== action.payload.id);
      return {
        ...state,
        scenarios: filteredScenarios,
        activeScenarioId: state.activeScenarioId === action.payload.id 
          ? 'baseline' 
          : state.activeScenarioId,
      };

    case 'SET_ACTIVE_SCENARIO':
      return {
        ...state,
        activeScenarioId: action.payload.id,
      };

    case 'UPDATE_SCENARIO':
      return {
        ...state,
        scenarios: state.scenarios.map(s => 
          s.id === action.payload.id
            ? { ...s, modifications: { ...s.modifications, ...action.payload.modifications } }
            : s
        ),
      };

    case 'SET_SCENARIO_RESULTS':
      return {
        ...state,
        scenarios: state.scenarios.map(s =>
          s.id === action.payload.id
            ? { ...s, results: action.payload.results }
            : s
        ),
      };

    case 'RENAME_SCENARIO':
      return {
        ...state,
        scenarios: state.scenarios.map(s =>
          s.id === action.payload.id
            ? { ...s, name: action.payload.name, description: action.payload.description ?? s.description }
            : s
        ),
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Context
interface SandboxContextValue {
  state: SandboxState;
  activateSandbox: (baselineData: Record<string, unknown>) => void;
  deactivateSandbox: () => void;
  createScenario: (name: string, description?: string) => void;
  deleteScenario: (id: string) => void;
  setActiveScenario: (id: string | null) => void;
  updateScenario: (modifications: Record<string, unknown>) => void;
  setScenarioResults: (results: Record<string, unknown>) => void;
  renameScenario: (id: string, name: string, description?: string) => void;
  getActiveScenario: () => Scenario | undefined;
  getMergedData: () => Record<string, unknown>;
  reset: () => void;
}

const SandboxContext = createContext<SandboxContextValue | undefined>(undefined);

// Provider
interface SandboxProviderProps {
  children: ReactNode;
}

export function SandboxProvider({ children }: SandboxProviderProps) {
  const [state, dispatch] = useReducer(sandboxReducer, initialState);

  const activateSandbox = useCallback((baselineData: Record<string, unknown>) => {
    dispatch({ type: 'ACTIVATE_SANDBOX', payload: { baselineData } });
    toast.info('Sandbox mode activated', {
      description: 'Changes will not be saved until you exit sandbox mode',
    });
  }, []);

  const deactivateSandbox = useCallback(() => {
    dispatch({ type: 'DEACTIVATE_SANDBOX' });
    toast.info('Sandbox mode deactivated');
  }, []);

  const createScenario = useCallback((name: string, description?: string) => {
    if (state.scenarios.length >= 5) {
      toast.error('Maximum 5 scenarios allowed');
      return;
    }
    dispatch({ type: 'CREATE_SCENARIO', payload: { name, description } });
    toast.success(`Scenario "${name}" created`);
  }, [state.scenarios.length]);

  const deleteScenario = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SCENARIO', payload: { id } });
    toast.success('Scenario deleted');
  }, []);

  const setActiveScenario = useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE_SCENARIO', payload: { id } });
  }, []);

  const updateScenario = useCallback((modifications: Record<string, unknown>) => {
    if (state.activeScenarioId) {
      dispatch({ 
        type: 'UPDATE_SCENARIO', 
        payload: { id: state.activeScenarioId, modifications } 
      });
    }
  }, [state.activeScenarioId]);

  const setScenarioResults = useCallback((results: Record<string, unknown>) => {
    if (state.activeScenarioId) {
      dispatch({
        type: 'SET_SCENARIO_RESULTS',
        payload: { id: state.activeScenarioId, results }
      });
    }
  }, [state.activeScenarioId]);

  const renameScenario = useCallback((id: string, name: string, description?: string) => {
    dispatch({ type: 'RENAME_SCENARIO', payload: { id, name, description } });
  }, []);

  const getActiveScenario = useCallback(() => {
    return state.scenarios.find(s => s.id === state.activeScenarioId);
  }, [state.scenarios, state.activeScenarioId]);

  const getMergedData = useCallback(() => {
    const activeScenario = getActiveScenario();
    if (!activeScenario) return state.baselineData;
    return { ...state.baselineData, ...activeScenario.modifications };
  }, [state.baselineData, getActiveScenario]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value: SandboxContextValue = {
    state,
    activateSandbox,
    deactivateSandbox,
    createScenario,
    deleteScenario,
    setActiveScenario,
    updateScenario,
    setScenarioResults,
    renameScenario,
    getActiveScenario,
    getMergedData,
    reset,
  };

  return (
    <SandboxContext.Provider value={value}>
      {children}
    </SandboxContext.Provider>
  );
}

// Hook
export function useSandbox() {
  const context = useContext(SandboxContext);
  if (!context) {
    throw new Error('useSandbox must be used within a SandboxProvider');
  }
  return context;
}
