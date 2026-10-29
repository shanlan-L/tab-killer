# AGENTS.md -- Tab Killer: Setup & Onboarding Guide for Coding Agents

You're installing **Tab Killer** for the user. Your job is not just to set it up -- it's to get them excited about using it.

---

## Step 0 -- Introduce the product

Before doing anything technical, tell the user what they're about to get:

> **Tab Killer** replaces your new tab page with a ledger of everything you have open, sorted by when you last used it.
>
> Here's what makes it useful:
> - **Park instead of close** put a group, a site, a window, or all idle tabs away; they wait in a side rail and come back with one click
> - **See what is idle** every tab shows how long ago you used it; one button parks everything untouched for 7+ days
> - **Toolbar button** (Alt+Shift+P) parks the whole current window
> - **Keyboard first** `/` search, `j`/`k` move, `s` park, `x` close, `c` copy as Markdown
> - **Copy as Markdown** hand a set of tabs to a coding agent or a note
> - **Duplicate detection** flags pages open twice and closes the extras
> - **100% local** no server, no accounts, no data sent anywhere
>
> It's just a Chrome extension. Setup takes about 1 minute.

---

## Step 1 -- Clone the repo

```bash
git clone https://github.com/<your-account>/tab-out.git
cd tab-out
```

---

## Step 2 -- Install the Chrome extension

This is the one step that requires manual action from the user. Make it as easy as possible.

**First**, print the full path to the `extension/` folder:
```bash
echo "Extension folder: $(cd extension && pwd)"
```

**Then**, copy the `extension/` folder path to their clipboard:
- macOS: `cd extension && pwd | pbcopy && echo "Path copied to clipboard"`
- Linux: `cd extension && pwd | xclip -selection clipboard 2>/dev/null || echo "Path: $(pwd)"`
- Windows: `cd extension && echo %CD% | clip`

**Then**, open the extensions page:
```bash
open "chrome://extensions"
```

**Then**, walk the user through it step by step:

> I've copied the extension folder path to your clipboard. Now:
>
> 1. You should see Chrome's extensions page. In the **top-right corner**, toggle on **Developer mode** (it's a switch).
> 2. Once Developer mode is on, you'll see a button called **"Load unpacked"** appear in the top-left. Click it.
> 3. A file picker will open. **Press Cmd+Shift+G** (Mac) or **Ctrl+L** (Windows/Linux) to open the "Go to folder" bar, then **paste** the path I copied (Cmd+V / Ctrl+V) and press Enter.
> 4. Click **"Select"** or **"Open"** and the extension will install.
>
> You should see "Tab Killer" appear in your extensions list.

**Also**, open the file browser directly to the extension folder as a fallback:
- macOS: `open extension/`
- Linux: `xdg-open extension/`
- Windows: `explorer extension\\`

---

## Step 3 -- Show them around

Once the extension is loaded:

> You're all set! Open a **new tab** and you'll see Tab Killer.
>
> Here's how it works:
> 1. **Tabs are listed by group**: Chrome tab groups first, then Dev servers (localhost), then sites. Press `v` to sort by last used instead.
> 2. **The age column** shows when you last used each tab. Amber is 7 days+, red is 30 days+.
> 3. **Click any title** (or press Enter) to jump to that tab, even in another window.
> 4. **Park** a section with its Park button, a single tab with `s`, or every idle tab with **Park N idle** at the top. Parked tabs close and appear in the right rail.
> 5. **Restore** a parked session from the rail. Every park and delete has an Undo toast.
> 6. **Click the toolbar icon** (or Alt+Shift+P) to park the whole current window.
> 7. **Copy** a section or session as a Markdown list to paste into Claude Code or a note.
> 8. **Make your own groups** with **Group rules** (above the list, or in the gear menu): for example an "AI" group holding claude.ai and chatgpt.com. It only changes how this page sorts tabs.
>
> That's it! No server to run, no config files. Everything works right away.

---

## Key Facts

- Tab Killer is a pure Chrome extension. No server, no Node.js, no npm.
- Parked sessions are stored in `chrome.storage.local`, one key per session (`parked:<id>`).
- Requires Chrome 121+ (for each tab's last-used time).
- 100% local. No data is sent to any external service.
- To update: `cd tab-out && git pull`, then reload the extension in `chrome://extensions`.
