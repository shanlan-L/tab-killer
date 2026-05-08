'use strict';

const TAB_GROUP_NONE = chrome.tabGroups.TAB_GROUP_ID_NONE;
const THEME_STORAGE_KEY = 'themePreference';
const THEME_PREF_VERSION_KEY = 'themePreferenceVersion';
const THEME_PREF_VERSION = 2;
const LOCALE_STORAGE_KEY = 'localePreference';
const THEME_QUERY = window.matchMedia('(prefers-color-scheme: dark)');
const TAB_KILLER_PAGE_URL = chrome.runtime.getURL('index.html');
const TAB_KILLER_NEW_TAB_PREFIXES = [
  'chrome://newtab',
  'edge://newtab',
  'brave://newtab',
  'about:newtab',
  'chrome-search://local-ntp',
];
const INTERNAL_URL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'chrome-search://',
  'about:',
  'edge://',
  'brave://',
  'devtools://',
];

const AUTO_GROUP_PALETTE = [
  { accent: '#9aa4b2', soft: 'rgba(154, 164, 178, 0.18)', edge: 'rgba(154, 164, 178, 0.32)' },
];

const COLOR_ACCENTS = {
  grey: '#9aa4b2',
  blue: '#5da8ff',
  red: '#ff6b6b',
  yellow: '#ffcd57',
  green: '#58d68d',
  pink: '#ff88c2',
  purple: '#a78bfa',
  cyan: '#56d7ff',
  orange: '#ff9966',
};

const FRIENDLY_DOMAINS = {
  'github.com': 'GitHub',
  'www.github.com': 'GitHub',
  'gist.github.com': 'GitHub Gist',
  'youtube.com': 'YouTube',
  'www.youtube.com': 'YouTube',
  'music.youtube.com': 'YouTube Music',
  'x.com': 'X',
  'www.x.com': 'X',
  'twitter.com': 'X',
  'www.twitter.com': 'X',
  'reddit.com': 'Reddit',
  'www.reddit.com': 'Reddit',
  'old.reddit.com': 'Reddit',
  'substack.com': 'Substack',
  'www.substack.com': 'Substack',
  'medium.com': 'Medium',
  'www.medium.com': 'Medium',
  'linkedin.com': 'LinkedIn',
  'www.linkedin.com': 'LinkedIn',
  'stackoverflow.com': 'Stack Overflow',
  'www.stackoverflow.com': 'Stack Overflow',
  'news.ycombinator.com': 'Hacker News',
  'google.com': 'Google',
  'www.google.com': 'Google',
  'mail.google.com': 'Gmail',
  'docs.google.com': 'Google Docs',
  'drive.google.com': 'Google Drive',
  'calendar.google.com': 'Google Calendar',
  'meet.google.com': 'Google Meet',
  'gemini.google.com': 'Gemini',
  'chatgpt.com': 'ChatGPT',
  'www.chatgpt.com': 'ChatGPT',
  'chat.openai.com': 'ChatGPT',
  'claude.ai': 'Claude',
  'www.claude.ai': 'Claude',
  'code.claude.com': 'Claude Code',
  'notion.so': 'Notion',
  'www.notion.so': 'Notion',
  'figma.com': 'Figma',
  'www.figma.com': 'Figma',
  'slack.com': 'Slack',
  'app.slack.com': 'Slack',
  'discord.com': 'Discord',
  'www.discord.com': 'Discord',
  'wikipedia.org': 'Wikipedia',
  'en.wikipedia.org': 'Wikipedia',
  'amazon.com': 'Amazon',
  'www.amazon.com': 'Amazon',
  'netflix.com': 'Netflix',
  'www.netflix.com': 'Netflix',
  'spotify.com': 'Spotify',
  'open.spotify.com': 'Spotify',
  'vercel.com': 'Vercel',
  'www.vercel.com': 'Vercel',
  'npmjs.com': 'npm',
  'www.npmjs.com': 'npm',
  'developer.mozilla.org': 'MDN',
  'arxiv.org': 'arXiv',
  'www.arxiv.org': 'arXiv',
  'huggingface.co': 'Hugging Face',
  'www.huggingface.co': 'Hugging Face',
  'producthunt.com': 'Product Hunt',
  'www.producthunt.com': 'Product Hunt',
  'xiaohongshu.com': 'RedNote',
  'www.xiaohongshu.com': 'RedNote',
  'local-files': 'Local Files',
};

