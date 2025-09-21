import {
  FILTER_OPTIONS,
  createSessionFilter,
  filterSessions,
  filterSessionsByType,
  getSessionCounts,
} from '../../utils/sessionFilters';
import { SessionObject, FilterType } from '../../types';

// Mock sessions for testing
const createMockSession = (date: string, id: string): SessionObject => ({
  id,
  date,
  clockIn: `${date}T09:00:00.000Z`,
  clockOut: `${date}T17:00:00.000Z`,
  hours: 8,
});

const createMockSessions = (): SessionObject[] => {
  const today = new Date();
  const sessions: SessionObject[] = [];

  // Create sessions for different time periods
  for (let i = 0; i < 45; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    sessions.push(createMockSession(dateString, `session-${i}`));
  }

  return sessions;
};

describe('sessionFilters', () => {
  let mockSessions: SessionObject[];

  beforeEach(() => {
    mockSessions = createMockSessions();
  });

  describe('FILTER_OPTIONS', () => {
    test('contains all expected filter options', () => {
      expect(FILTER_OPTIONS).toHaveLength(3);
      expect(FILTER_OPTIONS[0]).toEqual({ type: 'all', label: 'All Sessions' });
      expect(FILTER_OPTIONS[1]).toEqual({ type: 'lastWeek', label: 'Last Week', days: 7 });
      expect(FILTER_OPTIONS[2]).toEqual({ type: 'lastMonth', label: 'Last Month', days: 30 });
    });

    test('has correct types', () => {
      const types = FILTER_OPTIONS.map(option => option.type);
      expect(types).toContain('all');
      expect(types).toContain('lastWeek');
      expect(types).toContain('lastMonth');
    });
  });

  describe('createSessionFilter', () => {
    test('creates "all" filter correctly', () => {
      const filter = createSessionFilter('all');
      expect(filter.type).toBe('all');
      expect(filter.startDate).toBeUndefined();
      expect(filter.endDate).toBeUndefined();
    });

    test('creates "lastWeek" filter with date range', () => {
      const filter = createSessionFilter('lastWeek');
      expect(filter.type).toBe('lastWeek');
      expect(filter.startDate).toBeInstanceOf(Date);
      expect(filter.endDate).toBeInstanceOf(Date);
      
      if (filter.startDate && filter.endDate) {
        const daysDiff = Math.ceil((filter.endDate.getTime() - filter.startDate.getTime()) / (1000 * 60 * 60 * 24));
        expect(daysDiff).toBe(7);
      }
    });

    test('creates "lastMonth" filter with date range', () => {
      const filter = createSessionFilter('lastMonth');
      expect(filter.type).toBe('lastMonth');
      expect(filter.startDate).toBeInstanceOf(Date);
      expect(filter.endDate).toBeInstanceOf(Date);
      
      if (filter.startDate && filter.endDate) {
        const daysDiff = Math.ceil((filter.endDate.getTime() - filter.startDate.getTime()) / (1000 * 60 * 60 * 24));
        expect(daysDiff).toBe(30);
      }
    });

    test('handles invalid filter type as "all"', () => {
      const filter = createSessionFilter('invalid' as FilterType);
      expect(filter.type).toBe('all');
      expect(filter.startDate).toBeUndefined();
      expect(filter.endDate).toBeUndefined();
    });
  });

  describe('filterSessions', () => {
    test('returns all sessions for "all" filter', () => {
      const filter = createSessionFilter('all');
      const filtered = filterSessions(mockSessions, filter);
      expect(filtered).toHaveLength(mockSessions.length);
      expect(filtered).toEqual(mockSessions);
    });

    test('filters sessions for last week correctly', () => {
      const filter = createSessionFilter('lastWeek');
      const filtered = filterSessions(mockSessions, filter);
      
      // Should have sessions from the last 7 days (including today)
      expect(filtered.length).toBeLessThanOrEqual(8); // 7 days + today
      expect(filtered.length).toBeGreaterThan(0);
      
      // All filtered sessions should be within the date range
      filtered.forEach(session => {
        const sessionDate = new Date(session.date);
        const startDateOnly = new Date(filter.startDate!.getFullYear(), filter.startDate!.getMonth(), filter.startDate!.getDate());
        const endDateOnly = new Date(filter.endDate!.getFullYear(), filter.endDate!.getMonth(), filter.endDate!.getDate());
        const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
        
        expect(sessionDateOnly >= startDateOnly).toBe(true);
        expect(sessionDateOnly <= endDateOnly).toBe(true);
      });
    });

    test('filters sessions for last month correctly', () => {
      const filter = createSessionFilter('lastMonth');
      const filtered = filterSessions(mockSessions, filter);
      
      // Should have sessions from the last 30 days (including today)
      expect(filtered.length).toBeLessThanOrEqual(31); // 30 days + today
      expect(filtered.length).toBeGreaterThan(0);
      
      // All filtered sessions should be within the date range
      filtered.forEach(session => {
        const sessionDate = new Date(session.date);
        const startDateOnly = new Date(filter.startDate!.getFullYear(), filter.startDate!.getMonth(), filter.startDate!.getDate());
        const endDateOnly = new Date(filter.endDate!.getFullYear(), filter.endDate!.getMonth(), filter.endDate!.getDate());
        const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
        
        expect(sessionDateOnly >= startDateOnly).toBe(true);
        expect(sessionDateOnly <= endDateOnly).toBe(true);
      });
    });

    test('maintains chronological order', () => {
      const filter = createSessionFilter('lastWeek');
      const filtered = filterSessions(mockSessions, filter);
      
      // Check that sessions are in chronological order (most recent first)
      for (let i = 1; i < filtered.length; i++) {
        const currentDate = new Date(filtered[i].date);
        const previousDate = new Date(filtered[i - 1].date);
        expect(currentDate <= previousDate).toBe(true);
      }
    });

    test('handles empty sessions array', () => {
      const filter = createSessionFilter('lastWeek');
      const filtered = filterSessions([], filter);
      expect(filtered).toHaveLength(0);
    });

    test('handles filter without date range', () => {
      const filter = { type: 'lastWeek' as FilterType };
      const filtered = filterSessions(mockSessions, filter);
      expect(filtered).toEqual(mockSessions);
    });
  });

  describe('filterSessionsByType', () => {
    test('filters by "all" type', () => {
      const filtered = filterSessionsByType(mockSessions, 'all');
      expect(filtered).toEqual(mockSessions);
    });

    test('filters by "lastWeek" type', () => {
      const filtered = filterSessionsByType(mockSessions, 'lastWeek');
      expect(filtered.length).toBeLessThanOrEqual(8);
      expect(filtered.length).toBeGreaterThan(0);
    });

    test('filters by "lastMonth" type', () => {
      const filtered = filterSessionsByType(mockSessions, 'lastMonth');
      expect(filtered.length).toBeLessThanOrEqual(31);
      expect(filtered.length).toBeGreaterThan(0);
    });

    test('handles empty sessions array', () => {
      const filtered = filterSessionsByType([], 'lastWeek');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('getSessionCounts', () => {
    test('returns correct counts for all filter types', () => {
      const counts = getSessionCounts(mockSessions);
      
      expect(counts.all).toBe(mockSessions.length);
      expect(counts.lastWeek).toBeLessThanOrEqual(8);
      expect(counts.lastWeek).toBeGreaterThan(0);
      expect(counts.lastMonth).toBeLessThanOrEqual(31);
      expect(counts.lastMonth).toBeGreaterThan(0);
      
      // Last month should have more or equal sessions than last week
      expect(counts.lastMonth).toBeGreaterThanOrEqual(counts.lastWeek);
    });

    test('handles empty sessions array', () => {
      const counts = getSessionCounts([]);
      expect(counts.all).toBe(0);
      expect(counts.lastWeek).toBe(0);
      expect(counts.lastMonth).toBe(0);
    });

    test('handles sessions with only old dates', () => {
      const oldSessions = [
        createMockSession('2020-01-01', 'old-1'),
        createMockSession('2020-01-02', 'old-2'),
      ];
      
      const counts = getSessionCounts(oldSessions);
      expect(counts.all).toBe(2);
      expect(counts.lastWeek).toBe(0);
      expect(counts.lastMonth).toBe(0);
    });

    test('handles sessions with only recent dates', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      const recentSessions = [
        createMockSession(today, 'recent-1'),
        createMockSession(yesterdayString, 'recent-2'),
      ];
      
      const counts = getSessionCounts(recentSessions);
      expect(counts.all).toBe(2);
      expect(counts.lastWeek).toBe(2);
      expect(counts.lastMonth).toBe(2);
    });
  });

  describe('edge cases', () => {
    test('handles sessions exactly at boundary dates', () => {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const boundarySessions = [
        createMockSession(today.toISOString().split('T')[0], 'today'),
        createMockSession(sevenDaysAgo.toISOString().split('T')[0], 'boundary'),
      ];
      
      const lastWeekFiltered = filterSessionsByType(boundarySessions, 'lastWeek');
      expect(lastWeekFiltered.length).toBeGreaterThan(0);
    });

    test('handles sessions with different date formats', () => {
      const sessionsWithDifferentFormats = [
        { ...createMockSession('2024-01-01', 'format-1') },
        { ...createMockSession('2024-1-1', 'format-2') },
      ];
      
      // Should not throw errors
      expect(() => filterSessionsByType(sessionsWithDifferentFormats, 'lastWeek')).not.toThrow();
    });

    test('preserves session object integrity', () => {
      const filtered = filterSessionsByType(mockSessions, 'lastWeek');
      
      filtered.forEach(session => {
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('date');
        expect(session).toHaveProperty('clockIn');
        expect(session).toHaveProperty('clockOut');
        expect(session).toHaveProperty('hours');
        expect(typeof session.hours).toBe('number');
      });
    });
  });
});