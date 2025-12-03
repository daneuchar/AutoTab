// Options page logic for InitPage extension
import { DAYS_OF_WEEK, SCHEDULE_TYPES } from '../shared/constants.js';
import { getSchedules, addSchedule, updateSchedule, deleteSchedule, deleteSchedules, toggleSchedule, getSettings, updateSettings, clearAllSchedules, getStorageInfo } from '../shared/storage.js';
import { isValidURL, formatURL, findDuplicateSchedule, formatTime12Hour } from '../shared/scheduler.js';

// DOM elements
let schedulesContainer, searchInput;
let addNewBtn, exportBtn, importBtn, deleteAllBtn, importFile;
let scheduleModal, modalClose, scheduleForm, cancelBtn;
let modalTitle, modalUrl, modalDay, modalTime, modalEnabled;
let notificationsToggle;
let totalSchedules, activeSchedules, storageUsed;

// State
let allSchedules = [];
let filteredSchedules = [];
let editingScheduleId = null;

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
    // Get DOM elements
    schedulesContainer = document.getElementById('schedulesContainer');
    searchInput = document.getElementById('searchInput');
    addNewBtn = document.getElementById('addNewBtn');
    exportBtn = document.getElementById('exportBtn');
    importBtn = document.getElementById('importBtn');
    deleteAllBtn = document.getElementById('deleteAllBtn');
    importFile = document.getElementById('importFile');
    scheduleModal = document.getElementById('scheduleModal');
    modalClose = document.getElementById('modalClose');
    scheduleForm = document.getElementById('scheduleForm');
    cancelBtn = document.getElementById('cancelBtn');
    modalTitle = document.getElementById('modalTitle');
    modalUrl = document.getElementById('modalUrl');
    modalDay = document.getElementById('modalDay');
    modalTime = document.getElementById('modalTime');
    modalEnabled = document.getElementById('modalEnabled');
    notificationsToggle = document.getElementById('notificationsToggle');
    totalSchedules = document.getElementById('totalSchedules');
    activeSchedules = document.getElementById('activeSchedules');
    storageUsed = document.getElementById('storageUsed');

    // Event listeners
    addNewBtn.addEventListener('click', openAddModal);
    exportBtn.addEventListener('click', exportSchedules);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importSchedules);
    deleteAllBtn.addEventListener('click', confirmDeleteAll);
    modalClose.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    scheduleForm.addEventListener('submit', handleSaveSchedule);
    searchInput.addEventListener('input', handleSearch);
    notificationsToggle.addEventListener('change', handleSettingsChange);

    // Close modal on background click
    scheduleModal.addEventListener('click', (e) => {
        if (e.target === scheduleModal) {
            closeModal();
        }
    });

    // Load data
    await loadSettings();
    await loadSchedules();
    await updateStats();

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync') {
            if (changes.schedules) {
                loadSchedules();
                updateStats();
            }
            if (changes.settings) {
                loadSettings();
            }
        }
    });
});

// Load all schedules
async function loadSchedules() {
    try {
        allSchedules = await getSchedules();
        filteredSchedules = [...allSchedules];
        renderSchedules();
    } catch (error) {
        console.error('Error loading schedules:', error);
        showToast('Error loading schedules', 'error');
    }
}

// Render schedules to the table
function renderSchedules() {
    schedulesContainer.innerHTML = '';

    if (filteredSchedules.length === 0) {
        schedulesContainer.innerHTML = `
            <div class="empty-state">
                <p>${searchInput.value ? 'No schedules match your search' : 'No schedules yet'}</p>
                ${!searchInput.value ? '<button class="btn-primary" onclick="document.getElementById(\'addNewBtn\').click()">Add Your First Schedule</button>' : ''}
            </div>
        `;
        return;
    }

    filteredSchedules.forEach(schedule => {
        const row = createScheduleRow(schedule);
        schedulesContainer.appendChild(row);
    });
}

// Create schedule row element
function createScheduleRow(schedule) {
    const row = document.createElement('div');
    row.className = `schedule-row ${!schedule.enabled ? 'disabled' : ''}`;

    const dayName = DAYS_OF_WEEK[schedule.dayOfWeek];
    const timeStr = formatTime12Hour(schedule.time);
    const typeClass = schedule.type === SCHEDULE_TYPES.RECURRING ? 'recurring' : 'one-time';
    const typeText = schedule.type === SCHEDULE_TYPES.RECURRING ? 'Recurring' : 'One-time';

    row.innerHTML = `
        <div class="schedule-enabled">
            <input type="checkbox" ${schedule.enabled ? 'checked' : ''} data-id="${schedule.id}">
        </div>
        <div class="schedule-url">${schedule.url}</div>
        <div class="schedule-day">${dayName}</div>
        <div class="schedule-time">${timeStr}</div>
        <div class="schedule-type ${typeClass}">${typeText}</div>
        <div class="schedule-actions">
            <button class="btn-icon edit" data-id="${schedule.id}" title="Edit">✏️</button>
            <button class="btn-icon delete" data-id="${schedule.id}" title="Delete">🗑️</button>
        </div>
    `;

    // Event listeners
    const checkbox = row.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => handleToggle(schedule.id));

    const editBtn = row.querySelector('.edit');
    editBtn.addEventListener('click', () => openEditModal(schedule));

    const deleteBtn = row.querySelector('.delete');
    deleteBtn.addEventListener('click', () => handleDelete(schedule.id));

    return row;
}

// Handle search
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();

    if (!query) {
        filteredSchedules = [...allSchedules];
    } else {
        filteredSchedules = allSchedules.filter(schedule =>
            schedule.url.toLowerCase().includes(query) ||
            DAYS_OF_WEEK[schedule.dayOfWeek].toLowerCase().includes(query) ||
            schedule.time.includes(query)
        );
    }

    renderSchedules();
}

