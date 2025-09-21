import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../App';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  multiRemove: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Mock alert
global.alert = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
  });

  describe('Clock-in functionality', () => {
    test('should handle clock-in successfully', async () => {
      const { getByText } = render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      const clockInButton = getByText('Clock In');

      // Mock successful AsyncStorage operation
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Trigger clock-in
      fireEvent.press(clockInButton);

      // Wait for state update
      await waitFor(() => {
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'CLOCK_STATE',
          expect.stringContaining('"isClocked":true')
        );
      });

      // Verify UI updates
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });
    });

    test('should handle clock-in AsyncStorage error', async () => {
      const { getByText } = render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      const clockInButton = getByText('Clock In');

      // Mock AsyncStorage failure - consistently fail all attempts
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage failed'));

      // Trigger clock-in
      fireEvent.press(clockInButton);

      // Wait for error notification to appear
      await waitFor(() => {
        expect(
          getByText(
            'Failed to save clock-in. You can continue using the app, but your time may not be saved.'
          )
        ).toBeTruthy();
      });

      // Verify state is reverted
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });
    });

    test('should update state correctly during clock-in process', async () => {
      const { getByText } = render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      const clockInButton = getByText('Clock In');

      // Mock successful AsyncStorage operation
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Trigger clock-in
      fireEvent.press(clockInButton);

      // Verify AsyncStorage is called with correct data structure
      await waitFor(() => {
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'CLOCK_STATE',
          expect.stringMatching(/"isClocked":true,"clockInTime":".*"/)
        );
      });
    });

    test('should save clock-in time as ISO string', async () => {
      const { getByText } = render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });

      const clockInButton = getByText('Clock In');

      // Mock successful AsyncStorage operation
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Trigger clock-in
      fireEvent.press(clockInButton);

      // Verify the saved data contains a valid ISO timestamp
      await waitFor(() => {
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'CLOCK_STATE',
          expect.stringMatching(/"clockInTime":".*T.*Z"/)
        );
      });
    });
  });

  describe('Clock-out functionality', () => {
    test('should handle clock-out successfully', async () => {
      // Set up initial clocked-in state
      const mockClockState = {
        isClocked: true,
        clockInTime: '2024-01-01T09:00:00.000Z',
      };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve(JSON.stringify(mockClockState));
        }
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify([]));
        }
        return Promise.resolve(null);
      });

      const { getByText } = render(<App />);

      // Wait for app to initialize with clocked-in state
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      const clockOutButton = getByText('Clock Out');

      // Mock successful AsyncStorage operations
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      // Trigger clock-out
      fireEvent.press(clockOutButton);

      // Wait for state update
      await waitFor(() => {
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'CLOCK_STATE',
          expect.stringContaining('"isClocked":false')
        );
      });

      // Verify UI updates to show not clocked in
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });
    });

    test('should calculate hours correctly during clock-out', async () => {
      // Set up initial clocked-in state
      const mockClockState = {
        isClocked: true,
        clockInTime: '2024-01-01T09:00:00.000Z',
      };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve(JSON.stringify(mockClockState));
        }
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify([]));
        }
        return Promise.resolve(null);
      });

      const { getByText } = render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      const clockOutButton = getByText('Clock Out');

      // Mock successful AsyncStorage operations
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      // Trigger clock-out
      fireEvent.press(clockOutButton);

      // Verify session was saved with calculated hours
      await waitFor(() => {
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'WORK_SESSIONS',
          expect.stringMatching(/"hours":\d+(\.\d+)?/)
        );
      });
    });

    test('should handle clock-out AsyncStorage error', async () => {
      // Set up initial clocked-in state
      const mockClockState = {
        isClocked: true,
        clockInTime: '2024-01-01T09:00:00.000Z',
      };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve(JSON.stringify(mockClockState));
        }
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify([]));
        }
        return Promise.resolve(null);
      });

      const { getByText } = render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      const clockOutButton = getByText('Clock Out');

      // Mock AsyncStorage failure - consistently fail all attempts
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage failed'));

      // Trigger clock-out
      fireEvent.press(clockOutButton);

      // Wait for error notification to appear
      await waitFor(() => {
        expect(
          getByText(
            'Failed to save work session. You can try clocking out again.'
          )
        ).toBeTruthy();
      });

      // Verify state remains clocked in
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });
    });

    test('should create session with correct data structure', async () => {
      // Set up initial clocked-in state
      const mockClockState = {
        isClocked: true,
        clockInTime: '2024-01-01T09:00:00.000Z',
      };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve(JSON.stringify(mockClockState));
        }
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify([]));
        }
        return Promise.resolve(null);
      });

      const { getByText } = render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });

      const clockOutButton = getByText('Clock Out');

      // Mock successful AsyncStorage operations
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      // Trigger clock-out
      fireEvent.press(clockOutButton);

      // Verify session data structure
      await waitFor(() => {
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'WORK_SESSIONS',
          expect.stringMatching(
            /"id":"session-\d+".*"date":"\d{4}-\d{2}-\d{2}".*"clockIn":".*".*"clockOut":".*".*"hours":\d+(\.\d+)?/
          )
        );
      });
    });
  });

  describe('App initialization', () => {
    test('should load existing clock state on startup', async () => {
      const mockClockState = {
        isClocked: true,
        clockInTime: '2024-01-01T09:00:00.000Z',
      };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'CLOCK_STATE') {
          return Promise.resolve(JSON.stringify(mockClockState));
        }
        if (key === 'WORK_SESSIONS') {
          return Promise.resolve(JSON.stringify([]));
        }
        return Promise.resolve(null);
      });

      const { getByText } = render(<App />);

      // Wait for app to load and display clocked-in state
      await waitFor(() => {
        expect(getByText(/Clocked In at/)).toBeTruthy();
      });
    });

    test('should handle initialization errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { getByText } = render(<App />);

      // Should fall back to default state
      await waitFor(() => {
        expect(getByText('Not Clocked In')).toBeTruthy();
      });
    });
  });
});
