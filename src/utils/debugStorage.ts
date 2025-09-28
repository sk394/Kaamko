import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadStoredSessions, getStorageKeys } from './storage';
import { SessionObject } from '../types';

export const createTestSessions = (): SessionObject[] => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  return [
    {
      id: 'test-session-1',
      date: today,
      clockIn: `${today}T09:00:00.000Z`,
      clockOut: `${today}T17:00:00.000Z`,
      hours: 8,
    },
    {
      id: 'test-session-2',
      date: yesterday,
      clockIn: `${yesterday}T10:00:00.000Z`,
      clockOut: `${yesterday}T18:30:00.000Z`,
      hours: 8.5,
    },
    {
      id: 'test-session-3',
      date: today,
      clockIn: `${today}T13:00:00.000Z`,
      clockOut: `${today}T15:00:00.000Z`,
      hours: 2,
    },
  ];
};

/**
 * Add test sessions to storage for debugging
 */
export const addTestSessions = async (): Promise<void> => {
  try {
    const { WORK_SESSIONS_KEY } = getStorageKeys();
    const testSessions = createTestSessions();

    console.log('Adding test sessions:', testSessions);
    await AsyncStorage.setItem(WORK_SESSIONS_KEY, JSON.stringify(testSessions));
    console.log('Test sessions added successfully');
  } catch (error) {
    console.error('Failed to add test sessions:', error);
    throw error;
  }
};

/**
 * Clear all sessions from storage
 */
export const clearAllSessions = async (): Promise<void> => {
  try {
    const { WORK_SESSIONS_KEY } = getStorageKeys();
    await AsyncStorage.removeItem(WORK_SESSIONS_KEY);
    console.log('All sessions cleared');
  } catch (error) {
    console.error('Failed to clear sessions:', error);
    throw error;
  }
};

/**
 * Debug function to inspect storage contents
 */
export const inspectStorage = async (): Promise<void> => {
  try {
    console.log('=== STORAGE INSPECTION ===');

    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('All AsyncStorage keys:', allKeys);

    // Get storage keys
    const { WORK_SESSIONS_KEY, CLOCK_STATE_KEY } = getStorageKeys();
    console.log('Expected keys:', { WORK_SESSIONS_KEY, CLOCK_STATE_KEY });

    // Check sessions
    const sessionsData = await AsyncStorage.getItem(WORK_SESSIONS_KEY);
    console.log('Raw sessions data:', sessionsData);

    if (sessionsData) {
      try {
        const parsedSessions = JSON.parse(sessionsData);
        console.log('Parsed sessions:', parsedSessions);
        console.log('Sessions count:', parsedSessions?.length || 0);
      } catch (parseError) {
        console.error('Failed to parse sessions data:', parseError);
      }
    }

    // Check clock state
    const clockData = await AsyncStorage.getItem(CLOCK_STATE_KEY);
    console.log('Raw clock data:', clockData);

    if (clockData) {
      try {
        const parsedClock = JSON.parse(clockData);
        console.log('Parsed clock state:', parsedClock);
      } catch (parseError) {
        console.error('Failed to parse clock data:', parseError);
      }
    }

    console.log('=== END INSPECTION ===');
  } catch (error) {
    console.error('Storage inspection failed:', error);
  }
};

/**
 * Test the loadStoredSessions function directly
 */
export const testLoadStoredSessions = async (): Promise<SessionObject[]> => {
  try {
    console.log('Testing loadStoredSessions function...');
    const sessions = await loadStoredSessions();
    console.log('loadStoredSessions result:', sessions);
    console.log('Sessions count:', sessions.length);
    return sessions;
  } catch (error) {
    console.error('loadStoredSessions test failed:', error);
    throw error;
  }
};

/**
 * Complete debug test - runs all debug functions
 */
export const runCompleteDebugTest = async (): Promise<void> => {
  try {
    console.log('🔍 Starting complete debug test...');

    // Step 1: Inspect current storage
    console.log('\n1. Inspecting current storage...');
    await inspectStorage();

    // Step 2: Test loading current sessions
    console.log('\n2. Testing current session loading...');
    const currentSessions = await testLoadStoredSessions();

    // Step 3: Add test sessions
    console.log('\n3. Adding test sessions...');
    await addTestSessions();

    // Step 4: Test loading after adding test sessions
    console.log('\n4. Testing session loading after adding test data...');
    const newSessions = await testLoadStoredSessions();

    // Step 5: Final inspection
    console.log('\n5. Final storage inspection...');
    await inspectStorage();

    console.log('\n✅ Complete debug test finished!');
    console.log(`Original sessions: ${currentSessions.length}`);
    console.log(`Sessions after test: ${newSessions.length}`);
  } catch (error) {
    console.error('❌ Complete debug test failed:', error);
    throw error;
  }
};

/**
 * Quick debug - just check what's in storage
 */
export const quickDebug = async (): Promise<{
  hasSessionsKey: boolean;
  sessionsCount: number;
  rawData: string | null;
  error?: string;
}> => {
  try {
    const { WORK_SESSIONS_KEY } = getStorageKeys();
    const allKeys = await AsyncStorage.getAllKeys();
    const hasSessionsKey = allKeys.includes(WORK_SESSIONS_KEY);
    const rawData = await AsyncStorage.getItem(WORK_SESSIONS_KEY);

    let sessionsCount = 0;
    if (rawData) {
      try {
        const parsed = JSON.parse(rawData);
        sessionsCount = Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        // Ignore parse errors for this quick check
      }
    }

    return {
      hasSessionsKey,
      sessionsCount,
      rawData,
    };
  } catch (error) {
    return {
      hasSessionsKey: false,
      sessionsCount: 0,
      rawData: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
