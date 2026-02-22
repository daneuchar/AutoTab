// Background service worker for Auto Tab extension
// Handles scheduling and automatic tab opening

// Constants
const ALARM_NAME = 'schedule-checker';
const ALARM_PERIOD_MINUTES = 1;
const STORAGE_KEYS = {
  SCHEDULES: 'schedules',
  SETTINGS: 'settings',
  GROUPS: 'groups'
};
const DEFAULT_SETTINGS = {
  notifications: true
};
const SCHEDULE_TYPES = {
  RECURRING: 'recurring',
  ONE_TIME: 'one-time'
};

// Storage functions
async function getSchedules() {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.SCHEDULES]);
  return result[STORAGE_KEYS.SCHEDULES] || [];
}

async function updateSchedule(id, updates) {
  const schedules = await getSchedules();
  const index = schedules.findIndex(schedule => schedule.id === id);

  if (index === -1) {
    throw new Error(`Schedule with id ${id} not found`);
  }

  schedules[index] = {
    ...schedules[index],
    ...updates
  };

  await chrome.storage.sync.set({ [STORAGE_KEYS.SCHEDULES]: schedules });
  return schedules[index];
}

async function getSettings() {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.SETTINGS]);
  return result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
}

async function getGroups() {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.GROUPS]);
  return result[STORAGE_KEYS.GROUPS] || [];
}

async function getGroupById(id) {
  const groups = await getGroups();
  return groups.find(group => group.id === id);
}

