import React from 'react';
import { SessionObject } from '../../types';

// Mock react-native-paper to avoid IconButton issues in tests
jest.mock('react-native-paper', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...jest.requireActual('react-native-paper'),
    IconButton: ({ onPress, testID }: any) => (
      <RN.TouchableOpacity onPress={onPress} testID={testID}>
        <RN.Text>IconButton</RN.Text>
      </RN.TouchableOpacity>
    ),
  };
});

import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import SessionsHistoryScreen from '../../components/SessionsHistoryScreen';

// Mock data for testing - using recent dates
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(today.getDate() - 2);

const mockSessions: SessionObject[] = [
  {
    id: 'session-1',
    date: yesterday.toISOString().split('T')[0],
    clockIn: yesterday.toISOString().replace(/\.\d{3}Z$/, '.000Z'),
    clockOut: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, '.000Z'),
    hours: 8.0,
  },
  {
    id: 'session-2',
    date: twoDaysAgo.toISOString().split('T')[0],
    clockIn: twoDaysAgo.toISOString().replace(/\.\d{3}Z$/, '.000Z'),
    clockOut: new Date(twoDaysAgo.getTime() + 8 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, '.000Z'),
    hours: 8.0,
  },
];

const mockNavigateBack = jest.fn();

// Wrapper component to provide Paper theme
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('SessionsHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render component shell with title', () => {
    const { getByText } = render(
      <TestWrapper>
        <SessionsHistoryScreen
          sessions={mockSessions}
          onNavigateBack={mockNavigateBack}
        />
      </TestWrapper>
    );

    expect(getByText('Sessions History')).toBeTruthy();
  });

  it('should show filter controls with all options', () => {
    const { getByText } = render(
      <TestWrapper>
        <SessionsHistoryScreen
          sessions={mockSessions}
          onNavigateBack={mockNavigateBack}
        />
      </TestWrapper>
    );

    // Verify all filter options are present
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Last Week')).toBeTruthy();
    expect(getByText('Last Month')).toBeTruthy();
  });

  it('should show filtered sessions placeholder when sessions exist', () => {
    const { getByText } = render(
      <TestWrapper>
        <SessionsHistoryScreen
          sessions={mockSessions}
          onNavigateBack={mockNavigateBack}
        />
      </TestWrapper>
    );

    expect(getByText('Filtered sessions list will be displayed here')).toBeTruthy();
    expect(getByText('Showing 2 of 2 sessions')).toBeTruthy();
  });

  it('should show empty state when no sessions exist', () => {
    const { getByText } = render(
      <TestWrapper>
        <SessionsHistoryScreen
          sessions={[]}
          onNavigateBack={mockNavigateBack}
        />
      </TestWrapper>
    );

    expect(getByText('No work sessions yet')).toBeTruthy();
    expect(getByText('Your completed work sessions will appear here')).toBeTruthy();
  });

  it('should show back navigation button with proper text', () => {
    const { getByText } = render(
      <TestWrapper>
        <SessionsHistoryScreen
          sessions={mockSessions}
          onNavigateBack={mockNavigateBack}
        />
      </TestWrapper>
    );

    expect(getByText('Back to Main')).toBeTruthy();
  });

  it('should call onNavigateBack when back button is pressed', () => {
    const { getByText } = render(
      <TestWrapper>
        <SessionsHistoryScreen
          sessions={mockSessions}
          onNavigateBack={mockNavigateBack}
        />
      </TestWrapper>
    );

    // Find the back button by its text
    const backButton = getByText('IconButton');
    fireEvent.press(backButton);

    expect(mockNavigateBack).toHaveBeenCalledTimes(1);
  });

  it('should handle filter changes correctly', () => {
    const { getByText } = render(
      <TestWrapper>
        <SessionsHistoryScreen
          sessions={mockSessions}
          onNavigateBack={mockNavigateBack}
        />
      </TestWrapper>
    );

    // Initially shows all sessions
    expect(getByText('Showing 2 of 2 sessions')).toBeTruthy();

    // Click on Last Week filter
    const lastWeekButton = getByText('Last Week');
    fireEvent.press(lastWeekButton);

    // Should show sessions from last week (our mock data is recent)
    expect(getByText('Showing 2 of 2 sessions (Last Week)')).toBeTruthy();
  });

  it('should show appropriate empty state for filtered results', () => {
    // Create sessions that are older than 30 days to test empty filter results
    const oldSessions: SessionObject[] = [
      {
        id: 'session-old',
        date: '2020-01-15', // Very old date
        clockIn: '2020-01-15T09:00:00.000Z',
        clockOut: '2020-01-15T17:00:00.000Z',
        hours: 8.0,
      },
    ];

    const { getByText } = render(
      <TestWrapper>
        <SessionsHistoryScreen
          sessions={oldSessions}
          onNavigateBack={mockNavigateBack}
        />
      </TestWrapper>
    );

    // Click on Last Week filter
    const lastWeekButton = getByText('Last Week');
    fireEvent.press(lastWeekButton);

    // Should show empty state for filtered results
    expect(getByText('No sessions found for Last Week')).toBeTruthy();
    expect(getByText('Try selecting a different time period or check back later')).toBeTruthy();
  });

  it('should show loading state when isLoading is true', () => {
    const { getByText } = render(
      <TestWrapper>
        <SessionsHistoryScreen
          sessions={mockSessions}
          onNavigateBack={mockNavigateBack}
          isLoading={true}
        />
      </TestWrapper>
    );

    expect(getByText('Loading sessions...')).toBeTruthy();
    expect(getByText('Please wait while we fetch your work sessions')).toBeTruthy();
  });

  it('should show different empty state messages for different filters', () => {
    // Test with old sessions to trigger empty filter results
    const oldSessions: SessionObject[] = [
      {
        id: 'session-old',
        date: '2020-01-15',
        clockIn: '2020-01-15T09:00:00.000Z',
        clockOut: '2020-01-15T17:00:00.000Z',
        hours: 8.0,
      },
    ];

    const { getByText, rerender } = render(
      <TestWrapper>
        <SessionsHistoryScreen
          sessions={oldSessions}
          onNavigateBack={mockNavigateBack}
        />
      </TestWrapper>
    );

    // Test Last Month filter empty state
    const lastMonthButton = getByText('Last Month');
    fireEvent.press(lastMonthButton);
    expect(getByText('No sessions found for Last Month')).toBeTruthy();

    // Test with completely empty sessions
    rerender(
      <TestWrapper>
        <SessionsHistoryScreen
          sessions={[]}
          onNavigateBack={mockNavigateBack}
        />
      </TestWrapper>
    );

    expect(getByText('No work sessions yet')).toBeTruthy();
    expect(getByText('Your completed work sessions will appear here')).toBeTruthy();
  });

  it('should not show loading state when isLoading is false', () => {
    const { queryByText } = render(
      <TestWrapper>
        <SessionsHistoryScreen
          sessions={mockSessions}
          onNavigateBack={mockNavigateBack}
          isLoading={false}
        />
      </TestWrapper>
    );

    expect(queryByText('Loading sessions...')).toBeNull();
    expect(queryByText('Please wait while we fetch your work sessions')).toBeNull();
  });
});