/**
 * Type definitions for the React Native Time Tracker application
 *
 * This file contains all TypeScript interfaces and types used throughout
 * the application for type safety and better development experience.
 */

/**
 * Represents a completed work session
 * This is the main data structure for tracking work time
 */
export interface SessionObject {
  /** Unique identifier for the session (format: "session-{timestamp}") */
  id: string;

  /** Date of the work session in YYYY-MM-DD format */
  date: string;

  /** Clock-in timestamp in ISO 8601 format */
  clockIn: string;

  /** Clock-out timestamp in ISO 8601 format */
  clockOut: string;

  /** Total hours worked in the session (decimal, rounded to 2 places) */
  hours: number;
}

/**
 * Represents the current clock state for persistence
 * Used when saving/loading state to/from AsyncStorage
 */
export interface ClockState {
  /** Whether the user is currently clocked in */
  isClocked: boolean;

  /** Clock-in timestamp in ISO 8601 format, null if not clocked in */
  clockInTime: string | null;
}

/**
 * Navigation state interface for managing screen transitions
 * Used to track which screen is currently active
 */
export interface NavigationState {
  /** Current active screen */
  currentScreen: 'main' | 'sessionsHistory';
}

/**
 * Navigation methods interface for screen switching
 * Provides methods to navigate between different screens
 */
export interface NavigationMethods {
  /** Navigate to the sessions history screen */
  navigateToSessionsHistory: () => void;

  /** Navigate back to the main screen */
  navigateToMain: () => void;
}

/**
 * Filter types for sessions history
 * Used to filter sessions by different time periods
 */
export type FilterType = 'all' | 'lastWeek' | 'lastMonth' | 'thisWeek';

/**
 * Filter option interface
 * Represents a filter option with its configuration
 */
export interface FilterOption {
  /** Type of filter */
  type: FilterType;

  /** Display label for the filter */
  label: string;

  /** Number of days to look back (optional, used for time-based filters) */
  days?: number;
}

/**
 * Session filter interface
 * Used for filtering sessions with date ranges
 */
export interface SessionFilter {
  /** Type of filter being applied */
  type: FilterType;

  /** Start date for filtering (optional) */
  startDate?: Date;

  /** End date for filtering (optional) */
  endDate?: Date;
}

/**
 * Main application state interface
 * Used by the App component to manage global state
 */
export interface AppState {
  /** Whether the user is currently clocked in */
  isClocked: boolean;

  /** Clock-in time as Date object, null if not clocked in */
  clockInTime: Date | null;

  /** Array of all completed work sessions, ordered by most recent first */
  sessions: SessionObject[];

  /** Loading state for async operations (storage, calculations) */
  loading: boolean;

  /** Navigation state for managing screen transitions */
  navigation: NavigationState;
}
