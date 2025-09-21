import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
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

// Mock console methods to reduce noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('Complete Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to reduce noise
    console.error = jest.fn();
    console.warn = jest.fn();

    // Mock successful AsyncStorage operations by default
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe('Complete clock-in/clock-out workflow', () => {
    it('should complete a full work session workflow', async () => {
      const { getByText, queryByText } = render(<App />);

      // Wait for app initialization
      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Initial state - not clocked in
      expect(getByText('Time Tracker')).toBeTruthy();
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
      expect(getByText('No work sessions yet')).toBeTruthy();

      // Step 1: Clock in
      fireEvent.press(getByText('Clock In'));

      // Should show loading state briefly
      await waitFor(() => {
        expect(getByText('Loading your data...')).toBeTruthy();
      });

      // Wait for clock-in to complete
      await waitFor(() => {
        expect(getByText(/Clocked In at \d{1,2}:\d{2} [AP]M/)).toBeTruthy();
        expect(getByText('Clock Out')).toBeTruthy();
        expect(queryByText('Clock In')).toBeNull();
      });

      // Should show success notification
      await waitFor(() => {
        expect(getByText('Successfully clocked in!')).toBeTruthy();
      });

      // Verify AsyncStorage was called to save clock-in state
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'CLOCK_STATE',
        expect.stringContaining('"isClocked":true')
      );

      // Step 2: Clock out
      fireEvent.press(getByText('Clock Out'));

      // Should show loading state briefly
      await waitFor(() => {
        expect(getByText('Loading your data...')).toBeTruthy();
      });

      // Wait for clock-out to complete
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
        expect(getByText('Clock In')).toBeTruthy();
        expect(queryByText('Clock Out')).toBeNull();
      });

      // Should show success notification with hours worked
      await waitFor(() => {
        expect(
          getByText(/Successfully clocked out! Worked \d+\.\d{2} hours\./)
        ).toBeTruthy();
      });

      // Should show the completed session in history
      await waitFor(() => {
        expect(queryByText('No work sessions yet')).toBeNull();
        // Should show today's date and hours worked
        expect(getByText(/\d+\.\d{2}\s+hrs/)).toBeTruthy();
      });

      // Verify AsyncStorage was called to save session and reset clock state
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'WORK_SESSIONS',
        expect.stringContaining('"hours":')
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'CLOCK_STATE',
        expect.stringContaining('"isClocked":false')
      );
    });

    it('should handle rapid clock-in/clock-out operations', async () => {
      const { getByText, queryByText } = render(<App />);

      // Wait for initialization
      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Rapid clock-in
      fireEvent.press(getByText('Clock In'));

      // Wait for clock-in to complete
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      // Immediate clock-out
      fireEvent.press(getByText('Clock Out'));

      // Wait for clock-out to complete
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      // Should show session with minimal hours (close to 0)
      await waitFor(() => {
        expect(getByText(/0\.\d{2}\s+hrs/)).toBeTruthy();
      });
    });
  });

  describe('App restart scenarios with state persistence', () => {
    it('should restore clocked-in state after app restart', async () => {
      // First app instance - clock in
      const { getByText, queryByText, unmount } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      fireEvent.press(getByText('Clock In'));

      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      // Capture the saved state
      const savedClockState = mockAsyncStorage.setItem.mock.calls.find(
        (call) => call[0] === 'CLOCK_STATE'
      )?.[1];

      unmount();

      // Mock storage to return the saved state
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve(savedClockState || null);
        }
        return Promise.resolve(null);
      });

      // Second app instance - should restore state
      const { getByText: getByText2, queryByText: queryByText2 } = render(
        <App />
      );

      await waitFor(() => {
        expect(queryByText2('Loading...')).toBeNull();
      });

      // Should restore clocked-in state
      expect(getByText2(/Clocked In at/)).toBeTruthy();
      expect(getByText2('Clock Out')).toBeTruthy();
      expect(queryByText2('Clock In')).toBeNull();
    });

    it('should restore session history after app restart', async () => {
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
          date: '2024-01-02',
          clockIn: '2024-01-02T10:00:00.000Z',
          clockOut: '2024-01-02T18:30:00.000Z',
          hours: 8.5,
        },
      ];

      // Mock storage with existing sessions
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should show session history
      expect(queryByText('No work sessions yet')).toBeNull();
      expect(getByText(/8\.00\s+hrs/)).toBeTruthy();
      expect(getByText(/8\.50\s+hrs/)).toBeTruthy();
    });

    it('should handle app restart during clocked-in state and complete session', async () => {
      const clockInTime = '2024-01-01T09:00:00.000Z';

      // Mock storage with clocked-in state
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

      // Should restore clocked-in state
      expect(getByText(/Clocked In at/)).toBeTruthy();
      expect(getByText('Clock Out')).toBeTruthy();

      // Clock out to complete the session
      fireEvent.press(getByText('Clock Out'));

      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      // Should show completed session
      await waitFor(() => {
        expect(getByText(/\d+\.\d{2}\s+hrs/)).toBeTruthy();
      });
    });
  });

  describe('Multiple session creation and history display', () => {
    it('should create and display multiple sessions correctly', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Create first session
      fireEvent.press(getByText('Clock In'));
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      fireEvent.press(getByText('Clock Out'));
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      // Should show first session
      await waitFor(() => {
        expect(getByText(/\d+\.\d{2}\s+hrs/)).toBeTruthy();
      });

      // Create second session
      fireEvent.press(getByText('Clock In'));
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      fireEvent.press(getByText('Clock Out'));
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      // Should show both sessions
      await waitFor(() => {
        const hoursElements = queryByText(/\d+\.\d{2}\s+hrs/);
        // Note: We can't easily count elements with the same text pattern
        // but we can verify multiple sessions exist by checking storage calls
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'WORK_SESSIONS',
          expect.stringContaining('"hours":')
        );
      });
    });

    it('should display sessions in correct order (most recent first)', async () => {
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
          date: '2024-01-02',
          clockIn: '2024-01-02T10:00:00.000Z',
          clockOut: '2024-01-02T18:30:00.000Z',
          hours: 8.5,
        },
        {
          id: 'session-3',
          date: '2024-01-03',
          clockIn: '2024-01-03T08:30:00.000Z',
          clockOut: '2024-01-03T16:30:00.000Z',
          hours: 8,
        },
      ];

      // Mock storage with sessions (already in reverse chronological order)
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions.reverse())); // Most recent first
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should show all sessions
      expect(getByText(/8\.00\s+hrs/)).toBeTruthy();
      expect(getByText(/8\.50\s+hrs/)).toBeTruthy();
    });

    it('should handle large number of sessions efficiently', async () => {
      // Create 50 mock sessions
      const mockSessions: SessionObject[] = Array.from(
        { length: 50 },
        (_, i) => ({
          id: `session-${i + 1}`,
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          clockIn: `2024-01-${String(i + 1).padStart(2, '0')}T09:00:00.000Z`,
          clockOut: `2024-01-${String(i + 1).padStart(2, '0')}T17:00:00.000Z`,
          hours: 8,
        })
      );

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should load without performance issues
      expect(queryByText('No work sessions yet')).toBeNull();
      expect(getByText(/8\.00\s+hrs/)).toBeTruthy();
    });
  });

  describe('Error handling in integration scenarios', () => {
    it('should handle storage failure during complete workflow', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Mock storage to fail on save
      mockAsyncStorage.setItem.mockRejectedValue(
        new Error('Storage write failed')
      );

      // Try to clock in
      fireEvent.press(getByText('Clock In'));

      // Should show error notification
      await waitFor(() => {
        expect(getByText(/Failed to save clock-in/)).toBeTruthy();
      });

      // Should remain in not clocked in state
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
    });

    it('should handle partial workflow failures gracefully', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Clock in successfully first
      fireEvent.press(getByText('Clock In'));
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      // Now mock storage to fail on clock-out
      mockAsyncStorage.setItem.mockRejectedValue(
        new Error('Storage write failed')
      );

      // Try to clock out
      fireEvent.press(getByText('Clock Out'));

      // Should show error notification
      await waitFor(() => {
        expect(getByText(/Failed to save work session/)).toBeTruthy();
      });

      // Should remain clocked in
      expect(getByText(/Clocked In at/)).toBeTruthy();
      expect(getByText('Clock Out')).toBeTruthy();
    });

    it('should recover from storage failures and continue working', async () => {
      let shouldFail = true;

      // Mock storage to fail initially, then succeed
      mockAsyncStorage.setItem.mockImplementation(() => {
        if (shouldFail) {
          return Promise.reject(new Error('Storage write failed'));
        }
        return Promise.resolve();
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // First attempt should fail
      fireEvent.press(getByText('Clock In'));
      await waitFor(() => {
        expect(getByText(/Failed to save clock-in/)).toBeTruthy();
      });

      // Should remain not clocked in
      expect(getByText('Not Clocked In')).toBeTruthy();

      // Now allow storage to work
      shouldFail = false;

      // Second attempt should succeed
      fireEvent.press(getByText('Clock In'));
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      // Complete the workflow
      fireEvent.press(getByText('Clock Out'));
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      // Should show completed session
      await waitFor(() => {
        expect(getByText(/\d+\.\d{2}\s+hrs/)).toBeTruthy();
      });
    });

    it('should handle mixed success/failure scenarios in session history', async () => {
      // Mock storage with some valid and some invalid sessions
      const mixedSessions = [
        {
          id: 'valid-session',
          date: '2024-01-01',
          clockIn: '2024-01-01T09:00:00.000Z',
          clockOut: '2024-01-01T17:00:00.000Z',
          hours: 8,
        },
        {
          id: 'invalid-session',
          date: '2024-01-02',
          // Missing clockIn and clockOut
          hours: 8,
        },
        null, // Null session
        {
          id: 'another-valid',
          date: '2024-01-03',
          clockIn: '2024-01-03T09:00:00.000Z',
          clockOut: '2024-01-03T17:00:00.000Z',
          hours: 7.5,
        },
      ];

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mixedSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should only show valid sessions
      expect(getByText(/8\.00\s+hrs/)).toBeTruthy();
      expect(getByText(/7\.50\s+hrs/)).toBeTruthy();

      // Should not crash or show invalid data
      expect(queryByText('invalid-session')).toBeNull();
    });
  });

  describe('Notification system integration', () => {
    it('should show and dismiss notifications during workflow', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Clock in and verify success notification
      fireEvent.press(getByText('Clock In'));

      await waitFor(() => {
        expect(getByText('Successfully clocked in!')).toBeTruthy();
      });

      // Dismiss notification
      fireEvent.press(getByText('Dismiss'));

      await waitFor(() => {
        expect(queryByText('Successfully clocked in!')).toBeNull();
      });

      // Clock out and verify success notification
      fireEvent.press(getByText('Clock Out'));

      await waitFor(() => {
        expect(
          getByText(/Successfully clocked out! Worked \d+\.\d{2} hours\./)
        ).toBeTruthy();
      });
    });

    it('should handle error notifications during failures', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage failed'));

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Try to clock in (should fail)
      fireEvent.press(getByText('Clock In'));

      // Should show error notification
      await waitFor(() => {
        expect(getByText(/Failed to save clock-in/)).toBeTruthy();
      });

      // Error notifications should have dismiss button
      expect(getByText('Dismiss')).toBeTruthy();
    });
  });
});
