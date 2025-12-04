# AutoTab - Scheduled URL Opener

A Chrome extension that automatically opens URLs at scheduled times with powerful multi-date calendar scheduling and tab group organization. Perfect for automating your daily browsing routines!

## Features

### 📅 Advanced Scheduling
- **Multi-Date Calendar**: Select multiple specific dates using an intuitive calendar widget
- **Multi-Day Selection**: Choose multiple days of week (e.g., Mon, Wed, Fri) for recurring schedules
- **Two Scheduling Modes**:
  - 📅 **Specific Dates**: Pick one or more exact dates (e.g., Dec 5, Dec 12, Dec 19)
  - 🔄 **Days of Week**: Select multiple days for weekly recurring schedules
- **Visual Calendar Picker**: Powered by flatpickr for smooth multi-date selection
- **Backward Compatible**: All existing schedules continue to work seamlessly

### 🗂️ Tab Groups
- **Organize Tabs**: Group related schedules together (Work, Personal, etc.)
- **9 Color Options**: Visual color coding for easy identification
- **Quick Group Creation**: Add groups directly from the popup
- **Automatic Grouping**: Tabs open in browser tab groups automatically

### ⚡ Dual Interface
- **Quick Popup**: Add schedules and create groups on the fly
- **Full Options Page**: Comprehensive schedule and group management
- **Consistent Design**: Google-inspired UI with smooth transitions

### 🎯 Smart Features
- **URL Validation**: Auto-formatting with protocol detection
- **Duplicate Detection**: Prevents scheduling conflicts
- **Enable/Disable**: Toggle schedules without deleting
- **Search & Filter**: Find schedules quickly
- **Import/Export**: JSON backup and restore
- **Storage Monitor**: Track usage against sync limits
- **Day Tooltips**: Hover to see full day names
- **Toast Notifications**: Visual feedback for all actions

### 🔧 Technical
- **No Prompts**: Tabs open automatically when scheduled
- **Cross-device Sync**: Syncs across Chrome browsers
- **Manifest V3**: Modern, secure, performant

## Installation

### From Source (Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `extension` directory


## Usage

### Quick Add (Popup)

1. Click the AutoTab icon in your Chrome toolbar
2. Enter the URL you want to schedule
3. **Choose scheduling mode**:
   - **📅 Specific Dates**: Click calendar, select one or more dates
   - **🔄 Days of Week**: Check multiple days (hover for full day names)
4. Set the time
5. **(Optional)** Create or select a tab group
   - Click **+** button to quickly add a new group
   - Choose from 9 colors for easy identification
6. Click "Add Schedule"

### Manage Schedules (Options Page)

1. Right-click the AutoTab icon → Options, or click "Manage All Schedules" in the popup
2. **View All Schedules**:
   - See schedules organized in a clean table
   - Color-coded badges for schedule types
   - Tab group indicators with colors
3. **Schedule Management**:
   - Search/filter schedules
   - Edit existing schedules (updates modes automatically)
   - Delete schedules individually or in bulk
   - Enable/disable with toggle switches
4. **Tab Groups**:
   - Create, edit, and delete groups
   - See schedule count per group
   - Color-coded group cards
5. **Import/Export**:
   - Export schedules as JSON for backup
   - Import previously exported schedules
6. **Statistics**:
   - Total schedules count
   - Active schedules count
   - Storage usage monitoring

### Settings

Access settings from the Options page:

- **Notifications**: Toggle whether to show notifications when scheduled tabs open

## How It Works

1. **Service Worker**: Runs in the background and checks schedules every minute
2. **Schedule Matching**: Compares current date/time against your configured schedules
   - **Specific Dates Mode**: Checks if today matches any selected dates
   - **Days of Week Mode**: Checks if today matches any selected days
3. **Automatic Opening**: Opens matching URLs in new tabs (unfocused, less disruptive)
4. **Tab Grouping**: Automatically creates/updates browser tab groups with colors
5. **Smart Tracking**:
   - **Specific Dates**: Triggers once per date, tracks completion per date
   - **Days of Week**: Triggers every week on selected days, prevents duplicate triggers
   - **Backward Compatible**: Old schedules continue working with original logic

## File Structure

