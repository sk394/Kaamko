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

/**
 * Pre-Manual Testing Validation
 *
 * This test suite validates that the app is ready for manual testing
 * by checking core functionality that must work before manual testing begins.
 */
describe('Pre-Manual Testing Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.warn = jest.fn();

    // Mock successful AsyncStorage operations
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('App Rendering and Basic Structure', () => {
    it('should render without crashing', async () => {
      const { getByText, queryByText } = render(<App />);

      // Should show loading initially
      expect(getByText('Time Tracker')).toBeTruthy();
      expect(getByText('Loading your data...')).toBeTruthy();

      // Should complete loading
      await waitFor(
        () => {
          expect(queryByText('Loading your data...')).toBeNull();
        },
        { timeout: 10000 }
      );

      // Should show main interface
      expect(getByText('Time Tracker')).toBeTruthy();
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
    });

    it('should have all required UI elements', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(
        () => {
          expect(queryByText('Loading your data...')).toBeNull();
        },
        { timeout: 10000 }
      );

      // Check for essential UI elements
      expect(getByText('Time Tracker')).toBeTruthy();
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
      expect(getByText('No work sessions yet')).toBeTruthy();
    });
  });

  describe('Core Clock Functionality', () => {
    it('should handle basic clock-in operation', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(
        () => {
          expect(queryByText('Loading your data...')).toBeNull();
        },
        { timeout: 10000 }
      );

      // Clock in
      fireEvent.press(getByText('Clock In'));

      // Should show clocked in state
      await waitFor(
        () => {
          expect(getByText(/Clocked In at/)).toBeTruthy();
          expect(getByText('Clock Out')).toBeTruthy();
        },
        { timeout: 10000 }
      );

      // Should save to storage
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'CLOCK_STATE',
        expect.stringContaining('"isClocked":true')
      );
    });

    it('should handle basic clock-out operation', async () => {
      // Start with clocked-in state
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve(
            JSON.stringify({
              isClocked: true,
              clockInTime: new Date().toISOString(),
            })
          );
        }
        return Promise.resolve(null);
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(
        () => {
          expect(queryByText('Loading your data...')).toBeNull();
        },
        { timeout: 10000 }
      );

      // Should be clocked in
      expect(getByText(/Clocked In at/)).toBeTruthy();
      expect(getByText('Clock Out')).toBeTruthy();

      // Clock out
      fireEvent.press(getByText('Clock Out'));

      // Should show clocked out state
      await waitFor(
        () => {
          expect(getByText('Not Clocked In')).toBeTruthy();
          expect(getByText('Clock In')).toBeTruthy();
        },
        { timeout: 10000 }
      );

      // Should save session
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'WORK_SESSIONS',
        expect.stringContaining('"hours":')
      );
    });
  });

  describe('Data Persistence Readiness', () => {
    it('should restore state from storage', async () => {
      const clockInTime = new Date().toISOString();

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

      await waitFor(
        () => {
          expect(queryByText('Loading your data...')).toBeNull();
        },
        { timeout: 10000 }
      );

      // Should restore clocked-in state
      expect(getByText(/Clocked In at/)).toBeTruthy();
      expect(getByText('Clock Out')).toBeTruthy();
    });

    it('should display session history from storage', async () => {
      const mockSessions = [
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

      await waitFor(
        () => {
          expect(queryByText('Loading your data...')).toBeNull();
        },
        { timeout: 10000 }
      );

      // Should show session history
      expect(queryByText('No work sessions yet')).toBeNull();
      expect(getByText(/8\.00\s+hrs/)).toBeTruthy();
    });
  });

  describe('Error Handling Readiness', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { getByText, queryByText } = render(<App />);

      await waitFor(
        () => {
          expect(queryByText('Loading your data...')).toBeNull();
        },
        { timeout: 10000 }
      );

      // Should show default state despite error
      expect(getByText('Not Clocked In')).toBeTruthy();
      expect(getByText('Clock In')).toBeTruthy();
    });

    it('should show error notifications', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Save failed'));

      const { getByText, queryByText } = render(<App />);

      await waitFor(
        () => {
          expect(queryByText('Loading your data...')).toBeNull();
        },
        { timeout: 10000 }
      );

      // Try to clock in (should fail)
      fireEvent.press(getByText('Clock In'));

      // Should show error notification
      await waitFor(
        () => {
          expect(getByText(/Failed to save clock-in/)).toBeTruthy();
        },
        { timeout: 10000 }
      );
    });
  });

  describe('Notification System Readiness', () => {
    it('should show success notifications', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(
        () => {
          expect(queryByText('Loading your data...')).toBeNull();
        },
        { timeout: 10000 }
      );

      // Clock in
      fireEvent.press(getByText('Clock In'));

      // Should show success notification
      await waitFor(
        () => {
          expect(getByText('Successfully clocked in!')).toBeTruthy();
        },
        { timeout: 10000 }
      );

      // Should have dismiss button
      expect(getByText('Dismiss')).toBeTruthy();
    });

    it('should allow notification dismissal', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(
        () => {
          expect(queryByText('Loading your data...')).toBeNull();
        },
        { timeout: 10000 }
      );

      // Clock in to trigger notification
      fireEvent.press(getByText('Clock In'));

      await waitFor(
        () => {
          expect(getByText('Successfully clocked in!')).toBeTruthy();
        },
        { timeout: 10000 }
      );

      // Dismiss notification
      fireEvent.press(getByText('Dismiss'));

      // Notification should disappear
      await waitFor(
        () => {
          expect(queryByText('Successfully clocked in!')).toBeNull();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Performance Readiness', () => {
    it('should complete initialization within reasonable time', async () => {
      const startTime = Date.now();

      const { queryByText } = render(<App />);

      await waitFor(
        () => {
          expect(queryByText('Loading your data...')).toBeNull();
        },
        { timeout: 10000 }
      );

      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds (generous for test environment)
      expect(loadTime).toBeLessThan(5000);
    });

    it('should handle multiple rapid operations', async () => {
      const { getByText, queryByText } = render(<App />);

      await waitFor(
        () => {
          expect(queryByText('Loading your data...')).toBeNull();
        },
        { timeout: 10000 }
      );

      // Rapid clock in/out
      fireEvent.press(getByText('Clock In'));

      await waitFor(
        () => {
          expect(getByText('Clock Out')).toBeTruthy();
        },
        { timeout: 10000 }
      );

      fireEvent.press(getByText('Clock Out'));

      await waitFor(
        () => {
          expect(getByText('Clock In')).toBeTruthy();
        },
        { timeout: 10000 }
      );

      // Should complete without errors
      expect(getByText('Not Clocked In')).toBeTruthy();
    });
  });
});

/**
 * Manual Testing Readiness Report
 *
 * Run this test suite before beginning manual testing to ensure
 * the app is in a testable state.
 */
describe('Manual Testing Readiness Report', () => {
  it('should generate readiness report', async () => {
    const { getByText, queryByText } = render(<App />);

    // Test basic rendering
    expect(getByText('Time Tracker')).toBeTruthy();

    // Test initialization
    await waitFor(
      () => {
        expect(queryByText('Loading your data...')).toBeNull();
      },
      { timeout: 10000 }
    );

    // Test basic functionality
    expect(getByText('Not Clocked In')).toBeTruthy();
    expect(getByText('Clock In')).toBeTruthy();

    // If we reach here, basic functionality is working
    console.log('✅ App is ready for manual testing');
    console.log('📱 Deploy to Expo Go and begin manual test procedures');
    console.log('📋 Use ManualTestingGuide.md for comprehensive testing');
    console.log('⚡ Use QuickTestChecklist.md for essential tests');
  });
});
