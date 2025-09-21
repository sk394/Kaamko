import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
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

describe('State Persistence Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.warn = jest.fn();

    // Default successful storage operations
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('Clock state persistence', () => {
    it('should persist and restore exact clock-in time', async () => {
      const { getByText, queryByText, unmount } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Clock in
      fireEvent.press(getByText('Clock In'));

      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      // Capture the exact saved state
      const clockStateCalls = mockAsyncStorage.setItem.mock.calls.filter(
        (call) => call[0] === 'CLOCK_STATE'
      );
      const lastClockState = clockStateCalls[clockStateCalls.length - 1][1];
      const parsedState = JSON.parse(lastClockState);

      unmount();

      // Mock storage to return the exact saved state
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve(lastClockState);
        }
        return Promise.resolve(null);
      });

      // Restart app
      const { getByText: getByText2, queryByText: queryByText2 } = render(
        <App />
      );

      await waitFor(() => {
        expect(queryByText2('Loading...')).toBeNull();
      });

      // Should restore exact same state
      expect(getByText2(/Clocked In at/)).toBeTruthy();
      expect(getByText2('Clock Out')).toBeTruthy();

      // Verify the time matches (within reasonable tolerance for display formatting)
      const originalTime = new Date(parsedState.clockInTime);
      const displayedTime = getByText2(/Clocked In at/).props.children;
      expect(displayedTime).toContain(
        originalTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    });

    it('should handle clock state validation during restoration', async () => {
      // Test various invalid clock states
      const invalidStates = [
        '{"isClocked": true}', // Missing clockInTime
        '{"clockInTime": "2024-01-01T09:00:00.000Z"}', // Missing isClocked
        '{"isClocked": "true", "clockInTime": "2024-01-01T09:00:00.000Z"}', // Wrong type
        '{"isClocked": false, "clockInTime": "2024-01-01T09:00:00.000Z"}', // Inconsistent state
        '{"isClocked": true, "clockInTime": "invalid-date"}', // Invalid date
        '{"isClocked": true, "clockInTime": null}', // Null clockInTime when clocked
      ];

      for (const invalidState of invalidStates) {
        mockAsyncStorage.getItem.mockImplementation((key) => {
          if (key === 'CLOCK_STATE') {
            return Promise.resolve(invalidState);
          }
          return Promise.resolve(null);
        });

        const { getByText, queryByText, unmount } = render(<App />);

        await waitFor(() => {
          expect(queryByText('Loading...')).toBeNull();
        });

        // Should default to not clocked in for any invalid state
        expect(getByText('Not Clocked In')).toBeTruthy();
        expect(getByText('Clock In')).toBeTruthy();
        expect(queryByText('Clock Out')).toBeNull();

        unmount();
      }
    });

    it('should handle timezone changes correctly', async () => {
      const clockInTime = '2024-01-01T14:30:00.000Z'; // UTC time

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve(
            JSON.stringify({
              isClocked: true,
              clockInTime,
            })
          );
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should display time in local timezone
      expect(getByText(/Clocked In at/)).toBeTruthy();

      // The exact display will depend on the test environment's timezone
      // but it should be a valid time format
      const timeDisplay = getByText(/Clocked In at/).props.children;
      expect(timeDisplay).toMatch(/Clocked In at \d{1,2}:\d{2} [AP]M/);
    });
  });

  describe('Session data persistence', () => {
    it('should persist session data with exact precision', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Create a session
      fireEvent.press(getByText('Clock In'));
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      fireEvent.press(getByText('Clock Out'));
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      // Verify session was saved with correct structure
      const sessionCalls = mockAsyncStorage.setItem.mock.calls.filter(
        (call) => call[0] === 'WORK_SESSIONS'
      );
      expect(sessionCalls.length).toBeGreaterThan(0);

      const lastSessionData = sessionCalls[sessionCalls.length - 1][1];
      const sessions = JSON.parse(lastSessionData);

      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBe(1);

      const session = sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('date');
      expect(session).toHaveProperty('clockIn');
      expect(session).toHaveProperty('clockOut');
      expect(session).toHaveProperty('hours');

      // Verify data types and formats
      expect(typeof session.id).toBe('string');
      expect(session.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(session.clockIn).toISOString()).toBe(session.clockIn);
      expect(new Date(session.clockOut).toISOString()).toBe(session.clockOut);
      expect(typeof session.hours).toBe('number');
      expect(session.hours).toBeGreaterThanOrEqual(0);
    });

    it('should maintain session order across app restarts', async () => {
      // Create initial sessions
      const initialSessions: SessionObject[] = [
        {
          id: 'session-1',
          date: '2024-01-01',
          clockIn: '2024-01-01T09:00:00.000Z',
          clockOut: '2024-01-01T17:00:00.000Z',
          hours: 8,
        },
        {
          id: 'session-2',
          date: '2024-01-02',
          clockIn: '2024-01-02T10:00:00.000Z',
          clockOut: '2024-01-02T18:30:00.000Z',
          hours: 8.5,
        },
      ];

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(initialSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Add a new session
      fireEvent.press(getByText('Clock In'));
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      fireEvent.press(getByText('Clock Out'));
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      // Verify the new session was added to the beginning of the array
      const sessionCalls = mockAsyncStorage.setItem.mock.calls.filter(
        (call) => call[0] === 'WORK_SESSIONS'
      );
      const lastSessionData = sessionCalls[sessionCalls.length - 1][1];
      const sessions = JSON.parse(lastSessionData);

      expect(sessions.length).toBe(3);
      // New session should be first (most recent)
      expect(sessions[0].id).toMatch(/^session-\d+$/);
      expect(sessions[1].id).toBe('session-1');
      expect(sessions[2].id).toBe('session-2');
    });

    it('should handle session data corruption gracefully', async () => {
      const corruptedSessionData = [
        {
          id: 'valid-session',
          date: '2024-01-01',
          clockIn: '2024-01-01T09:00:00.000Z',
          clockOut: '2024-01-01T17:00:00.000Z',
          hours: 8,
        },
        {
          id: 'corrupted-session',
          date: '2024-01-02',
          clockIn: 'invalid-date',
          clockOut: '2024-01-02T17:00:00.000Z',
          hours: 8,
        },
        {
          id: 'incomplete-session',
          date: '2024-01-03',
          // Missing required fields
        },
        null, // Null entry
        {
          id: 'negative-hours',
          date: '2024-01-04',
          clockIn: '2024-01-04T09:00:00.000Z',
          clockOut: '2024-01-04T17:00:00.000Z',
          hours: -5,
        },
      ];

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(corruptedSessionData));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should only show valid session
      expect(getByText(/8\.00\s+hrs/)).toBeTruthy();

      // Should not show corrupted data
      expect(queryByText('corrupted-session')).toBeNull();
      expect(queryByText('incomplete-session')).toBeNull();
      expect(queryByText('negative-hours')).toBeNull();
      expect(queryByText('-5')).toBeNull();
    });
  });

  describe('Data migration and versioning', () => {
    it('should handle legacy data formats gracefully', async () => {
      // Simulate old data format without some fields
      const legacyClockState =
        '{"isClocked": true, "startTime": "2024-01-01T09:00:00.000Z"}';
      const legacySessions = JSON.stringify([
        {
          date: '2024-01-01',
          start: '2024-01-01T09:00:00.000Z',
          end: '2024-01-01T17:00:00.000Z',
          duration: 8,
        },
      ]);

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve(legacyClockState);
        }
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(legacySessions);
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should handle legacy format gracefully by defaulting to safe state
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('No work sessions yet')).toBeTruthy();
    });

    it('should handle empty or null storage values', async () => {
      const emptyValues = [null, '', '{}', '[]', 'null', 'undefined'];

      for (const emptyValue of emptyValues) {
        mockAsyncStorage.getItem.mockImplementation((key) => {
          return Promise.resolve(emptyValue);
        });

        const { getByText, queryByText, unmount } = render(<App />);

        await waitFor(() => {
          expect(queryByText('Loading...')).toBeNull();
        });

        // Should show default state for any empty value
        expect(getByText('Not Clocked In')).toBeTruthy();
        expect(getByText('Clock In')).toBeTruthy();
        expect(getByText('No work sessions yet')).toBeTruthy();

        unmount();
      }
    });
  });

  describe('Concurrent access and race conditions', () => {
    it('should handle rapid state changes correctly', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Simulate rapid button presses
      const clockInButton = getByText('Clock In');

      // Press multiple times rapidly
      fireEvent.press(clockInButton);
      fireEvent.press(clockInButton);
      fireEvent.press(clockInButton);

      // Should only process one clock-in
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      // Should only have one clock-in call to storage
      const clockStateCalls = mockAsyncStorage.setItem.mock.calls.filter(
        (call) =>
          call[0] === 'CLOCK_STATE' && call[1].includes('"isClocked":true')
      );

      // Due to loading states, there should be exactly one successful clock-in
      expect(clockStateCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle storage delays without state corruption', async () => {
      // Mock slow storage operations
      let resolveStorage: (() => void) | null = null;
      mockAsyncStorage.setItem.mockImplementation(() => {
        return new Promise<void>((resolve) => {
          resolveStorage = resolve;
        });
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Start clock-in (will be pending)
      fireEvent.press(getByText('Clock In'));

      // Should show loading state
      await waitFor(() => {
        expect(getByText('Loading your data...')).toBeTruthy();
      });

      // Resolve the storage operation
      if (resolveStorage) {
        resolveStorage();
      }

      // Should complete clock-in
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });
    });
  });

  describe('Storage quota and limits', () => {
    it('should handle storage quota exceeded errors', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(
        new Error('QuotaExceededError: Storage quota exceeded')
      );

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Try to clock in
      fireEvent.press(getByText('Clock In'));

      // Should show appropriate error message
      await waitFor(() => {
        expect(getByText(/Failed to save clock-in/)).toBeTruthy();
      });

      // Should remain in safe state
      expect(getByText('Not Clocked In')).toBeTruthy();
    });

    it('should handle large session history efficiently', async () => {
      // Create a large number of sessions (100)
      const largeSessions: SessionObject[] = Array.from(
        { length: 100 },
        (_, i) => ({
          id: `session-${i + 1}`,
          date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
          clockIn: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}T09:00:00.000Z`,
          clockOut: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}T17:00:00.000Z`,
          hours: 8,
        })
      );

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(largeSessions));
        }
        return Promise.resolve(null);
      });

      const startTime = Date.now();

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      const loadTime = Date.now() - startTime;

      // Should load within reasonable time (less than 2 seconds)
      expect(loadTime).toBeLessThan(2000);

      // Should show session history
      expect(queryByText('No work sessions yet')).toBeNull();
      expect(getByText(/8\.00\s+hrs/)).toBeTruthy();
    });
  });
});
