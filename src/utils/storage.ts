// AsyncStorage wrapper functions
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClockState, SessionObject } from '../types';
import { validateClockState, validateSessionsArray } from './validation';
import {
  handleStorageError,
  safeAsyncOperation,
  retryOperation,
} from './errorHandling';
import { timeAsyncOperation } from './performance';

// Storage keys
const CLOCK_STATE_KEY = 'CLOCK_STATE';
const WORK_SESSIONS_KEY = 'WORK_SESSIONS';

/**
 * Save current clock state to AsyncStorage with retry logic
 * @param state - Clock state to save
 */
export const saveCurrentState = async (state: ClockState): Promise<void> => {
  const stateToSave = {
    isClocked: state.isClocked,
    clockInTime: state.clockInTime,
  };

  try {
    await timeAsyncOperation('save_clock_state', async () => {
      await retryOperation(
        () =>
          AsyncStorage.setItem(CLOCK_STATE_KEY, JSON.stringify(stateToSave)),
        2, // Max 2 retries for saves
        500 // 500ms base delay
      );
    });
  } catch (error) {
    const appError = handleStorageError(error as Error, 'save clock state');
    throw new Error(appError.message);
  }
};

/**
 * Load stored data from AsyncStorage with comprehensive error handling
 * @returns Object containing clock state and sessions
 */
export const loadStoredData = async (): Promise<{
  clockState: ClockState;
  sessions: SessionObject[];
}> => {
  const defaultResult = {
    clockState: { isClocked: false, clockInTime: null },
    sessions: [],
  };

  try {
    return await timeAsyncOperation('load_stored_data', async () => {
      // Load clock state with safe operation
      const clockState = await safeAsyncOperation(
        async () => {
          const clockStateData = await AsyncStorage.getItem(CLOCK_STATE_KEY);
          if (clockStateData) {
            const parsedState = JSON.parse(clockStateData);
            return validateClockState(parsedState);
          }
          return { isClocked: false, clockInTime: null };
        },
        { isClocked: false, clockInTime: null },
        'load clock state'
      );

      // Load sessions with safe operation
      const sessions = await safeAsyncOperation(
        async () => {
          const sessionsData = await AsyncStorage.getItem(WORK_SESSIONS_KEY);
          if (sessionsData) {
            const parsedSessions = JSON.parse(sessionsData);
            return validateSessionsArray(parsedSessions);
          }
          return [];
        },
        [],
        'load sessions'
      );

      return { clockState, sessions };
    });
  } catch (error) {
    // This should rarely happen due to safe operations, but just in case
    handleStorageError(error as Error, 'load stored data');
    return defaultResult;
  }
};

/**
 * Save a completed work session to AsyncStorage with retry logic
 * @param session - Session object to save
 */
export const saveSession = async (session: SessionObject): Promise<void> => {
  try {
    await retryOperation(
      async () => {
        // Load existing sessions safely
        const existingSessions = await safeAsyncOperation(
          async () => {
            const sessionsData = await AsyncStorage.getItem(WORK_SESSIONS_KEY);
            if (sessionsData) {
              const parsedSessions = JSON.parse(sessionsData);
              return validateSessionsArray(parsedSessions);
            }
            return [];
          },
          [],
          'load existing sessions for save'
        );

        // Add new session to the beginning of the array (most recent first)
        const updatedSessions = [session, ...existingSessions];

        // Limit to last 50 sessions for better performance (reduced from 100)
        // This prevents excessive memory usage and improves app performance
        const sessionsToSave = updatedSessions.slice(0, 50);

        await AsyncStorage.setItem(
          WORK_SESSIONS_KEY,
          JSON.stringify(sessionsToSave)
        );
      },
      2,
      500
    );
  } catch (error) {
    const appError = handleStorageError(error as Error, 'save work session');
    throw new Error(appError.message);
  }
};

/**
 * Batch save clock state and session data for better performance
 * Used when clocking out to save both operations atomically
 * @param clockState - New clock state to save
 * @param session - Session to add to history
 */
export const batchSaveClockOutData = async (
  clockState: ClockState,
  session: SessionObject
): Promise<void> => {
  try {
    await retryOperation(
      async () => {
        // Load existing sessions safely
        const existingSessions = await safeAsyncOperation(
          async () => {
            const sessionsData = await AsyncStorage.getItem(WORK_SESSIONS_KEY);
            if (sessionsData) {
              const parsedSessions = JSON.parse(sessionsData);
              return validateSessionsArray(parsedSessions);
            }
            return [];
          },
          [],
          'load existing sessions for batch save'
        );

        // Prepare data for batch operation
        const updatedSessions = [session, ...existingSessions];
        const sessionsToSave = updatedSessions.slice(0, 50);

        const stateToSave = {
          isClocked: clockState.isClocked,
          clockInTime: clockState.clockInTime,
        };

        // Use multiSet for atomic batch operation
        await AsyncStorage.multiSet([
          [CLOCK_STATE_KEY, JSON.stringify(stateToSave)],
          [WORK_SESSIONS_KEY, JSON.stringify(sessionsToSave)],
        ]);
      },
      2,
      500
    );
  } catch (error) {
    const appError = handleStorageError(
      error as Error,
      'batch save clock out data'
    );
    throw new Error(appError.message);
  }
};

/**
 * Clear all stored data (useful for testing or reset functionality)
 */
export const clearStoredData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([CLOCK_STATE_KEY, WORK_SESSIONS_KEY]);
  } catch (error) {
    console.error('Failed to clear stored data:', error);
    throw new Error('Failed to clear stored data');
  }
};

/**
 * Load only the stored sessions from AsyncStorage
 * Useful for components that only need session data
 * @returns Array of stored sessions
 */
export const loadStoredSessions = async (): Promise<SessionObject[]> => {
  try {
    return await timeAsyncOperation('load_stored_sessions', async () => {
      return await safeAsyncOperation(
        async () => {
          const sessionsData = await AsyncStorage.getItem(WORK_SESSIONS_KEY);
          if (sessionsData) {
            const parsedSessions = JSON.parse(sessionsData);
            return validateSessionsArray(parsedSessions);
          }
          return [];
        },
        [],
        'load sessions only'
      );
    });
  } catch (error) {
    handleStorageError(error as Error, 'load stored sessions');
    return [];
  }
};

/**
 * Get storage keys for testing purposes
 */
export const getStorageKeys = () => ({
  CLOCK_STATE_KEY,
  WORK_SESSIONS_KEY,
});
