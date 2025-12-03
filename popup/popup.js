// Popup logic for InitPage extension
import { DAYS_OF_WEEK, SCHEDULE_TYPES } from '../shared/constants.js';
import { getSchedules, addSchedule, toggleSchedule } from '../shared/storage.js';
import { getUpcomingSchedules, isValidURL, formatURL, findDuplicateSchedule, getRelativeTimeString, formatTime12Hour } from '../shared/scheduler.js';

// DOM elements
let urlInput, dayOfWeekSelect, timeInput, recurringCheckbox, addScheduleForm;
let upcomingList, scheduleCount, openOptionsBtn;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    // Get DOM elements
    urlInput = document.getElementById('url');
    dayOfWeekSelect = document.getElementById('dayOfWeek');
    timeInput = document.getElementById('time');
    recurringCheckbox = document.getElementById('recurring');
    addScheduleForm = document.getElementById('addScheduleForm');
    upcomingList = document.getElementById('upcomingList');
    scheduleCount = document.getElementById('scheduleCount');
    openOptionsBtn = document.getElementById('openOptions');

    // Set default values
    setDefaultFormValues();

    // Event listeners
    addScheduleForm.addEventListener('submit', handleAddSchedule);
    openOptionsBtn.addEventListener('click', openOptionsPage);

    // Load and display upcoming schedules
    await loadUpcomingSchedules();

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync' && changes.schedules) {
            loadUpcomingSchedules();
        }
    });
});

// Set default form values to current day and time
function setDefaultFormValues() {
    const now = new Date();

    // Set day to current day
    dayOfWeekSelect.value = now.getDay();

    // Set time to current time + 5 minutes (rounded)
    const futureTime = new Date(now.getTime() + 5 * 60000);
    const hours = String(futureTime.getHours()).padStart(2, '0');
    const minutes = String(futureTime.getMinutes()).padStart(2, '0');
    timeInput.value = `${hours}:${minutes}`;
}

// Handle add schedule form submission
async function handleAddSchedule(e) {
    e.preventDefault();

    try {
        // Get form values
        const url = formatURL(urlInput.value);
        const dayOfWeek = parseInt(dayOfWeekSelect.value);
        const time = timeInput.value;
        const type = recurringCheckbox.checked ? SCHEDULE_TYPES.RECURRING : SCHEDULE_TYPES.ONE_TIME;

        // Validate URL
        if (!isValidURL(url)) {
            showToast('Please enter a valid URL (http:// or https://)', 'error');
            return;
        }

        // Create schedule object
        const newSchedule = {
            url,
            dayOfWeek,
            time,
            type,
            enabled: true
        };

        // Check for duplicates
        const existingSchedules = await getSchedules();
        const duplicate = findDuplicateSchedule(existingSchedules, newSchedule);

        if (duplicate) {
            const dayName = DAYS_OF_WEEK[dayOfWeek];
            const timeStr = formatTime12Hour(time);
            const typeStr = type === SCHEDULE_TYPES.RECURRING ? 'recurring' : 'one-time';
            showToast(`A ${typeStr} schedule for ${dayName} at ${timeStr} already exists for this URL`, 'error');
            return;
        }

        // Add schedule
        await addSchedule(newSchedule);

        // Show success message
        showToast('Schedule added successfully!', 'success');

        // Reset form
        addScheduleForm.reset();
        setDefaultFormValues();

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

    const dayName = DAYS_OF_WEEK[schedule.dayOfWeek];
    const timeStr = formatTime12Hour(schedule.time);
    const typeClass = schedule.type === SCHEDULE_TYPES.RECURRING ? 'badge-recurring' : 'badge-one-time';
    const typeText = schedule.type === SCHEDULE_TYPES.RECURRING ? 'Recurring' : 'One-time';
    const nextTime = getRelativeTimeString(schedule.nextOccurrence);

    item.innerHTML = `
        <div class="schedule-header">
            <div class="schedule-url">${truncateURL(schedule.url)}</div>
            <div class="schedule-toggle">
                <input type="checkbox" id="toggle-${schedule.id}" ${schedule.enabled ? 'checked' : ''}>
                <label for="toggle-${schedule.id}" class="schedule-toggle-label">On</label>
            </div>
        </div>
        <div class="schedule-details">
            <div class="schedule-detail">
                <span>📅</span>
                <span class="schedule-time">${dayName} at ${timeStr}</span>
            </div>
            <div class="schedule-detail">
                <span class="badge ${typeClass}">${typeText}</span>
            </div>
            <div class="schedule-detail">
                <span>⏰</span>
                <span>${nextTime}</span>
            </div>
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