```
extension/
├── manifest.json           # Extension configuration (Manifest V3)
├── background.js           # Service worker (scheduling engine)
├── popup/                  # Popup interface
│   ├── popup.html         # Calendar widget, group creation
│   ├── popup.css          # Compact styles with modal
│   └── popup.js           # Calendar logic, group management
├── options/                # Options page
│   ├── options.html       # Full calendar widget, group management
│   ├── options.css        # Comprehensive styles
│   └── options.js         # Full schedule & group management
├── shared/                 # Shared utilities
│   ├── constants.js       # Constants, date helpers
│   ├── storage.js         # Storage operations, groups API
│   ├── scheduler.js       # Scheduling logic
│   └── groups.js          # Group utilities
├── lib/                    # Third-party libraries
│   └── flatpickr/         # Calendar widget (~67KB)
│       ├── flatpickr.min.js
│       └── flatpickr.min.css
└── icons/                  # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Technical Details

### Manifest V3

This extension uses Chrome's Manifest V3, which provides:
- Better security and privacy
- Improved performance with service workers
- Future-proof compatibility with Chrome

### APIs Used

- **chrome.storage.sync**: Store schedules and groups (syncs across devices, 100KB limit)
- **chrome.alarms**: Check schedules every minute (1-minute granularity)
- **chrome.tabs**: Open scheduled URLs automatically
- **chrome.tabGroups**: Create and manage browser tab groups with colors
- **chrome.notifications**: Show notifications (optional)

### Storage Limits

- **chrome.storage.sync**: ~100KB total (~800-1000 schedules)
- **Sync quota**: QUOTA_BYTES and QUOTA_BYTES_PER_ITEM limits
- Monitor usage in the Options page statistics

### Scheduling Accuracy

- Chrome alarms have **1-minute granularity** (not exact seconds)
- Schedules are checked every minute
- This is acceptable for most use cases (opening websites at scheduled times)

## Privacy

- **No data collection**: This extension does not collect or transmit any data
- **Local storage only**: All schedules are stored locally in your Chrome profile
- **Sync optional**: Uses Chrome's built-in sync (can be disabled in Chrome settings)
- **No external servers**: Everything runs locally

## Troubleshooting

### Schedules not triggering?

1. Check that the schedule is **enabled** (toggle in popup or options)
2. Verify the **day and time** are correct
3. For **one-time schedules**, ensure they haven't already been triggered
4. Check Chrome DevTools → Service Workers to see if background.js is running
5. Open the service worker console and look for "Checking schedules at:" logs

### Extension not loading?

1. Make sure all files are present in the extension directory
2. Verify flatpickr library files exist in `lib/flatpickr/`
3. Icons should be present in `icons/` directory
4. Check for JavaScript errors in Chrome DevTools
5. Try reloading the extension from `chrome://extensions/`

### Storage quota exceeded?

1. Export your schedules for backup
2. Delete old or unused schedules
3. Consider using fewer schedules or shorter URLs

## Development

### Project Structure

- **Shared utilities** (`shared/`): Reusable code for storage, scheduling, constants
- **ES6 modules**: Uses `import`/`export` for modular code
- **Service worker**: Background.js handles all scheduling logic
- **Dual UI**: Popup for quick access, Options for full management

### Testing

1. Load the extension in Chrome
2. Add a test schedule for 1-2 minutes in the future
3. Watch the service worker console: Right-click extension → Inspect → Service Workers
4. Check for "Checking schedules at:" logs every minute
5. Verify tab opens at the scheduled time

### Debugging

**Service Worker Console**:
```javascript
// View the service worker console
chrome://extensions/ → AutoTab → Service Worker (inspect)
```

**Storage Inspector**:
```javascript
// In any extension page console
chrome.storage.sync.get(null, console.log)
```

**Manual Schedule Check**:
```javascript
// In popup or options page console
chrome.runtime.sendMessage({ action: 'triggerScheduleCheck' }, console.log)
```

## Roadmap

### ✅ Completed Features

- [x] Multiple days selection (Mon-Fri at same time)
- [x] Multiple dates selection (calendar picker)
- [x] Tab groups/categories with colors
- [x] Statistics dashboard (schedules, storage)

### Planned Features

- [ ] Dark mode
- [ ] Context menu: "Schedule this page"
- [ ] Keyboard shortcuts
- [ ] Quiet hours (don't open during specified times)
- [ ] Template schedules
- [ ] Schedule history and analytics
- [ ] Time range scheduling (9 AM - 5 PM daily)
- [ ] Browser startup triggers

## Contributing

Feel free to fork this project and submit pull requests! Some areas for improvement:

- UI/UX enhancements
- Additional features from the roadmap
- Bug fixes and optimizations
- Documentation improvements
- Localization/internationalization

## License

This project is open source. Feel free to use, modify, and distribute as needed.

## Credits

Created with Claude Code. Uses [flatpickr](https://flatpickr.js.org/) for the calendar widget.

## Changelog

### Version 2.0.0 (Major Update)

**New Features:**
- 📅 Multi-date calendar picker with flatpickr
- 🔄 Multi-day of week selection
- 🗂️ Tab groups with 9 colors
- ⚡ Quick group creation in popup
- 💡 Day tooltips (hover for full names)
- 🎨 Google-inspired UI redesign

**Improvements:**
- Two scheduling modes (Specific Dates / Days of Week)
- Enhanced popup with group management
- Automatic tab grouping in browser
- Backward compatibility with v1.0 schedules
- Better visual feedback with toast notifications
- Improved schedule display with type indicators

**Technical:**
- Flatpickr integration (~67KB)
- Updated background scheduler logic
- New data models for multi-date/multi-day
- Tab Groups API integration
- 1,600+ lines of new code

### Version 1.0.0 (Initial Release)

- Basic scheduling functionality
- Recurring and one-time schedules
- Popup and options page interfaces
- Import/Export functionality
- Storage usage monitoring
- URL validation and duplicate detection
- Chrome storage sync support
- Notifications support

---

**Enjoy automated browsing with AutoTab!** 🚀