const I18N = {
  en: {
    'app.title': 'Tab Killer',
    'stats.tabs': 'Tabs',
    'stats.tabGroups': 'Tab Groups',
    'stats.autoGroups': 'Auto Groups',
    'theme.modeSystem': 'Follow browser',
    'theme.modeLight': 'Light mode',
    'theme.modeDark': 'Dark mode',
    'locale.target': '中文',
    'duplicates.cleanupCta': ({ count }) => `Close ${count} duplicate tab${plural(count)}`,
    'duplicates.summary': ({ count, groupCount }) => `${count} duplicate tab${plural(count)} across ${groupCount} link${plural(groupCount)}`,
    'duplicates.tabKillerHint': ({ count }) => `Tab Killer x${count}`,
    'section.tabGroups.kicker': 'Tab Groups',
    'section.autoGroups.kicker': 'Auto Groups',
    'empty.tabGroups.title': 'No tab groups yet',
    'empty.tabGroups.body': 'Create a native Chrome tab group and it will appear here with its title, color, and tabs.',
    'empty.autoGroups.title': 'Everything is grouped',
    'empty.autoGroups.body': 'Once tabs fall outside native Chrome tab groups, Tab Killer will cluster them below by context.',
    'fallback.untitledTab': 'Untitled tab',
    'fallback.untitledGroup': 'Untitled group',
    'summary.tabGroups': ({ groupCount, tabCount }) => `${groupCount} group${plural(groupCount)} · ${tabCount} tab${plural(tabCount)}`,
    'summary.autoGroups': ({ clusterCount, tabCount }) => `${clusterCount} cluster${plural(clusterCount)} · ${tabCount} tab${plural(tabCount)}`,
    'chromeGroup.caption': 'Chrome group',
    'color.grey': 'Grey',
    'color.blue': 'Blue',
    'color.red': 'Red',
    'color.yellow': 'Yellow',
    'color.green': 'Green',
    'color.pink': 'Pink',
    'color.purple': 'Purple',
    'color.cyan': 'Cyan',
    'color.orange': 'Orange',
    'badge.active': 'Active',
    'badge.pinned': 'Pinned',
    'badge.audio': 'Audio',
    'badge.loading': 'Loading',
    'badge.collapsed': 'Collapsed',
    'count.tabs': ({ count }) => `${count} tab${plural(count)}`,
    'count.activeTabs': ({ count }) => `${count} active tab${plural(count)}`,
    'button.closeTab': 'Close tab',
    'button.closeGroup': 'Close group',
    'button.closeCluster': 'Close cluster',
    'button.showMore': ({ count }) => `Show ${count} more`,
    'group.nativeFootnote': 'Native Chrome tab group',
    'tab.localFile': 'Local file',
    'toast.closedTab': 'Tab closed',
    'toast.closedTabs': ({ count }) => `Closed ${count} tab${plural(count)}`,
    'toast.refreshError': 'Could not refresh tabs',
    'auto.localhost': ({ port, host }) => port ? `Localhost ${port}` : host,
    'auto.localFiles': 'Local Files',
    'auto.githubRepo': ({ repo }) => repo,
    'auto.googleDocs': 'Google Docs',
    'auto.googleSheets': 'Google Sheets',
    'auto.googleSlides': 'Google Slides',
    'auto.googleForms': 'Google Forms',
    'auto.googleDrive': 'Google Drive',
    'auto.googleCalendar': 'Google Calendar',
    'auto.figmaFiles': 'Figma Files',
    'auto.assistant': ({ name }) => name,
    'auto.domain': ({ name }) => name,
  },
  zh: {
    'app.title': 'Tab Killer',
    'stats.tabs': '标签页',
    'stats.tabGroups': '标签组',
    'stats.autoGroups': '自动分组',
    'theme.modeSystem': '跟随浏览器',
    'theme.modeLight': '浅色模式',
    'theme.modeDark': '深色模式',
    'locale.target': 'English',
    'duplicates.cleanupCta': ({ count }) => `清理 ${count} 个重复页`,
    'duplicates.summary': ({ count, groupCount }) => `${count} 个重复标签，涉及 ${groupCount} 个重复链接`,
    'duplicates.tabKillerHint': ({ count }) => `Tab Killer x${count}`,
    'section.tabGroups.kicker': '原生标签组',
    'section.autoGroups.kicker': '自动分组',
    'empty.tabGroups.title': '还没有标签组',
    'empty.tabGroups.body': '在 Chrome 里创建原生标签组后，这里会显示它的标题、颜色和成员标签页。',
    'empty.autoGroups.title': '当前都已经分组了',
    'empty.autoGroups.body': '当标签页不在 Chrome 原生标签组里时，Tab Killer 会在这里按上下文自动聚类。',
    'fallback.untitledTab': '未命名标签页',
    'fallback.untitledGroup': '未命名标签组',
    'summary.tabGroups': ({ groupCount, tabCount }) => `${groupCount} 个分组 · ${tabCount} 个标签页`,
    'summary.autoGroups': ({ clusterCount, tabCount }) => `${clusterCount} 个聚类 · ${tabCount} 个标签页`,
    'chromeGroup.caption': 'Chrome 标签组',
    'color.grey': '灰色',
    'color.blue': '蓝色',
    'color.red': '红色',
    'color.yellow': '黄色',
    'color.green': '绿色',
    'color.pink': '粉色',
    'color.purple': '紫色',
    'color.cyan': '青色',
    'color.orange': '橙色',
    'badge.active': '当前',
    'badge.pinned': '固定',
    'badge.audio': '音频',
    'badge.loading': '加载中',
    'badge.collapsed': '已折叠',
    'count.tabs': ({ count }) => `${count} 个标签页`,
    'count.activeTabs': ({ count }) => `${count} 个当前标签页`,
    'button.closeTab': '关闭标签页',
    'button.closeGroup': '关闭整组',
    'button.closeCluster': '关闭这一组',
    'button.showMore': ({ count }) => `展开剩余 ${count} 个`,
    'group.nativeFootnote': 'Chrome 原生标签组',
    'tab.localFile': '本地文件',
    'toast.closedTab': '已关闭标签页',
    'toast.closedTabs': ({ count }) => `已关闭 ${count} 个标签页`,
    'toast.refreshError': '刷新标签页失败',
    'auto.localhost': ({ port, host }) => port ? `本地服务 ${port}` : host,
    'auto.localFiles': '本地文件',
    'auto.githubRepo': ({ repo }) => repo,
    'auto.googleDocs': 'Google 文档',
    'auto.googleSheets': 'Google 表格',
    'auto.googleSlides': 'Google 幻灯片',
    'auto.googleForms': 'Google 表单',
    'auto.googleDrive': 'Google 云端硬盘',
    'auto.googleCalendar': 'Google 日历',
    'auto.figmaFiles': 'Figma 文件',
    'auto.assistant': ({ name }) => name,
    'auto.domain': ({ name }) => name,
  },
};

