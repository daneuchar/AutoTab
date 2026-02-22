// Options page logic for Auto Tab extension
import { DAYS_OF_WEEK, SCHEDULE_TYPES } from '../shared/constants.js';
import { getSchedules, addSchedule, updateSchedule, deleteSchedule, deleteSchedules, toggleSchedule, getSettings, updateSettings, clearAllSchedules, getStorageInfo, getGroups, addGroup, updateGroup, deleteGroup, getSchedulesByGroupId } from '../shared/storage.js';
import { isValidURL, formatURL, findDuplicateSchedule, formatTime12Hour } from '../shared/scheduler.js';
import { getGroupColorHex, isGroupInUse } from '../shared/groups.js';

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// DOM elements
let schedulesContainer, searchInput;
let addNewBtn, exportBtn, importBtn, deleteAllBtn, importFile;
let scheduleModal, modalClose, scheduleForm, cancelBtn;
let modalTitle, modalUrl, modalTime, modalEnabled, modalGroup;
let calendarPicker, flatpickrInstance;
let specificDatesMode, daysOfWeekMode;
let notificationsToggle;
let totalSchedules, activeSchedules, storageUsed;
// Group elements
let groupsContainer, addGroupBtn;
let groupModal, groupModalClose, groupForm, groupCancelBtn;
let groupModalTitle, groupName, groupColor, colorPicker;

// State
let allSchedules = [];
let filteredSchedules = [];
let editingScheduleId = null;
let allGroups = [];
let editingGroupId = null;
let selectedColor = null;

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
    modalTime = document.getElementById('modalTime');
    modalEnabled = document.getElementById('modalEnabled');
    modalGroup = document.getElementById('modalGroup');
    calendarPicker = document.getElementById('calendarPicker');
    specificDatesMode = document.getElementById('specificDatesMode');
    daysOfWeekMode = document.getElementById('daysOfWeekMode');
    notificationsToggle = document.getElementById('notificationsToggle');
    totalSchedules = document.getElementById('totalSchedules');
    activeSchedules = document.getElementById('activeSchedules');
    storageUsed = document.getElementById('storageUsed');
    // Group elements
    groupsContainer = document.getElementById('groupsContainer');
    addGroupBtn = document.getElementById('addGroupBtn');
    groupModal = document.getElementById('groupModal');
    groupModalClose = document.getElementById('groupModalClose');
    groupForm = document.getElementById('groupForm');
    groupCancelBtn = document.getElementById('groupCancelBtn');
    groupModalTitle = document.getElementById('groupModalTitle');
    groupName = document.getElementById('groupName');
    groupColor = document.getElementById('groupColor');
    colorPicker = document.getElementById('colorPicker');

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
    // Group event listeners
    addGroupBtn.addEventListener('click', openAddGroupModal);
    groupModalClose.addEventListener('click', closeGroupModal);
    groupCancelBtn.addEventListener('click', closeGroupModal);
    groupForm.addEventListener('submit', handleSaveGroup);
    colorPicker.addEventListener('click', handleColorSelection);

    // Initialize flatpickr for multi-date selection
    flatpickrInstance = flatpickr(calendarPicker, {
        mode: "multiple",
        dateFormat: "Y-m-d",
        minDate: "today",
        inline: false,
        showMonths: 1,
        onChange: function() {
        }
    });

    // Mode switching event listeners
    document.querySelectorAll('input[name="scheduleMode"]').forEach(radio => {
        radio.addEventListener('change', handleModeSwitch);
    });

    // Close modal on background click
    scheduleModal.addEventListener('click', (e) => {
        if (e.target === scheduleModal) {
            closeModal();
        }
    });
    groupModal.addEventListener('click', (e) => {
        if (e.target === groupModal) {
            closeGroupModal();
        }
    });

    // Load data
    await loadSettings();
    await loadGroups();
    await loadSchedules();
    await updateStats();

    // Add event listener to initial empty state button (if it exists)
    const emptyAddBtn = document.getElementById('emptyAddBtn');
    if (emptyAddBtn) {
        emptyAddBtn.addEventListener('click', openAddModal);
    }

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync') {
            if (changes.schedules) {
                loadSchedules();
                updateStats();
                loadGroups(); // Reload groups to update schedule counts
            }
            if (changes.settings) {
                loadSettings();
            }
            if (changes.groups) {
                loadGroups();
            }
        }
    });
});

// ============================================================================
// GROUP MANAGEMENT FUNCTIONS
// ============================================================================

// Load and display groups
async function loadGroups() {
    try {
        allGroups = await getGroups();
        renderGroups();
        populateGroupDropdowns();
    } catch (error) {
        console.error('Error loading groups:', error);
        showToast('Error loading groups', 'error');
    }
}

