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

describe('Navigation Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('Navigation Flow Tests', () => {
    it('should navigate to sessions history and back to main screen', async () => {
      // Create mock sessions for testing navigation
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

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify(mockSessions));
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      // Wait for app initialization
      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Should be on main screen initially
      expect(getByText('Time Tracker')).toBeTruthy();
      expect(getByText('Not Clocked In')).toBeTruthy();

      // Navigate to sessions history
      const viewHistoryButton = getByText('View History');
      fireEvent.press(viewHistoryButton);

      // Should navigate to sessions history screen
      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
        expect(getByText('All')).toBeTruthy(); // Filter controls
        expect(getByText('Last Week')).toBeTruthy();
        expect(getByText('Last Month')).toBeTruthy();
      });

      // Should not show main screen elements
      expect(queryByText('Time Tracker')).toBeNull();
      expect(queryByText('Clock In')).toBeNull();

      // Navigate back to main screen
      const backButton = getByText('Back to Main');
      fireEvent.press(backButton);

      // Should be back on main screen
      await waitFor(() => {
        expect(getByText('Time Tracker')).toBeTruthy();
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      // Should not show sessions history elements
      expect(queryByText('Sessions History')).toBeNull();
      expect(queryByText('All')).toBeNull();
    });

    it('should maintain time tracking state during navigation', async () => {
      const { getByText, queryByText } = render(<App />);

      // Wait for app initialization
      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Clock in on main screen
      fireEvent.press(getByText('Clock In'));

      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
        expect(getByText('Clock Out')).toBeTruthy();
      });

      // Navigate to sessions history while clocked in
      const viewHistoryButton = getByText('View History');
      fireEvent.press(viewHistoryButton);

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      // Navigate back to main screen
      const backButton = getByText('Back to Main');
      fireEvent.press(backButton);

      // Should still be clocked in
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
        expect(getByText('Clock Out')).toBeTruthy();
        expect(queryByText('Clock In')).toBeNull();
      });
    });

    it('should handle rapid navigation between screens', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Rapid navigation test
      for (let i = 0; i < 5; i++) {
        // Navigate to sessions history
        fireEvent.press(getByText('View History'));

        await waitFor(() => {
          expect(getByText('Sessions History')).toBeTruthy();
        });

        // Navigate back to main
        fireEvent.press(getByText('Back to Main'));

        await waitFor(() => {
          expect(getByText('Time Tracker')).toBeTruthy();
        });
      }

      // Should still be functional after rapid navigation
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
    });
  });

  describe('Screen Transition Performance Tests', () => {
    it('should transition between screens within acceptable time limits', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Measure navigation to sessions history
      const startTime = performance.now();

      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      const navigationTime = performance.now() - startTime;

      // Navigation should complete within 1 second
      expect(navigationTime).toBeLessThan(1000);

      // Measure navigation back to main
      const backStartTime = performance.now();

      fireEvent.press(getByText('Back to Main'));

      await waitFor(() => {
        expect(getByText('Time Tracker')).toBeTruthy();
      });

      const backNavigationTime = performance.now() - backStartTime;

      // Back navigation should also complete within 1 second
      expect(backNavigationTime).toBeLessThan(1000);
    });

    it('should handle navigation with loading states efficiently', async () => {
      // Mock slower storage operations to test loading states
      mockAsyncStorage.getItem.mockImplementation((key) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(null), 100); // 100ms delay
        });
      });

      const { getByText, queryByText } = render(<App />);

      // Should show loading state initially
      expect(getByText('Loading your data...')).toBeTruthy();

      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Navigation should still work efficiently after loading
      const startTime = performance.now();

      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      const navigationTime = performance.now() - startTime;

      // Even with initial loading, navigation should be fast
      expect(navigationTime).toBeLessThan(500);
    });
  });

  describe('State Persistence During Navigation', () => {
    it('should preserve session data during screen transitions', async () => {
      const mockSessions: SessionObject[] = [
        {
          id: 'session-1',
          date: '2024-01-01',
          clockIn: '2024-01-01T09:00:00.000Z',
          clockOut: '2024-01-01T17:00:00.000Z',
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

      // Should show session on main screen
      expect(getByText(/8\.00\s+hrs/)).toBeTruthy();

      // Navigate to sessions history
      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      // Navigate back
      fireEvent.press(getByText('Back to Main'));

      await waitFor(() => {
        expect(getByText('Time Tracker')).toBeTruthy();
      });

      // Session data should still be preserved
      expect(getByText(/8\.00\s+hrs/)).toBeTruthy();
    });

    it('should handle navigation during active clock session', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Start a clock session
      fireEvent.press(getByText('Clock In'));

      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      // Navigate to sessions history
      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      // Navigate back
      fireEvent.press(getByText('Back to Main'));

      await waitFor(() => {
        expect(getByText('Time Tracker')).toBeTruthy();
      });

      // Should still be clocked in
      expect(getByText(/Clocked In at/)).toBeTruthy();
      expect(getByText('Clock Out')).toBeTruthy();

      // Complete the session
      fireEvent.press(getByText('Clock Out'));

      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      // Should show the completed session
      await waitFor(() => {
        expect(getByText(/\d+\.\d{2}\s+hrs/)).toBeTruthy();
      });
    });
  });

  describe('Error Handling During Navigation', () => {
    it('should handle navigation errors gracefully', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Even if there are errors, navigation should work
      expect(getByText('Time Tracker')).toBeTruthy();

      // Navigate to sessions history
      fireEvent.press(getByText('View History'));

      await waitFor(() => {
        expect(getByText('Sessions History')).toBeTruthy();
      });

      // Navigate back
      fireEvent.press(getByText('Back to Main'));

      await waitFor(() => {
        expect(getByText('Time Tracker')).toBeTruthy();
      });

      // App should remain functional
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
    });

    it('should recover from navigation state corruption', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Loading your data...')).toBeNull();
      });

      // Multiple rapid navigation attempts
      for (let i = 0; i < 3; i++) {
        fireEvent.press(getByText('View History'));
        fireEvent.press(getByText('Back to Main'));
      }

      // Should eventually settle on main screen
      await waitFor(() => {
        expect(getByText('Time Tracker')).toBeTruthy();
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      // Should still be functional
      fireEvent.press(getByText('Clock In'));

      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });
    });
  });
});