// Open add modal
function openAddModal() {
    editingScheduleId = null;
    modalTitle.textContent = 'Add Schedule';
    scheduleForm.reset();

    // Set defaults
    const now = new Date();
    modalDay.value = now.getDay();
    const futureTime = new Date(now.getTime() + 5 * 60000);
    modalTime.value = `${String(futureTime.getHours()).padStart(2, '0')}:${String(futureTime.getMinutes()).padStart(2, '0')}`;
    modalEnabled.checked = true;
    document.querySelector('input[name="scheduleType"][value="recurring"]').checked = true;

    scheduleModal.classList.add('show');
}

// Open edit modal
function openEditModal(schedule) {
    editingScheduleId = schedule.id;
    modalTitle.textContent = 'Edit Schedule';

    modalUrl.value = schedule.url;
    modalDay.value = schedule.dayOfWeek;
    modalTime.value = schedule.time;
    modalEnabled.checked = schedule.enabled;
    document.querySelector(`input[name="scheduleType"][value="${schedule.type}"]`).checked = true;

    scheduleModal.classList.add('show');
}

// Close modal
function closeModal() {
    scheduleModal.classList.remove('show');
    editingScheduleId = null;
}

// Handle save schedule
async function handleSaveSchedule(e) {
    e.preventDefault();

    try {
        const url = formatURL(modalUrl.value);
        const dayOfWeek = parseInt(modalDay.value);
        const time = modalTime.value;
        const type = document.querySelector('input[name="scheduleType"]:checked').value;
        const enabled = modalEnabled.checked;

        // Validate URL
        if (!isValidURL(url)) {
            showToast('Please enter a valid URL (http:// or https://)', 'error');
            return;
        }

        const scheduleData = {
            url,
            dayOfWeek,
            time,
            type,
            enabled
        };

        // Check for duplicates (excluding current schedule if editing)
        const duplicate = findDuplicateSchedule(allSchedules, { ...scheduleData, id: editingScheduleId });
        if (duplicate) {
            const dayName = DAYS_OF_WEEK[dayOfWeek];
            const timeStr = formatTime12Hour(time);
            showToast(`A ${type} schedule for ${dayName} at ${timeStr} already exists for this URL`, 'error');
            return;
        }

        if (editingScheduleId) {
            // Update existing
            await updateSchedule(editingScheduleId, scheduleData);
            showToast('Schedule updated successfully', 'success');
        } else {
            // Add new
            await addSchedule(scheduleData);
            showToast('Schedule added successfully', 'success');
        }

        closeModal();
        await loadSchedules();
        await updateStats();

    } catch (error) {
        console.error('Error saving schedule:', error);
        showToast('Error saving schedule', 'error');
    }
}

// Handle toggle
async function handleToggle(id) {
    try {
        await toggleSchedule(id);
        await loadSchedules();
        await updateStats();
    } catch (error) {
        console.error('Error toggling schedule:', error);
        showToast('Error updating schedule', 'error');
    }
}

// Handle delete
async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this schedule?')) {
        return;
    }

    try {
        await deleteSchedule(id);
        showToast('Schedule deleted', 'success');
        await loadSchedules();
        await updateStats();
    } catch (error) {
        console.error('Error deleting schedule:', error);
        showToast('Error deleting schedule', 'error');
    }
}

// Confirm delete all
async function confirmDeleteAll() {
    if (allSchedules.length === 0) {
        showToast('No schedules to delete', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to delete all ${allSchedules.length} schedules? This cannot be undone.`)) {
        return;
    }

    try {
        await clearAllSchedules();
        showToast('All schedules deleted', 'success');
        await loadSchedules();
        await updateStats();
    } catch (error) {
        console.error('Error deleting all schedules:', error);
        showToast('Error deleting schedules', 'error');
    }
}

// Export schedules
function exportSchedules() {
    if (allSchedules.length === 0) {
        showToast('No schedules to export', 'error');
        return;
    }

    const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        schedules: allSchedules
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `initpage-schedules-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Schedules exported successfully', 'success');
}

// Import schedules
async function importSchedules(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.schedules || !Array.isArray(data.schedules)) {
            throw new Error('Invalid file format');
        }

        // Validate and add schedules
        let imported = 0;
        for (const schedule of data.schedules) {
            if (schedule.url && schedule.dayOfWeek !== undefined && schedule.time && schedule.type) {
                await addSchedule({
                    url: schedule.url,
                    dayOfWeek: schedule.dayOfWeek,
                    time: schedule.time,
                    type: schedule.type,
                    enabled: schedule.enabled !== undefined ? schedule.enabled : true
                });
                imported++;
            }
        }

        showToast(`Imported ${imported} schedule(s)`, 'success');
        await loadSchedules();
        await updateStats();

    } catch (error) {
        console.error('Error importing schedules:', error);
        showToast('Error importing schedules. Please check the file format.', 'error');
    } finally {
        importFile.value = ''; // Reset file input
    }
}

// Load settings
async function loadSettings() {
    try {
        const settings = await getSettings();
        notificationsToggle.checked = settings.notifications;
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Handle settings change
async function handleSettingsChange() {
    try {
        await updateSettings({
            notifications: notificationsToggle.checked
        });
        showToast('Settings saved', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Error saving settings', 'error');
    }
}

// Update statistics
async function updateStats() {
    try {
        const schedules = await getSchedules();
        totalSchedules.textContent = schedules.length;
        activeSchedules.textContent = schedules.filter(s => s.enabled).length;

        const info = await getStorageInfo();
        storageUsed.textContent = `${info.percentUsed.toFixed(1)}%`;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;

    void toast.offsetWidth; // Trigger reflow

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