// Render groups to the grid
async function renderGroups() {
    groupsContainer.innerHTML = '';

    if (allGroups.length === 0) {
        groupsContainer.innerHTML = `
            <div class="empty-state-small">
                <p>No groups yet. Groups help organize tabs that open together.</p>
            </div>
        `;
        return;
    }

    for (const group of allGroups) {
        const card = await createGroupCard(group);
        groupsContainer.appendChild(card);
    }
}

// Create group card element
async function createGroupCard(group) {
    const card = document.createElement('div');
    card.className = 'group-card';

    const scheduleCount = await getSchedulesByGroupId(group.id);
    const count = scheduleCount.length;
    const colorHex = getGroupColorHex(group.color);

    card.innerHTML = `
        <div class="group-card-header">
            <div class="group-color-badge" style="background: ${colorHex}"></div>
            <div class="group-name">${group.name}</div>
        </div>
        <div class="group-schedule-count">${count} schedule${count !== 1 ? 's' : ''}</div>
        <div class="group-actions">
            <button class="edit-btn" data-id="${group.id}">Edit</button>
            <button class="delete-btn" data-id="${group.id}">Delete</button>
        </div>
    `;

    // Add event listeners
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');

    editBtn.addEventListener('click', () => openEditGroupModal(group));
    deleteBtn.addEventListener('click', () => handleDeleteGroup(group.id));

    return card;
}

// Open add group modal
function openAddGroupModal() {
    editingGroupId = null;
    selectedColor = null;
    groupModalTitle.textContent = 'Add Group';
    groupForm.reset();
    groupColor.value = '';

    // Deselect all colors
    colorPicker.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    groupModal.classList.add('show');
}

