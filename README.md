# InitPage - Scheduled URL Opener

A Chrome extension that automatically opens URLs at scheduled times based on day of week. Perfect for automating your daily browsing routines!

## Features

- **Scheduled URL Opening**: Automatically open URLs at specific days and times
- **Recurring & One-time Schedules**: Choose between weekly recurring schedules or one-time events
- **Dual Interface**:
  - Quick popup for adding schedules on the fly
  - Full options page for comprehensive schedule management
- **Smart Features**:
  - URL validation and auto-formatting
  - Duplicate detection
  - Enable/disable schedules without deleting
  - Search and filter schedules
  - Import/Export functionality for backup
  - Storage usage monitoring
- **Automatic Tab Opening**: No prompts - tabs open automatically when scheduled
- **Cross-device Sync**: Schedules sync across your Chrome browsers (via chrome.storage.sync)

## Installation

### From Source (Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `extension` directory

### Generate Icons (Optional but Recommended)

Before loading the extension, you should generate the icons:

1. Open `icons/generate-icons.html` in your browser
2. Right-click each canvas and save as PNG
3. Save them as `icon16.png`, `icon48.png`, and `icon128.png` in the `icons/` directory

Alternatively, the extension will work with Chrome's default icon.

## Usage

### Quick Add (Popup)

1. Click the InitPage icon in your Chrome toolbar
2. Enter the URL you want to schedule
3. Select the day of week
4. Set the time
5. Choose recurring (weekly) or one-time
6. Click "Add Schedule"

### Manage Schedules (Options Page)

1. Right-click the InitPage icon → Options, or click "Manage All Schedules" in the popup
2. View all your schedules in a table
3. Search/filter schedules
4. Edit or delete existing schedules
5. Enable/disable schedules with a toggle
6. Export schedules as JSON for backup
7. Import previously exported schedules

### Settings

Access settings from the Options page:

- **Notifications**: Toggle whether to show notifications when scheduled tabs open

## How It Works

1. **Service Worker**: Runs in the background and checks schedules every minute
2. **Schedule Matching**: Compares current day/time against your configured schedules
3. **Automatic Opening**: Opens matching URLs in new tabs (unfocused, less disruptive)
4. **Smart Tracking**:
   - One-time schedules: Only trigger once, then remain in history
   - Recurring schedules: Trigger every week at the specified day/time

## File Structure

```
extension/
├── manifest.json           # Extension configuration
├── background.js           # Service worker (scheduling engine)
├── popup/                  # Popup interface
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/                # Options page
│   ├── options.html
│   ├── options.css
│   └── options.js
├── shared/                 # Shared utilities
│   ├── constants.js        # Constants and helpers
│   ├── storage.js          # Storage operations
│   └── scheduler.js        # Scheduling logic
└── icons/                  # Extension icons
    ├── icon16.png
    ├── icon48.png
    ├── icon128.png
    ├── icon.svg            # SVG template
    └── generate-icons.html # Icon generator
```

## Technical Details

### Manifest V3

This extension uses Chrome's Manifest V3, which provides:
- Better security and privacy
- Improved performance with service workers
- Future-proof compatibility with Chrome

### APIs Used

- **chrome.storage.sync**: Store schedules (syncs across devices, 100KB limit)
- **chrome.alarms**: Check schedules every minute
- **chrome.tabs**: Open scheduled URLs
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
2. Icons are optional - the extension will work without custom icons
3. Check for JavaScript errors in Chrome DevTools
4. Try reloading the extension from `chrome://extensions/`

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
chrome://extensions/ → InitPage → Service Worker (inspect)
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

### Planned Features

- [ ] Multiple days selection (Mon-Fri at same time)
- [ ] Schedule groups/categories
- [ ] Statistics dashboard
- [ ] Dark mode
- [ ] Context menu: "Schedule this page"
- [ ] Keyboard shortcuts
- [ ] Quiet hours (don't open during specified times)
- [ ] Template schedules

## Contributing

Feel free to fork this project and submit pull requests! Some areas for improvement:

- Better icon design
- UI/UX enhancements
- Additional features from the roadmap
- Bug fixes and optimizations
- Documentation improvements

## License

This project is open source. Feel free to use, modify, and distribute as needed.

## Credits

Created with Claude Code. Icon designed with simplicity in mind.

## Changelog

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

**Enjoy automated browsing with InitPage!** 🚀
