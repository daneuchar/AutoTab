// Popup logic for Auto Tab extension
import { DAYS_OF_WEEK } from '../shared/constants.js';
import { getSchedules, addSchedule, toggleSchedule, getGroups, addGroup } from '../shared/storage.js';
import { getUpcomingSchedules, isValidURL, formatURL, findDuplicateSchedule, getRelativeTimeString, formatTime12Hour } from '../shared/scheduler.js';
import { getGroupColorHex } from '../shared/groups.js';

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// DOM elements
let urlInput, timeInput, groupSelect, addScheduleForm;
let calendarPicker, flatpickrInstance;
let specificDatesMode, daysOfWeekMode;
let upcomingList, scheduleCount, openOptionsBtn;
// Group elements
let addGroupBtn, groupModal, groupModalClose, groupForm, groupCancelBtn;
let groupName, groupColor, colorPicker;

// State
let allGroups = [];
let selectedColor = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    // Get DOM elements
    urlInput = document.getElementById('url');
    timeInput = document.getElementById('time');
    groupSelect = document.getElementById('group');
    addScheduleForm = document.getElementById('addScheduleForm');
    calendarPicker = document.getElementById('calendarPicker');
    specificDatesMode = document.getElementById('specificDatesMode');
    daysOfWeekMode = document.getElementById('daysOfWeekMode');
    upcomingList = document.getElementById('upcomingList');
    scheduleCount = document.getElementById('scheduleCount');
    openOptionsBtn = document.getElementById('openOptions');
    // Group elements
    addGroupBtn = document.getElementById('addGroupBtn');
    groupModal = document.getElementById('groupModal');
    groupModalClose = document.getElementById('groupModalClose');
    groupForm = document.getElementById('groupForm');
    groupCancelBtn = document.getElementById('groupCancelBtn');
    groupName = document.getElementById('groupName');
    groupColor = document.getElementById('groupColor');
    colorPicker = document.getElementById('colorPicker');

    // Initialize flatpickr for multi-date selection
    flatpickrInstance = flatpickr(calendarPicker, {
        mode: "multiple",
        dateFormat: "Y-m-d",
        minDate: "today",
        inline: false,
        showMonths: 1
    });

    // Mode switching event listeners
    document.querySelectorAll('input[name="scheduleMode"]').forEach(radio => {
        radio.addEventListener('change', handleModeSwitch);
    });

    // Set default values
    setDefaultFormValues();
    await populateCurrentTabUrl();

    // Load groups and populate dropdown
    await loadGroups();

    // Event listeners
    addScheduleForm.addEventListener('submit', handleAddSchedule);
    openOptionsBtn.addEventListener('click', openOptionsPage);
    // Group event listeners
    addGroupBtn.addEventListener('click', openAddGroupModal);
    groupModalClose.addEventListener('click', closeGroupModal);
    groupCancelBtn.addEventListener('click', closeGroupModal);
    groupForm.addEventListener('submit', handleSaveGroup);
    colorPicker.addEventListener('click', handleColorSelection);

    // Close modal on background click
    groupModal.addEventListener('click', (e) => {
        if (e.target === groupModal) {
            closeGroupModal();
        }
    });

    // Load and display upcoming schedules
    await loadUpcomingSchedules();

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync') {
            if (changes.schedules) {
                loadUpcomingSchedules();
            }
            if (changes.groups) {
                loadGroups();
            }
        }
    });
});

// Load groups and populate dropdown
async function loadGroups() {
    try {
        allGroups = await getGroups();
        populateGroupDropdown();
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

// Populate group dropdown
function populateGroupDropdown() {
    // Clear existing options except first (None)
    groupSelect.innerHTML = '<option value="">None (Ungrouped)</option>';

    // Add group options
    allGroups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        groupSelect.appendChild(option);
    });
}

// Set default form values to current day and time
function setDefaultFormValues() {
    const now = new Date();

    // Set time to current time + 5 minutes (rounded)
    const futureTime = new Date(now.getTime() + 5 * 60000);
    const hours = String(futureTime.getHours()).padStart(2, '0');
    const minutes = String(futureTime.getMinutes()).padStart(2, '0');
    timeInput.value = `${hours}:${minutes}`;
}

async function populateCurrentTabUrl() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab?.url ?? '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            urlInput.value = url;
        }
    } catch (error) {
        // Non-fatal — leave URL field empty
        console.error('Could not get active tab URL:', error);
    }
}

