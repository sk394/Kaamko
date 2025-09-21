import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveCurrentState,
  loadStoredData,
  saveSession,
  clearStoredData,
  getStorageKeys,
} from '../../utils/storage';
import { ClockState, SessionObject } from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  multiRemove: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('saveCurrentState', () => {
    test('saves clock state successfully', async () => {
      const state: ClockState = {
        isClocked: true,
        clockInTime: '2024-01-01T09:00:00.000Z',
      };

      mockAsyncStorage.setItem.mockResolvedValueOnce();

      await saveCurrentState(state);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'CLOCK_STATE',
        JSON.stringify(state)
      );
    });

    test('handles AsyncStorage errors', async () => {
      const state: ClockState = {
        isClocked: false,
        clockInTime: null,
      };

      mockAsyncStorage.setItem.mockRejectedValueOnce(
        new Error('Storage error')
      );

      await expect(saveCurrentState(state)).rejects.toThrow(
        'Failed to save clock state'
      );
    });
  });

  describe('loadStoredData', () => {
    test('loads valid data successfully', async () => {
      const clockState = {
        isClocked: true,
        clockInTime: '2024-01-01T09:00:00.000Z',
      };
      const sessions: SessionObject[] = [
        {
          id: 'test-id',
          date: '2024-01-01',
          clockIn: '2024-01-01T09:00:00.000Z',
          clockOut: '2024-01-01T17:00:00.000Z',
          hours: 8,
        },
      ];

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(clockState))
        .mockResolvedValueOnce(JSON.stringify(sessions));

      const result = await loadStoredData();

      expect(result.clockState).toEqual(clockState);
      expect(result.sessions).toEqual(sessions);
    });

    test('returns defaults when no data exists', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await loadStoredData();

      expect(result.clockState).toEqual({
        isClocked: false,
        clockInTime: null,
      });
      expect(result.sessions).toEqual([]);
    });

    test('handles invalid JSON data', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('invalid-json')
        .mockResolvedValueOnce('invalid-json');

      const result = await loadStoredData();

      expect(result.clockState).toEqual({
        isClocked: false,
        clockInTime: null,
      });
      expect(result.sessions).toEqual([]);
    });

    test('validates and sanitizes loaded data', async () => {
      const invalidClockState = { isClocked: 'true', clockInTime: 'invalid' };
      const invalidSessions = [
        {
          id: 'valid',
          date: '2024-01-01',
          clockIn: '2024-01-01T09:00:00.000Z',
          clockOut: '2024-01-01T17:00:00.000Z',
          hours: 8,
        },
        {
          id: '',
          date: '2024-01-01',
          clockIn: '2024-01-01T09:00:00.000Z',
          clockOut: '2024-01-01T17:00:00.000Z',
          hours: 8,
        },
      ];

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(invalidClockState))
        .mockResolvedValueOnce(JSON.stringify(invalidSessions));

      const result = await loadStoredData();

      expect(result.clockState).toEqual({
        isClocked: false,
        clockInTime: null,
      });
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].id).toBe('valid');
    });

    test('handles AsyncStorage errors', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await loadStoredData();

      expect(result.clockState).toEqual({
        isClocked: false,
        clockInTime: null,
      });
      expect(result.sessions).toEqual([]);
    });
  });

  describe('saveSession', () => {
    const validSession: SessionObject = {
      id: 'test-id',
      date: '2024-01-01',
      clockIn: '2024-01-01T09:00:00.000Z',
      clockOut: '2024-01-01T17:00:00.000Z',
      hours: 8,
    };

    test('saves new session successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null); // no existing sessions
      mockAsyncStorage.setItem.mockResolvedValueOnce();

      await saveSession(validSession);

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('WORK_SESSIONS');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'WORK_SESSIONS',
        JSON.stringify([validSession])
      );
    });

    test('adds session to existing sessions at the beginning', async () => {
      const existingSession: SessionObject = {
        id: 'existing-id',
        date: '2024-01-02',
        clockIn: '2024-01-02T09:00:00.000Z',
        clockOut: '2024-01-02T17:00:00.000Z',
        hours: 8,
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify([existingSession])
      );
      mockAsyncStorage.setItem.mockResolvedValueOnce();

      await saveSession(validSession);

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('WORK_SESSIONS');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'WORK_SESSIONS',
        JSON.stringify([validSession, existingSession])
      );
    });

    test('limits sessions to 100 entries', async () => {
      // Create 100 existing sessions
      const existingSessions: SessionObject[] = Array.from(
        { length: 100 },
        (_, i) => ({
          id: `session-${i}`,
          date: '2024-01-01',
          clockIn: '2024-01-01T09:00:00.000Z',
          clockOut: '2024-01-01T17:00:00.000Z',
          hours: 8,
        })
      );

      mockAsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify(existingSessions)
      );
      mockAsyncStorage.setItem.mockResolvedValueOnce();

      await saveSession(validSession);

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      const savedSessions = JSON.parse(
        (mockAsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );

      expect(savedSessions).toHaveLength(100);
      expect(savedSessions[0]).toEqual(validSession);
      expect(savedSessions[99].id).toBe('session-98'); // Last session should be session-98 (0-99, but we removed session-99)
    });

    test('handles AsyncStorage errors', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(
        new Error('Storage error')
      );

      await expect(saveSession(validSession)).rejects.toThrow(
        'Failed to save work session'
      );
    });
  });

  describe('clearStoredData', () => {
    test('clears all stored data successfully', async () => {
      mockAsyncStorage.multiRemove.mockResolvedValueOnce();

      await clearStoredData();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'CLOCK_STATE',
        'WORK_SESSIONS',
      ]);
    });

    test('handles AsyncStorage errors', async () => {
      mockAsyncStorage.multiRemove.mockRejectedValueOnce(
        new Error('Storage error')
      );

      await expect(clearStoredData()).rejects.toThrow(
        'Failed to clear stored data'
      );
    });
  });

  describe('getStorageKeys', () => {
    test('returns storage keys', () => {
      const keys = getStorageKeys();
      expect(keys).toEqual({
        CLOCK_STATE_KEY: 'CLOCK_STATE',
        WORK_SESSIONS_KEY: 'WORK_SESSIONS',
      });
    });
  });
});