const state = {
  localePreference: null,
  themePreference: 'system',
  snapshot: null,
};

let toastTimer = null;
let renderScheduled = false;
let renderRunning = false;
let rerenderRequested = false;

function plural(count) {
  return count === 1 ? '' : 's';
}

function detectLocale() {
  const language = navigator.language || navigator.languages?.[0] || 'en';
  return language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function getResolvedLocale() {
  return state.localePreference === 'zh' || state.localePreference === 'en'
    ? state.localePreference
    : detectLocale();
}

function t(key, params = {}) {
  const locale = getResolvedLocale();
  const dictionary = I18N[locale] || I18N.en;
  const fallback = I18N.en[key];
  const value = dictionary[key] ?? fallback ?? key;

  if (typeof value === 'function') return value(params);
  return String(value).replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case '\'': return '&#39;';
      default: return char;
    }
  });
}

function safeParseUrl(url) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function safePageUrl(url) {
  const parsed = safeParseUrl(url);
  if (!parsed) return '';
  return ['http:', 'https:', 'file:'].includes(parsed.protocol) ? parsed.toString() : '';
}

function getFaviconUrl(url, size = 32) {
  const pageUrl = safePageUrl(url);
  if (!pageUrl || pageUrl.startsWith('file:')) return '';

  const faviconUrl = new URL(chrome.runtime.getURL('/_favicon/'));
  faviconUrl.searchParams.set('pageUrl', pageUrl);
  faviconUrl.searchParams.set('size', String(size));
  return faviconUrl.toString();
}

function renderFaviconImg(url) {
  const faviconUrl = getFaviconUrl(url);
  if (!faviconUrl) return '';
  return `<img class="tab-favicon" src="${escapeHtml(faviconUrl)}" alt="">`;
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function friendlyDomain(hostname) {
  if (!hostname) return '';
  if (FRIENDLY_DOMAINS[hostname]) return FRIENDLY_DOMAINS[hostname];

  if (hostname.endsWith('.substack.com') && hostname !== 'substack.com') {
    return `${capitalize(hostname.replace('.substack.com', ''))}'s Substack`;
  }

  if (hostname.endsWith('.github.io')) {
    return `${capitalize(hostname.replace('.github.io', ''))} Pages`;
  }

  const cleaned = hostname
    .replace(/^www\./, '')
    .replace(/\.(com|org|net|io|co|ai|dev|app|so|me|xyz|info|us|uk|co\.uk|co\.jp)$/, '');

  return cleaned.split('.').map(capitalize).join(' ');
}

function stripTitleNoise(title) {
  if (!title) return '';
  let output = title;
  output = output.replace(/^\(\d+\+?\)\s*/, '');
  output = output.replace(/\s*\([\d,]+\+?\)\s*/g, ' ');
  output = output.replace(/\s*[\-\u2010-\u2015]\s*[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '');
  output = output.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '');
  output = output.replace(/\s+on X:\s*/, ': ');
  output = output.replace(/\s*\/\s*X\s*$/, '');
  return output.trim();
}

function cleanTitle(title, hostname) {
  if (!title || !hostname) return title || '';

  const friendly = friendlyDomain(hostname);
  const domain = hostname.replace(/^www\./, '');
  const separators = [' - ', ' | ', ' — ', ' · ', ' – '];

  for (const separator of separators) {
    const index = title.lastIndexOf(separator);
    if (index === -1) continue;

    const suffix = title.slice(index + separator.length).trim();
    const suffixLower = suffix.toLowerCase();

    if (
      suffixLower === domain.toLowerCase() ||
      suffixLower === friendly.toLowerCase() ||
      suffixLower === domain.replace(/\.\w+$/, '').toLowerCase() ||
      domain.toLowerCase().includes(suffixLower) ||
      friendly.toLowerCase().includes(suffixLower)
    ) {
      const cleaned = title.slice(0, index).trim();
      if (cleaned.length >= 5) return cleaned;
    }
  }

  return title;
}

function smartTitle(title, url) {
  if (!url) return title || '';

  const parsed = safeParseUrl(url);
  if (!parsed) return title || '';

  const { hostname, pathname } = parsed;
  const titleIsUrl = !title || title === url || title.startsWith(hostname) || title.startsWith('http');

  if ((hostname === 'x.com' || hostname === 'twitter.com' || hostname === 'www.x.com') && pathname.includes('/status/')) {
    const username = pathname.split('/')[1];
    if (username && titleIsUrl) return `Post by @${username}`;
  }

  if (hostname === 'github.com' || hostname === 'www.github.com') {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const [owner, repo, ...rest] = parts;
      if (rest[0] === 'issues' && rest[1]) return `${owner}/${repo} Issue #${rest[1]}`;
      if (rest[0] === 'pull' && rest[1]) return `${owner}/${repo} PR #${rest[1]}`;
      if (rest[0] === 'blob' || rest[0] === 'tree') return `${owner}/${repo} - ${rest.slice(2).join('/')}`;
      if (titleIsUrl) return `${owner}/${repo}`;
    }
  }

  if ((hostname === 'www.youtube.com' || hostname === 'youtube.com') && pathname === '/watch' && titleIsUrl) {
    return 'YouTube Video';
  }

  if ((hostname === 'www.reddit.com' || hostname === 'reddit.com' || hostname === 'old.reddit.com') && pathname.includes('/comments/')) {
    const parts = pathname.split('/').filter(Boolean);
    const subIndex = parts.indexOf('r');
    if (subIndex !== -1 && parts[subIndex + 1] && titleIsUrl) {
      return `r/${parts[subIndex + 1]} post`;
    }
  }

  return title || url;
}

