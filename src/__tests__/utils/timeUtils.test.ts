import { 
  calculateHours, 
  formatTime, 
  formatDate, 
  getThisWeekDateRange, 
  getLastWeekDateRange, 
  getLastMonthDateRange, 
  isDateInRange 
} from '../../utils/timeUtils';

describe('Time Utils', () => {
  describe('calculateHours', () => {
    test('calculates hours correctly for same day', () => {
      const clockIn = '2024-01-01T09:00:00.000Z';
      const clockOut = '2024-01-01T17:00:00.000Z';
      const hours = calculateHours(clockIn, clockOut);
      expect(hours).toBe(8);
    });

    test('calculates hours correctly with minutes', () => {
      const clockIn = '2024-01-01T09:30:00.000Z';
      const clockOut = '2024-01-01T17:15:00.000Z';
      const hours = calculateHours(clockIn, clockOut);
      expect(hours).toBe(7.75);
    });

    test('handles overnight work sessions', () => {
      const clockIn = '2024-01-01T22:00:00.000Z';
      const clockOut = '2024-01-02T06:00:00.000Z';
      const hours = calculateHours(clockIn, clockOut);
      expect(hours).toBe(8);
    });

    test('returns negative for invalid scenario (clockOut before clockIn)', () => {
      const clockIn = '2024-01-01T17:00:00.000Z';
      const clockOut = '2024-01-01T09:00:00.000Z';
      const hours = calculateHours(clockIn, clockOut);
      expect(hours).toBe(-8);
    });
  });

  describe('formatTime', () => {
    test('formats time correctly', () => {
      const timeString = '2024-01-01T14:30:00.000Z';
      const formatted = formatTime(timeString);
      expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    });
  });

  describe('formatDate', () => {
    test('formats date correctly', () => {
      const dateString = '2024-01-01';
      const formatted = formatDate(dateString);
      expect(formatted).toMatch(/^\w{3}, \w{3} \d{1,2}$/);
    });
  });

  describe('getThisWeekDateRange', () => {
    test('returns date range for current week', () => {
      const range = getThisWeekDateRange();
      expect(range.startDate).toBeInstanceOf(Date);
      expect(range.endDate).toBeInstanceOf(Date);
      expect(range.endDate.getTime()).toBeGreaterThan(range.startDate.getTime());
    });
  });

  describe('getLastWeekDateRange', () => {
    test('returns date range for last week', () => {
      const range = getLastWeekDateRange();
      expect(range.startDate).toBeInstanceOf(Date);
      expect(range.endDate).toBeInstanceOf(Date);
      expect(range.endDate.getTime()).toBeGreaterThan(range.startDate.getTime());
    });
  });

  describe('getLastMonthDateRange', () => {
    test('returns date range for last month', () => {
      const range = getLastMonthDateRange();
      expect(range.startDate).toBeInstanceOf(Date);
      expect(range.endDate).toBeInstanceOf(Date);
      expect(range.endDate.getTime()).toBeGreaterThan(range.startDate.getTime());
    });
  });

  describe('isDateInRange', () => {
    test('correctly identifies dates within range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      expect(isDateInRange('2024-01-15', startDate, endDate)).toBe(true);
      expect(isDateInRange('2024-01-01', startDate, endDate)).toBe(true);
      expect(isDateInRange('2024-01-31', startDate, endDate)).toBe(true);
    });

    test('correctly identifies dates outside range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      expect(isDateInRange('2023-12-31', startDate, endDate)).toBe(false);
      expect(isDateInRange('2024-02-01', startDate, endDate)).toBe(false);
    });
  });
});