// Scheduler function
function shouldTriggerSchedule(schedule, currentDate = new Date()) {
  const currentDay = currentDate.getDay();
  const currentTime = `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;

  // Must be enabled
  if (!schedule.enabled) {
    return false;
  }

  // Get current date in YYYY-MM-DD format
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const currentDateStr = `${year}-${month}-${day}`;

  // New mode: Specific Dates (multi-date selection)
  if (schedule.mode === 'specific-dates' && schedule.specificDates) {
    if (schedule.time !== currentTime) {
      return false;
    }

    // Check if today is one of the selected dates
    if (!schedule.specificDates.includes(currentDateStr)) {
      return false;
    }

    // Check if already triggered today
    if (schedule.lastTriggered) {
      const lastDate = formatDateYYYYMMDD(new Date(schedule.lastTriggered));
      if (lastDate === currentDateStr) {
        return false; // Already triggered today
      }
    }

    return true;
  }

  // New mode: Days of Week (multi-day selection)
  if (schedule.mode === 'days-of-week' && schedule.daysOfWeek) {
    if (schedule.time !== currentTime) {
      return false;
    }

    // Check if today is one of the selected days
    if (!schedule.daysOfWeek.includes(currentDay)) {
      return false;
    }

    // Prevent duplicate triggers within same minute
    if (schedule.lastTriggered) {
      const timeDiff = currentDate - new Date(schedule.lastTriggered);
      if (timeDiff < 60000) {
        return false;
      }
    }

    return true;
  }

  // Backward compatibility: Old format with specificDate and recurring
  if (schedule.specificDate) {
    const scheduleDate = new Date(schedule.specificDate);
    const scheduleDayOfWeek = scheduleDate.getDay();

    // Must match time
    if (schedule.time !== currentTime) {
      return false;
    }

    if (schedule.recurring) {
      // Recurring: match day of week from the selected date
      if (scheduleDayOfWeek !== currentDay) {
        return false;
      }

      // Check if not triggered in the last minute
      if (schedule.lastTriggered) {
        const lastTriggerDate = new Date(schedule.lastTriggered);
        const timeDiff = currentDate - lastTriggerDate;
        if (timeDiff < 60000) {
          return false;
        }
      }
    } else {
      // One-time: exact date match
      if (schedule.specificDate !== currentDateStr) {
        return false;
      }

      // One-time only
      if (schedule.lastTriggered) {
        return false;
      }
    }
  }
  // Backward compatibility with very old day-of-week format
  else if (schedule.dayOfWeek !== undefined) {
    if (schedule.dayOfWeek !== currentDay) {
      return false;
    }

    if (schedule.time !== currentTime) {
      return false;
    }

    if (schedule.type === SCHEDULE_TYPES.ONE_TIME) {
      if (schedule.lastTriggered) {
        return false;
      }
    } else {
      if (schedule.lastTriggered) {
        const lastTriggerDate = new Date(schedule.lastTriggered);
        const timeDiff = currentDate - lastTriggerDate;
        if (timeDiff < 60000) {
          return false;
        }
      }
    }
  } else {
    // Unknown/corrupt format — do not trigger
    return false;
  }

  return true;
}

// Helper function to format date as YYYY-MM-DD
function formatDateYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initialize alarm on extension install or update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Auto Tab extension installed/updated:', details.reason);

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
    await openScheduledTabs(triggeredSchedules);

    // Update lastTriggered timestamp for all triggered schedules
    for (const schedule of triggeredSchedules) {
      await updateSchedule(schedule.id, {
        lastTriggered: currentDate.getTime()
      });
    }

    // Show notification if enabled
    const settings = await getSettings();
    if (settings.notifications) {
      showNotification(triggeredSchedules);
    }

  } catch (error) {
    console.error('Error checking schedules:', error);
  }
}

// Open tabs for scheduled URLs with tab grouping support
async function openScheduledTabs(schedules) {
  if (!schedules || schedules.length === 0) {
    return;
  }

  console.log(`Opening ${schedules.length} scheduled URL(s)`);

  try {
    // Get last focused window (safe in service worker — getCurrent() can fail)
    let windowId = null;
    try {
      const win = await chrome.windows.getLastFocused({ populate: false });
      if (win) windowId = win.id;
    } catch (e) { /* no window available, open tabs without windowId */ }

    // Get all existing tab groups in current window
    const existingGroups = windowId
      ? await chrome.tabGroups.query({ windowId })
      : [];

    // Organize schedules by groupId
    const schedulesByGroup = {};
    const ungroupedSchedules = [];

    for (const schedule of schedules) {
      if (schedule.groupId) {
        if (!schedulesByGroup[schedule.groupId]) {
          schedulesByGroup[schedule.groupId] = [];
        }
        schedulesByGroup[schedule.groupId].push(schedule);
      } else {
        ungroupedSchedules.push(schedule);
      }
    }

    let isFirstTab = true;

    // Process grouped schedules
    for (const [groupId, groupSchedules] of Object.entries(schedulesByGroup)) {
      try {
        // Get group details
        const group = await getGroupById(groupId);

        if (!group) {
          // Group was deleted, treat as ungrouped
          console.warn(`Group ${groupId} not found, opening tabs ungrouped`);
          ungroupedSchedules.push(...groupSchedules);
          continue;
        }

        // Open all tabs in this group
        const tabIds = [];
        for (const schedule of groupSchedules) {
          try {
            const tab = await chrome.tabs.create({
              url: schedule.url,
              active: isFirstTab,
              ...(windowId ? { windowId } : {})
            });
            tabIds.push(tab.id);
            console.log(`Opened tab: ${schedule.url}`);
            isFirstTab = false;
          } catch (error) {
            console.error(`Error opening tab for ${schedule.url}:`, error);
          }
        }

        // Group the tabs
        if (tabIds.length > 0) {
          try {
            // Check if group with same title already exists
            const existingGroup = existingGroups.find(g => g.title === group.name);

            if (existingGroup) {
              // Add tabs to existing group
              await chrome.tabs.group({
                tabIds: tabIds,
                groupId: existingGroup.id
              });
              console.log(`Added ${tabIds.length} tabs to existing group: ${group.name}`);
            } else {
              // Create new group
              const newGroupId = await chrome.tabs.group({
                tabIds: tabIds
              });

              // Configure the group
              await chrome.tabGroups.update(newGroupId, {
                title: group.name,
                color: group.color,
                collapsed: false
              });
              console.log(`Created new group "${group.name}" with ${tabIds.length} tabs`);
            }
          } catch (error) {
            console.error(`Error grouping tabs for group ${group.name}:`, error);
            // Tabs are still open, just not grouped
          }
        }
      } catch (error) {
        console.error(`Error processing group ${groupId}:`, error);
      }
    }

    // Process ungrouped schedules
    for (const schedule of ungroupedSchedules) {
      try {
        await chrome.tabs.create({
          url: schedule.url,
          active: isFirstTab,
          ...(windowId ? { windowId } : {})
        });
        console.log(`Opened ungrouped tab: ${schedule.url}`);
        isFirstTab = false;
      } catch (error) {
        console.error(`Error opening tab for ${schedule.url}:`, error);
      }
    }

  } catch (error) {
    console.error('Error in openScheduledTabs:', error);
    // Fallback: open tabs without grouping
    for (let i = 0; i < schedules.length; i++) {
      try {
        await chrome.tabs.create({
          url: schedules[i].url,
          active: i === 0
        });
      } catch (tabError) {
        console.error(`Error opening tab:`, tabError);
      }
    }
  }
}

// Show notification when tabs are opened
function showNotification(schedules) {
  const title = 'Auto Tab - Scheduled URLs Opened';
  let message;

  if (schedules.length === 1) {
    message = `Opened: ${schedules[0].url}`;
  } else {
    message = `Opened ${schedules.length} scheduled URLs`;
  }

  chrome.notifications.create('autotab-trigger', {
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

console.log('Auto Tab background service worker loaded');