function isVisibleTab(tab) {
  const url = tab.url || tab.pendingUrl || '';
  if (!url) return false;
  return INTERNAL_URL_PREFIXES.every(prefix => !url.startsWith(prefix));
}

function isManagedNewTabUrl(url) {
  return Boolean(url) && TAB_KILLER_NEW_TAB_PREFIXES.some(prefix => (
    url === prefix ||
    url.startsWith(`${prefix}/`) ||
    url.startsWith(`${prefix}?`) ||
    url.startsWith(`${prefix}#`)
  ));
}

function isTabKillerUrl(url) {
  return Boolean(url) && (
    url === TAB_KILLER_PAGE_URL ||
    url.startsWith(`${TAB_KILLER_PAGE_URL}?`) ||
    url.startsWith(`${TAB_KILLER_PAGE_URL}#`) ||
    isManagedNewTabUrl(url)
  );
}

function isDuplicateCandidateTab(tab) {
  const url = tab.url || tab.pendingUrl || '';
  if (!url) return false;
  return isVisibleTab(tab) || isTabKillerUrl(url);
}

function getHostname(url) {
  if (!url) return '';
  if (url.startsWith('file://')) return 'local-files';
  const parsed = safeParseUrl(url);
  return parsed?.hostname || '';
}

function canonicalizeGroupHostname(hostname) {
  if (!hostname) return '';
  if (hostname === 'local-files') return hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) return hostname;
  return hostname.replace(/^www\./, '');
}

function getAvatarLetter(tab) {
  const source = friendlyDomain(tab.hostname) || tab.title || 'T';
  const letter = source.trim().charAt(0).toUpperCase();
  return escapeHtml(letter || 'T');
}

function renderTabAvatar(tab) {
  return `
    <span class="tab-avatar">
      <span class="tab-avatar-fallback">${getAvatarLetter(tab)}</span>
      ${renderFaviconImg(tab.url)}
    </span>
  `;
}

function serializeIds(ids) {
  return ids.join(',');
}

function parseIds(raw) {
  return String(raw || '')
    .split(',')
    .map(value => Number(value))
    .filter(value => Number.isInteger(value) && value >= 0);
}

function normalizeDuplicateUrl(url) {
  if (!url) return '';
  if (isTabKillerUrl(url)) return TAB_KILLER_PAGE_URL;

  const parsed = safeParseUrl(url);
  if (!parsed) return url;

  parsed.hash = '';
  if (parsed.pathname && parsed.pathname.length > 1) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  }

  return parsed.toString();
}

function compareDuplicateTabs(left, right) {
  const leftScore = (left.active ? 4 : 0) + (left.pinned ? 2 : 0);
  const rightScore = (right.active ? 4 : 0) + (right.pinned ? 2 : 0);

  if (rightScore !== leftScore) return rightScore - leftScore;
  return sortTabs(left, right);
}

function buildDuplicateCleanup(tabs) {
  const duplicatesByUrl = new Map();
  let tabKillerTotalCount = 0;

  for (const tab of tabs) {
    if (!isDuplicateCandidateTab(tab)) continue;

    const duplicateUrl = normalizeDuplicateUrl(tab.url);
    if (!duplicateUrl) continue;

    if (isTabKillerUrl(tab.url)) tabKillerTotalCount += 1;
    if (!duplicatesByUrl.has(duplicateUrl)) duplicatesByUrl.set(duplicateUrl, []);
    duplicatesByUrl.get(duplicateUrl).push(tab);
  }

  let groupCount = 0;
  let tabKillerDuplicateCount = 0;
  const closeIds = [];

  for (const [duplicateUrl, groupTabs] of duplicatesByUrl.entries()) {
    if (groupTabs.length < 2) continue;

    groupCount += 1;
    const orderedTabs = [...groupTabs].sort(compareDuplicateTabs);
    const groupCloseIds = orderedTabs.slice(1).map(tab => tab.id);
    closeIds.push(...groupCloseIds);

    if (duplicateUrl === TAB_KILLER_PAGE_URL) {
      tabKillerDuplicateCount = groupCloseIds.length;
    }
  }

  return {
    count: closeIds.length,
    closeIds,
    groupCount,
    tabKillerTotalCount,
    tabKillerDuplicateCount,
  };
}

function hashString(value) {
  let hash = 0;
  for (const char of value) {
    hash = ((hash << 5) - hash) + char.charCodeAt(0);
    hash |= 0;
  }
  return Math.abs(hash);
}

function paletteForKey(value) {
  return AUTO_GROUP_PALETTE[hashString(value) % AUTO_GROUP_PALETTE.length];
}

