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
