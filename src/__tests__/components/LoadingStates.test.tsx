import React from 'react';
import { render } from '@testing-library/react-native';
import { ClockControls } from '../../components/ClockControls';
import { StatusDisplay } from '../../components/StatusDisplay';
import { SessionHistory } from '../../components/SessionHistory';

// Mock the theme colors
jest.mock('../../theme/colors', () => ({
  AppColors: {
    primary: '#6750A4',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    outline: '#79747E',
    error: '#BA1A1A',
    primaryContainer: '#EADDFF',
    errorContainer: '#FFDAD6',
    surface: '#FFFBFE',
  },
}));

// Mock the time utils
jest.mock('../../utils/timeUtils', () => ({
  formatTime: jest.fn((timestamp) => '10:30 AM'),
  formatDate: jest.fn((dateString) => 'Mon, Jan 1'),
}));

describe('Loading States and User Feedback', () => {
  describe('ClockControls Loading States', () => {
    test('should show loading state when disabled', () => {
      const { getByText } = render(
        <ClockControls
          isClocked={false}
          onClockIn={jest.fn()}
          onClockOut={jest.fn()}
          disabled={true}
        />
      );

      expect(getByText('Processing...')).toBeTruthy();
      expect(getByText('Clocking In...')).toBeTruthy();
    });

    test('should show normal state when not disabled', () => {
      const { getByText } = render(
        <ClockControls
          isClocked={false}
          onClockIn={jest.fn()}
          onClockOut={jest.fn()}
          disabled={false}
        />
      );

      expect(getByText('Clock In')).toBeTruthy();
    });

    test('should show clock out loading state when clocked in and disabled', () => {
      const { getByText } = render(
        <ClockControls
          isClocked={true}
          onClockIn={jest.fn()}
          onClockOut={jest.fn()}
          disabled={true}
        />
      );

      expect(getByText('Processing...')).toBeTruthy();
      expect(getByText('Clocking Out...')).toBeTruthy();
    });
  });

  describe('StatusDisplay Loading States', () => {
    test('should show processing state when loading', () => {
      const { getByText } = render(
        <StatusDisplay isClocked={false} clockInTime={null} isLoading={true} />
      );

      expect(getByText('Processing...')).toBeTruthy();
      expect(getByText('Please wait...')).toBeTruthy();
    });

    test('should show normal state when not loading', () => {
      const { getByText } = render(
        <StatusDisplay isClocked={false} clockInTime={null} isLoading={false} />
      );

      expect(getByText('Not Clocked In')).toBeTruthy();
    });

    test('should show clocked in state when not loading and clocked in', () => {
      const clockInTime = new Date('2024-01-01T10:30:00.000Z');
      const { getByText } = render(
        <StatusDisplay
          isClocked={true}
          clockInTime={clockInTime}
          isLoading={false}
        />
      );

      expect(getByText('Clocked In')).toBeTruthy();
      expect(getByText('Since 10:30 AM')).toBeTruthy();
    });
  });

  describe('SessionHistory Loading States', () => {
    test('should show loading state when isLoading is true', () => {
      const { getByText } = render(
        <SessionHistory sessions={[]} isLoading={true} />
      );

      expect(getByText('Loading sessions...')).toBeTruthy();
    });

    test('should show empty state when no sessions and not loading', () => {
      const { getByText } = render(
        <SessionHistory sessions={[]} isLoading={false} />
      );

      expect(getByText('No work sessions yet')).toBeTruthy();
      expect(getByText('Clock in to start tracking your time')).toBeTruthy();
    });

    test('should show sessions when available and not loading', () => {
      const sessions = [
        {
          id: 'session-1',
          date: '2024-01-01',
          clockIn: '2024-01-01T09:00:00.000Z',
          clockOut: '2024-01-01T17:00:00.000Z',
          hours: 8.0,
        },
      ];

      const { getByText } = render(
        <SessionHistory sessions={sessions} isLoading={false} />
      );

      expect(getByText('8.00 hrs')).toBeTruthy();
      expect(getByText('Mon, Jan 1')).toBeTruthy();
    });
  });
});