function normalizeTab(tab) {
  const url = tab.url || tab.pendingUrl || '';
  const hostname = getHostname(url);
  let title = cleanTitle(smartTitle(stripTitleNoise(tab.title || ''), url), hostname);
  title = title || url || '';

  const parsed = safeParseUrl(url);
  if (parsed?.hostname === 'localhost' && parsed.port) {
    title = `${parsed.port} ${title}`;
  }

  return {
    id: tab.id,
    windowId: tab.windowId,
    index: tab.index,
    groupId: tab.groupId,
    url,
    hostname,
    title,
    active: Boolean(tab.active),
    pinned: Boolean(tab.pinned),
    audible: Boolean(tab.audible),
    loading: tab.status === 'loading',
  };
}

function sortTabs(left, right) {
  if (left.windowId !== right.windowId) return left.windowId - right.windowId;
  return left.index - right.index;
}

function deriveAutoGroup(tab) {
  const parsed = safeParseUrl(tab.url);
  const hostname = tab.hostname || 'unknown';
  const canonicalHostname = canonicalizeGroupHostname(hostname);

  if (hostname === 'local-files') {
    return {
      key: 'local-files',
      kind: 'local-files',
      domainDisplay: 'file://',
      sortLabel: 'local-files',
    };
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
    const port = parsed?.port || '';
    const host = `${hostname}${port ? `:${port}` : ''}`;
    return {
      key: `localhost:${host || hostname}`,
      kind: 'localhost',
      port,
      host,
      domainDisplay: host || hostname,
      sortLabel: host || hostname,
    };
  }

  return {
    key: `domain:${canonicalHostname}`,
    kind: 'domain',
    domain: canonicalHostname,
    domainDisplay: canonicalHostname,
    sortLabel: (friendlyDomain(canonicalHostname) || canonicalHostname).toLowerCase(),
  };
}

function formatAutoGroupLabel(group) {
  switch (group.kind) {
    case 'local-files':
      return t('auto.localFiles');
    case 'localhost':
      return t('auto.localhost', { port: group.port, host: group.host || group.domainDisplay });
    default:
      return t('auto.domain', { name: friendlyDomain(group.domain) || group.domainDisplay });
  }
}

function metaLineForTab(tab) {
  const parts = [];

  if (tab.hostname === 'local-files') {
    parts.push(t('tab.localFile'));
  } else if (tab.hostname) {
    parts.push(tab.hostname.replace(/^www\./, ''));
  }

  return escapeHtml(parts.join(' · '));
}

function renderBadge(label, variant = 'neutral') {
  return `<span class="state-badge ${variant}">${escapeHtml(label)}</span>`;
}

function renderTabBadges(tab) {
  const badges = [];
  if (tab.active) badges.push(renderBadge(t('badge.active'), 'active'));
  if (tab.pinned) badges.push(renderBadge(t('badge.pinned'), 'quiet'));
  if (tab.audible) badges.push(renderBadge(t('badge.audio'), 'accent'));
  if (tab.loading) badges.push(renderBadge(t('badge.loading'), 'quiet'));
  return badges.join('');
}

