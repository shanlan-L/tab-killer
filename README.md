# Tab Killer

Tab Killer is a Chrome new-tab extension built for one job: making a crowded browser readable again.

It turns every new tab into a lightweight dashboard where:

- Native Chrome tab groups stay visible and actionable
- Ungrouped tabs are clustered automatically by hostname
- Duplicate links can be cleaned up in one click
- Duplicate Tab Killer pages can be cleaned up too
- Theme follows the browser by default
- Interface supports both English and Chinese

No server. No account. No build step. Just a local Chrome extension.

## Product Positioning

Tab Killer is not a bookmark manager, tab archiver, or workspace platform.

It is a fast cleanup surface for people who:

- Keep many tabs open across multiple windows
- Already use Chrome tab groups, but still lose track of everything else
- Want a global overview without managing tabs one by one
- Need a low-friction way to close noise and keep signal

The design goal is simple:

`open new tab -> see the whole browser -> clean it up quickly`

## What It Does

### 1. Chrome Tab Groups on Top

If you already use native Chrome tab groups, Tab Killer keeps them intact and shows:

- Group title
- Group color
- Tabs inside the group
- Quick actions for closing one tab or the whole group

This means you keep Chrome's native grouping model instead of replacing it.

### 2. Automatic Grouping Below

Tabs that are not inside a native Chrome group are clustered automatically.

Current grouping behavior:

- Same hostname is grouped together, even across different browser windows
- `localhost` and local dev domains stay split by host/port when useful
- Auto groups use a neutral gray visual style so they do not conflict with native Chrome group colors

### 3. One-Click Duplicate Cleanup

Tab Killer detects repeated links globally and surfaces a cleanup action in the top toolbar.

It will:

- Keep one copy of each duplicated page
- Close the extra copies
- Include duplicate Tab Killer pages in the cleanup flow

### 4. Fast Tab Actions

From the dashboard you can:

- Focus any tab
- Close a single tab
- Close a whole native Chrome group
- Close a whole automatic group
- Expand long groups to reveal more tabs

## UI Behavior

- Layout is vertical: native tab groups first, auto groups second
- Theme follows browser/system preference by default
- Theme can still be manually overridden from the UI
- Language can be toggled between English and Chinese
- The extension updates as tabs, groups, titles, and states change

## Privacy

Everything runs locally inside the extension.

- No backend
- No account
- No remote sync
- No external API required for core functionality

## Install

### Load as an unpacked extension

1. Clone this repository:

```bash
git clone https://github.com/shanlan-L/tab-killer.git
cd tab-killer
```

2. Open Chrome and go to `chrome://extensions`
3. Turn on `Developer mode`
4. Click `Load unpacked`
5. Select the `extension/` folder

Then open a new tab and Tab Killer will replace the default new-tab page.

## Tech Notes

- Chrome Extension Manifest V3
- `chrome_url_overrides.newtab` for new-tab replacement
- `chrome.tabs`, `chrome.tabGroups`, `chrome.storage.local`
- Plain HTML/CSS/JavaScript, no build pipeline

## Repository Structure

```text
extension/
  manifest.json
  index.html
  app.js
  style.css
  background.js
```

## License

MIT
