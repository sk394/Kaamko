import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../../App';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('App Error Handling Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to reduce noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Storage failure scenarios', () => {
    it('should handle initialization storage failure gracefully', async () => {
      // Mock AsyncStorage to fail on read
      mockAsyncStorage.getItem.mockRejectedValue(
        new Error('Storage unavailable')
      );

      const { getByText, queryByText } = render(<App />);

      // Wait for initialization to complete
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should show default state despite storage error
      expect(getByText('Time Tracker')).toBeTruthy();
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
      expect(getByText('No work sessions yet')).toBeTruthy();

      // Should show error notification
      await waitFor(() => {
        expect(
          getByText('Failed to load saved data. Starting with fresh state.')
        ).toBeTruthy();
      });
    });

    it('should handle clock-in storage failure gracefully', async () => {
      // Mock successful initialization but failed save
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockAsyncStorage.setItem.mockRejectedValue(
        new Error('Storage write failed')
      );

      const { getByText, queryByText } = render(<App />);

      // Wait for initialization
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Try to clock in
      fireEvent.press(getByText('Clock In'));

      // Should revert to not clocked in state
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
        expect(getByText('Clock In')).toBeTruthy();
      });

      // Should show error notification
      await waitFor(() => {
        expect(getByText(/Failed to save clock-in/)).toBeTruthy();
      });
    });

    it('should handle clock-out storage failure gracefully', async () => {
      // Mock successful initialization with clocked-in state
      const clockInTime = '2024-01-01T09:00:00.000Z';
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

      // Mock save operations to fail
      mockAsyncStorage.setItem.mockRejectedValue(
        new Error('Storage write failed')
      );

      const { getByText, queryByText } = render(<App />);

      // Wait for initialization
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should be clocked in
      expect(getByText(/Clocked In at/)).toBeTruthy();
      expect(getByText('Clock Out')).toBeTruthy();

      // Try to clock out
      fireEvent.press(getByText('Clock Out'));

      // Should remain clocked in due to storage failure
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
        expect(getByText('Clock Out')).toBeTruthy();
      });

      // Should show error notification
      await waitFor(() => {
        expect(getByText(/Failed to save work session/)).toBeTruthy();
      });
    });

    it('should continue functioning with in-memory state after storage failures', async () => {
      // Mock storage to fail initially but succeed later
      let shouldFail = true;
      mockAsyncStorage.getItem.mockImplementation(() => {
        if (shouldFail) {
          return Promise.reject(new Error('Storage unavailable'));
        }
        return Promise.resolve(null);
      });

      mockAsyncStorage.setItem.mockImplementation(() => {
        if (shouldFail) {
          return Promise.reject(new Error('Storage write failed'));
        }
        return Promise.resolve();
      });

      const { getByText, queryByText } = render(<App />);

      // Wait for initialization
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should show default state
      expect(getByText('Not Clocked In')).toBeTruthy();

      // Try to clock in (should fail)
      fireEvent.press(getByText('Clock In'));

      await waitFor(() => {
        expect(getByText(/Failed to save clock-in/)).toBeTruthy();
      });

      // Should still be able to interact with UI
      expect(getByText('Clock In')).toBeTruthy();
      expect(getByText('Not Clocked In')).toBeTruthy();

      // Now allow storage to work
      shouldFail = false;

      // Try clock in again (should work now)
      fireEvent.press(getByText('Clock In'));

      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
        expect(getByText('Clock Out')).toBeTruthy();
      });
    });
  });

  describe('Data corruption scenarios', () => {
    it('should handle corrupted clock state data', async () => {
      // Mock corrupted JSON data
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve('{"isClocked": true, "clockInTime": invalid}');
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      // Wait for initialization
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should show default state despite corrupted data
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
    });

    it('should handle corrupted session data', async () => {
      // Mock corrupted session data
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve('[{"id": "test", invalid json}]');
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      // Wait for initialization
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should show empty session history despite corrupted data
      expect(getByText('No work sessions yet')).toBeTruthy();
    });

    it('should filter out invalid session objects', async () => {
      // Mock mixed valid and invalid session data
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
          // Missing required fields
        },
        {
          id: 'another-invalid',
          date: '2024-01-02',
          clockIn: '2024-01-02T09:00:00.000Z',
          clockOut: '2024-01-02T17:00:00.000Z',
          hours: -1, // Invalid negative hours
        },
      ];

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mixedSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      // Wait for initialization
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeNull();
      });

      // Should only show valid session
      expect(getByText(/Jan 1|Dec 31/)).toBeTruthy(); // Date may vary due to timezone
      expect(getByText(/8\.00\s+hrs/)).toBeTruthy();

      // Should not show invalid sessions
      expect(queryByText('invalid-session')).toBeNull();
      expect(queryByText('another-invalid')).toBeNull();
    });
  });

  describe('Error notification system', () => {
    it('should show and dismiss error notifications', async () => {
      // Mock storage failure
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { getByText, queryByText } = render(<App />);

      // Wait for error notification to appear
      await waitFor(() => {
        expect(
          getByText('Failed to load saved data. Starting with fresh state.')
        ).toBeTruthy();
      });

      // Should have dismiss button
      expect(getByText('Dismiss')).toBeTruthy();

      // Dismiss the error
      fireEvent.press(getByText('Dismiss'));

      // Error should disappear
      await waitFor(() => {
        expect(
          queryByText('Failed to load saved data. Starting with fresh state.')
        ).toBeNull();
      });
    });

    it('should auto-dismiss error notifications after timeout', async () => {
      // Mock storage failure
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { getByText, queryByText } = render(<App />);

      // Wait for error notification to appear
      await waitFor(() => {
        expect(
          getByText('Failed to load saved data. Starting with fresh state.')
        ).toBeTruthy();
      });

      // Wait for auto-dismiss (4 seconds + some buffer)
      await waitFor(
        () => {
          expect(
            queryByText('Failed to load saved data. Starting with fresh state.')
          ).toBeNull();
        },
        { timeout: 5000 }
      );
    });
  });
});