function renderTabRow(tab) {
  return `
    <div class="tab-row">
      <button
        class="tab-focus"
        type="button"
        data-action="focus-tab"
        data-tab-id="${tab.id}"
        data-window-id="${tab.windowId}"
      >
        ${renderTabAvatar(tab)}
        <span class="tab-copy">
          <span class="tab-title">${escapeHtml(tab.title || t('fallback.untitledTab'))}</span>
          <span class="tab-meta-line">${metaLineForTab(tab)}</span>
        </span>
      </button>

      <div class="tab-row-right">
        <div class="tab-badges">${renderTabBadges(tab)}</div>
        <button
          class="icon-button"
          type="button"
          data-action="close-tab"
          data-tab-id="${tab.id}"
          title="${escapeHtml(t('button.closeTab'))}"
          aria-label="${escapeHtml(t('button.closeTab'))}"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function renderTabRows(tabs, limit = 5) {
  const visibleTabs = tabs.slice(0, limit);
  const hiddenTabs = tabs.slice(limit);
  const visibleHtml = visibleTabs.map(renderTabRow).join('');

  if (hiddenTabs.length === 0) return visibleHtml;

  return `
    ${visibleHtml}
    <div class="tab-overflow" hidden>${hiddenTabs.map(renderTabRow).join('')}</div>
    <button class="expand-button" type="button" data-action="expand-tabs">
      ${escapeHtml(t('button.showMore', { count: hiddenTabs.length }))}
    </button>
  `;
}

function renderMetaPill(label, variant = 'quiet') {
  return `<span class="meta-pill ${variant}">${escapeHtml(label)}</span>`;
}

function renderGroupCard(group) {
  const accent = COLOR_ACCENTS[group.color] || COLOR_ACCENTS.grey;
  const style = `--card-accent:${accent};--card-soft:${alphaColor(accent, 0.24)};--card-edge:${alphaColor(accent, 0.38)};`;
  const pills = [
    renderMetaPill(t('count.tabs', { count: group.tabs.length }), 'count'),
    renderMetaPill(t(`color.${group.color}`), 'accent'),
  ];

  if (group.collapsed) {
    pills.push(renderMetaPill(t('badge.collapsed'), 'quiet'));
  }

  const footnote = group.activeCount > 0
    ? t('count.activeTabs', { count: group.activeCount })
    : t('group.nativeFootnote');

  return `
    <section class="letter-group" style="${style}">
      <div class="letter-header">
        <div class="letter-title-block">
          <span class="color-dot" aria-hidden="true"></span>
          <div>
            <h3>${escapeHtml(group.title || t('fallback.untitledGroup'))}</h3>
            <p class="letter-caption">${escapeHtml(t('chromeGroup.caption'))}</p>
          </div>
        </div>
        <div class="letter-actions">
          <div class="letter-meta">${pills.join('')}</div>
          <button
            class="icon-button group-close-btn"
            type="button"
            data-action="close-group-tabs"
            data-tab-ids="${serializeIds(group.tabs.map(tab => tab.id))}"
            title="${escapeHtml(t('button.closeGroup'))}"
            aria-label="${escapeHtml(t('button.closeGroup'))}"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>
          </button>
        </div>
      </div>

      <div class="letter-body">
        <div class="tab-stack">${renderTabRows(group.tabs, 8)}</div>
      </div>
    </section>
  `;
}

function renderAutoGroupCard(group) {
  const style = `--card-accent:${group.palette.accent};--card-soft:${group.palette.soft};--card-edge:${group.palette.edge};`;
  const pills = [renderMetaPill(t('count.tabs', { count: group.tabs.length }), 'count')];

  if (group.activeCount > 0) {
    pills.push(renderMetaPill(t('count.activeTabs', { count: group.activeCount }), 'accent'));
  }

  return `
    <section class="letter-group" style="${style}">
      <div class="letter-header">
        <div class="letter-title-block">
          <h3>${escapeHtml(formatAutoGroupLabel(group))}</h3>
        </div>
        <div class="letter-actions">
          <div class="letter-meta">${pills.join('')}</div>
          <button
            class="icon-button group-close-btn"
            type="button"
            data-action="close-group-tabs"
            data-tab-ids="${serializeIds(group.tabs.map(tab => tab.id))}"
            title="${escapeHtml(t('button.closeCluster'))}"
            aria-label="${escapeHtml(t('button.closeCluster'))}"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>
          </button>
        </div>
      </div>

      <div class="letter-body">
        <div class="tab-stack">${renderTabRows(group.tabs, 10)}</div>
      </div>
    </section>
  `;
}

function getResolvedTheme() {
  if (state.themePreference === 'light' || state.themePreference === 'dark') {
    return state.themePreference;
  }
  return THEME_QUERY.matches ? 'dark' : 'light';
}

function getThemeLabel() {
  switch (state.themePreference) {
    case 'light':
      return t('theme.modeLight');
    case 'dark':
      return t('theme.modeDark');
    default:
      return t('theme.modeSystem');
  }
}

function alphaColor(hex, alpha) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized;

  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyTheme() {
  const resolvedTheme = getResolvedTheme();
  document.documentElement.dataset.theme = resolvedTheme;

  const toggleLabel = document.getElementById('themeToggleLabel');
  if (toggleLabel) {
    toggleLabel.textContent = getThemeLabel();
  }
}

function applyLocale() {
  const locale = getResolvedLocale();
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  document.title = t('app.title');

  setText('heroTitle', t('app.title'));
  setText('statTotalTabsLabel', t('stats.tabs'));
  setText('statTabGroupsLabel', t('stats.tabGroups'));
  setText('statAutoGroupsLabel', t('stats.autoGroups'));
  setText('localeToggleLabel', t('locale.target'));
  setText('localeToggleCode', locale === 'zh' ? '中' : 'EN');
  setText('tabGroupsKicker', t('section.tabGroups.kicker'));
  setText('autoGroupsKicker', t('section.autoGroups.kicker'));
  setText('tabGroupsEmptyTitle', t('empty.tabGroups.title'));
  setText('tabGroupsEmptyBody', t('empty.tabGroups.body'));
  setText('autoGroupsEmptyTitle', t('empty.autoGroups.title'));
  setText('autoGroupsEmptyBody', t('empty.autoGroups.body'));

  applyTheme();
  if (state.snapshot) renderDashboard(state.snapshot);
}

async function loadPreferences() {
  let needsThemeMigration = false;

  try {
    const stored = await chrome.storage.local.get([THEME_STORAGE_KEY, THEME_PREF_VERSION_KEY, LOCALE_STORAGE_KEY]);
    const storedTheme = stored[THEME_STORAGE_KEY];
    const storedThemeVersion = stored[THEME_PREF_VERSION_KEY];

    if (
      storedThemeVersion === THEME_PREF_VERSION &&
      (storedTheme === 'system' || storedTheme === 'light' || storedTheme === 'dark')
    ) {
      state.themePreference = storedTheme;
    } else {
      state.themePreference = 'system';
      needsThemeMigration = true;
    }

    state.localePreference = stored[LOCALE_STORAGE_KEY] || null;
  } catch {
    state.themePreference = 'system';
    state.localePreference = null;
  }

  if (needsThemeMigration) {
    try {
      await chrome.storage.local.set({
        [THEME_STORAGE_KEY]: 'system',
        [THEME_PREF_VERSION_KEY]: THEME_PREF_VERSION,
      });
    } catch {}
  }

  applyLocale();
}

async function toggleTheme() {
  const nextTheme = state.themePreference === 'system'
    ? 'dark'
    : state.themePreference === 'dark'
      ? 'light'
      : 'system';
  state.themePreference = nextTheme;
  applyTheme();

  try {
    await chrome.storage.local.set({
      [THEME_STORAGE_KEY]: nextTheme,
      [THEME_PREF_VERSION_KEY]: THEME_PREF_VERSION,
    });
  } catch {}
}

async function toggleLocale() {
  const nextLocale = getResolvedLocale() === 'zh' ? 'en' : 'zh';
  state.localePreference = nextLocale;
  applyLocale();

  try {
    await chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: nextLocale });
  } catch {}
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('visible');

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove('visible');
  }, 2200);
}

async function focusTab(tabId, windowId) {
  if (!Number.isInteger(tabId)) return;
  try {
    await chrome.tabs.update(tabId, { active: true });
    if (Number.isInteger(windowId)) {
      await chrome.windows.update(windowId, { focused: true });
    }
  } catch {
    requestRender();
  }
}

async function closeTabsByIds(tabIds) {
  const validIds = tabIds.filter(id => Number.isInteger(id));
  if (validIds.length === 0) return;

  try {
    await chrome.tabs.remove(validIds);
  } catch {
    requestRender();
  }
}

async function buildDashboardSnapshot() {
  const allTabs = (await chrome.tabs.query({ windowType: 'normal' }))
    .map(normalizeTab)
    .sort(sortTabs);
  const tabs = allTabs.filter(isVisibleTab);
  const duplicateCleanup = buildDuplicateCleanup(allTabs);

  const groupTabsById = new Map();
  const ungroupedTabs = [];

  for (const tab of tabs) {
    if (tab.groupId !== TAB_GROUP_NONE) {
      if (!groupTabsById.has(tab.groupId)) groupTabsById.set(tab.groupId, []);
      groupTabsById.get(tab.groupId).push(tab);
    } else {
      ungroupedTabs.push(tab);
    }
  }

  let chromeGroups = [];
  try {
    chromeGroups = await chrome.tabGroups.query({});
  } catch {
    chromeGroups = [];
  }

  const chromeGroupsById = new Map(chromeGroups.map(group => [group.id, group]));
  const tabGroups = [...groupTabsById.entries()]
    .map(([groupId, groupTabs]) => {
      const meta = chromeGroupsById.get(groupId);
      if (!meta || groupTabs.length === 0) return null;

      const sortedTabs = [...groupTabs].sort(sortTabs);
      return {
        id: groupId,
        title: meta.title?.trim() || '',
        color: meta.color || 'grey',
        collapsed: Boolean(meta.collapsed),
        windowId: meta.windowId,
        tabs: sortedTabs,
        activeCount: sortedTabs.filter(tab => tab.active).length,
        sortWindow: sortedTabs[0].windowId,
        sortIndex: sortedTabs[0].index,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left.sortWindow !== right.sortWindow) return left.sortWindow - right.sortWindow;
      return left.sortIndex - right.sortIndex;
    });

  const autoGroupsMap = new Map();

  for (const tab of ungroupedTabs) {
    const descriptor = deriveAutoGroup(tab);
    if (!autoGroupsMap.has(descriptor.key)) {
      autoGroupsMap.set(descriptor.key, {
        ...descriptor,
        palette: paletteForKey(descriptor.key),
        tabs: [],
        windowIds: new Set(),
        activeCount: 0,
      });
    }

    const group = autoGroupsMap.get(descriptor.key);
    group.tabs.push(tab);
    group.windowIds.add(tab.windowId);
    if (tab.active) group.activeCount += 1;
  }

  const autoGroups = [...autoGroupsMap.values()]
    .map(group => ({
      ...group,
      tabs: group.tabs.sort(sortTabs),
      label: formatAutoGroupLabel(group),
    }))
    .sort((left, right) => {
      if (right.activeCount !== left.activeCount) return right.activeCount - left.activeCount;
      if (right.tabs.length !== left.tabs.length) return right.tabs.length - left.tabs.length;
      return left.sortLabel.localeCompare(right.sortLabel);
    });

  return {
    totalTabs: tabs.length,
    groupedTabCount: tabGroups.reduce((count, group) => count + group.tabs.length, 0),
    ungroupedTabCount: ungroupedTabs.length,
    tabGroups,
    autoGroups,
    duplicateCleanup,
  };
}

function renderDashboard(snapshot) {
  state.snapshot = snapshot;

  setText('statTotalTabs', String(snapshot.totalTabs));
  setText('statTabGroups', String(snapshot.tabGroups.length));
  setText('statAutoGroups', String(snapshot.autoGroups.length));

  setText('tabGroupsSummary', t('summary.tabGroups', {
    groupCount: snapshot.tabGroups.length,
    tabCount: snapshot.groupedTabCount,
  }));
  setText('autoGroupsSummary', t('summary.autoGroups', {
    clusterCount: snapshot.autoGroups.length,
    tabCount: snapshot.ungroupedTabCount,
  }));

  const duplicateCleanupButton = document.getElementById('duplicateCleanupButton');
  const duplicateCleanupLabel = document.getElementById('duplicateCleanupLabel');
  const duplicateCleanupHint = document.getElementById('duplicateCleanupHint');
  if (duplicateCleanupButton && duplicateCleanupLabel && duplicateCleanupHint) {
    const duplicateCleanup = snapshot.duplicateCleanup;
    const hasDuplicates = duplicateCleanup.count > 0;

    duplicateCleanupButton.hidden = !hasDuplicates;
    duplicateCleanupHint.hidden = !hasDuplicates || duplicateCleanup.tabKillerTotalCount <= 1;

    if (hasDuplicates) {
      const summary = t('duplicates.summary', {
        count: duplicateCleanup.count,
        groupCount: duplicateCleanup.groupCount,
      });

      setText('duplicateCleanupLabel', t('duplicates.cleanupCta', { count: duplicateCleanup.count }));
      duplicateCleanupButton.dataset.tabIds = serializeIds(duplicateCleanup.closeIds);
      duplicateCleanupButton.title = summary;
      duplicateCleanupButton.setAttribute('aria-label', summary);

      if (duplicateCleanup.tabKillerTotalCount > 1) {
        setText('duplicateCleanupHint', t('duplicates.tabKillerHint', {
          count: duplicateCleanup.tabKillerTotalCount,
        }));
      }
    } else {
      delete duplicateCleanupButton.dataset.tabIds;
      duplicateCleanupButton.removeAttribute('title');
      duplicateCleanupButton.removeAttribute('aria-label');
      duplicateCleanupHint.textContent = '';
    }
  }

  const tabGroupsGrid = document.getElementById('tabGroupsGrid');
  const tabGroupsEmpty = document.getElementById('tabGroupsEmpty');
  if (tabGroupsGrid && tabGroupsEmpty) {
    if (snapshot.tabGroups.length > 0) {
      tabGroupsGrid.innerHTML = snapshot.tabGroups.map(renderGroupCard).join('');
      tabGroupsEmpty.hidden = true;
    } else {
      tabGroupsGrid.innerHTML = '';
      tabGroupsEmpty.hidden = false;
    }
  }

  const autoGroupsGrid = document.getElementById('autoGroupsGrid');
  const autoGroupsEmpty = document.getElementById('autoGroupsEmpty');
  if (autoGroupsGrid && autoGroupsEmpty) {
    if (snapshot.autoGroups.length > 0) {
      autoGroupsGrid.innerHTML = snapshot.autoGroups.map(renderAutoGroupCard).join('');
      autoGroupsEmpty.hidden = true;
    } else {
      autoGroupsGrid.innerHTML = '';
      autoGroupsEmpty.hidden = false;
    }
  }
}

async function refreshDashboard() {
  if (renderRunning) {
    rerenderRequested = true;
    return;
  }

  renderRunning = true;

  try {
    const snapshot = await buildDashboardSnapshot();
    renderDashboard(snapshot);
  } catch (error) {
    console.error('[tab-out] failed to render dashboard', error);
    showToast(t('toast.refreshError'));
  } finally {
    renderRunning = false;
    if (rerenderRequested) {
      rerenderRequested = false;
      requestRender();
    }
  }
}

function requestRender() {
  if (renderScheduled) return;
  renderScheduled = true;

  window.setTimeout(() => {
    renderScheduled = false;
    refreshDashboard();
  }, 80);
}

function bindChromeListeners() {
  chrome.tabs.onCreated.addListener(requestRender);
  chrome.tabs.onRemoved.addListener(requestRender);
  chrome.tabs.onMoved.addListener(requestRender);
  chrome.tabs.onAttached.addListener(requestRender);
  chrome.tabs.onDetached.addListener(requestRender);
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (
      'status' in changeInfo ||
      'title' in changeInfo ||
      'url' in changeInfo ||
      'favIconUrl' in changeInfo ||
      'groupId' in changeInfo ||
      'audible' in changeInfo ||
      'pinned' in changeInfo
    ) {
      requestRender();
    }
  });

  chrome.tabGroups.onCreated.addListener(requestRender);
  chrome.tabGroups.onMoved.addListener(requestRender);
  chrome.tabGroups.onRemoved.addListener(requestRender);
  chrome.tabGroups.onUpdated.addListener(requestRender);
}

function bindUiListeners() {
  document.addEventListener('click', async event => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.dataset.action;

    if (action === 'toggle-theme') {
      await toggleTheme();
      return;
    }

    if (action === 'toggle-locale') {
      await toggleLocale();
      return;
    }

    if (action === 'expand-tabs') {
      const overflow = actionEl.previousElementSibling;
      if (overflow?.classList.contains('tab-overflow')) {
        overflow.hidden = false;
        actionEl.remove();
      }
      return;
    }

    if (action === 'focus-tab') {
      const tabId = Number(actionEl.dataset.tabId);
      const windowId = Number(actionEl.dataset.windowId);
      await focusTab(tabId, windowId);
      return;
    }

    if (action === 'close-tab') {
      const tabId = Number(actionEl.dataset.tabId);
      await closeTabsByIds([tabId]);
      showToast(t('toast.closedTab'));
      requestRender();
      return;
    }

    if (action === 'close-duplicate-tabs') {
      const ids = parseIds(actionEl.dataset.tabIds || state.snapshot?.duplicateCleanup?.closeIds);
      if (ids.length === 0) return;
      await closeTabsByIds(ids);
      showToast(t('toast.closedTabs', { count: ids.length }));
      requestRender();
      return;
    }

    if (action === 'close-group-tabs') {
      const ids = parseIds(actionEl.dataset.tabIds);
      await closeTabsByIds(ids);
      showToast(t('toast.closedTabs', { count: ids.length }));
      requestRender();
    }
  });

  document.addEventListener('error', event => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    if (!target.matches('.tab-favicon')) return;
    target.remove();
  }, true);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) requestRender();
  });

  THEME_QUERY.addEventListener('change', () => {
    if (state.themePreference === 'system') applyTheme();
  });
}

async function init() {
  await loadPreferences();
  bindChromeListeners();
  bindUiListeners();
  await refreshDashboard();
}

init();
