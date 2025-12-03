// Group utility functions
import { getGroups, getSchedulesByGroupId } from './storage.js';

// Get group by ID or return null if not found
export async function getGroupOrNull(groupId) {
  if (!groupId) {
    return null;
  }

  const groups = await getGroups();
  return groups.find(group => group.id === groupId) || null;
}

// Organize schedules by their group
export function groupSchedulesByGroup(schedules, groups) {
  const result = {
    ungrouped: [],
    grouped: {}
  };

  // Initialize grouped object with each group
  groups.forEach(group => {
    result.grouped[group.id] = {
      group: group,
      schedules: []
    };
  });

  // Organize schedules
  schedules.forEach(schedule => {
    if (schedule.groupId && result.grouped[schedule.groupId]) {
      result.grouped[schedule.groupId].schedules.push(schedule);
    } else {
      result.ungrouped.push(schedule);
    }
  });

  return result;
}

// Validate group name (check uniqueness)
export async function validateGroupName(name, excludeId = null) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Group name cannot be empty' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Group name must be 50 characters or less' };
  }

  const groups = await getGroups();
  const existing = groups.find(g =>
    g.id !== excludeId &&
    g.name.toLowerCase() === name.toLowerCase().trim()
  );

  if (existing) {
    return { valid: false, error: `A group named "${name}" already exists` };
  }

  return { valid: true };
}

// Check if group is in use by any schedules
export async function isGroupInUse(groupId) {
  const schedules = await getSchedulesByGroupId(groupId);
  return schedules.length > 0;
}

// Get color class for UI display
export function getGroupColorClass(color) {
  return `group-color-${color}`;
}

// Get color hex code for display
export function getGroupColorHex(color) {
  const colorMap = {
    grey: '#5f6368',
    blue: '#1967d2',
    red: '#d93025',
    yellow: '#ea8600',
    green: '#1e8e3e',
    pink: '#d01884',
    purple: '#8430ce',
    cyan: '#12b5cb',
    orange: '#fa903e'
  };

  return colorMap[color] || colorMap.grey;
}