// Handle mode switching between specific dates and days of week
function handleModeSwitch(e) {
    const mode = e.target.value;

    if (mode === 'specific-dates') {
        specificDatesMode.style.display = 'block';
        daysOfWeekMode.style.display = 'none';
    } else {
        specificDatesMode.style.display = 'none';
        daysOfWeekMode.style.display = 'block';
    }
}

// Handle add schedule form submission
async function handleAddSchedule(e) {
    e.preventDefault();

    try {
        // Get form values
        const url = formatURL(urlInput.value);
        const time = timeInput.value;
        const groupId = groupSelect.value || null;
        const mode = document.querySelector('input[name="scheduleMode"]:checked').value;

        // Validate URL
        if (!isValidURL(url)) {
            showToast('Please enter a valid URL (http:// or https://)', 'error');
            return;
        }

        if (!time) {
            showToast('Please select a time', 'error');
            return;
        }

        // Build schedule data
        const scheduleData = {
            url,
            time,
            enabled: true,
            groupId,
            mode
        };

        if (mode === 'specific-dates') {
            const selectedDates = flatpickrInstance.selectedDates;
            if (selectedDates.length === 0) {
                showToast('Please select at least one date', 'error');
                return;
            }

            scheduleData.specificDates = selectedDates.map(date => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            });

        } else if (mode === 'days-of-week') {
            const selectedDays = Array.from(document.querySelectorAll('input[name="dow"]:checked'))
                .map(cb => parseInt(cb.value));

            if (selectedDays.length === 0) {
                showToast('Please select at least one day', 'error');
                return;
            }

            scheduleData.daysOfWeek = selectedDays;
        }

        // Add schedule
        await addSchedule(scheduleData);

        // Show success message
        showToast('Schedule added successfully!', 'success');

        // Reset form
        addScheduleForm.reset();
        setDefaultFormValues();

        // Clear flatpickr and checkboxes
        flatpickrInstance.clear();
        document.querySelectorAll('input[name="dow"]').forEach(cb => cb.checked = false);

        // Reset to specific dates mode
        document.querySelector('input[name="scheduleMode"][value="specific-dates"]').checked = true;
        handleModeSwitch({ target: { value: 'specific-dates' } });

        // Reload upcoming schedules
        await loadUpcomingSchedules();

    } catch (error) {
        console.error('Error adding schedule:', error);
        showToast('Error adding schedule. Please try again.', 'error');
    }
}

// Load and display upcoming schedules
async function loadUpcomingSchedules() {
    try {
        const allSchedules = await getSchedules();
        const upcoming = getUpcomingSchedules(allSchedules, 5);

        // Update count
        scheduleCount.textContent = allSchedules.filter(s => s.enabled).length;

        // Clear list
        upcomingList.innerHTML = '';

        if (upcoming.length === 0) {
            upcomingList.innerHTML = '<p class="empty-state">No upcoming schedules</p>';
            return;
        }

        // Render each schedule
        upcoming.forEach(schedule => {
            const item = createScheduleItem(schedule);
            upcomingList.appendChild(item);
        });

    } catch (error) {
        console.error('Error loading schedules:', error);
        upcomingList.innerHTML = '<p class="empty-state">Error loading schedules</p>';
    }
}

