'use strict';

/**
 * workflows.js: tabs opened in one burst count as one workflow.
 *
 * Chrome does not say when a tab was opened, so the service worker records it under
 * "origin:<tabId>" in chrome.storage.session. Tab ids do not survive a browser restart and
 * neither does session storage, so a record never outlives the tab it describes.
 *
 * The new tab page links two tabs when:
 *   opener  B was opened from A (Cmd+click, target=_blank) within OPENER_WINDOW_MS of A
 *   burst   B was opened in the same window within BURST_GAP_MS of the tab opened before it
 * Linked tabs form one workflow. A workflow never spans more than MAX_SPAN_MS from its first
 * tab to its last, so a steady trickle of tabs does not chain a whole afternoon together,
 * and it needs MIN_SIZE open tabs to show up at all.
 *
 * Origin shape: { tabId, windowId, openerTabId, openedAt }
 */
(function (root) {
  const PREFIX = 'origin:';
  const SESSION_START_KEY = 'workflowSessionStartedAt';
  const MINUTE_MS = 60 * 1000;
  const BURST_GAP_MS = 3 * MINUTE_MS;
  const OPENER_WINDOW_MS = 30 * MINUTE_MS;
  const MAX_SPAN_MS = 30 * MINUTE_MS;
  const MIN_SIZE = 3;
  // A browser restart reopens every tab at once. That burst is not a workflow.
  const STARTUP_GRACE_MS = 15 * 1000;

  // ─── Recording (service worker) ────────────────────────────────────────────

  let sessionStartPromise = null;

  function getSessionStart() {
    if (!sessionStartPromise) {
      sessionStartPromise = chrome.storage.session.get(SESSION_START_KEY).then(async stored => {
        if (Number.isFinite(stored[SESSION_START_KEY])) return stored[SESSION_START_KEY];
        const now = Date.now();
        await chrome.storage.session.set({ [SESSION_START_KEY]: now });
        return now;
      });
    }
    return sessionStartPromise;
  }

  function toOrigin(tab, openedAt) {
    return {
      tabId: tab.id,
      windowId: tab.windowId,
      openerTabId: Number.isInteger(tab.openerTabId) ? tab.openerTabId : null,
      openedAt,
    };
  }

  async function recordCreated(tab) {
    const openedAt = Date.now();
    if (!Number.isInteger(tab.id)) return;
    // Session restore brings tabs back unloaded; a tab the user just opened is loading.
    if (tab.discarded || tab.status === 'unloaded') return;
    const sessionStart = await getSessionStart();
    if (openedAt - sessionStart < STARTUP_GRACE_MS) return;
    await chrome.storage.session.set({ [PREFIX + tab.id]: toOrigin(tab, openedAt) });
  }

  async function forget(tabId) {
    await chrome.storage.session.remove(PREFIX + tabId);
  }

  // Prerendering can swap one tab id for another; the tab is the same as far as the user knows.
  async function replace(addedTabId, removedTabId) {
    const key = PREFIX + removedTabId;
    const stored = await chrome.storage.session.get(key);
    const origin = stored[key];
    if (!origin) return;
    await chrome.storage.session.set({ [PREFIX + addedTabId]: { ...origin, tabId: addedTabId } });
    await chrome.storage.session.remove(key);
  }

  async function loadOrigins() {
    const stored = await chrome.storage.session.get(null);
    const origins = new Map();
    for (const [key, value] of Object.entries(stored)) {
      if (key.startsWith(PREFIX) && Number.isFinite(value?.openedAt)) origins.set(value.tabId, value);
    }
    return origins;
  }

  // ─── Clustering (new tab page) ─────────────────────────────────────────────

  /**
   * cluster(tabs, origins) -> [{ id, tabs, startedAt, endedAt, hubTabId }]
   *
   * tabs: open tabs, each with { id, pinned }. origins: Map<tabId, origin>.
   * Pinned tabs and tabs opened before recording began never join a workflow.
   * Each workflow lists its tabs in the order they were opened. hubTabId is the tab most of
   * the others were opened from (a search page, an index), or null when there is none.
   */
  function cluster(tabs, origins) {
    const members = tabs
      .filter(tab => !tab.pinned && origins.has(tab.id))
      .map(tab => ({ tab, origin: origins.get(tab.id) }))
      .sort((left, right) => left.origin.openedAt - right.origin.openedAt || left.tab.id - right.tab.id);

    const memberById = new Map(members.map(member => [member.tab.id, member]));
    const parentOf = new Map();
    const extentOf = new Map();

    function find(id) {
      let current = id;
      while (parentOf.get(current) !== current) current = parentOf.get(current);
      parentOf.set(id, current);
      return current;
    }

    function union(leftId, rightId) {
      const leftRoot = find(leftId);
      const rightRoot = find(rightId);
      if (leftRoot === rightRoot) return;

      const left = extentOf.get(leftRoot);
      const right = extentOf.get(rightRoot);
      const start = Math.min(left.start, right.start);
      const end = Math.max(left.end, right.end);
      if (end - start > MAX_SPAN_MS) return;

      parentOf.set(rightRoot, leftRoot);
      extentOf.set(leftRoot, { start, end });
      extentOf.delete(rightRoot);
    }

    // Walk tabs in the order they were opened, so the span limit cuts a long chain at the
    // same place every time rather than wherever a merge happened to be tried first.
    const lastInWindow = new Map();
    for (const member of members) {
      const { tab, origin } = member;
      parentOf.set(tab.id, tab.id);
      extentOf.set(tab.id, { start: origin.openedAt, end: origin.openedAt });

      const opener = memberById.get(origin.openerTabId);
      if (opener && opener !== member) {
        const gap = origin.openedAt - opener.origin.openedAt;
        if (gap >= 0 && gap <= OPENER_WINDOW_MS) union(opener.tab.id, tab.id);
      }

      const previous = lastInWindow.get(origin.windowId);
      if (previous && origin.openedAt - previous.origin.openedAt <= BURST_GAP_MS) {
        union(previous.tab.id, tab.id);
      }
      lastInWindow.set(origin.windowId, member);
    }

    const groups = new Map();
    for (const member of members) {
      const rootId = find(member.tab.id);
      if (!groups.has(rootId)) groups.set(rootId, []);
      groups.get(rootId).push(member);
    }

    return [...groups.values()]
      .filter(group => group.length >= MIN_SIZE)
      .map(group => {
        const ids = new Set(group.map(member => member.tab.id));
        const childCounts = new Map();
        for (const member of group) {
          const openerId = member.origin.openerTabId;
          if (ids.has(openerId)) childCounts.set(openerId, (childCounts.get(openerId) || 0) + 1);
        }

        let hubTabId = null;
        let hubChildren = 1;
        for (const [id, count] of childCounts) {
          if (count > hubChildren) {
            hubTabId = id;
            hubChildren = count;
          }
        }

        return {
          id: String(group[0].tab.id),
          tabs: group.map(member => member.tab),
          startedAt: group[0].origin.openedAt,
          endedAt: group[group.length - 1].origin.openedAt,
          hubTabId,
        };
      });
  }

  root.TabKillerWorkflows = {
    PREFIX,
    BURST_GAP_MS,
    OPENER_WINDOW_MS,
    MAX_SPAN_MS,
    MIN_SIZE,
    getSessionStart,
    recordCreated,
    forget,
    replace,
    loadOrigins,
    cluster,
  };
})(self);
