# Tab Killer

Tab Killer is a Chrome new-tab extension for people who keep too many tabs open because closing them feels risky.

Every new tab shows a ledger of what is open, when you last used it, and a place to **park** tabs: they close, wait in a side rail, and come back with one click.

No server. No account. No build step. Just a local Chrome extension.

## Product Positioning

Tab Killer is not a bookmark manager or a workspace platform. It answers two questions fast:

- What have I not touched in a week?
- Can I put it away without losing it?

`open new tab -> see what is idle -> park it -> restore it when you need it`

## What It Does

### Park instead of close

- **Park** a Chrome tab group, a site, a single tab, or every idle tab at once
- Parked tabs are saved first, then closed, so a storage failure never loses a tab
- Every park shows an **Undo** toast
- The **Parked** rail lists each session with its links; restore all, open one, copy, or delete (with undo)
- Restoring a parked Chrome group recreates the group with its title and color
- **Toolbar button** (default shortcut `Alt+Shift+P`) parks the whole current window, skipping pinned tabs

### See what is idle

- Each row shows how long ago you last used the tab (Chrome 121+ `lastAccessed`)
- Rows fade as they age; amber marks 7 days+, red marks 30 days+
- **By last used** view buckets tabs into today, this week, idle 7 days+, idle 30 days+
- **Park N idle** in the top bar parks every unpinned, silent, inactive tab older than 7 days

### Grouping

- Native Chrome tab groups come first, with their title and color
- **Custom groups** (Group rules panel, from the gear menu or above the list): name a group, pick a color, list URL rules one per line: a domain (`claude.ai`, subdomains included), a host with port (`localhost:3000`), a path prefix (`github.com/anthropics`), or a wildcard (`*.google.com/document`). Matching tabs land in that group; the top rule wins. Rules only change this page, never your Chrome tabs, and tabs already in a Chrome group stay there
- `localhost`, `127.0.0.1`, and `.local` tabs share one **Dev servers** section, sorted by port
- Other tabs group by site; sites with a single tab share an **Other sites** section
- Duplicate pages carry a `2x` tag, and **Close duplicates** keeps one copy of each

### Search, keyboard, and Markdown

| Key | Action |
|---|---|
| `/` | Search titles, URLs, and site names |
| `j` / `k` | Move between rows |
| `Enter` | Jump to the tab |
| `s` | Park the focused tab |
| `x` | Close the focused tab |
| `c` | Copy the focused tab as a Markdown link |
| `v` | Switch between By group and By last used |

Each section and each parked session can be copied as a Markdown list, ready to paste into a coding agent or a note.

### Settings

Theme (system, light, dark), language (English, Chinese), and Group rules live in the gear menu.

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

Then open a new tab and Tab Killer will replace the default new-tab page. Requires Chrome 121 or newer.

## Tech Notes

- Chrome Extension Manifest V3
- `chrome_url_overrides.newtab` for new-tab replacement
- `chrome.tabs`, `chrome.tabGroups`, `chrome.storage.local`
- Parked sessions are stored one per key (`parked:<id>`) in `chrome.storage.local`; group rules live under `groupRules`
- Plain HTML/CSS/JavaScript, no build pipeline

## Repository Structure

```text
extension/
  manifest.json
  index.html
  app.js          new tab page
  sessions.js     parked session storage, shared with the service worker
  style.css
  background.js   badge count and toolbar "park window"
```

## License

MIT
