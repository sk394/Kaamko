// src/types/index.ts
export interface SessionObject {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string;
  hours: number;
}

export interface ClockState {
  isClocked: boolean;
  clockInTime: string | null;
}

export interface NavigationState {
  currentScreen: 'main' | 'sessionsHistory' | 'settings';
}

export interface NavigationMethods {
  navigateToSessionsHistory: () => void;
  navigateToMain: () => void;
  navigateToSettings: () => void;
}

export type FilterType = 'all' | 'lastWeek' | 'lastMonth' | 'thisWeek';

export interface FilterOption {
  type: FilterType;
  label: string;
  days?: number;
}

export interface SessionFilter {
  type: FilterType;
  startDate?: Date;
  endDate?: Date;
}

export interface AppState {
  /** Whether the user is currently clocked in */
  isClocked: boolean;

  /** Clock-in time as Date object, null if not clocked in */
  clockInTime: Date | null;

  sessions: SessionObject[];

  loading: boolean;

  navigation: NavigationState;
}
