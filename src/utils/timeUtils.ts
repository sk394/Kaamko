/**
 * Get date range for this week (Monday to today)
 * @returns Object with start and end dates for this week
 */
export const getThisWeekDateRange = (): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
  // Calculate Monday (if Sunday, go back 6 days)
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(23, 59, 59, 999);
  return { startDate: monday, endDate: today };
};
// Time calculation and formatting utilities

/**
 * Calculate hours between two timestamps
 * @param startTime - ISO 8601 timestamp string
 * @param endTime - ISO 8601 timestamp string
 * @returns Number of hours worked (rounded to 2 decimal places)
 */
export const calculateHours = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
};

/**
 * Format timestamp for display
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted time string (e.g., "09:30 AM")
 */
export const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date for display
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Mon, Jan 1")
 */
export const formatDate = (dateString: string): string => {

  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

/**
 * Get date range for last week filter (past 7 days)
 * @returns Object with start and end dates for the past 7 days
 */
export const getLastWeekDateRange = (): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)

  // Calculate last week's Monday
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) - 7);
  lastMonday.setHours(0, 0, 0, 0);

  // Calculate last week's Sunday
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);

  return { startDate: lastMonday, endDate: lastSunday };
};

/**
 * Get date range for last month filter (past 30 days)
 * @returns Object with start and end dates for the past 30 days
 */
export const getLastMonthDateRange = (): { startDate: Date; endDate: Date } => {
  const now = new Date();

  // Get first day of previous month
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  startDate.setHours(0, 0, 0, 0);

  // Get last day of previous month
  const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

/**
 * Check if a date string falls within a date range
 * @param dateString - Date string in YYYY-MM-DD format
 * @param startDate - Start date of the range
 * @param endDate - End date of the range
 * @returns True if the date falls within the range
 */
export const isDateInRange = (
  dateString: string,
  startDate: Date,
  endDate: Date
): boolean => {
  const date = new Date(dateString);

  // Set time to start of day for consistent comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  return dateOnly >= startOnly && dateOnly <= endOnly;
};