// Open edit group modal
function openEditGroupModal(group) {
    editingGroupId = group.id;
    selectedColor = group.color;
    groupModalTitle.textContent = 'Edit Group';

    groupName.value = group.name;
    groupColor.value = group.color;

    // Select the color
    colorPicker.querySelectorAll('.color-btn').forEach(btn => {
        if (btn.dataset.color === group.color) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    groupModal.classList.add('show');
}

// Close group modal
function closeGroupModal() {
    groupModal.classList.remove('show');
    editingGroupId = null;
    selectedColor = null;
}

// Handle color selection
function handleColorSelection(e) {
    if (!e.target.classList.contains('color-btn')) {
        return;
    }

    const color = e.target.dataset.color;
    selectedColor = color;
    groupColor.value = color;

    // Update visual selection
    colorPicker.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    e.target.classList.add('selected');
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

        const groupData = {
            name,
            color
        };

        if (editingGroupId) {
            // Update existing group
            await updateGroup(editingGroupId, groupData);
            showToast('Group updated successfully', 'success');
        } else {
            // Add new group
            await addGroup(groupData);
            showToast('Group added successfully', 'success');
        }

        closeGroupModal();
        // Note: loadGroups() will be called automatically by storage.onChanged listener

    } catch (error) {
        console.error('Error saving group:', error);
        showToast(error.message || 'Error saving group', 'error');
    }
}

// Handle delete group
async function handleDeleteGroup(groupId) {
    try {
        const inUse = await isGroupInUse(groupId);
        const schedules = await getSchedulesByGroupId(groupId);

        let confirmMessage = 'Are you sure you want to delete this group?';
        if (inUse) {
            confirmMessage = `This group has ${schedules.length} schedule${schedules.length !== 1 ? 's' : ''}. They will be ungrouped. Continue?`;
        }

        if (!confirm(confirmMessage)) {
            return;
        }

        await deleteGroup(groupId);
        showToast('Group deleted', 'success');
        // Note: loadGroups() and loadSchedules() will be called automatically by storage.onChanged listener

    } catch (error) {
        console.error('Error deleting group:', error);
        showToast('Error deleting group', 'error');
    }
}

// Populate group dropdowns (in schedule modal)
function populateGroupDropdowns() {
    const options = ['<option value="">None (Ungrouped)</option>'];

    allGroups.forEach(group => {
        const colorHex = getGroupColorHex(group.color);
        options.push(`<option value="${group.id}">${group.name}</option>`);
    });

    modalGroup.innerHTML = options.join('');
}

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
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';

        const message = document.createElement('p');
        message.textContent = searchInput.value ? 'No schedules match your search' : 'No schedules yet';
        emptyState.appendChild(message);

        if (!searchInput.value) {
            const button = document.createElement('button');
            button.className = 'btn-primary';
            button.textContent = 'Add Your First Schedule';
            button.addEventListener('click', openAddModal);
            emptyState.appendChild(button);
        }

        schedulesContainer.appendChild(emptyState);
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

    const timeStr = formatTime12Hour(schedule.time);

    // Build day/date info
    let dayInfo = '';
    let typeClass = '';
    let typeText = '';

    if (schedule.mode === 'specific-dates' && schedule.specificDates) {
        // New format: multiple specific dates
        const dates = schedule.specificDates.map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }).join(', ');
        dayInfo = dates;
        typeClass = 'one-time';
        typeText = `${schedule.specificDates.length} Date${schedule.specificDates.length > 1 ? 's' : ''}`;

    } else if (schedule.mode === 'days-of-week' && schedule.daysOfWeek) {
        // New format: multiple days of week
        const days = schedule.daysOfWeek
            .sort((a, b) => a - b)
            .map(d => DAYS_OF_WEEK[d].substring(0, 3))
            .join(', ');
        dayInfo = days;
        typeClass = 'recurring';
        typeText = 'Weekly';

    } else if (schedule.specificDate) {
        // Old format: single specific date
        const date = new Date(schedule.specificDate);
        const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        if (schedule.recurring) {
            dayInfo = `${dayOfWeek}<br><small>${dateStr}</small>`;
            typeClass = 'recurring';
            typeText = 'Recurring';
        } else {
            dayInfo = dateStr;
            typeClass = 'one-time';
            typeText = 'One-time';
        }
    } else if (schedule.dayOfWeek !== undefined) {
        // Very old format: day of week number
        const dayName = DAYS_OF_WEEK[schedule.dayOfWeek];
        dayInfo = dayName;
        typeClass = schedule.type === SCHEDULE_TYPES.RECURRING ? 'recurring' : 'one-time';
        typeText = schedule.type === SCHEDULE_TYPES.RECURRING ? 'Recurring' : 'One-time';
    }

    // Get group info
    let groupHtml = '<div class="schedule-group">—</div>';
    if (schedule.groupId) {
        const group = allGroups.find(g => g.id === schedule.groupId);
        if (group) {
            const colorHex = getGroupColorHex(group.color);
            groupHtml = `<div class="schedule-group"><span class="group-color-badge" style="background: ${colorHex}; width: 12px; height: 12px; display: inline-block; border-radius: 50%; margin-right: 6px; vertical-align: middle;"></span>${escapeHtml(group.name)}</div>`;
        }
    }

    row.innerHTML = `
        <div class="schedule-enabled">
            <input type="checkbox" ${schedule.enabled ? 'checked' : ''} data-id="${schedule.id}">
        </div>
        <div class="schedule-url">${escapeHtml(schedule.url)}</div>
        <div class="schedule-day">${dayInfo}</div>
        <div class="schedule-time">${timeStr}</div>
        ${groupHtml}
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

// Handle search
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();

    if (!query) {
        filteredSchedules = [...allSchedules];
    } else {
        filteredSchedules = allSchedules.filter(schedule => {
            const dayStr = schedule.dayOfWeek !== undefined
                ? DAYS_OF_WEEK[schedule.dayOfWeek].toLowerCase()
                : (schedule.daysOfWeek || []).map(d => DAYS_OF_WEEK[d].toLowerCase()).join(' ');
            return schedule.url.toLowerCase().includes(query) ||
                dayStr.includes(query) ||
                schedule.time.includes(query);
        });
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
    const futureTime = new Date(now.getTime() + 5 * 60000);
    modalTime.value = `${String(futureTime.getHours()).padStart(2, '0')}:${String(futureTime.getMinutes()).padStart(2, '0')}`;

    // Set mode to specific dates by default
    document.querySelector('input[name="scheduleMode"][value="specific-dates"]').checked = true;
    handleModeSwitch({ target: { value: 'specific-dates' } });

    // Clear flatpickr selection
    flatpickrInstance.clear();

    // Uncheck all day-of-week checkboxes
    document.querySelectorAll('input[name="dow"]').forEach(cb => cb.checked = false);

    modalEnabled.checked = true;

    scheduleModal.classList.add('show');
}

// Open edit modal
function openEditModal(schedule) {
    editingScheduleId = schedule.id;
    modalTitle.textContent = 'Edit Schedule';

    modalUrl.value = schedule.url;
    modalEnabled.checked = schedule.enabled;
    modalGroup.value = schedule.groupId || '';
    modalTime.value = schedule.time;

    // Handle different schedule formats
    if (schedule.mode === 'specific-dates' && schedule.specificDates) {
        // New format: specific dates mode
        document.querySelector('input[name="scheduleMode"][value="specific-dates"]').checked = true;
        handleModeSwitch({ target: { value: 'specific-dates' } });
        const dates = schedule.specificDates.map(d => new Date(d));
        flatpickrInstance.setDate(dates);
    } else if (schedule.mode === 'days-of-week' && schedule.daysOfWeek) {
        // New format: days of week mode
        document.querySelector('input[name="scheduleMode"][value="days-of-week"]').checked = true;
        handleModeSwitch({ target: { value: 'days-of-week' } });
        document.querySelectorAll('input[name="dow"]').forEach(cb => {
            cb.checked = schedule.daysOfWeek.includes(parseInt(cb.value));
        });
    } else if (schedule.specificDate) {
        // Old format with specificDate - convert to new specific-dates mode
        document.querySelector('input[name="scheduleMode"][value="specific-dates"]').checked = true;
        handleModeSwitch({ target: { value: 'specific-dates' } });
        flatpickrInstance.setDate([new Date(schedule.specificDate)]);
    } else if (schedule.dayOfWeek !== undefined) {
        // Very old day-of-week format - convert to new days-of-week mode
        document.querySelector('input[name="scheduleMode"][value="days-of-week"]').checked = true;
        handleModeSwitch({ target: { value: 'days-of-week' } });
        document.querySelectorAll('input[name="dow"]').forEach(cb => {
            cb.checked = parseInt(cb.value) === schedule.dayOfWeek;
        });
    }

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
        const time = modalTime.value;
        const enabled = modalEnabled.checked;
        const groupId = modalGroup.value || null;
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
            enabled,
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

        // Save schedule
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
        // Note: loadSchedules() will be called automatically by storage.onChanged listener

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
    if (allSchedules.length === 0 && allGroups.length === 0) {
        showToast('No schedules or groups to export', 'error');
        return;
    }

    const data = {
        version: '1.1',
        exportDate: new Date().toISOString(),
        groups: allGroups,
        schedules: allSchedules
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autotab-schedules-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Schedules and groups exported successfully', 'success');
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

        // Import groups first (if available)
        const groupIdMapping = {}; // Map old IDs to new IDs
        let importedGroups = 0;

        if (data.groups && Array.isArray(data.groups)) {
            for (const group of data.groups) {
                if (group.name && group.color) {
                    // Check if group with same name already exists
                    const existingGroup = allGroups.find(g => g.name === group.name);

                    if (existingGroup) {
                        // Reuse existing group
                        groupIdMapping[group.id] = existingGroup.id;
                    } else {
                        // Create new group
                        const newGroup = await addGroup({
                            name: group.name,
                            color: group.color
                        });
                        groupIdMapping[group.id] = newGroup.id;
                        importedGroups++;
                    }
                }
            }
        }

        // Reload groups after import
        await loadGroups();

        // Validate and add schedules with updated groupId references
        let importedSchedules = 0;
        for (const schedule of data.schedules) {
            const isNewSpecificDates = schedule.url && schedule.time && schedule.mode === 'specific-dates' && Array.isArray(schedule.specificDates) && schedule.specificDates.length > 0;
            const isNewDaysOfWeek = schedule.url && schedule.time && schedule.mode === 'days-of-week' && Array.isArray(schedule.daysOfWeek) && schedule.daysOfWeek.length > 0;
            const isLegacy = schedule.url && schedule.time && schedule.dayOfWeek !== undefined && schedule.type;

            if (isNewSpecificDates || isNewDaysOfWeek || isLegacy) {
                const newGroupId = (schedule.groupId && groupIdMapping[schedule.groupId]) ? groupIdMapping[schedule.groupId] : null;

                await addSchedule({
                    url: schedule.url,
                    time: schedule.time,
                    enabled: schedule.enabled !== undefined ? schedule.enabled : true,
                    groupId: newGroupId,
                    ...(isNewSpecificDates && { mode: 'specific-dates', specificDates: schedule.specificDates }),
                    ...(isNewDaysOfWeek && { mode: 'days-of-week', daysOfWeek: schedule.daysOfWeek }),
                    ...(isLegacy && { dayOfWeek: schedule.dayOfWeek, type: schedule.type })
                });
                importedSchedules++;
            }
        }

        const message = importedGroups > 0
            ? `Imported ${importedSchedules} schedule(s) and ${importedGroups} group(s)`
            : `Imported ${importedSchedules} schedule(s)`;

        showToast(message, 'success');
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
        const usedKB = (info.bytesInUse / 1024).toFixed(1);
        const totalKB = (chrome.storage.sync.QUOTA_BYTES / 1024).toFixed(0);
        storageUsed.textContent = `${usedKB}/${totalKB} KB`;
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
