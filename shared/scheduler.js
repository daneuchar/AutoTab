// Scheduling utilities and time calculations
import { SCHEDULE_TYPES } from './constants.js';

// Check if a schedule should trigger at the current time
export function shouldTriggerSchedule(schedule, currentDate = new Date()) {
  const currentDay = currentDate.getDay();
  const currentTime = `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;

  // Must be enabled
  if (!schedule.enabled) {
    return false;
  }

  // Must match day and time
  if (schedule.dayOfWeek !== currentDay) {
    return false;
  }

  if (schedule.time !== currentTime) {
    return false;
  }

  // For one-time schedules
  if (schedule.type === SCHEDULE_TYPES.ONE_TIME) {
    // Don't trigger if already triggered
    if (schedule.lastTriggered) {
      return false;
    }
  } else {
    // For recurring schedules, check if not triggered in the last minute
    if (schedule.lastTriggered) {
      const lastTriggerDate = new Date(schedule.lastTriggered);
      const timeDiff = currentDate - lastTriggerDate;

      // If triggered less than 1 minute ago, don't trigger again
      if (timeDiff < 60000) {
        return false;
      }
    }
  }

  return true;
}

// Get the next occurrence of a schedule
export function getNextOccurrence(schedule) {
  const now = new Date();
  const [scheduleHours, scheduleMinutes] = schedule.time.split(':').map(Number);

  // Specific dates mode: find the next upcoming date from the list
  if (schedule.mode === 'specific-dates' && schedule.specificDates) {
    const sorted = [...schedule.specificDates].sort();
    for (const dateStr of sorted) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const candidate = new Date(y, m - 1, d, scheduleHours, scheduleMinutes, 0, 0);
      if (candidate >= now) return candidate;
    }
    return null;
  }

  // Days-of-week mode: find the nearest upcoming day from the array
  if (schedule.mode === 'days-of-week' && schedule.daysOfWeek) {
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let minDaysUntil = Infinity;

    for (const day of schedule.daysOfWeek) {
      let daysUntil = day - currentDay;
      if (daysUntil === 0 && currentTime >= schedule.time) daysUntil = 7;
      if (daysUntil < 0) daysUntil += 7;
      if (daysUntil < minDaysUntil) minDaysUntil = daysUntil;
    }

    if (minDaysUntil === Infinity) return null;
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + minDaysUntil);
    nextDate.setHours(scheduleHours, scheduleMinutes, 0, 0);
    return nextDate;
  }

  // Legacy fallback: old single dayOfWeek format
  if (schedule.dayOfWeek !== undefined) {
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let daysUntil = schedule.dayOfWeek - currentDay;

    if (daysUntil === 0 && currentTime >= schedule.time) {
      if (schedule.type === SCHEDULE_TYPES.ONE_TIME) {
        if (schedule.lastTriggered) return null;
      } else {
        daysUntil = 7;
      }
    }
    if (daysUntil < 0) daysUntil += 7;

    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntil);
    nextDate.setHours(scheduleHours, scheduleMinutes, 0, 0);
    return nextDate;
  }

  return null;
}

// Get upcoming schedules sorted by next occurrence
export function getUpcomingSchedules(schedules, limit = 5) {
  const schedulesWithNext = schedules
    .filter(schedule => schedule.enabled)
    .map(schedule => ({
      ...schedule,
      nextOccurrence: getNextOccurrence(schedule)
    }))
    .filter(schedule => schedule.nextOccurrence !== null)
    .sort((a, b) => a.nextOccurrence - b.nextOccurrence);

  return limit ? schedulesWithNext.slice(0, limit) : schedulesWithNext;
}

// Validate URL
export function isValidURL(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

// Format URL (add https:// if missing)
export function formatURL(url) {
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  // If no protocol, add https://
  if (!trimmed.match(/^https?:\/\//i)) {
    return 'https://' + trimmed;
  }

  return trimmed;
}

// Check for duplicate schedules
export function findDuplicateSchedule(schedules, newSchedule) {
  return schedules.find(
    schedule =>
      schedule.url === newSchedule.url &&
      schedule.dayOfWeek === newSchedule.dayOfWeek &&
      schedule.time === newSchedule.time &&
      schedule.type === newSchedule.type &&
      schedule.id !== newSchedule.id // Don't match itself when editing
  );
}

// Format time for display (12-hour format)
export function formatTime12Hour(time24) {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

// Get relative time string (e.g., "in 2 hours", "tomorrow at 3:00 PM")
export function getRelativeTimeString(date) {
  if (!date) {
    return 'Never';
  }

  const now = new Date();
  const diff = date - now;

  // If in the past
  if (diff < 0) {
    return 'Passed';
  }

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return 'In less than a minute';
  }

  if (minutes < 60) {
    return `In ${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  if (hours < 24) {
    return `In ${hours} hour${hours === 1 ? '' : 's'}`;
  }

  if (days === 1) {
    const timeStr = formatTime12Hour(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`);
    return `Tomorrow at ${timeStr}`;
  }

  return `In ${days} days`;
}
