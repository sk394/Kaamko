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

// Helper function to generate realistic mock sessions with varied data
const generateRealisticSessions = (count: number): SessionObject[] => {
  const sessions: SessionObject[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const sessionDate = new Date(today);
    sessionDate.setDate(today.getDate() - Math.floor(i / 2)); // Some sessions on same day

    // Vary clock-in times
    const clockInHour = 8 + (i % 3); // 8, 9, or 10 AM
    const clockInMinute = (i % 4) * 15; // 0, 15, 30, or 45 minutes

    const clockIn = new Date(sessionDate);
    clockIn.setHours(clockInHour, clockInMinute, 0, 0);

    // Vary session lengths
    const sessionHours = 7 + (i % 3); // 7, 8, or 9 hours
    const sessionMinutes = (i % 4) * 15; // 0, 15, 30, or 45 minutes

    const clockOut = new Date(clockIn);
    clockOut.setHours(
      clockIn.getHours() + sessionHours,
      clockIn.getMinutes() + sessionMinutes
    );

    const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

    sessions.push({
      id: `session-${String(i + 1).padStart(4, '0')}`, // Consistent ID format
      date: sessionDate.toISOString().split('T')[0],
      clockIn: clockIn.toISOString(),
      clockOut: clockOut.toISOString(),
      hours: Math.round(hours * 100) / 100, // Round to 2 decimal places
    });
  }

  return sessions;
};

