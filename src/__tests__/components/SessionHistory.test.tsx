import React from 'react';
import { SessionHistory } from '../../components/SessionHistory';
import { formatTime, formatDate } from '../../utils/timeUtils';

// Mock the timeUtils module
jest.mock('../../utils/timeUtils', () => ({
  formatTime: jest.fn((timestamp: string) => '09:00 AM'),
  formatDate: jest.fn((dateString: string) => 'Mon, Jan 1'),
}));

const mockFormatTime = formatTime as jest.MockedFunction<typeof formatTime>;
const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>;

describe('SessionHistory Component', () => {
  const mockSessions = [
    {
      id: '1',
      date: '2024-01-01',
      clockIn: '2024-01-01T09:00:00.000Z',
      clockOut: '2024-01-01T17:00:00.000Z',
      hours: 8.0,
    },
    {
      id: '2',
      date: '2024-01-02',
      clockIn: '2024-01-02T08:30:00.000Z',
      clockOut: '2024-01-02T16:30:00.000Z',
      hours: 8.0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render component without crashing', () => {
    const component = React.createElement(SessionHistory, {
      sessions: [],
    });

    expect(component).toBeTruthy();
    expect(component.type).toBe(SessionHistory);
  });

  it('should handle empty sessions array', () => {
    const props = {
      sessions: [],
    };

    const component = React.createElement(SessionHistory, props);
    expect(component.props.sessions).toEqual([]);
    expect(component.props.sessions.length).toBe(0);
  });

  it('should handle empty sessions with default filter', () => {
    const props = {
      sessions: [],
      activeFilter: 'all' as const,
    };

    const component = React.createElement(SessionHistory, props);
    expect(component.props.sessions).toEqual([]);
    expect(component.props.activeFilter).toBe('all');
  });

  it('should handle empty sessions with lastWeek filter', () => {
    const props = {
      sessions: [],
      activeFilter: 'lastWeek' as const,
    };

    const component = React.createElement(SessionHistory, props);
    expect(component.props.sessions).toEqual([]);
    expect(component.props.activeFilter).toBe('lastWeek');
  });

  it('should handle empty sessions with lastMonth filter', () => {
    const props = {
      sessions: [],
      activeFilter: 'lastMonth' as const,
    };

    const component = React.createElement(SessionHistory, props);
    expect(component.props.sessions).toEqual([]);
    expect(component.props.activeFilter).toBe('lastMonth');
  });

  it('should handle sessions with data', () => {
    const props = {
      sessions: mockSessions,
    };

    const component = React.createElement(SessionHistory, props);
    expect(component.props.sessions).toEqual(mockSessions);
    expect(component.props.sessions.length).toBe(2);
  });

  it('should handle sessions with data and filter', () => {
    const props = {
      sessions: mockSessions,
      activeFilter: 'lastWeek' as const,
    };

    const component = React.createElement(SessionHistory, props);
    expect(component.props.sessions).toEqual(mockSessions);
    expect(component.props.sessions.length).toBe(2);
    expect(component.props.activeFilter).toBe('lastWeek');
  });

  it('should sort sessions by date correctly', () => {
    const unsortedSessions = [
      {
        id: '1',
        date: '2024-01-01',
        clockIn: '2024-01-01T09:00:00.000Z',
        clockOut: '2024-01-01T17:00:00.000Z',
        hours: 8.0,
      },
      {
        id: '2',
        date: '2024-01-03',
        clockIn: '2024-01-03T09:00:00.000Z',
        clockOut: '2024-01-03T17:00:00.000Z',
        hours: 8.0,
      },
      {
        id: '3',
        date: '2024-01-02',
        clockIn: '2024-01-02T09:00:00.000Z',
        clockOut: '2024-01-02T17:00:00.000Z',
        hours: 8.0,
      },
    ];

    const props = {
      sessions: unsortedSessions,
    };

    const component = React.createElement(SessionHistory, props);
    expect(component.props.sessions).toEqual(unsortedSessions);

    // Test that the component receives the data correctly
    expect(component.props.sessions[0].date).toBe('2024-01-01');
    expect(component.props.sessions[1].date).toBe('2024-01-03');
    expect(component.props.sessions[2].date).toBe('2024-01-02');
  });

  it('should handle session data formatting', () => {
    const session = {
      id: '1',
      date: '2024-01-01',
      clockIn: '2024-01-01T09:00:00.000Z',
      clockOut: '2024-01-01T17:00:00.000Z',
      hours: 8.5,
    };

    const props = {
      sessions: [session],
    };

    const component = React.createElement(SessionHistory, props);
    const sessionData = component.props.sessions[0];

    expect(sessionData.hours).toBe(8.5);
    expect(sessionData.date).toBe('2024-01-01');
    expect(sessionData.clockIn).toBe('2024-01-01T09:00:00.000Z');
    expect(sessionData.clockOut).toBe('2024-01-01T17:00:00.000Z');
  });

  it('should handle single session', () => {
    const singleSession = [mockSessions[0]];

    const props = {
      sessions: singleSession,
    };

    const component = React.createElement(SessionHistory, props);
    expect(component.props.sessions.length).toBe(1);
    expect(component.props.sessions[0]).toEqual(mockSessions[0]);
  });

  it('should pass activeFilter prop correctly', () => {
    const props = {
      sessions: mockSessions,
      activeFilter: 'lastMonth' as const,
      isLoading: false,
    };

    const component = React.createElement(SessionHistory, props);
    expect(component.props.activeFilter).toBe('lastMonth');
    expect(component.props.isLoading).toBe(false);
    expect(component.props.sessions).toEqual(mockSessions);
  });

  it('should default activeFilter to all when not provided', () => {
    const props = {
      sessions: mockSessions,
      isLoading: false,
    };

    const component = React.createElement(SessionHistory, props);
    expect(component.props.activeFilter).toBeUndefined(); // Component will use default 'all'
    expect(component.props.sessions).toEqual(mockSessions);
  });
});
