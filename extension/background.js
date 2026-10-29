/**
 * background.js: Service Worker
 *
 * Two jobs:
 *   1. Keep the toolbar badge showing the current open tab count.
 *   2. Park the current window when the toolbar button (or its shortcut) is pressed.
 *
 * Badge color gives a quick at-a-glance health signal:
 *   Green  (#3d7a4a) → 1–10 tabs  (focused, manageable)
 *   Amber  (#b8892e) → 11–20 tabs (getting busy)
 *   Red    (#b35a5a) → 21+ tabs   (time to cull!)
 */

importScripts('sessions.js');

const DASHBOARD_URL = chrome.runtime.getURL('index.html');

// ─── Badge updater ────────────────────────────────────────────────────────────

/**
 * updateBadge()
 *
 * Counts open real-web tabs and updates the extension's toolbar badge.
 * "Real" tabs = not chrome://, not extension pages, not about:blank.
 */
async function updateBadge() {
  try {
    const tabs = await chrome.tabs.query({});

    // Only count actual web pages — skip browser internals and extension pages
    const count = tabs.filter(t => {
      const url = t.url || '';
      return (
        !url.startsWith('chrome://') &&
        !url.startsWith('chrome-extension://') &&
        !url.startsWith('about:') &&
        !url.startsWith('edge://') &&
        !url.startsWith('brave://')
      );
    }).length;

    // Don't show "0" — an empty badge is cleaner
    await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });

    if (count === 0) return;

    // Pick badge color based on workload level
    let color;
    if (count <= 10) {
      color = '#3d7a4a'; // Green — you're in control
    } else if (count <= 20) {
      color = '#b8892e'; // Amber — things are piling up
    } else {
      color = '#b35a5a'; // Red — time to focus and close some tabs
    }

    await chrome.action.setBadgeBackgroundColor({ color });

  } catch {
    // If something goes wrong, clear the badge rather than show stale data
    chrome.action.setBadgeText({ text: '' });
  }
}

// ─── Park window ──────────────────────────────────────────────────────────────

function isDashboardUrl(url) {
  return Boolean(url) && (url.startsWith(DASHBOARD_URL) || url.startsWith('chrome://newtab'));
}

/**
 * parkWindow()
 *
 * Saves every unpinned web tab in the window as one parked session, then closes them
 * and leaves the dashboard open so the window survives and the session is visible.
 * The session is written before anything closes: if storage fails, no tab is lost.
 */
async function parkWindow(windowId) {
  const tabs = await chrome.tabs.query({ windowId });
  const parkable = tabs.filter(tab => !tab.pinned && TabKillerSessions.isParkableUrl(tab.url));
  const dashboardTab = tabs.find(tab => tab.active && isDashboardUrl(tab.url));

  if (parkable.length === 0) {
    if (!dashboardTab) await chrome.tabs.create({ windowId, url: DASHBOARD_URL, active: true });
    return;
  }

  const session = await TabKillerSessions.save({ kind: 'window', tabs: parkable });
  const landingUrl = `${DASHBOARD_URL}?parked=${session.id}`;

  if (dashboardTab) {
    await chrome.tabs.update(dashboardTab.id, { url: landingUrl });
  } else {
    await chrome.tabs.create({ windowId, url: landingUrl, active: true });
  }

  await chrome.tabs.remove(parkable.map(tab => tab.id));
}

chrome.action.onClicked.addListener(tab => {
  parkWindow(tab.windowId).catch(error => {
    console.error('[tab-killer] failed to park window', error);
  });
});

// ─── Event listeners ──────────────────────────────────────────────────────────

// Update badge when the extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
});

// Update badge when Chrome starts up
chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Update badge whenever a tab is opened
chrome.tabs.onCreated.addListener(() => {
  updateBadge();
});

// Update badge whenever a tab is closed
chrome.tabs.onRemoved.addListener(() => {
  updateBadge();
});

// Update badge when a tab's URL changes (e.g. navigating to/from chrome://)
chrome.tabs.onUpdated.addListener(() => {
  updateBadge();
});

// ─── Initial run ─────────────────────────────────────────────────────────────

// Run once immediately when the service worker first loads
updateBadge();