// Create schedule item element
function createScheduleItem(schedule) {
    const item = document.createElement('div');
    item.className = 'schedule-item';

    // Build day/date info based on schedule mode
    let dayInfo = '';
    let typeClass = '';
    let typeText = '';

    if (schedule.mode === 'specific-dates' && schedule.specificDates) {
        // New format: multiple specific dates
        const dates = schedule.specificDates.slice(0, 2).map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        dayInfo = dates.join(', ') + (schedule.specificDates.length > 2 ? '...' : '');
        typeClass = 'badge-one-time';
        typeText = `${schedule.specificDates.length} Date${schedule.specificDates.length > 1 ? 's' : ''}`;

    } else if (schedule.mode === 'days-of-week' && schedule.daysOfWeek) {
        // New format: multiple days of week
        const days = schedule.daysOfWeek
            .sort((a, b) => a - b)
            .map(d => DAYS_OF_WEEK[d].substring(0, 3))
            .join(', ');
        dayInfo = days;
        typeClass = 'badge-recurring';
        typeText = 'Weekly';

    } else if (schedule.dayOfWeek !== undefined) {
        // Old format
        dayInfo = DAYS_OF_WEEK[schedule.dayOfWeek];
        typeClass = schedule.type === SCHEDULE_TYPES.RECURRING ? 'badge-recurring' : 'badge-one-time';
        typeText = schedule.type === SCHEDULE_TYPES.RECURRING ? 'Recurring' : 'One-time';
    }

    const timeStr = formatTime12Hour(schedule.time);
    const nextTime = getRelativeTimeString(schedule.nextOccurrence);

    // Get group info
    let groupBadge = '';
    if (schedule.groupId) {
        const group = allGroups.find(g => g.id === schedule.groupId);
        if (group) {
            const colorHex = getGroupColorHex(group.color);
            groupBadge = `
                <div class="schedule-detail">
                    <span class="group-color-badge" style="background: ${colorHex}; width: 12px; height: 12px; display: inline-block; border-radius: 50%; margin-right: 4px;"></span>
                    <span>${escapeHtml(group.name)}</span>
                </div>
            `;
        }
    }

    const nextRow = `<div class="schedule-detail"><span>⏰</span><span>${nextTime}</span></div>`;

    item.innerHTML = `
        <div class="schedule-header">
            <div class="schedule-url">${escapeHtml(truncateURL(schedule.url))}</div>
            <div class="schedule-toggle">
                <input type="checkbox" id="toggle-${schedule.id}" ${schedule.enabled ? 'checked' : ''}>
                <label for="toggle-${schedule.id}" class="schedule-toggle-label">On</label>
            </div>
        </div>
        <div class="schedule-details">
            <div class="schedule-detail">
                <span>📅</span>
                <span class="schedule-time">${dayInfo} at ${timeStr}</span>
            </div>
            ${typeText !== '' && schedule.mode !== 'specific-dates' ? `<div class="schedule-detail"><span class="badge ${typeClass}">${typeText}</span></div>` : ''}
            ${groupBadge}
            ${nextRow}
        </div>
    `;

    // Add toggle event listener
    const toggle = item.querySelector(`#toggle-${schedule.id}`);
    toggle.addEventListener('change', async () => {
        try {
            await toggleSchedule(schedule.id);
            showToast(`Schedule ${toggle.checked ? 'enabled' : 'disabled'}`, 'success');
        } catch (error) {
            console.error('Error toggling schedule:', error);
            showToast('Error updating schedule', 'error');
            toggle.checked = !toggle.checked; // Revert
        }
    });

    return item;
}

// Truncate long URLs for display
function truncateURL(url, maxLength = 35) {
    if (url.length <= maxLength) {
        return url;
    }
    return url.substring(0, maxLength - 3) + '...';
}

// Open options page
function openOptionsPage() {
    chrome.runtime.openOptionsPage();
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;

    // Trigger reflow to restart animation
    void toast.offsetWidth;

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Group Management Functions

// Open add group modal
function openAddGroupModal() {
    groupForm.reset();
    selectedColor = null;

    // Remove selected class from all color buttons
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    groupModal.classList.add('show');
}

// Close group modal
function closeGroupModal() {
    groupModal.classList.remove('show');
}

// Handle color selection
function handleColorSelection(e) {
    if (e.target.classList.contains('color-btn')) {
        // Remove selected class from all buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Add selected class to clicked button
        e.target.classList.add('selected');

        // Set the color value
        selectedColor = e.target.dataset.color;
        groupColor.value = selectedColor;
    }
}

// Handle save group
async function handleSaveGroup(e) {
    e.preventDefault();

    try {
        const name = groupName.value.trim();
        const color = groupColor.value;

        if (!name) {
            showToast('Please enter a group name', 'error');
            return;
        }

        if (!color) {
            showToast('Please select a color', 'error');
            return;
        }

        // Check for duplicate group name
        const duplicate = allGroups.find(g => g.name.toLowerCase() === name.toLowerCase());
        if (duplicate) {
            showToast('A group with this name already exists', 'error');
            return;
        }

        // Create group object
        const newGroup = {
            name,
            color
        };

        // Add group
        const addedGroup = await addGroup(newGroup);

        // Show success message
        showToast('Group added successfully!', 'success');

        // Close modal
        closeGroupModal();

        // Reload groups and select the new group
        await loadGroups();
        groupSelect.value = addedGroup.id;

    } catch (error) {
        console.error('Error adding group:', error);
        showToast('Error adding group. Please try again.', 'error');
    }
}
