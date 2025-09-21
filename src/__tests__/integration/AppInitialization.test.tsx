import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../../App';
import { SessionObject } from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('App Initialization Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('App initialization with empty storage', () => {
    it('should initialize with default state when no data in storage', async () => {
      // Mock empty storage
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const { getByText, queryByText } = render(<App />);

      // Should show loading initially
      expect(getByText('Loading...')).toBeTruthy();

      // Wait for initialization to complete
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should show default state
      expect(getByText('Time Tracker')).toBeTruthy();
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
      expect(getByText('No work sessions yet')).toBeTruthy();

      // Verify AsyncStorage was called for both keys
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('CLOCK_STATE');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('WORK_SESSIONS');
    });
  });

  describe('App initialization with existing clock state', () => {
    it('should restore clocked-in state from storage', async () => {
      const clockInTime = '2024-01-01T09:00:00.000Z';
      const mockClockState = {
        isClocked: true,
        clockInTime,
      };

      // Mock storage with clocked-in state
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve(JSON.stringify(mockClockState));
        }
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      // Wait for initialization to complete
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should show clocked-in state (time may vary due to timezone)
      expect(getByText(/Clocked In at \d{1,2}:\d{2} [AP]M/)).toBeTruthy();
      expect(getByText('Clock Out')).toBeTruthy();
      expect(queryByText('Clock In')).toBeNull();
    });

    it('should handle invalid clock state data gracefully', async () => {
      // Mock storage with invalid data
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve('invalid json');
        }
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      // Wait for initialization to complete
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should show default state despite invalid data
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
    });
  });

  describe('App initialization with existing sessions', () => {
    it('should restore session history from storage', async () => {
      const mockSessions: SessionObject[] = [
        {
          id: 'session-1',
          date: '2024-01-01',
          clockIn: '2024-01-01T09:00:00.000Z',
          clockOut: '2024-01-01T17:00:00.000Z',
          hours: 8,
        },
        {
          id: 'session-2',
          date: '2023-12-31',
          clockIn: '2023-12-31T10:00:00.000Z',
          clockOut: '2023-12-31T18:30:00.000Z',
          hours: 8.5,
        },
      ];

      // Mock storage with sessions
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve(null);
        }
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      // Wait for initialization to complete
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should show session history (dates may vary due to timezone)
      expect(getByText(/Jan 1|Dec 31/)).toBeTruthy();
      expect(getByText(/8\.00\s+hrs/)).toBeTruthy();
      expect(getByText(/8\.50\s+hrs/)).toBeTruthy();
    });

    it('should filter out invalid sessions during initialization', async () => {
      const mockSessionsWithInvalid = [
        {
          id: 'session-1',
          date: '2024-01-01',
          clockIn: '2024-01-01T09:00:00.000Z',
          clockOut: '2024-01-01T17:00:00.000Z',
          hours: 8,
        },
        {
          // Invalid session - missing required fields
          id: 'session-2',
          date: '2023-12-31',
        },
        {
          // Invalid session - negative hours
          id: 'session-3',
          date: '2023-12-30',
          clockIn: '2023-12-30T09:00:00.000Z',
          clockOut: '2023-12-30T17:00:00.000Z',
          hours: -1,
        },
      ];

      // Mock storage with mixed valid/invalid sessions
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve(null);
        }
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessionsWithInvalid));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      // Wait for initialization to complete
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should only show valid session (date may vary due to timezone)
      expect(getByText(/Jan 1|Dec 31/)).toBeTruthy();
      expect(getByText(/8\.00\s+hrs/)).toBeTruthy();

      // Should not show invalid sessions (negative hours)
      expect(queryByText(/-1/)).toBeNull();
    });
  });

  describe('App initialization error handling', () => {
    it('should handle AsyncStorage read failures gracefully', async () => {
      // Mock AsyncStorage to throw error
      mockAsyncStorage.getItem.mockRejectedValue(
        new Error('Storage unavailable')
      );

      const { getByText, queryByText } = render(<App />);

      // Wait for initialization to complete
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should show default state despite storage error
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
      expect(getByText('No work sessions yet')).toBeTruthy();
    });

    it('should handle corrupted JSON data gracefully', async () => {
      // Mock storage with corrupted JSON
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve('{invalid json}');
        }
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve('[{invalid json}]');
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      // Wait for initialization to complete
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should show default state despite corrupted data
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
      expect(getByText('No work sessions yet')).toBeTruthy();
    });
  });

  describe('Complete app restart scenarios', () => {
    it('should maintain state consistency across app restarts', async () => {
      const clockInTime = '2024-01-01T09:00:00.000Z';
      const mockClockState = {
        isClocked: true,
        clockInTime,
      };
      const mockSessions: SessionObject[] = [
        {
          id: 'session-1',
          date: '2023-12-31',
          clockIn: '2023-12-31T09:00:00.000Z',
          clockOut: '2023-12-31T17:00:00.000Z',
          hours: 8,
        },
      ];

      // Mock storage with both clock state and sessions
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve(JSON.stringify(mockClockState));
        }
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      // Wait for initialization to complete
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should restore both clock state and session history
      expect(getByText(/Clocked In at \d{1,2}:\d{2} [AP]M/)).toBeTruthy();
      expect(getByText('Clock Out')).toBeTruthy();
      expect(getByText(/Dec 31|Dec 30/)).toBeTruthy();
      expect(getByText(/8\.00\s+hrs/)).toBeTruthy();
    });
  });
});
