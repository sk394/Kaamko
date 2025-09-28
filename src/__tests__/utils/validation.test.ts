import { validateClockState, validateSessionsArray, validateSessionData } from '../../utils/validation';
import { ClockState, SessionObject } from '../../types';

describe('Validation Utils', () => {
  describe('validateClockState', () => {
    test('validates correct clock state', () => {
      const validState: ClockState = {
        isClocked: true,
        clockInTime: '2024-01-01T09:00:00.000Z',
      };
      
      const result = validateClockState(validState);
      expect(result).toEqual(validState);
    });

    test('validates clock state with null time', () => {
      const validState: ClockState = {
        isClocked: false,
        clockInTime: null,
      };
      
      const result = validateClockState(validState);
      expect(result).toEqual(validState);
    });

    test('returns default for invalid state', () => {
      const invalidState = {
        isClocked: 'true',
        clockInTime: 'invalid-time',
      };
      
      const result = validateClockState(invalidState as any);
      expect(result).toEqual({ isClocked: false, clockInTime: null });
    });

    test('returns default for missing properties', () => {
      const incompleteState = { isClocked: true };
      
      const result = validateClockState(incompleteState as any);
      expect(result).toEqual({ isClocked: false, clockInTime: null });
    });
  });

  describe('validateSessionData', () => {
    test('validates correct session object', () => {
      const validSession: SessionObject = {
        id: 'test-id',
        date: '2024-01-01',
        clockIn: '2024-01-01T09:00:00.000Z',
        clockOut: '2024-01-01T17:00:00.000Z',
        hours: 8,
      };
      
      const result = validateSessionData(validSession);
      expect(result).toBe(true);
    });

    test('returns false for invalid session', () => {
      const invalidSession = {
        id: '',
        date: '2024-01-01',
        clockIn: 'invalid-time',
        clockOut: '2024-01-01T17:00:00.000Z',
        hours: 'invalid-hours',
      };
      
      const result = validateSessionData(invalidSession as any);
      expect(result).toBe(false);
    });

    test('returns false for missing required fields', () => {
      const incompleteSession = {
        id: 'test-id',
        date: '2024-01-01',
      };
      
      const result = validateSessionData(incompleteSession as any);
      expect(result).toBe(false);
    });

    test('returns false when clockOut is before clockIn', () => {
      const invalidSession = {
        id: 'test-id',
        date: '2024-01-01',
        clockIn: '2024-01-01T17:00:00.000Z',
        clockOut: '2024-01-01T09:00:00.000Z',
        hours: 8,
      };
      
      const result = validateSessionData(invalidSession);
      expect(result).toBe(false);
    });
  });

  describe('validateSessionsArray', () => {
    test('validates array of correct sessions', () => {
      const validSessions: SessionObject[] = [
        {
          id: 'test-1',
          date: '2024-01-01',
          clockIn: '2024-01-01T09:00:00.000Z',
          clockOut: '2024-01-01T17:00:00.000Z',
          hours: 8,
        },
        {
          id: 'test-2',
          date: '2024-01-02',
          clockIn: '2024-01-02T09:00:00.000Z',
          clockOut: '2024-01-02T17:00:00.000Z',
          hours: 8,
        },
      ];
      
      const result = validateSessionsArray(validSessions);
      expect(result).toEqual(validSessions);
      expect(result).toHaveLength(2);
    });

    test('filters out invalid sessions', () => {
      const mixedSessions = [
        {
          id: 'valid-1',
          date: '2024-01-01',
          clockIn: '2024-01-01T09:00:00.000Z',
          clockOut: '2024-01-01T17:00:00.000Z',
          hours: 8,
        },
        {
          id: '',
          date: '2024-01-02',
          clockIn: 'invalid-time',
          clockOut: '2024-01-02T17:00:00.000Z',
          hours: 'invalid-hours',
        },
        {
          id: 'valid-2',
          date: '2024-01-03',
          clockIn: '2024-01-03T09:00:00.000Z',
          clockOut: '2024-01-03T17:00:00.000Z',
          hours: 8,
        },
      ];
      
      const result = validateSessionsArray(mixedSessions as any);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('valid-1');
      expect(result[1].id).toBe('valid-2');
    });

    test('returns empty array for non-array input', () => {
      const nonArrayInput = { notAnArray: true };
      
      const result = validateSessionsArray(nonArrayInput as any);
      expect(result).toEqual([]);
    });

    test('returns empty array for null/undefined input', () => {
      expect(validateSessionsArray(null as any)).toEqual([]);
      expect(validateSessionsArray(undefined as any)).toEqual([]);
    });
  });
});
