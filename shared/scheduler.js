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
  const currentDay = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Parse schedule time
  const [scheduleHours, scheduleMinutes] = schedule.time.split(':').map(Number);

  // Calculate days until next occurrence
  let daysUntil = schedule.dayOfWeek - currentDay;

  // If schedule is for today
  if (daysUntil === 0) {
    // Check if time has already passed
    if (currentTime >= schedule.time) {
      // For one-time, if already triggered or time passed, no next occurrence
      if (schedule.type === SCHEDULE_TYPES.ONE_TIME) {
        if (schedule.lastTriggered) {
          return null;
        }
        // If time passed today and not triggered yet, still schedule for today
        // (might be in the future if we haven't reached it yet)
      } else {
        // For recurring, schedule for next week
        daysUntil = 7;
      }
    }
  }

  // If day is in the past this week, schedule for next week
  if (daysUntil < 0) {
    daysUntil += 7;
  }

  // Create the next occurrence date
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntil);
  nextDate.setHours(scheduleHours, scheduleMinutes, 0, 0);

  return nextDate;
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

  if (days < 7) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeStr = formatTime12Hour(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`);
    return `${dayNames[date.getDay()]} at ${timeStr}`;
  }

  return `In ${days} days`;
}
