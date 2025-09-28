import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveCurrentState, loadStoredData, saveSession, clearStoredData } from '../../utils/storage';
import { ClockState, SessionObject } from '../../types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  multiRemove: jest.fn(),
  multiSet: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Storage Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
        JSON.stringify({ isClocked: true, clockInTime: '2024-01-01T09:00:00.000Z' })
      );
    });
  });

  describe('loadStoredData', () => {
    test('loads valid data successfully', async () => {
      const mockClockState = { isClocked: true, clockInTime: '2024-01-01T09:00:00.000Z' };
      const mockSessions: SessionObject[] = [{
        id: 'test-1',
        date: '2024-01-01',
        clockIn: '2024-01-01T09:00:00.000Z',
        clockOut: '2024-01-01T17:00:00.000Z',
        hours: 8,
      }];

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(mockClockState))
        .mockResolvedValueOnce(JSON.stringify(mockSessions));

      const result = await loadStoredData();
      expect(result.clockState).toEqual(mockClockState);
      expect(result.sessions).toEqual(mockSessions);
    });

    test('returns defaults when no data exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      const result = await loadStoredData();
      
      expect(result.clockState).toEqual({ isClocked: false, clockInTime: null });
      expect(result.sessions).toEqual([]);
    });
  });

  describe('clearStoredData', () => {
    test('clears all stored data', async () => {
      mockAsyncStorage.multiRemove.mockResolvedValueOnce();
      await clearStoredData();
      
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'CLOCK_STATE',
        'WORK_SESSIONS',
      ]);
    });
  });
});
