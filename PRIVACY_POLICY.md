# AutoTab Privacy Policy

**Last Updated: February 22, 2026**

## Overview

AutoTab is committed to protecting your privacy. This privacy policy explains how AutoTab handles your data.

## Data Collection

**AutoTab does NOT collect, store, or transmit any user data to external servers.**

We do not:
- ❌ Collect personal information
- ❌ Track your browsing history
- ❌ Send data to external servers
- ❌ Use analytics or tracking services
- ❌ Share data with third parties
- ❌ Sell or monetize user data

## Local Storage

All data is stored locally in your Chrome browser using the `chrome.storage.sync` API:

**What we store locally:**
- Your scheduled URLs and times
- Your tab group configurations
- Your extension settings (notifications on/off)
- Schedule enable/disable states

**Chrome Sync:**
If you have Chrome Sync enabled in your browser, Google Chrome may sync this data across your devices. This is controlled by your Chrome settings, not by AutoTab. You can disable Chrome Sync at any time in Chrome Settings.

## Permissions Explained

AutoTab requests the following permissions:

### storage
**Purpose:** Store your schedules, tab groups, and settings locally in your Chrome profile.

**Data:** Schedule URLs, times, tab group names/colors, notification preferences.

**Access:** Only AutoTab can access this data. It remains on your device.

### alarms
**Purpose:** Check your schedules every minute to trigger automatic tab opening.

**Data:** No data is stored. This permission only allows AutoTab to wake up periodically.

**Access:** Standard Chrome API, no external access.

### tabs
**Purpose:** Open scheduled URLs automatically in new browser tabs.

**Data:** No data is collected. AutoTab only opens tabs you've scheduled.

**Access:** AutoTab can only open tabs, not read existing tab content.

### tabGroups
**Purpose:** Create and manage colored tab groups for organization.

**Data:** Tab group names and colors (stored locally with storage permission).

**Access:** AutoTab can create/modify tab groups, not access tab content.

### notifications
**Purpose:** Show optional notifications when scheduled tabs open.

**Data:** No data is collected. Notifications are generated locally.

**Access:** Can be disabled in extension settings at any time.

## Third-Party Services

**AutoTab does not use any third-party services**, including:
- No analytics (Google Analytics, etc.)
- No error tracking (Sentry, etc.)
- No CDN services
- No external APIs
- No advertising networks

The only exception is:
- **Flatpickr library**: A calendar widget included locally in the extension (not loaded from external CDN). No data is sent to flatpickr.

## Data Security

Since all data is stored locally on your device:
- We do not have access to your data
- Your data never leaves your device (except via Chrome Sync if enabled)
- No passwords or sensitive data are stored
- No authentication is required

## Data Deletion

To delete all AutoTab data:

**Option 1: Clear Extension Data**
1. Go to `chrome://extensions/`
2. Find AutoTab
3. Click "Remove"
4. All data is immediately deleted

**Option 2: Clear Storage**
1. Open AutoTab options page
2. Click "Delete All" schedules
3. Delete all groups
4. All data is cleared

**Chrome Sync Data:**
If you use Chrome Sync, you may need to clear synced data:
1. Go to Chrome Settings → Sync and Google Services
2. Manage synced data
3. Clear Extension data

## Children's Privacy

AutoTab does not collect any data from anyone, including children under 13. The extension is suitable for all ages.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. Changes will be:
- Posted in this document
- Noted in the Chrome Web Store extension description
- Announced in extension update notes (for major changes)

Continued use of AutoTab after changes constitutes acceptance of the updated policy.

## Your Rights

Since we don't collect any data:
- There is no data to access, modify, or delete from our servers
- All data is under your control locally
- You can export your schedules at any time (Import/Export feature)
- You can delete the extension at any time

## Open Source

AutoTab is open source. You can:
- Review the complete source code: https://github.com/daneuchar/AutoTab
- Verify that no data collection occurs
- Audit the code for security
- Contribute improvements

## Contact

If you have questions about this privacy policy or AutoTab's data practices:

- **GitHub Issues:** https://github.com/daneuchar/AutoTab/issues


## Compliance

AutoTab complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR) - no data collected
- California Consumer Privacy Act (CCPA) - no data collected
- Children's Online Privacy Protection Act (COPPA) - no data collected

## Summary

**TL;DR:**
- ✅ Zero data collection
- ✅ Everything stored locally
- ✅ No external servers
- ✅ No tracking or analytics
- ✅ Open source and auditable
- ✅ You control all your data

---

**AutoTab - Privacy-First Browser Automation**

*This privacy policy was last updated on February 22, 2026.*
