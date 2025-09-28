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

// Performance measurement utilities
const measurePerformance = async (
  operation: () => Promise<void>
): Promise<number> => {
  const startTime = performance.now();
  await operation();
  return performance.now() - startTime;
};

// Generate sessions with realistic distribution
const generateSessionsWithDistribution = (count: number): SessionObject[] => {
  const sessions: SessionObject[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    // Create realistic date distribution
    let daysBack: number;
    if (i < count * 0.1) {
      // 10% from last week
      daysBack = Math.floor(Math.random() * 7);
    } else if (i < count * 0.3) {
      // 20% from last month (excluding last week)
      daysBack = 7 + Math.floor(Math.random() * 23);
    } else {
      // 70% older than last month
      daysBack = 30 + Math.floor(Math.random() * 335);
    }

    const sessionDate = new Date(today);
    sessionDate.setDate(today.getDate() - daysBack);

    const clockIn = new Date(sessionDate);
    clockIn.setHours(
      8 + Math.floor(Math.random() * 3),
      Math.floor(Math.random() * 60)
    );

    const sessionLength = 6 + Math.random() * 4; // 6-10 hours
    const clockOut = new Date(
      clockIn.getTime() + sessionLength * 60 * 60 * 1000
    );

    sessions.push({
      id: `session-${String(i + 1).padStart(4, '0')}`,
      date: sessionDate.toISOString().split('T')[0],
      clockIn: clockIn.toISOString(),
      clockOut: clockOut.toISOString(),
      hours: Math.round(sessionLength * 100) / 100,
    });
  }

  return sessions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

describe('Comprehensive Performance Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.warn = jest.fn();

    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('Task 12.1: Integration Tests for Navigation Flow', () => {
    it('should complete full navigation workflow within performance thresholds', async () => {
      const mockSessions = generateSessionsWithDistribution(100);

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      // Test app initialization performance
      const initTime = await measurePerformance(async () => {
        await waitFor(() => {
          expect(queryByText('Loading your data...')).toBeNull();
        });
      });

      expect(initTime).toBeLessThan(2000); // App should initialize within 2 seconds

      // Test navigation to sessions history
      const navigationTime = await measurePerformance(async () => {
        fireEvent.press(getByText('View History'));
        await waitFor(() => {
          expect(getByText('Sessions History')).toBeTruthy();
        });
      });

      expect(navigationTime).toBeLessThan(500); // Navigation should be under 500ms

      // Test back navigation
      const backNavigationTime = await measurePerformance(async () => {
        fireEvent.press(getByText('Back to Main'));
        await waitFor(() => {
          expect(getByText('Time Tracker')).toBeTruthy();
        });
      });

      expect(backNavigationTime).toBeLessThan(300); // Back navigation should be faster

      // Test state persistence during navigation
      fireEvent.press(getByText('Clock In'));
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      // Navigate while clocked in
      fireEvent.press(getByText('View History'));
      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      fireEvent.press(getByText('Back to Main'));
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy(); // State should persist
      });
    });

    it('should handle complex navigation patterns efficiently', async () => {
      const mockSessions = generateSessionsWithDistribution(50);

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

      // Test rapid navigation pattern
      const rapidNavigationTime = await measurePerformance(async () => {
        for (let i = 0; i < 5; i++) {
          fireEvent.press(getByText('View History'));
          await waitFor(() => {
            expect(getByText('Sessions History')).toBeTruthy();
          });

          fireEvent.press(getByText('Back to Main'));
          await waitFor(() => {
            expect(getByText('Time Tracker')).toBeTruthy();
          });
        }
      });

      // Rapid navigation should complete within reasonable time
      expect(rapidNavigationTime).toBeLessThan(3000);

      // App should remain functional after rapid navigation
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
    });
  });

  describe('Task 12.2: Filtering Functionality with Various Session Datasets', () => {
    it('should filter small datasets (10-50 sessions) efficiently', async () => {
      const mockSessions = generateSessionsWithDistribution(25);

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

      fireEvent.press(getByText('View History'));
      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      // Test filter performance
      const filterTime = await measurePerformance(async () => {
        fireEvent.press(getByText('Last Week'));
        await waitFor(() => {
          expect(
            getByText(/Showing \d+ of 25 sessions \(Last Week\)/)
          ).toBeTruthy();
        });
      });

      expect(filterTime).toBeLessThan(100); // Small datasets should filter very quickly

      // Test filter switching
      const switchTime = await measurePerformance(async () => {
        fireEvent.press(getByText('Last Month'));
        await waitFor(() => {
          expect(
            getByText(/Showing \d+ of 25 sessions \(Last Month\)/)
          ).toBeTruthy();
        });
      });

      expect(switchTime).toBeLessThan(100);
    });

    it('should filter medium datasets (100-500 sessions) efficiently', async () => {
      const mockSessions = generateSessionsWithDistribution(250);

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

      fireEvent.press(getByText('View History'));
      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      // Test filter performance with medium dataset
      const filterTime = await measurePerformance(async () => {
        fireEvent.press(getByText('Last Week'));
        await waitFor(() => {
          expect(
            getByText(/Showing \d+ of 250 sessions \(Last Week\)/)
          ).toBeTruthy();
        });
      });

      expect(filterTime).toBeLessThan(300); // Medium datasets should still be fast

      // Test multiple filter switches
      const filters = ['Last Month', 'All', 'Last Week'];
      const multiFilterTime = await measurePerformance(async () => {
        for (const filter of filters) {
          fireEvent.press(getByText(filter));
          await waitFor(() => {
            expect(getByText(/Showing \d+ of 250 sessions/)).toBeTruthy();
          });
        }
      });

      expect(multiFilterTime).toBeLessThan(800);
    });

    it('should filter large datasets (500+ sessions) within acceptable limits', async () => {
      const mockSessions = generateSessionsWithDistribution(750);

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

      fireEvent.press(getByText('View History'));
      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      // Test filter performance with large dataset
      const filterTime = await measurePerformance(async () => {
        fireEvent.press(getByText('Last Week'));
        await waitFor(() => {
          expect(
            getByText(/Showing \d+ of 750 sessions \(Last Week\)/)
          ).toBeTruthy();
        });
      });

      expect(filterTime).toBeLessThan(1000); // Large datasets should complete within 1 second

      // Test that UI remains responsive
      fireEvent.press(getByText('Last Month'));
      await waitFor(() => {
        expect(
          getByText(/Showing \d+ of 750 sessions \(Last Month\)/)
        ).toBeTruthy();
      });

      fireEvent.press(getByText('All'));
      await waitFor(() => {
        expect(getByText('Showing 750 of 750 sessions')).toBeTruthy();
      });
    });

    it('should validate filter accuracy across different dataset sizes', async () => {
      const testSizes = [10, 50, 100, 200];

      for (const size of testSizes) {
        const mockSessions = generateSessionsWithDistribution(size);

        mockAsyncStorage.getItem.mockImplementation((key) => {
          if (key === 'WORK_SESSIONS') {
            return Promise.resolve(JSON.stringify(mockSessions));
          }
          return Promise.resolve(null);
        });

        const { getByText, queryByText, unmount } = render(<App />);

        await waitFor(() => {
          expect(queryByText('Loading your data...')).toBeNull();
        });

        fireEvent.press(getByText('View History'));
        await waitFor(() => {
          expect(getByText('Sessions History')).toBeTruthy();
        });

        // Test All filter
        expect(getByText(`Showing ${size} of ${size} sessions`)).toBeTruthy();

        // Test Last Week filter
        fireEvent.press(getByText('Last Week'));
        await waitFor(() => {
          expect(
            getByText(/Showing \d+ of \d+ sessions \(Last Week\)/)
          ).toBeTruthy();
        });

        // Test Last Month filter
        fireEvent.press(getByText('Last Month'));
        await waitFor(() => {
          expect(
            getByText(/Showing \d+ of \d+ sessions \(Last Month\)/)
          ).toBeTruthy();
        });

        unmount();
      }
    });
  });

  describe('Task 12.3: Rendering Performance Optimization for Large Session Lists', () => {
    it('should optimize rendering for 1000+ sessions', async () => {
      const mockSessions = generateSessionsWithDistribution(1000);

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions));
        }
        return Promise.resolve(null);
      });

      const renderStartTime = performance.now();

      const { getByText, queryByText } = render(<App />);

      await waitFor(
        () => {
          expect(queryByText('Loading your data...')).toBeNull();
        },
        { timeout: 10000 }
      );

      const renderTime = performance.now() - renderStartTime;

      // Should render within reasonable time even with 1000 sessions
      expect(renderTime).toBeLessThan(5000);

      // Test navigation performance with large dataset
      const navigationTime = await measurePerformance(async () => {
        fireEvent.press(getByText('View History'));
        await waitFor(() => {
          expect(getByText('Sessions History')).toBeTruthy();
        });
      });

      expect(navigationTime).toBeLessThan(2000);

      // Test filtering performance
      const filterTime = await measurePerformance(async () => {
        fireEvent.press(getByText('Last Month'));
        await waitFor(() => {
          expect(getByText(/Showing \d+ of 1000 sessions/)).toBeTruthy();
        });
      });

      expect(filterTime).toBeLessThan(1500);
    });

    it('should handle memory efficiently during intensive operations', async () => {
      const mockSessions = generateSessionsWithDistribution(500);

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

      // Intensive operation: multiple navigation and filtering cycles
      const intensiveOperationTime = await measurePerformance(async () => {
        for (let cycle = 0; cycle < 5; cycle++) {
          // Navigate to sessions history
          fireEvent.press(getByText('View History'));
          await waitFor(() => {
            expect(getByText('Sessions History')).toBeTruthy();
          });

          // Apply all filters
          const filters = ['Last Week', 'Last Month', 'All'];
          for (const filter of filters) {
            fireEvent.press(getByText(filter));
            await waitFor(() => {
              expect(getByText(/Showing \d+ of 500 sessions/)).toBeTruthy();
            });
          }

          // Navigate back
          fireEvent.press(getByText('Back to Main'));
          await waitFor(() => {
            expect(getByText('Time Tracker')).toBeTruthy();
          });
        }
      });

      // Should complete intensive operations within reasonable time
      expect(intensiveOperationTime).toBeLessThan(10000);

      // App should remain responsive after intensive operations
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
    });
  });

  describe('Task 12.4: Screen Transitions and State Persistence', () => {
    it('should maintain state consistency during rapid transitions', async () => {
      const mockSessions = generateSessionsWithDistribution(100);

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

      // Start a clock session
      fireEvent.press(getByText('Clock In'));
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      // Rapid transitions while maintaining state
      const transitionTime = await measurePerformance(async () => {
        for (let i = 0; i < 10; i++) {
          fireEvent.press(getByText('View History'));
          await waitFor(() => {
            expect(getByText('Sessions History')).toBeTruthy();
          });

          // Apply filter
          fireEvent.press(getByText('Last Week'));
          await waitFor(() => {
            expect(getByText(/Showing \d+ of 100 sessions/)).toBeTruthy();
          });

          fireEvent.press(getByText('Back to Main'));
          await waitFor(() => {
            expect(getByText(/Clocked In at/)).toBeTruthy(); // State should persist
          });
        }
      });

      expect(transitionTime).toBeLessThan(8000);

      // Complete the session
      fireEvent.press(getByText('Clock Out'));
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      // Verify session was added
      fireEvent.press(getByText('View History'));
      await waitFor(() => {
        expect(getByText('Showing 101 of 101 sessions')).toBeTruthy();
      });
    });

    it('should handle concurrent operations without state corruption', async () => {
      const mockSessions = generateSessionsWithDistribution(200);

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

      // Test concurrent navigation and filtering
      fireEvent.press(getByText('View History'));
      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      // Rapid filter changes
      fireEvent.press(getByText('Last Week'));
      fireEvent.press(getByText('Last Month'));
      fireEvent.press(getByText('All'));

      // Navigate back during filtering
      fireEvent.press(getByText('Back to Main'));

      await waitFor(() => {
        expect(getByText('Time Tracker')).toBeTruthy();
      });

      // Navigate back to verify state consistency
      fireEvent.press(getByText('View History'));
      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
        expect(getByText('Showing 200 of 200 sessions')).toBeTruthy();
      });
    });
  });

  describe('Performance Regression Tests', () => {
    it('should not degrade performance with repeated operations', async () => {
      const mockSessions = generateSessionsWithDistribution(300);

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

      // Measure baseline performance
      const baselineTime = await measurePerformance(async () => {
        fireEvent.press(getByText('View History'));
        await waitFor(() => {
          expect(getByText('Sessions History')).toBeTruthy();
        });

        fireEvent.press(getByText('Last Week'));
        await waitFor(() => {
          expect(getByText(/Showing \d+ of 300 sessions/)).toBeTruthy();
        });

        fireEvent.press(getByText('Back to Main'));
        await waitFor(() => {
          expect(getByText('Time Tracker')).toBeTruthy();
        });
      });

      // Perform many operations
      for (let i = 0; i < 20; i++) {
        fireEvent.press(getByText('View History'));
        await waitFor(() => {
          expect(getByText('Sessions History')).toBeTruthy();
        });

        fireEvent.press(getByText('Last Month'));
        await waitFor(() => {
          expect(getByText(/Showing \d+ of 300 sessions/)).toBeTruthy();
        });

        fireEvent.press(getByText('Back to Main'));
        await waitFor(() => {
          expect(getByText('Time Tracker')).toBeTruthy();
        });
      }

      // Measure performance after many operations
      const finalTime = await measurePerformance(async () => {
        fireEvent.press(getByText('View History'));
        await waitFor(() => {
          expect(getByText('Sessions History')).toBeTruthy();
        });

        fireEvent.press(getByText('Last Week'));
        await waitFor(() => {
          expect(getByText(/Showing \d+ of 300 sessions/)).toBeTruthy();
        });

        fireEvent.press(getByText('Back to Main'));
        await waitFor(() => {
          expect(getByText('Time Tracker')).toBeTruthy();
        });
      });

      // Performance should not degrade significantly (allow 50% tolerance)
      expect(finalTime).toBeLessThan(baselineTime * 1.5);
    });
  });
});