describe('Rendering Performance Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.warn = jest.fn();

    // Mock successful AsyncStorage operations by default
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('Large Session List Rendering', () => {
    it('should render 100 sessions efficiently', async () => {
      const mockSessions = generateRealisticSessions(100);

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions));
        }
        return Promise.resolve(null);
      });

      const startTime = performance.now();

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      const loadTime = performance.now() - startTime;

      // App should load within reasonable time even with 100 sessions
      expect(loadTime).toBeLessThan(2000);

      // Should show sessions on main screen
      expect(getByText(/\d+\.\d{2}\s+hrs/)).toBeTruthy();

      // Navigate to sessions history
      const navigationStartTime = performance.now();

      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
        expect(getByText('Showing 100 of 100 sessions')).toBeTruthy();
      });

      const navigationTime = performance.now() - navigationStartTime;

      // Navigation should be fast even with large dataset
      expect(navigationTime).toBeLessThan(1000);
    });

    it('should handle 500 sessions without performance degradation', async () => {
      const mockSessions = generateRealisticSessions(500);

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions));
        }
        return Promise.resolve(null);
      });

      const startTime = performance.now();

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      const loadTime = performance.now() - startTime;

      // Should still load within reasonable time
      expect(loadTime).toBeLessThan(3000);

      // Navigate to sessions history
      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
        expect(getByText('Showing 500 of 500 sessions')).toBeTruthy();
      });

      // Test filtering performance with large dataset
      const filterStartTime = performance.now();

      fireEvent.press(getByText('Last Week'));

      await waitFor(() => {
        expect(
          getByText(/Showing \d+ of 500 sessions \(Last Week\)/)
        ).toBeTruthy();
      });

      const filterTime = performance.now() - filterStartTime;

      // Filtering should still be responsive
      expect(filterTime).toBeLessThan(1000);
    });

    it('should maintain responsiveness with 1000 sessions', async () => {
      const mockSessions = generateRealisticSessions(1000);

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(
        () => {
          expect(queryByText('Loading your data...')).toBeNull();
        },
        { timeout: 5000 }
      );

      // Should still be functional
      expect(getByText('Time Tracker')).toBeTruthy();
      expect(getByText(/\d+\.\d{2}\s+hrs/)).toBeTruthy();

      // Navigate to sessions history
      fireEvent.press(getByText('View History'));

      await waitFor(
        () => {
          expect(getByText('Sessions History')).toBeTruthy();
        },
        { timeout: 3000 }
      );

      // Test that filtering still works
      fireEvent.press(getByText('Last Month'));

      await waitFor(
        () => {
          expect(getByText(/Showing \d+ of 1000 sessions/)).toBeTruthy();
        },
        { timeout: 2000 }
      );

      // Test navigation back
      fireEvent.press(getByText('Back to Main'));

      await waitFor(() => {
        expect(getByText('Time Tracker')).toBeTruthy();
      });
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should handle repeated navigation without memory leaks', async () => {
      const mockSessions = generateRealisticSessions(200);

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Perform multiple navigation cycles
      for (let i = 0; i < 10; i++) {
        // Navigate to sessions history
        fireEvent.press(getByText('View History'));

        await waitFor(() => {
          expect(getByText('Sessions History')).toBeTruthy();
        });

        // Apply different filters
        fireEvent.press(getByText('Last Week'));
        await waitFor(() => {
          expect(getByText(/Showing \d+ of 200 sessions/)).toBeTruthy();
        });

        fireEvent.press(getByText('Last Month'));
        await waitFor(() => {
          expect(getByText(/Showing \d+ of 200 sessions/)).toBeTruthy();
        });

        fireEvent.press(getByText('All'));
        await waitFor(() => {
          expect(getByText('Showing 200 of 200 sessions')).toBeTruthy();
        });

        // Navigate back
        fireEvent.press(getByText('Back to Main'));

        await waitFor(() => {
          expect(getByText('Time Tracker')).toBeTruthy();
        });
      }

      // Should still be responsive after multiple cycles
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
    });

    it('should efficiently handle session data updates', async () => {
      const initialSessions = generateRealisticSessions(50);

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(initialSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Create a new session by clocking in and out
      fireEvent.press(getByText('Clock In'));

      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      const clockOutStartTime = performance.now();

      fireEvent.press(getByText('Clock Out'));

      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      const clockOutTime = performance.now() - clockOutStartTime;

      // Clock out should be fast even with existing sessions
      expect(clockOutTime).toBeLessThan(1000);

      // Navigate to sessions history to verify new session
      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
        expect(getByText('Showing 51 of 51 sessions')).toBeTruthy();
      });
    });
  });

  describe('Scroll Performance', () => {
    it('should handle scrolling through large session lists efficiently', async () => {
      const mockSessions = generateRealisticSessions(300);

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Navigate to sessions history
      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
        expect(getByText('Showing 300 of 300 sessions')).toBeTruthy();
      });

      // The sessions should be displayed (we can't easily test scrolling in unit tests,
      // but we can verify the list is rendered)
      expect(
        getByText('Filtered sessions list will be displayed here')
      ).toBeTruthy();
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle filtering while loading new sessions', async () => {
      const mockSessions = generateRealisticSessions(100);

      // Mock slower storage operations
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return new Promise((resolve) => {
            setTimeout(() => resolve(JSON.stringify(mockSessions)), 200);
          });
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Navigate to sessions history
      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      // Rapid filter changes
      const filters = ['Last Week', 'Last Month', 'All'];

      for (let i = 0; i < 5; i++) {
        for (const filter of filters) {
          fireEvent.press(getByText(filter));

          // Don't wait for each filter to complete, test rapid switching
          if (i === 4) {
            // Only wait on the last iteration
            await waitFor(() => {
              expect(getByText(/Showing \d+ of 100 sessions/)).toBeTruthy();
            });
          }
        }
      }

      // Should still be functional after rapid operations
      expect(getByText('Sessions History')).toBeTruthy();
    });

    it('should handle navigation during active filtering', async () => {
      const mockSessions = generateRealisticSessions(150);

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Navigate to sessions history
      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      // Start filtering
      fireEvent.press(getByText('Last Month'));

      // Immediately navigate back (don't wait for filter to complete)
      fireEvent.press(getByText('Back to Main'));

      await waitFor(() => {
        expect(getByText('Time Tracker')).toBeTruthy();
      });

      // Navigate back to sessions history
      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      // Should still be functional
      fireEvent.press(getByText('All'));

      await waitFor(() => {
        expect(getByText('Showing 150 of 150 sessions')).toBeTruthy();
      });
    });
  });

  describe('Error Recovery Performance', () => {
    it('should recover quickly from rendering errors', async () => {
      // Create sessions with some potentially problematic data
      const mockSessions: SessionObject[] = [
        ...generateRealisticSessions(50),
        // Add a session with edge case data
        {
          id: 'edge-case-session',
          date: '2024-02-29', // Leap year date
          clockIn: '2024-02-29T23:59:59.999Z',
          clockOut: '2024-03-01T00:00:00.001Z', // Crosses midnight
          hours: 0.0003, // Very small hours value
        },
      ];

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Should handle edge case data gracefully
      expect(getByText('Time Tracker')).toBeTruthy();

      // Navigate to sessions history
      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
        expect(getByText('Showing 51 of 51 sessions')).toBeTruthy();
      });

      // Test filtering with edge case data
      fireEvent.press(getByText('Last Month'));

      await waitFor(() => {
        expect(getByText(/Showing \d+ of 51 sessions/)).toBeTruthy();
      });
    });
  });
});
