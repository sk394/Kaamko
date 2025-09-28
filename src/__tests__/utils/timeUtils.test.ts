import {
  calculateHours,
  formatTime,
  formatDate,
  getLastWeekDateRange,
  getLastMonthDateRange,
  isDateInRange,
} from '../../utils/timeUtils';

describe('timeUtils', () => {
  describe('calculateHours', () => {
    test('calculates correct hours for same day', () => {
      const start = '2024-01-01T09:00:00.000Z';
      const end = '2024-01-01T17:30:00.000Z';
      expect(calculateHours(start, end)).toBe(8.5);
    });

    test('handles overnight sessions', () => {
      const start = '2024-01-01T23:00:00.000Z';
      const end = '2024-01-02T07:00:00.000Z';
      expect(calculateHours(start, end)).toBe(8);
    });

    test('calculates fractional hours correctly', () => {
      const start = '2024-01-01T09:00:00.000Z';
      const end = '2024-01-01T09:15:00.000Z';
      expect(calculateHours(start, end)).toBe(0.25);
    });

    test('handles same start and end time', () => {
      const time = '2024-01-01T09:00:00.000Z';
      expect(calculateHours(time, time)).toBe(0);
    });

    test('rounds to 2 decimal places', () => {
      const start = '2024-01-01T09:00:00.000Z';
      const end = '2024-01-01T09:10:00.000Z';
      expect(calculateHours(start, end)).toBe(0.17);
    });
  });

  describe('formatTime', () => {
    test('formats time correctly for AM', () => {
      const timestamp = '2024-01-01T09:30:00.000Z';
      const formatted = formatTime(timestamp);
      // Note: This will depend on the system timezone, but should include time
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });

    test('formats time correctly for PM', () => {
      const timestamp = '2024-01-01T15:45:00.000Z';
      const formatted = formatTime(timestamp);
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });

    test('handles midnight correctly', () => {
      const timestamp = '2024-01-01T00:00:00.000Z';
      const formatted = formatTime(timestamp);
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('formatDate', () => {
    test('formats date correctly', () => {
      const dateString = '2024-01-01';
      const formatted = formatDate(dateString);
      expect(formatted).toMatch(/\w{3}, \w{3} \d{1,2}/);
    });

    test('handles different months', () => {
      const dateString = '2024-12-25';
      const formatted = formatDate(dateString);
      expect(formatted).toMatch(/\w{3}, \w{3} \d{1,2}/);
    });

    test('handles leap year dates', () => {
      const dateString = '2024-02-29';
      const formatted = formatDate(dateString);
      expect(formatted).toMatch(/\w{3}, \w{3} \d{1,2}/);
    });
  });

  describe('getLastWeekDateRange', () => {
    test('returns date range for past 7 days', () => {
      const { startDate, endDate } = getLastWeekDateRange();
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(7);
    });

    test('end date is today', () => {
      const { endDate } = getLastWeekDateRange();
      const today = new Date();
      expect(endDate.toDateString()).toBe(today.toDateString());
    });

    test('start date is 7 days ago', () => {
      const { startDate } = getLastWeekDateRange();
      const expectedStart = new Date();
      expectedStart.setDate(expectedStart.getDate() - 7);
      expect(startDate.toDateString()).toBe(expectedStart.toDateString());
    });
  });

  describe('getLastMonthDateRange', () => {
    test('returns date range for past 30 days', () => {
      const { startDate, endDate } = getLastMonthDateRange();
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(30);
    });

    test('end date is today', () => {
      const { endDate } = getLastMonthDateRange();
      const today = new Date();
      expect(endDate.toDateString()).toBe(today.toDateString());
    });

    test('start date is 30 days ago', () => {
      const { startDate } = getLastMonthDateRange();
      const expectedStart = new Date();
      expectedStart.setDate(expectedStart.getDate() - 30);
      expect(startDate.toDateString()).toBe(expectedStart.toDateString());
    });
  });

  describe('isDateInRange', () => {
    test('returns true for date within range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const dateString = '2024-01-15';
      expect(isDateInRange(dateString, startDate, endDate)).toBe(true);
    });

    test('returns true for date at start of range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const dateString = '2024-01-01';
      expect(isDateInRange(dateString, startDate, endDate)).toBe(true);
    });

    test('returns true for date at end of range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const dateString = '2024-01-31';
      expect(isDateInRange(dateString, startDate, endDate)).toBe(true);
    });

    test('returns false for date before range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const dateString = '2023-12-31';
      expect(isDateInRange(dateString, startDate, endDate)).toBe(false);
    });

    test('returns false for date after range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const dateString = '2024-02-01';
      expect(isDateInRange(dateString, startDate, endDate)).toBe(false);
    });

    test('handles time components correctly', () => {
      const startDate = new Date('2024-01-01T10:30:00');
      const endDate = new Date('2024-01-03T15:45:00');
      const dateString = '2024-01-02';
      expect(isDateInRange(dateString, startDate, endDate)).toBe(true);
    });
  });
});
