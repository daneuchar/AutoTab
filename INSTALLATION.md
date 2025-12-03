# InitPage Installation Guide

## Quick Start (5 minutes)

### Step 1: Generate Icons (Recommended)

1. Open `icons/generate-icons.html` in your web browser
2. The icons will generate automatically
3. Right-click each canvas image:
   - Save the 16×16 as `icon16.png`
   - Save the 48×48 as `icon48.png`
   - Save the 128×128 as `icon128.png`
4. Place all three PNG files in the `icons/` directory

**Note**: This step is optional. The extension will work without custom icons (Chrome will use a default icon).

### Step 2: Load Extension in Chrome

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle switch in top-right corner)
4. Click **"Load unpacked"** button
5. Select the `/Users/danieleuchar/workspace/extension` directory
6. The InitPage extension should now appear in your extensions list

### Step 3: Verify Installation

1. Look for the InitPage icon in your Chrome toolbar (puzzle piece if no custom icon)
2. Click the icon to open the popup
3. You should see the "Add New Schedule" form

## First Schedule Test

Let's create a test schedule to verify everything works:

1. **Click the InitPage icon** in your toolbar
2. **Add a test schedule**:
   - URL: `https://www.google.com`
   - Day: Select today's day
   - Time: Set to 2 minutes from now
   - Keep "Recurring" checked
   - Click "Add Schedule"

3. **Monitor the schedule**:
   - Open Chrome DevTools (F12)
   - Go to the Extensions page: `chrome://extensions/`
   - Find InitPage and click "Service Worker" (inspect)
   - In the console, you'll see "Checking schedules at:" logs every minute

4. **Wait for trigger**:
   - When the scheduled time arrives, a new tab should open with Google
   - You should see a notification (if enabled)
   - Check the service worker console for "Triggering X schedule(s)" log

## Exploring Features

### Popup Interface
- **Quick add**: Add schedules in seconds
- **Upcoming view**: See your next 5 scheduled URLs
- **Toggle on/off**: Enable/disable schedules with a checkbox
- **Manage all**: Click the link to open the full options page

### Options Page
- **Access**: Right-click extension icon → Options, or click "Manage All Schedules" in popup
- **Full management**: View, edit, delete all schedules
- **Search**: Filter schedules by URL, day, or time
- **Import/Export**: Backup your schedules as JSON
- **Statistics**: See total schedules, active count, and storage usage

## Common Use Cases

### Daily Morning Routine
```
Monday-Friday at 9:00 AM → Open work email
Monday-Friday at 9:01 AM → Open project management tool
Monday-Friday at 9:02 AM → Open team chat
```

### Weekly Reminders
```
Friday at 5:00 PM → Open timesheet (recurring)
Sunday at 8:00 PM → Open weekly planning doc (recurring)
```

### One-time Events
```
December 25 at 10:00 AM → Open holiday video call link (one-time)
```

## Troubleshooting

### Extension won't load?
- Make sure you selected the correct directory
- Check that `manifest.json` exists in the root
- Look for error messages in the Chrome extensions page

### Schedules not triggering?
1. Verify the schedule is **enabled** (checkbox)
2. Check the **day and time** are correct
3. Open service worker console and look for "Checking schedules" logs
4. For **one-time schedules**, ensure they haven't already triggered

### Can't see the extension icon?
- Click the puzzle piece icon in Chrome toolbar
- Click the pin icon next to InitPage to pin it to toolbar

### Service worker not running?
- Go to `chrome://extensions/`
- Find InitPage
- Click "Service Worker" to inspect/wake it up
- The alarm should recreate on startup

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Can open popup by clicking icon
- [ ] Can add a schedule via popup
- [ ] Can open options page
- [ ] Can add a schedule via options page
- [ ] Schedule triggers and opens tab at correct time
- [ ] Can edit existing schedule
- [ ] Can delete schedule
- [ ] Can toggle schedule on/off
- [ ] Can search/filter schedules
- [ ] Can export schedules as JSON
- [ ] Can import schedules from JSON
- [ ] Notifications show when tabs open (if enabled)

## Next Steps

1. **Set up your schedules**: Add URLs you want to open automatically
2. **Customize settings**: Enable/disable notifications
3. **Backup**: Export your schedules periodically
4. **Explore**: Try one-time schedules for events

## Uninstallation

To remove the extension:

1. Go to `chrome://extensions/`
2. Find InitPage
3. Click "Remove"
4. Confirm removal

Your schedules will be deleted when you remove the extension. Make sure to export them first if you want to keep them!

## Support

For issues or questions:
- Check the [README.md](README.md) for detailed documentation
- Review the [Troubleshooting](#troubleshooting) section above
- Check the service worker console for error messages

---

Enjoy automated browsing! 🚀
