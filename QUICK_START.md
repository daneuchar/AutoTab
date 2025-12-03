# InitPage - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Load the Extension
```bash
1. Open Chrome → chrome://extensions/
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select this directory: /Users/danieleuchar/workspace/extension
```

### 2. Add Your First Schedule
```bash
1. Click the InitPage icon in Chrome toolbar
2. Enter a URL: https://news.ycombinator.com
3. Select day and time (try 2 minutes from now for testing)
4. Click "Add Schedule"
```

### 3. Watch It Work!
```bash
1. Open chrome://extensions/ → InitPage → "Service Worker" (inspect)
2. Watch the console for "Checking schedules at:" every minute
3. When time arrives, tab opens automatically! 🎉
```

## ✨ What You Can Do

| Feature | How To |
|---------|--------|
| **Quick Add** | Click toolbar icon → Fill form → Add |
| **Manage All** | Right-click icon → Options |
| **Edit Schedule** | Options page → Click ✏️ |
| **Delete Schedule** | Options page → Click 🗑️ |
| **Disable Temporarily** | Toggle checkbox (popup or options) |
| **Search Schedules** | Options page → Search box |
| **Backup Schedules** | Options page → Export button |
| **Restore Schedules** | Options page → Import button |

## 📅 Common Examples

### Daily Work Routine
```
Monday-Friday 9:00 AM → https://mail.google.com (recurring)
Monday-Friday 9:01 AM → https://calendar.google.com (recurring)
Monday-Friday 9:02 AM → https://slack.com (recurring)
```

### Weekly Reminders
```
Friday 5:00 PM → Timesheet URL (recurring)
Sunday 8:00 PM → Weekly planning doc (recurring)
```

### One-Time Events
```
Dec 25 10:00 AM → Holiday video call link (one-time)
```

## 🔍 Testing Your Extension

1. **Create Test Schedule**
   - Set time to 2 minutes from now
   - Use URL: https://www.google.com
   - Watch the service worker console

2. **Verify It Works**
   - Tab should open at scheduled time
   - Notification appears (if enabled)
   - Console shows "Triggering 1 schedule(s)"

3. **Check Statistics**
   - Options page shows total schedules
   - Shows active count
   - Displays storage usage

## 🎨 Generate Icons (Optional)

Icons make your extension look professional!

```bash
1. Open: icons/generate-icons.html in browser
2. Right-click each canvas → Save as PNG:
   - icon16.png (16×16)
   - icon48.png (48×48)
   - icon128.png (128×128)
3. Place in icons/ directory
4. Reload extension in Chrome
```

## ⚙️ Settings

Access via Options page:

- **Notifications**: Toggle browser notifications when tabs open
- More settings coming in future updates!

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Extension won't load | Check manifest.json exists, reload page |
| Schedule not triggering | Verify enabled checkbox, check day/time |
| Can't see icon | Click puzzle piece → Pin InitPage |
| Service worker stopped | Click "Service Worker" to restart |

## 📚 Full Documentation

- **README.md** - Complete feature documentation
- **INSTALLATION.md** - Detailed installation guide
- **PROJECT_SUMMARY.md** - Technical overview
- **This file** - Quick reference

## 🎯 Next Steps

1. ✅ Test with a schedule 2 minutes from now
2. ✅ Add your real daily schedules
3. ✅ Enable/disable notifications in settings
4. ✅ Export your schedules for backup
5. ✅ Explore the options page features

## 💡 Pro Tips

- **Use recurring** for weekly routines (work, errands)
- **Use one-time** for events (meetings, deadlines)
- **Disable instead of delete** to temporarily pause schedules
- **Export regularly** to backup your schedules
- **Monitor storage** in options page statistics

## 🌟 Features at a Glance

✅ Automatic URL opening  
✅ Day + time scheduling  
✅ Recurring & one-time  
✅ Quick popup interface  
✅ Full options page  
✅ Search & filter  
✅ Import/Export  
✅ Cross-device sync  
✅ Enable/disable toggle  
✅ Duplicate detection  
✅ URL validation  
✅ Storage monitoring  
✅ Notifications  

---

**Enjoy automated browsing! 🚀**

Need help? Check README.md or INSTALLATION.md
