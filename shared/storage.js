// Storage utilities for managing schedules
import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants.js';

// Get all schedules
export async function getSchedules() {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.SCHEDULES]);
  return result[STORAGE_KEYS.SCHEDULES] || [];
}

// Get a single schedule by ID
export async function getScheduleById(id) {
  const schedules = await getSchedules();
  return schedules.find(schedule => schedule.id === id);
}

// Add a new schedule
export async function addSchedule(schedule) {
  const schedules = await getSchedules();

  // Add timestamp and ensure enabled is set
  const newSchedule = {
    ...schedule,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    lastTriggered: null,
    enabled: schedule.enabled !== undefined ? schedule.enabled : true
  };

  schedules.push(newSchedule);
  await chrome.storage.sync.set({ [STORAGE_KEYS.SCHEDULES]: schedules });

  return newSchedule;
}

// Update an existing schedule
export async function updateSchedule(id, updates) {
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

// Delete a schedule
export async function deleteSchedule(id) {
  const schedules = await getSchedules();
  const filtered = schedules.filter(schedule => schedule.id !== id);

  await chrome.storage.sync.set({ [STORAGE_KEYS.SCHEDULES]: filtered });
  return true;
}

// Delete multiple schedules
export async function deleteSchedules(ids) {
  const schedules = await getSchedules();
  const filtered = schedules.filter(schedule => !ids.includes(schedule.id));

  await chrome.storage.sync.set({ [STORAGE_KEYS.SCHEDULES]: filtered });
  return true;
}

// Toggle schedule enabled status
export async function toggleSchedule(id) {
  const schedule = await getScheduleById(id);
  if (!schedule) {
    throw new Error(`Schedule with id ${id} not found`);
  }

  return await updateSchedule(id, { enabled: !schedule.enabled });
}

// Get settings
export async function getSettings() {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.SETTINGS]);
  return result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
}

// Update settings
export async function updateSettings(settings) {
  const currentSettings = await getSettings();
  const newSettings = { ...currentSettings, ...settings };
  await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: newSettings });
  return newSettings;
}

// Clear all schedules (for testing or bulk delete)
export async function clearAllSchedules() {
  await chrome.storage.sync.set({ [STORAGE_KEYS.SCHEDULES]: [] });
  return true;
}

// Get storage usage info (helpful for monitoring limits)
export async function getStorageInfo() {
  return new Promise((resolve) => {
    chrome.storage.sync.getBytesInUse(null, (bytesInUse) => {
      resolve({
        bytesInUse,
        percentUsed: (bytesInUse / chrome.storage.sync.QUOTA_BYTES) * 100
      });
    });
  });
}

// ============================================================================
// GROUP MANAGEMENT FUNCTIONS
// ============================================================================

// Get all groups
export async function getGroups() {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.GROUPS]);
  return result[STORAGE_KEYS.GROUPS] || [];
}

// Get a single group by ID
export async function getGroupById(id) {
  const groups = await getGroups();
  return groups.find(group => group.id === id);
}

// Add a new group
export async function addGroup(group) {
  const groups = await getGroups();

  // Validate name uniqueness
  const existingGroup = groups.find(g => g.name.toLowerCase() === group.name.toLowerCase());
  if (existingGroup) {
    throw new Error(`A group named "${group.name}" already exists`);
  }

  // Create new group with defaults
  const newGroup = {
    ...group,
    id: crypto.randomUUID(),
    createdAt: Date.now()
  };

  groups.push(newGroup);
  await chrome.storage.sync.set({ [STORAGE_KEYS.GROUPS]: groups });

  return newGroup;
}

// Update an existing group
export async function updateGroup(id, updates) {
  const groups = await getGroups();
  const index = groups.findIndex(group => group.id === id);

  if (index === -1) {
    throw new Error(`Group with id ${id} not found`);
  }

  // Validate name uniqueness if name is being updated
  if (updates.name) {
    const existingGroup = groups.find(g =>
      g.id !== id && g.name.toLowerCase() === updates.name.toLowerCase()
    );
    if (existingGroup) {
      throw new Error(`A group named "${updates.name}" already exists`);
    }
  }

  groups[index] = {
    ...groups[index],
    ...updates
  };

  await chrome.storage.sync.set({ [STORAGE_KEYS.GROUPS]: groups });
  return groups[index];
}

// Delete a group
export async function deleteGroup(id) {
  const groups = await getGroups();
  const filtered = groups.filter(group => group.id !== id);

  // Unassign schedules from this group
  const schedules = await getSchedules();
  const updatedSchedules = schedules.map(schedule => {
    if (schedule.groupId === id) {
      return { ...schedule, groupId: null };
    }
    return schedule;
  });

  // Update both groups and schedules atomically
  await chrome.storage.sync.set({
    [STORAGE_KEYS.GROUPS]: filtered,
    [STORAGE_KEYS.SCHEDULES]: updatedSchedules
  });

  return true;
}

// Get schedules by group ID
export async function getSchedulesByGroupId(groupId) {
  const schedules = await getSchedules();
  return schedules.filter(schedule => schedule.groupId === groupId);
}
