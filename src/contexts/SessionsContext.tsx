import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { loadStoredSessions } from '../utils/storage';
import { SessionObject } from '../types';

// Types
interface SessionsState {
  sessions: SessionObject[];
  loading: boolean;
  error: string | null;
}

type SessionsAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: SessionObject[] }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'ADD_SESSION'; payload: SessionObject }
  | { type: 'CLEAR_ERROR' };

interface SessionsContextType extends SessionsState {
  refreshSessions: () => Promise<void>;
  addSession: (session: SessionObject) => void;
  totalHours: number;
  sessionCount: number;
  clearError: () => void;
}

// Initial state
const initialState: SessionsState = {
  sessions: [],
  loading: true,
  error: null,
};

// Reducer
const sessionsReducer = (state: SessionsState, action: SessionsAction): SessionsState => {
  switch (action.type) {
    case 'LOAD_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        sessions: action.payload,
        loading: false,
        error: null,
      };
    case 'LOAD_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [action.payload, ...state.sessions],
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Context
const SessionsContext = createContext<SessionsContextType | undefined>(undefined);

// Provider Props
interface SessionsProviderProps {
  children: ReactNode;
}

/**
 * Sessions Context Provider
 * Provides sessions data and management functions to all child components
 */
export const SessionsProvider: React.FC<SessionsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(sessionsReducer, initialState);

  /**
   * Load sessions from storage
   */
  const loadSessions = async () => {
    try {
      dispatch({ type: 'LOAD_START' });
      const sessions = await loadStoredSessions();
      dispatch({ type: 'LOAD_SUCCESS', payload: sessions });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load sessions';
      dispatch({ type: 'LOAD_ERROR', payload: errorMessage });
    }
  };

  /**
   * Refresh sessions from storage
   */
  const refreshSessions = async () => {
    await loadSessions();
  };

  /**
   * Add a new session to the context (useful when a session is created)
   */
  const addSession = (session: SessionObject) => {
    dispatch({ type: 'ADD_SESSION', payload: session });
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Calculate derived values
  const totalHours = state.sessions.reduce((total, session) => total + session.hours, 0);
  const sessionCount = state.sessions.length;

  const contextValue: SessionsContextType = {
    ...state,
    refreshSessions,
    addSession,
    totalHours,
    sessionCount,
    clearError,
  };

  return (
    <SessionsContext.Provider value={contextValue}>
      {children}
    </SessionsContext.Provider>
  );
};

/**
 * Hook to use sessions context
 * Must be used within a SessionsProvider
 */
export const useSessionsContext = (): SessionsContextType => {
  const context = useContext(SessionsContext);
  if (context === undefined) {
    throw new Error('useSessionsContext must be used within a SessionsProvider');
  }
  return context;
};

/**
 * Hook to get filtered sessions from context
 */
import {
  getLastWeekDateRange,
  getLastMonthDateRange,
  getThisWeekDateRange,
  isDateInRange,
} from '../utils/timeUtils';

export const useFilteredSessionsContext = (
  filterType: 'all' | 'lastWeek' | 'lastMonth' | 'thisWeek' = 'all'
) => {
  const { sessions, totalHours: _, sessionCount: __, ...rest } = useSessionsContext();
  let filteredSessions = sessions;
  if (filterType === 'lastWeek') {
    const { startDate, endDate } = getLastWeekDateRange();
    filteredSessions = sessions.filter(s => isDateInRange(s.date, startDate, endDate));
  } else if (filterType === 'lastMonth') {
    const { startDate, endDate } = getLastMonthDateRange();
    filteredSessions = sessions.filter(s => isDateInRange(s.date, startDate, endDate));
  } else if (filterType === 'thisWeek') {
    const { startDate, endDate } = getThisWeekDateRange();
    filteredSessions = sessions.filter(s => isDateInRange(s.date, startDate, endDate));
  }
  const totalHours = filteredSessions.reduce((total, session) => total + session.hours, 0);
  return {
    sessions: filteredSessions,
    totalHours,
    sessionCount: filteredSessions.length,
    ...rest,
  };
};