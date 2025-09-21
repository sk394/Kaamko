import { SessionObject, FilterType, SessionFilter } from '../types';
import { getLastWeekDateRange, getLastMonthDateRange, isDateInRange } from './timeUtils';

/**
 * Available filter options for sessions
 */
export const FILTER_OPTIONS = [
  { type: 'all' as FilterType, label: 'All Sessions' },
  { type: 'lastWeek' as FilterType, label: 'Last Week', days: 7 },
  { type: 'lastMonth' as FilterType, label: 'Last Month', days: 30 },
];

/**
 * Create a session filter based on filter type
 * @param filterType - Type of filter to create
 * @returns SessionFilter object with appropriate date ranges
 */
export const createSessionFilter = (filterType: FilterType): SessionFilter => {
  switch (filterType) {
    case 'lastWeek': {
      const { startDate, endDate } = getLastWeekDateRange();
      return { type: filterType, startDate, endDate };
    }
    case 'lastMonth': {
      const { startDate, endDate } = getLastMonthDateRange();
      return { type: filterType, startDate, endDate };
    }
    case 'all':
    default:
      return { type: 'all' };
  }
};

/**
 * Filter sessions based on the provided filter
 * @param sessions - Array of sessions to filter
 * @param filter - Filter to apply
 * @returns Filtered array of sessions, maintaining chronological order (most recent first)
 */
export const filterSessions = (
  sessions: SessionObject[],
  filter: SessionFilter
): SessionObject[] => {
  if (filter.type === 'all' || !filter.startDate || !filter.endDate) {
    return sessions;
  }

  return sessions.filter(session =>
    isDateInRange(session.date, filter.startDate!, filter.endDate!)
  );
};

/**
 * Filter sessions by filter type (convenience function)
 * @param sessions - Array of sessions to filter
 * @param filterType - Type of filter to apply
 * @returns Filtered array of sessions
 */
export const filterSessionsByType = (
  sessions: SessionObject[],
  filterType: FilterType
): SessionObject[] => {
  const filter = createSessionFilter(filterType);
  return filterSessions(sessions, filter);
};

/**
 * Get the count of sessions for each filter type
 * @param sessions - Array of sessions to analyze
 * @returns Object with counts for each filter type
 */
export const getSessionCounts = (sessions: SessionObject[]) => {
  const allCount = sessions.length;
  const lastWeekCount = filterSessionsByType(sessions, 'lastWeek').length;
  const lastMonthCount = filterSessionsByType(sessions, 'lastMonth').length;

  return {
    all: allCount,
    lastWeek: lastWeekCount,
    lastMonth: lastMonthCount,
  };
};