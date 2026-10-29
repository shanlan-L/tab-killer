'use strict';

/**
 * sessions.js: parked tab sessions, shared by the new tab page and the service worker.
 *
 * Each session lives under its own storage key ("parked:<id>") so the page and the
 * service worker can write at the same time without overwriting each other's list.
 *
 * Session shape:
 *   { id, kind: 'window' | 'group' | 'domain' | 'idle' | 'tab', label, color, createdAt,
 *     tabs: [{ url, title }] }
 */
(function (root) {
  const PREFIX = 'parked:';

  function isParkableUrl(url) {
    return /^(https?|file):/i.test(url || '');
  }

  function toParkedTab(tab) {
    const url = tab.url || tab.pendingUrl || '';
    return { url, title: String(tab.title || '').trim() || url };
  }

  // Resolves only after the write lands, so callers can close tabs knowing the copy exists.
  async function save({ kind, label = null, color = null, tabs }) {
    const parkedTabs = tabs.map(toParkedTab).filter(tab => isParkableUrl(tab.url));
    if (parkedTabs.length === 0) return null;

    const session = {
      id: crypto.randomUUID(),
      kind,
      label,
      color,
      createdAt: Date.now(),
      tabs: parkedTabs,
    };

    await chrome.storage.local.set({ [PREFIX + session.id]: session });
    return session;
  }

  async function put(session) {
    await chrome.storage.local.set({ [PREFIX + session.id]: session });
  }

  async function list() {
    const stored = await chrome.storage.local.get(null);
    return Object.entries(stored)
      .filter(([key, value]) => key.startsWith(PREFIX) && Array.isArray(value?.tabs))
      .map(([, value]) => value)
      .sort((left, right) => right.createdAt - left.createdAt);
  }

  async function remove(id) {
    await chrome.storage.local.remove(PREFIX + id);
  }

  root.TabKillerSessions = { PREFIX, isParkableUrl, save, put, list, remove };
})(self);
