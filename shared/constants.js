// Constants used throughout the extension

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const SCHEDULE_TYPES = {
  RECURRING: 'recurring',
  ONE_TIME: 'one-time'
};

export const SCHEDULE_MODES = {
  DAY_OF_WEEK: 'day-of-week',      // Recurring by day of week (existing)
  SPECIFIC_DATE: 'specific-date',   // One-time on specific date
  DATE_RANGE: 'date-range'          // Recurring within a date range
};

export const ALARM_NAME = 'schedule-checker';
export const ALARM_PERIOD_MINUTES = 1;

export const STORAGE_KEYS = {
  SCHEDULES: 'schedules',
  SETTINGS: 'settings',
  GROUPS: 'groups'
};

export const DEFAULT_SETTINGS = {
  notifications: true
};

export const TAB_GROUP_COLORS = [
  'grey',
  'blue',
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan',
  'orange'
];

// Time format helpers
export function formatTime24(hours, minutes) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getCurrentTime24() {
  const now = new Date();
  return formatTime24(now.getHours(), now.getMinutes());
}

export function getCurrentDayOfWeek() {
  return new Date().getDay();
}

// Date format helpers
export function formatDate(date) {
  // Returns YYYY-MM-DD format
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateString) {
  // Parse YYYY-MM-DD format
  return new Date(dateString);
}

export function isDateInRange(date, startDate, endDate) {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set time to midnight for date comparison
  d.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return d >= start && d <= end;
}
