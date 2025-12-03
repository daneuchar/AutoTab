// Background service worker for InitPage extension
// Handles scheduling and automatic tab opening

import { ALARM_NAME, ALARM_PERIOD_MINUTES } from './shared/constants.js';
import { getSchedules, updateSchedule, getSettings } from './shared/storage.js';
import { shouldTriggerSchedule } from './shared/scheduler.js';

// Initialize alarm on extension install or update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('InitPage extension installed/updated:', details.reason);

  // Create the periodic alarm
  await createScheduleAlarm();

  // Initialize default settings if first install
  if (details.reason === 'install') {
    console.log('First install - initializing defaults');
    const settings = await getSettings();
    console.log('Default settings loaded:', settings);
  }
});

// Recreate alarm on service worker startup (in case it was cleared)
chrome.runtime.onStartup.addListener(async () => {
  console.log('Browser started - ensuring alarm exists');
  await createScheduleAlarm();
});

// Create or verify the schedule checking alarm
async function createScheduleAlarm() {
  // Check if alarm already exists
  const existingAlarm = await chrome.alarms.get(ALARM_NAME);

  if (existingAlarm) {
    console.log('Schedule alarm already exists');
    return;
  }

  // Create new alarm that fires every minute
  await chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: ALARM_PERIOD_MINUTES,
    delayInMinutes: 0 // Start immediately
  });

  console.log(`Created schedule alarm - fires every ${ALARM_PERIOD_MINUTES} minute(s)`);
}

// Handle alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) {
    return;
  }

  // Check schedules and open tabs if needed
  await checkAndTriggerSchedules();
});

// Main scheduling logic
async function checkAndTriggerSchedules() {
  try {
    const currentDate = new Date();
    console.log('Checking schedules at:', currentDate.toLocaleString());

    // Get all schedules
    const schedules = await getSchedules();

    if (schedules.length === 0) {
      console.log('No schedules configured');
      return;
    }

    // Find schedules that should trigger now
    const triggeredSchedules = schedules.filter(schedule =>
      shouldTriggerSchedule(schedule, currentDate)
    );

    if (triggeredSchedules.length === 0) {
      console.log('No schedules to trigger at this time');
      return;
    }

    console.log(`Triggering ${triggeredSchedules.length} schedule(s):`, triggeredSchedules);

    // Open tabs for all triggered schedules
    const urls = triggeredSchedules.map(s => s.url);
    await openScheduledTabs(urls);

    // Update lastTriggered timestamp for all triggered schedules
    for (const schedule of triggeredSchedules) {
      await updateSchedule(schedule.id, {
        lastTriggered: currentDate.getTime()
      });
    }

    // Show notification if enabled
    const settings = await getSettings();
    if (settings.notifications) {
      showNotification(urls);
    }

  } catch (error) {
    console.error('Error checking schedules:', error);
  }
}

// Open tabs for scheduled URLs
async function openScheduledTabs(urls) {
  if (!urls || urls.length === 0) {
    return;
  }

  console.log(`Opening ${urls.length} scheduled URL(s):`, urls);

  for (const url of urls) {
    try {
      // Open in new tab, not focused (less disruptive)
      await chrome.tabs.create({
        url: url,
        active: false
      });

      console.log('Opened tab:', url);
    } catch (error) {
      console.error(`Error opening tab for ${url}:`, error);
    }
  }
}

// Show notification when tabs are opened
function showNotification(urls) {
  const title = 'InitPage - Scheduled URLs Opened';
  let message;

  if (urls.length === 1) {
    message = `Opened: ${urls[0]}`;
  } else {
    message = `Opened ${urls.length} scheduled URLs`;
  }

  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    title: title,
    message: message,
    priority: 1
  });
}

// Listen for manual trigger from popup/options (for testing)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'triggerScheduleCheck') {
    checkAndTriggerSchedules().then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Error in manual trigger:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }

  if (message.action === 'getAlarmInfo') {
    chrome.alarms.get(ALARM_NAME).then(alarm => {
      sendResponse({ alarm: alarm });
    });
    return true;
  }
});

console.log('InitPage background service worker loaded');
