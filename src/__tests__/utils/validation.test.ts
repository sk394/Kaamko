import {
  validateClockState,
  validateSessionData,
  validateSessionsArray,
} from '../../utils/validation';
import { ClockState, SessionObject } from '../../types';

describe('validation', () => {
  describe('validateClockState', () => {
    test('returns default state for null input', () => {
      const result = validateClockState(null);
      expect(result).toEqual({ isClocked: false, clockInTime: null });
    });

    test('returns default state for undefined input', () => {
      const result = validateClockState(undefined);
      expect(result).toEqual({ isClocked: false, clockInTime: null });
    });

    test('returns default state for non-object input', () => {
      const result = validateClockState('invalid');
      expect(result).toEqual({ isClocked: false, clockInTime: null });
    });

    test('returns default state when isClocked is not boolean', () => {
      const result = validateClockState({
        isClocked: 'true',
        clockInTime: null,
      });
      expect(result).toEqual({ isClocked: false, clockInTime: null });
    });

    test('returns valid state when not clocked', () => {
      const input = { isClocked: false, clockInTime: 'some-time' };
      const result = validateClockState(input);
      expect(result).toEqual({ isClocked: false, clockInTime: null });
    });

    test('returns default state when clocked but no clockInTime', () => {
      const input = { isClocked: true, clockInTime: null };
      const result = validateClockState(input);
      expect(result).toEqual({ isClocked: false, clockInTime: null });
    });

    test('returns default state when clocked but invalid clockInTime', () => {
      const input = { isClocked: true, clockInTime: 'invalid-date' };
      const result = validateClockState(input);
      expect(result).toEqual({ isClocked: false, clockInTime: null });
    });

    test('returns valid state when properly clocked in', () => {
      const clockInTime = '2024-01-01T09:00:00.000Z';
      const input = { isClocked: true, clockInTime };
      const result = validateClockState(input);
      expect(result).toEqual({ isClocked: true, clockInTime });
    });

    test('handles extra properties in input', () => {
      const clockInTime = '2024-01-01T09:00:00.000Z';
      const input = { isClocked: true, clockInTime, extraProp: 'value' };
      const result = validateClockState(input);
      expect(result).toEqual({ isClocked: true, clockInTime });
    });
  });

  describe('validateSessionData', () => {
    const validSession: SessionObject = {
      id: 'test-id',
      date: '2024-01-01',
      clockIn: '2024-01-01T09:00:00.000Z',
      clockOut: '2024-01-01T17:00:00.000Z',
      hours: 8,
    };

    test('returns true for valid session', () => {
      expect(validateSessionData(validSession)).toBe(true);
    });

    test('returns false for null input', () => {
      expect(validateSessionData(null)).toBe(false);
    });

    test('returns false for non-object input', () => {
      expect(validateSessionData('invalid')).toBe(false);
    });

    test('returns false for missing id', () => {
      const session = { ...validSession };
      delete (session as any).id;
      expect(validateSessionData(session)).toBe(false);
    });

    test('returns false for empty id', () => {
      const session = { ...validSession, id: '' };
      expect(validateSessionData(session)).toBe(false);
    });

    test('returns false for non-string id', () => {
      const session = { ...validSession, id: 123 };
      expect(validateSessionData(session)).toBe(false);
    });

    test('returns false for invalid date format', () => {
      const session = { ...validSession, date: '01/01/2024' };
      expect(validateSessionData(session)).toBe(false);
    });

    test('returns false for invalid clockIn timestamp', () => {
      const session = { ...validSession, clockIn: 'invalid-date' };
      expect(validateSessionData(session)).toBe(false);
    });

    test('returns false for invalid clockOut timestamp', () => {
      const session = { ...validSession, clockOut: 'invalid-date' };
      expect(validateSessionData(session)).toBe(false);
    });

    test('returns false for negative hours', () => {
      const session = { ...validSession, hours: -1 };
      expect(validateSessionData(session)).toBe(false);
    });

    test('returns false for non-number hours', () => {
      const session = { ...validSession, hours: '8' };
      expect(validateSessionData(session)).toBe(false);
    });

    test('returns false when clockOut is before clockIn', () => {
      const session = {
        ...validSession,
        clockIn: '2024-01-01T17:00:00.000Z',
        clockOut: '2024-01-01T09:00:00.000Z',
      };
      expect(validateSessionData(session)).toBe(false);
    });

    test('returns false when clockOut equals clockIn', () => {
      const time = '2024-01-01T09:00:00.000Z';
      const session = {
        ...validSession,
        clockIn: time,
        clockOut: time,
      };
      expect(validateSessionData(session)).toBe(false);
    });
  });

  describe('validateSessionsArray', () => {
    const validSession: SessionObject = {
      id: 'test-id',
      date: '2024-01-01',
      clockIn: '2024-01-01T09:00:00.000Z',
      clockOut: '2024-01-01T17:00:00.000Z',
      hours: 8,
    };

    test('returns empty array for non-array input', () => {
      expect(validateSessionsArray('not-array')).toEqual([]);
      expect(validateSessionsArray(null)).toEqual([]);
      expect(validateSessionsArray(undefined)).toEqual([]);
    });

    test('returns empty array for empty array', () => {
      expect(validateSessionsArray([])).toEqual([]);
    });

    test('filters out invalid sessions', () => {
      const sessions = [
        validSession,
        { ...validSession, id: '' }, // Invalid
        { ...validSession, id: 'valid-2' },
        null, // Invalid
        { ...validSession, hours: -1 }, // Invalid
      ];

      const result = validateSessionsArray(sessions);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test-id');
      expect(result[1].id).toBe('valid-2');
    });

    test('returns all sessions when all are valid', () => {
      const sessions = [validSession, { ...validSession, id: 'valid-2' }];

      const result = validateSessionsArray(sessions);
      expect(result).toHaveLength(2);
    });
  });
});
