// Data validation utilities
import { ClockState, SessionObject } from '../types';

/**
 * Validate and sanitize clock state data
 * @param state - Raw state data from AsyncStorage
 * @returns Valid ClockState object
 */
export const validateClockState = (state: any): ClockState => {
  // Return default state if input is invalid
  if (!state || typeof state !== 'object') {
    return { isClocked: false, clockInTime: null };
  }

  // Validate isClocked property
  if (typeof state.isClocked !== 'boolean') {
    return { isClocked: false, clockInTime: null };
  }

  // If not clocked, clockInTime should be null
  if (!state.isClocked) {
    return { isClocked: false, clockInTime: null };
  }

  // If clocked, clockInTime must be a valid timestamp string
  if (
    state.isClocked &&
    (!state.clockInTime || typeof state.clockInTime !== 'string')
  ) {
    return { isClocked: false, clockInTime: null };
  }

  // Validate that clockInTime is a valid date string
  if (state.isClocked && state.clockInTime) {
    const date = new Date(state.clockInTime);
    if (isNaN(date.getTime())) {
      return { isClocked: false, clockInTime: null };
    }
  }

  return {
    isClocked: state.isClocked,
    clockInTime: state.clockInTime,
  };
};

/**
 * Validate session data object
 * @param session - Session object to validate
 * @returns True if session is valid, false otherwise
 */
export const validateSessionData = (session: any): boolean => {
  // Check if session is an object
  if (!session || typeof session !== 'object') {
    return false;
  }

  // Check required properties exist and are correct types
  if (typeof session.id !== 'string' || !session.id.trim()) {
    return false;
  }

  if (typeof session.date !== 'string' || !session.date.trim()) {
    return false;
  }

  if (typeof session.clockIn !== 'string' || !session.clockIn.trim()) {
    return false;
  }

  if (typeof session.clockOut !== 'string' || !session.clockOut.trim()) {
    return false;
  }

  if (typeof session.hours !== 'number' || session.hours < 0) {
    return false;
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(session.date)) {
    return false;
  }

  // Validate that clockIn and clockOut are valid ISO timestamps
  const clockInDate = new Date(session.clockIn);
  const clockOutDate = new Date(session.clockOut);

  if (isNaN(clockInDate.getTime()) || isNaN(clockOutDate.getTime())) {
    return false;
  }

  // Validate that clockOut is after clockIn
  if (clockOutDate <= clockInDate) {
    return false;
  }

  return true;
};

/**
 * Validate array of sessions
 * @param sessions - Array of session objects
 * @returns Array of valid sessions (filters out invalid ones)
 */
export const validateSessionsArray = (sessions: any): SessionObject[] => {
  if (!Array.isArray(sessions)) {
    return [];
  }

  return sessions.filter(validateSessionData);
};
