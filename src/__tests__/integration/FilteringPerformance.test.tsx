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

// Helper function to generate mock sessions
const generateMockSessions = (count: number): SessionObject[] => {
  const sessions: SessionObject[] = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const sessionDate = new Date(today);
    sessionDate.setDate(today.getDate() - i); // Go back in time
    
    const clockIn = new Date(sessionDate);
    clockIn.setHours(9, 0, 0, 0);
    
    const clockOut = new Date(sessionDate);
    clockOut.setHours(17, 0, 0, 0);
    
    sessions.push({
      id: `session-${i + 1}`,
      date: sessionDate.toISOString().split('T')[0],
      clockIn: clockIn.toISOString(),
      clockOut: clockOut.toISOString(),
      hours: 8,
    });
  }
  
  return sessions;
};

describe('Filtering Performance Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.warn = jest.fn();

    // Mock successful AsyncStorage operations by default
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('Filter Performance with Small Dataset', () => {
    it('should filter sessions efficiently with 10 sessions', async () => {
      const mockSessions = generateMockSessions(10);
      
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

      // Test filter performance
      const startTime = performance.now();
      
      // Apply Last Week filter
      fireEvent.press(getByText('Last Week'));
      
      await waitFor(() => {
        expect(getByText('Showing')).toBeTruthy();
      });
      
      const filterTime = performance.now() - startTime;
      
      // Filtering should be very fast with small dataset
      expect(filterTime).toBeLessThan(100);

      // Test switching between filters
      const switchStartTime = performance.now();
      
      fireEvent.press(getByText('Last Month'));
      
      await waitFor(() => {
        expect(getByText('Showing')).toBeTruthy();
      });
      
      const switchTime = performance.now() - switchStartTime;
      
      // Filter switching should also be fast
      expect(switchTime).toBeLessThan(100);
    });
  });

  describe('Filter Performance with Medium Dataset', () => {
    it('should filter sessions efficiently with 100 sessions', async () => {
      const mockSessions = generateMockSessions(100);
      
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

      // Test filter performance with medium dataset
      const startTime = performance.now();
      
      fireEvent.press(getByText('Last Week'));
      
      await waitFor(() => {
        expect(getByText('Showing')).toBeTruthy();
      });
      
      const filterTime = performance.now() - startTime;
      
      // Should still be fast with 100 sessions
      expect(filterTime).toBeLessThan(200);

      // Test rapid filter switching
      const filters = ['Last Month', 'All', 'Last Week'];
      
      for (const filter of filters) {
        const switchStartTime = performance.now();
        
        fireEvent.press(getByText(filter));
        
        await waitFor(() => {
          expect(getByText('Showing')).toBeTruthy();
        });
        
        const switchTime = performance.now() - switchStartTime;
        expect(switchTime).toBeLessThan(150);
      }
    });
  });

  describe('Filter Performance with Large Dataset', () => {
    it('should filter sessions efficiently with 500 sessions', async () => {
      const mockSessions = generateMockSessions(500);
      
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

      // Test filter performance with large dataset
      const startTime = performance.now();
      
      fireEvent.press(getByText('Last Week'));
      
      await waitFor(() => {
        expect(getByText('Showing')).toBeTruthy();
      });
      
      const filterTime = performance.now() - startTime;
      
      // Should still be reasonable with 500 sessions
      expect(filterTime).toBeLessThan(500);

      // Test that the UI remains responsive
      fireEvent.press(getByText('Last Month'));
      
      await waitFor(() => {
        expect(getByText('Showing')).toBeTruthy();
      });

      fireEvent.press(getByText('All'));
      
      await waitFor(() => {
        expect(getByText('Showing')).toBeTruthy();
      });
    });

    it('should handle memory efficiently with large datasets', async () => {
      const mockSessions = generateMockSessions(1000);
      
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

      // Rapid filter switching to test memory usage
      const filters = ['Last Week', 'Last Month', 'All'];
      
      for (let i = 0; i < 10; i++) {
        for (const filter of filters) {
          fireEvent.press(getByText(filter));
          
          await waitFor(() => {
            expect(getByText('Showing')).toBeTruthy();
          });
        }
      }

      // Should still be functional after intensive filtering
      expect(getByText('Sessions History')).toBeTruthy();
      expect(getByText('All')).toBeTruthy();
    });
  });

  describe('Filter Accuracy Tests', () => {
    it('should correctly filter sessions by date ranges', async () => {
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 5); // 5 days ago (within last week)
      
      const lastMonth = new Date(today);
      lastMonth.setDate(today.getDate() - 20); // 20 days ago (within last month)
      
      const oldSession = new Date(today);
      oldSession.setDate(today.getDate() - 40); // 40 days ago (older than last month)

      const mockSessions: SessionObject[] = [
        {
          id: 'recent-session',
          date: lastWeek.toISOString().split('T')[0],
          clockIn: lastWeek.toISOString(),
          clockOut: new Date(lastWeek.getTime() + 8 * 60 * 60 * 1000).toISOString(),
          hours: 8,
        },
        {
          id: 'month-session',
          date: lastMonth.toISOString().split('T')[0],
          clockIn: lastMonth.toISOString(),
          clockOut: new Date(lastMonth.getTime() + 8 * 60 * 60 * 1000).toISOString(),
          hours: 8,
        },
        {
          id: 'old-session',
          date: oldSession.toISOString().split('T')[0],
          clockIn: oldSession.toISOString(),
          clockOut: new Date(oldSession.getTime() + 8 * 60 * 60 * 1000).toISOString(),
          hours: 8,
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

      // Navigate to sessions history
      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      // Test All filter (should show all 3 sessions)
      expect(getByText('Showing 3 of 3 sessions')).toBeTruthy();

      // Test Last Week filter (should show 1 session)
      fireEvent.press(getByText('Last Week'));
      
      await waitFor(() => {
        expect(getByText('Showing 1 of 3 sessions (Last Week)')).toBeTruthy();
      });

      // Test Last Month filter (should show 2 sessions)
      fireEvent.press(getByText('Last Month'));
      
      await waitFor(() => {
        expect(getByText('Showing 2 of 3 sessions (Last Month)')).toBeTruthy();
      });

      // Back to All filter
      fireEvent.press(getByText('All'));
      
      await waitFor(() => {
        expect(getByText('Showing 3 of 3 sessions')).toBeTruthy();
      });
    });

    it('should handle edge cases in date filtering', async () => {
      const today = new Date();
      const exactlyOneWeekAgo = new Date(today);
      exactlyOneWeekAgo.setDate(today.getDate() - 7);
      
      const exactlyOneMonthAgo = new Date(today);
      exactlyOneMonthAgo.setDate(today.getDate() - 30);

      const mockSessions: SessionObject[] = [
        {
          id: 'week-edge-session',
          date: exactlyOneWeekAgo.toISOString().split('T')[0],
          clockIn: exactlyOneWeekAgo.toISOString(),
          clockOut: new Date(exactlyOneWeekAgo.getTime() + 8 * 60 * 60 * 1000).toISOString(),
          hours: 8,
        },
        {
          id: 'month-edge-session',
          date: exactlyOneMonthAgo.toISOString().split('T')[0],
          clockIn: exactlyOneMonthAgo.toISOString(),
          clockOut: new Date(exactlyOneMonthAgo.getTime() + 8 * 60 * 60 * 1000).toISOString(),
          hours: 8,
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

      // Navigate to sessions history
      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      // Test edge case filtering
      fireEvent.press(getByText('Last Week'));
      
      await waitFor(() => {
        // Should include sessions from exactly 7 days ago
        expect(getByText(/Showing \d+ of 2 sessions \(Last Week\)/)).toBeTruthy();
      });

      fireEvent.press(getByText('Last Month'));
      
      await waitFor(() => {
        // Should include sessions from exactly 30 days ago
        expect(getByText(/Showing \d+ of 2 sessions \(Last Month\)/)).toBeTruthy();
      });
    });
  });

  describe('Empty State Performance', () => {
    it('should handle empty filter results efficiently', async () => {
      // Create sessions that are all older than 30 days
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);
      
      const mockSessions: SessionObject[] = [
        {
          id: 'old-session',
          date: oldDate.toISOString().split('T')[0],
          clockIn: oldDate.toISOString(),
          clockOut: new Date(oldDate.getTime() + 8 * 60 * 60 * 1000).toISOString(),
          hours: 8,
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

      // Navigate to sessions history
      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      // Test empty filter results
      const startTime = performance.now();
      
      fireEvent.press(getByText('Last Week'));
      
      await waitFor(() => {
        expect(getByText('No sessions found for Last Week')).toBeTruthy();
      });
      
      const filterTime = performance.now() - startTime;
      
      // Empty results should be handled quickly
      expect(filterTime).toBeLessThan(100);

      // Test switching to another empty filter
      fireEvent.press(getByText('Last Month'));
      
      await waitFor(() => {
        expect(getByText('No sessions found for Last Month')).toBeTruthy();
      });

      // Back to All should show the session
      fireEvent.press(getByText('All'));
      
      await waitFor(() => {
        expect(getByText('Showing 1 of 1 sessions')).toBeTruthy();
      });
    });
  });
});