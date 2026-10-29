'use strict';

const TAB_GROUP_NONE = chrome.tabGroups.TAB_GROUP_ID_NONE;
const THEME_STORAGE_KEY = 'themePreference';
const THEME_PREF_VERSION_KEY = 'themePreferenceVersion';
const THEME_PREF_VERSION = 2;
const LOCALE_STORAGE_KEY = 'localePreference';
const VIEW_STORAGE_KEY = 'viewPreference';
const RULES_STORAGE_KEY = 'groupRules';
const RULE_SAVE_DELAY_MS = 250;
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

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const IDLE_AFTER_MS = 7 * DAY_MS;
const STALE_AFTER_MS = 30 * DAY_MS;
const SECTION_ROW_LIMIT = 12;
const LEAVE_ANIMATION_MS = 160;

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
    'status.tabs': ({ count }) => `${count} tab${plural(count)} open`,
    'status.idle': ({ count }) => `${count} idle 7d+`,
    'status.duplicates': ({ count }) => `${count} duplicate${plural(count)}`,
    'search.placeholder': 'Search tabs',
    'search.results': ({ count }) => `${count} match${count === 1 ? '' : 'es'}`,
    'button.parkIdle': ({ count }) => `Park ${count} idle`,
    'duplicates.cleanupCta': ({ count }) => `Close ${count} duplicate${plural(count)}`,
    'duplicates.summary': ({ count, groupCount }) => `${count} duplicate tab${plural(count)} across ${groupCount} link${plural(groupCount)}`,
    'settings.label': 'Settings',
    'settings.theme': 'Appearance',
    'settings.language': 'Language',
    'theme.system': 'System',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'view.groups': 'By group',
    'view.idle': 'By last used',
    'section.chromeGroup': 'Chrome group',
    'section.dev': 'Dev servers',
    'section.misc': 'Other sites',
    'bucket.today': 'Used today',
    'bucket.week': 'Used this week',
    'bucket.idle': 'Idle 7 days+',
    'bucket.stale': 'Idle 30 days+',
    'bucket.unknown': 'No usage data',
    'empty.board.title': 'No web pages open',
    'empty.board.body': 'Open a few pages and they show up here, grouped and sorted by when you last used them.',
    'empty.search.title': ({ query }) => `Nothing matches "${query}"`,
    'empty.search.body': 'Search looks at titles and URLs. Press Esc to clear.',
    'fallback.untitledTab': 'Untitled tab',
    'fallback.untitledGroup': 'Untitled group',
    'badge.active': 'Active',
    'badge.pinned': 'Pinned',
    'badge.audio': 'Audio',
    'badge.duplicate': ({ count }) => `${count}x`,
    'button.park': 'Park',
    'button.parkTab': 'Park tab',
    'button.copy': 'Copy as Markdown',
    'button.closeTab': 'Close tab',
    'button.closeAll': 'Close all',
    'button.showMore': ({ count }) => `Show ${count} more`,
    'age.now': 'now',
    'age.minutes': ({ count }) => `${count}m`,
    'age.hours': ({ count }) => `${count}h`,
    'age.days': ({ count }) => `${count}d`,
    'age.weeks': ({ count }) => `${count}w`,
    'ago.now': 'just now',
    'ago.value': ({ age }) => `${age} ago`,
    'tab.lastUsed': ({ ago }) => `Last used ${ago}`,
    'tab.localFile': 'Local file',
    'rail.title': 'Parked',
    'rail.emptyTitle': 'Nothing parked',
    'rail.emptyBody': 'Park a group, a window, or your idle tabs. They close, wait here, and come back with one click.',
    'session.window': ({ time }) => `Window, ${time}`,
    'session.idle': 'Idle tabs',
    'session.meta': ({ count, ago }) => `${count} tab${plural(count)} · ${ago}`,
    'session.restore': 'Restore',
    'session.delete': 'Delete',
    'session.showLinks': 'Show links',
    'toast.parked': ({ count }) => `Parked ${count} tab${plural(count)}`,
    'toast.parkedWindow': ({ count }) => `Parked this window: ${count} tab${plural(count)}`,
    'toast.restored': ({ count }) => `Restored ${count} tab${plural(count)}`,
    'toast.copied': ({ count }) => `Copied ${count} link${plural(count)} as Markdown`,
    'toast.copyError': 'Clipboard is unavailable. Click the page and try again.',
    'toast.deleted': 'Parked session deleted',
    'toast.saveError': 'Could not save the session, so nothing was closed.',
    'toast.restoreError': 'Could not reopen those tabs. The session is still here.',
    'toast.undo': 'Undo',
    'toast.closedTab': 'Tab closed',
    'toast.closedTabs': ({ count }) => `Closed ${count} tab${plural(count)}`,
    'toast.refreshError': 'Could not read your tabs. Reload this page.',
    'keys.search': 'search',
    'keys.move': 'move',
    'keys.open': 'open',
    'keys.park': 'park',
    'keys.close': 'close',
    'keys.copy': 'copy',
    'keys.view': 'switch view',
    'auto.localFiles': 'Local Files',
    'auto.domain': ({ name }) => name,
    'rules.open': 'Group rules',
    'rules.title': 'Group rules',
    'rules.hint': 'One URL per line: a domain (claude.ai, subdomains included), a path (github.com/anthropics), or a wildcard (*.google.com/document). Matching tabs go to that group; the top rule wins. Chrome tab groups are left as they are.',
    'rules.add': 'New group',
    'rules.untitled': 'Untitled group',
    'rules.namePlaceholder': 'Group name',
    'rules.patternsPlaceholder': 'claude.ai\nchatgpt.com',
    'rules.patternsLabel': 'URL rules, one per line',
    'rules.matches': ({ count }) => `${count} tab${plural(count)}`,
    'rules.empty': 'No custom groups yet. Create one to pull related sites, like every AI tool or every doc for one project, into a single section.',
    'rules.moveUp': 'Move up',
    'rules.moveDown': 'Move down',
    'rules.delete': 'Delete group',
    'rules.color': ({ color }) => `Color: ${color}`,
    'rules.close': 'Close',
    'toast.ruleDeleted': ({ name }) => `Deleted group "${name}"`,
    'color.grey': 'grey',
    'color.blue': 'blue',
    'color.red': 'red',
    'color.yellow': 'yellow',
    'color.green': 'green',
    'color.pink': 'pink',
    'color.purple': 'purple',
    'color.cyan': 'cyan',
    'color.orange': 'orange',
  },
  zh: {
    'app.title': 'Tab Killer',
    'status.tabs': ({ count }) => `${count} 个标签页`,
    'status.idle': ({ count }) => `${count} 个闲置超过 7 天`,
    'status.duplicates': ({ count }) => `${count} 个重复`,
    'search.placeholder': '搜索标签页',
    'search.results': ({ count }) => `${count} 个结果`,
    'button.parkIdle': ({ count }) => `暂存 ${count} 个闲置`,
    'duplicates.cleanupCta': ({ count }) => `关闭 ${count} 个重复`,
    'duplicates.summary': ({ count, groupCount }) => `${count} 个重复标签，涉及 ${groupCount} 个链接`,
    'settings.label': '设置',
    'settings.theme': '外观',
    'settings.language': '语言',
    'theme.system': '跟随系统',
    'theme.light': '浅色',
    'theme.dark': '深色',
    'view.groups': '按分组',
    'view.idle': '按闲置时间',
    'section.chromeGroup': 'Chrome 标签组',
    'section.dev': '本地开发',
    'section.misc': '其他站点',
    'bucket.today': '今天用过',
    'bucket.week': '本周用过',
    'bucket.idle': '闲置 7 天以上',
    'bucket.stale': '闲置 30 天以上',
    'bucket.unknown': '没有使用记录',
    'empty.board.title': '没有打开的网页',
    'empty.board.body': '打开几个网页后，它们会按分组和最后使用时间出现在这里。',
    'empty.search.title': ({ query }) => `没有匹配“${query}”的标签页`,
    'empty.search.body': '搜索范围是标题和网址。按 Esc 清空。',
    'fallback.untitledTab': '未命名标签页',
    'fallback.untitledGroup': '未命名标签组',
    'badge.active': '当前',
    'badge.pinned': '固定',
    'badge.audio': '播放中',
    'badge.duplicate': ({ count }) => `${count} 份`,
    'button.park': '暂存',
    'button.parkTab': '暂存标签页',
    'button.copy': '复制为 Markdown',
    'button.closeTab': '关闭标签页',
    'button.closeAll': '全部关闭',
    'button.showMore': ({ count }) => `展开剩余 ${count} 个`,
    'age.now': '刚刚',
    'age.minutes': ({ count }) => `${count} 分钟`,
    'age.hours': ({ count }) => `${count} 小时`,
    'age.days': ({ count }) => `${count} 天`,
    'age.weeks': ({ count }) => `${count} 周`,
    'ago.now': '刚刚',
    'ago.value': ({ age }) => `${age}前`,
    'tab.lastUsed': ({ ago }) => `最后使用：${ago}`,
    'tab.localFile': '本地文件',
    'rail.title': '暂存',
    'rail.emptyTitle': '还没有暂存',
    'rail.emptyBody': '把一个分组、一个窗口或闲置标签页暂存起来。它们会被关闭并留在这里，一键就能恢复。',
    'session.window': ({ time }) => `窗口 · ${time}`,
    'session.idle': '闲置标签页',
    'session.meta': ({ count, ago }) => `${count} 个 · ${ago}`,
    'session.restore': '恢复',
    'session.delete': '删除',
    'session.showLinks': '查看链接',
    'toast.parked': ({ count }) => `已暂存 ${count} 个标签页`,
    'toast.parkedWindow': ({ count }) => `已暂存这个窗口的 ${count} 个标签页`,
    'toast.restored': ({ count }) => `已恢复 ${count} 个标签页`,
    'toast.copied': ({ count }) => `已复制 ${count} 个链接为 Markdown`,
    'toast.copyError': '无法写入剪贴板，点一下页面再试。',
    'toast.deleted': '已删除这条暂存',
    'toast.saveError': '保存失败，没有关闭任何标签页。',
    'toast.restoreError': '没能重新打开这些标签页，暂存还在。',
    'toast.undo': '撤销',
    'toast.closedTab': '已关闭标签页',
    'toast.closedTabs': ({ count }) => `已关闭 ${count} 个标签页`,
    'toast.refreshError': '读取标签页失败，请刷新页面。',
    'keys.search': '搜索',
    'keys.move': '移动',
    'keys.open': '打开',
    'keys.park': '暂存',
    'keys.close': '关闭',
    'keys.copy': '复制',
    'keys.view': '切换视图',
    'auto.localFiles': '本地文件',
    'auto.domain': ({ name }) => name,
    'rules.open': '分组规则',
    'rules.title': '分组规则',
    'rules.hint': '每行一条网址：写域名（claude.ai，含子域名）、带路径（github.com/anthropics）或用 * 通配（*.google.com/document）。命中的标签归到这个分组，同时命中多条时上面的分组优先。Chrome 原生标签组不受影响。',
    'rules.add': '新建分组',
    'rules.untitled': '未命名分组',
    'rules.namePlaceholder': '分组名',
    'rules.patternsPlaceholder': 'claude.ai\nchatgpt.com',
    'rules.patternsLabel': '网址规则，每行一条',
    'rules.matches': ({ count }) => `命中 ${count} 个`,
    'rules.empty': '还没有自定义分组。新建一个，把相关的网站归到一起，比如所有 AI 工具，或者某个项目的全部文档。',
    'rules.moveUp': '上移',
    'rules.moveDown': '下移',
    'rules.delete': '删除分组',
    'rules.color': ({ color }) => `颜色：${color}`,
    'rules.close': '关闭',
    'toast.ruleDeleted': ({ name }) => `已删除分组「${name}」`,
    'color.grey': '灰色',
    'color.blue': '蓝色',
    'color.red': '红色',
    'color.yellow': '黄色',
    'color.green': '绿色',
    'color.pink': '粉色',
    'color.purple': '紫色',
    'color.cyan': '青色',
    'color.orange': '橙色',
  },
};

const ICONS = {
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"></path></svg>',
  park: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h11M12 7l5 5-5 5M20 5v14"></path></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 5H7a2 2 0 0 0-2 2v9"></path></svg>',
  restore: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H8M12 7l-5 5 5 5M4 5v14"></path></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"></path></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14l5-5 5 5"></path></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"></path></svg>',
};

const state = {
  localePreference: null,
  themePreference: 'system',
  view: 'groups',
  query: '',
  snapshot: null,
  sections: new Map(),
  expandedSections: new Set(),
  sessions: [],
  expandedSessions: new Set(),
  highlightSessionId: null,
  rules: [],
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
  return `<img class="tab-favicon" src="${escapeHtml(faviconUrl)}" alt="" width="16" height="16">`;
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

function isLocalDevHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname.endsWith('.local');
}

function getHostname(url) {
  if (!url) return '';
  if (url.startsWith('file://')) return 'local-files';
  const parsed = safeParseUrl(url);
  return parsed?.hostname || '';
}

function getHostDisplay(url, hostname) {
  if (hostname === 'local-files') return 'file://';
  const parsed = safeParseUrl(url);
  if (!parsed) return hostname;
  return parsed.host.replace(/^www\./, '');
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

  for (const tab of tabs) {
    if (!isDuplicateCandidateTab(tab)) continue;

    const duplicateUrl = normalizeDuplicateUrl(tab.url);
    if (!duplicateUrl) continue;

    if (!duplicatesByUrl.has(duplicateUrl)) duplicatesByUrl.set(duplicateUrl, []);
    duplicatesByUrl.get(duplicateUrl).push(tab);
  }

  let groupCount = 0;
  const closeIds = [];
  const countByUrl = new Map();

  for (const [duplicateUrl, groupTabs] of duplicatesByUrl.entries()) {
    if (groupTabs.length < 2) continue;

    groupCount += 1;
    countByUrl.set(duplicateUrl, groupTabs.length);
    const orderedTabs = [...groupTabs].sort(compareDuplicateTabs);
    closeIds.push(...orderedTabs.slice(1).map(tab => tab.id));
  }

  return {
    count: closeIds.length,
    closeIds,
    groupCount,
    countByUrl,
  };
}

function normalizeTab(tab) {
  const url = tab.url || tab.pendingUrl || '';
  const hostname = getHostname(url);
  let title = cleanTitle(smartTitle(stripTitleNoise(tab.title || ''), url), hostname);
  title = title || url || '';

  return {
    id: tab.id,
    windowId: tab.windowId,
    index: tab.index,
    groupId: tab.groupId,
    url,
    hostname,
    hostDisplay: getHostDisplay(url, hostname),
    title,
    // Title cleanup strips site suffixes like "| MDN", so search also covers the friendly site name.
    searchText: `${title} ${url} ${friendlyDomain(hostname)}`.toLowerCase(),
    matchTarget: getMatchTarget(url),
    active: Boolean(tab.active),
    pinned: Boolean(tab.pinned),
    audible: Boolean(tab.audible),
    // Chrome 121+ reports when the tab was last focused; older builds leave it undefined.
    lastAccessed: Number.isFinite(tab.lastAccessed) ? tab.lastAccessed : null,
    duplicateCount: 1,
  };
}

function sortTabs(left, right) {
  if (left.windowId !== right.windowId) return left.windowId - right.windowId;
  return left.index - right.index;
}

function sortByLastUsed(left, right) {
  return (right.lastAccessed ?? 0) - (left.lastAccessed ?? 0) || sortTabs(left, right);
}

function tabAge(tab, now) {
  if (tab.active) return 0;
  if (tab.lastAccessed === null) return null;
  return Math.max(0, now - tab.lastAccessed);
}

function freshnessOf(age) {
  if (age === null) return 'unknown';
  if (age < DAY_MS) return 'fresh';
  if (age < IDLE_AFTER_MS) return 'warm';
  if (age < STALE_AFTER_MS) return 'idle';
  return 'stale';
}

function isIdleTab(tab, now) {
  if (tab.pinned || tab.audible || tab.active) return false;
  const age = tabAge(tab, now);
  return age !== null && age >= IDLE_AFTER_MS;
}

function formatAge(age) {
  if (age === null) return '';
  if (age < MINUTE_MS) return t('age.now');
  if (age < HOUR_MS) return t('age.minutes', { count: Math.floor(age / MINUTE_MS) });
  if (age < DAY_MS) return t('age.hours', { count: Math.floor(age / HOUR_MS) });
  if (age < 14 * DAY_MS) return t('age.days', { count: Math.floor(age / DAY_MS) });
  return t('age.weeks', { count: Math.floor(age / (7 * DAY_MS)) });
}

function formatAgo(timestamp, now = Date.now()) {
  const age = Math.max(0, now - timestamp);
  if (age < MINUTE_MS) return t('ago.now');
  return t('ago.value', { age: formatAge(age) });
}

function deriveAutoGroup(tab) {
  const hostname = tab.hostname || 'unknown';

  if (hostname === 'local-files') {
    return { key: 'local-files', kind: 'local-files', caption: 'file://', sortLabel: 'local-files' };
  }

  if (isLocalDevHost(hostname)) {
    return { key: 'dev', kind: 'dev', caption: 'localhost', sortLabel: 'localhost' };
  }

  const domain = hostname.replace(/^www\./, '');
  return {
    key: `domain:${domain}`,
    kind: 'domain',
    domain,
    caption: domain,
    sortLabel: (friendlyDomain(domain) || domain).toLowerCase(),
  };
}

function formatAutoGroupLabel(group) {
  switch (group.kind) {
    case 'local-files':
      return t('auto.localFiles');
    case 'dev':
      return t('section.dev');
    case 'misc':
      return t('section.misc');
    default:
      return t('auto.domain', { name: friendlyDomain(group.domain) || group.domain });
  }
}

function matchesQuery(tab, query) {
  if (!query) return true;
  return tab.searchText.includes(query);
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

// ─── Snapshot ────────────────────────────────────────────────────────────────

async function buildDashboardSnapshot() {
  const now = Date.now();
  const allTabs = (await chrome.tabs.query({ windowType: 'normal' }))
    .map(normalizeTab)
    .sort(sortTabs);
  const tabs = allTabs.filter(isVisibleTab);
  const duplicateCleanup = buildDuplicateCleanup(allTabs);

  for (const tab of tabs) {
    tab.duplicateCount = duplicateCleanup.countByUrl.get(normalizeDuplicateUrl(tab.url)) || 1;
  }

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

      return {
        id: groupId,
        title: meta.title?.trim() || '',
        color: meta.color || 'grey',
        tabs: groupTabs,
        sortWindow: groupTabs[0].windowId,
        sortIndex: groupTabs[0].index,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left.sortWindow !== right.sortWindow) return left.sortWindow - right.sortWindow;
      return left.sortIndex - right.sortIndex;
    });

  return {
    now,
    tabs,
    tabGroups,
    ungroupedTabs,
    duplicateCleanup,
    idleTabs: tabs.filter(tab => isIdleTab(tab, now)),
  };
}

// ─── Custom group rules ──────────────────────────────────────────────────────
//
// A rule is { id, name, color, patterns: string[] }. A pattern is one of:
//   claude.ai               the host and its subdomains
//   localhost:3000          a host with a port
//   github.com/anthropics   a host plus a path prefix
//   *.google.com/document   a wildcard, matched against host + path from the start

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compilePattern(raw) {
  const pattern = String(raw || '').trim().toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
  if (!pattern) return null;

  if (pattern.includes('*')) {
    const regex = new RegExp(`^${pattern.split('*').map(escapeRegExp).join('.*')}(?:[/?#]|$)`);
    return target => regex.test(target.full);
  }

  const slash = pattern.indexOf('/');
  const host = slash === -1 ? pattern : pattern.slice(0, slash);
  const path = slash === -1 ? '' : pattern.slice(slash);
  // "claude.ai" also covers its subdomains, but a bare word like "ai" must not match every .ai site.
  const coversSubdomains = host.includes('.');

  return target => {
    const candidate = host.includes(':') ? target.hostWithPort : target.hostname;
    const hostMatches = candidate === host || (coversSubdomains && candidate.endsWith(`.${host}`));
    if (!hostMatches) return false;
    return !path || target.path === path || target.path.startsWith(`${path}/`);
  };
}

function getMatchTarget(url) {
  const parsed = safeParseUrl(url);
  if (!parsed || !['http:', 'https:'].includes(parsed.protocol)) return null;

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const hostWithPort = parsed.host.toLowerCase().replace(/^www\./, '');
  const path = parsed.pathname.toLowerCase().replace(/\/+$/, '');
  return { hostname, hostWithPort, path, full: `${hostWithPort}${path}${parsed.search.toLowerCase()}` };
}

// The first rule that matches wins, so the order of rules is their priority.
function assignRuleGroups(tabs, rules) {
  const compiled = rules.map(rule => ({
    rule,
    matchers: rule.patterns.map(compilePattern).filter(Boolean),
    tabs: [],
  }));
  const unmatched = [];

  for (const tab of tabs) {
    const target = tab.matchTarget;
    const owner = target && compiled.find(entry => entry.matchers.some(matcher => matcher(target)));
    if (owner) owner.tabs.push(tab);
    else unmatched.push(tab);
  }

  return {
    ruleGroups: compiled.filter(entry => entry.tabs.length > 0),
    countsById: new Map(compiled.map(entry => [entry.rule.id, entry.tabs.length])),
    unmatched,
  };
}

function sanitizeRules(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(rule => rule && typeof rule.id === 'string')
    .map(rule => ({
      id: rule.id,
      name: String(rule.name || ''),
      color: COLOR_ACCENTS[rule.color] ? rule.color : 'grey',
      patterns: Array.isArray(rule.patterns) ? rule.patterns.map(String) : [],
    }));
}

function buildAutoGroups(tabs) {
  const autoGroupsMap = new Map();

  for (const tab of tabs) {
    const descriptor = deriveAutoGroup(tab);
    if (!autoGroupsMap.has(descriptor.key)) {
      autoGroupsMap.set(descriptor.key, { ...descriptor, tabs: [], activeCount: 0 });
    }

    const group = autoGroupsMap.get(descriptor.key);
    group.tabs.push(tab);
    if (tab.active) group.activeCount += 1;
  }

  // A site with one tab gets no header of its own: those rows share an "Other sites" section.
  const singleSiteTabs = [];
  for (const [key, group] of autoGroupsMap.entries()) {
    if (group.kind === 'domain' && group.tabs.length === 1) {
      singleSiteTabs.push(group.tabs[0]);
      autoGroupsMap.delete(key);
    }
  }

  const autoGroups = [...autoGroupsMap.values()]
    .map(group => {
      if (group.kind === 'dev') {
        group.tabs.sort((left, right) => left.hostDisplay.localeCompare(right.hostDisplay, undefined, { numeric: true }));
      }
      return group;
    })
    .sort((left, right) => {
      // Dev servers sit right under the native groups: they are the tabs tied to work in progress.
      if ((left.kind === 'dev') !== (right.kind === 'dev')) return left.kind === 'dev' ? -1 : 1;
      if (right.activeCount !== left.activeCount) return right.activeCount - left.activeCount;
      if (right.tabs.length !== left.tabs.length) return right.tabs.length - left.tabs.length;
      return left.sortLabel.localeCompare(right.sortLabel);
    });

  if (singleSiteTabs.length > 0) {
    autoGroups.push({ key: 'misc', kind: 'misc', caption: '', sortLabel: '', tabs: singleSiteTabs.sort(sortTabs), activeCount: 0 });
  }

  return autoGroups;
}

function buildSections(snapshot) {
  const match = tab => matchesQuery(tab, state.query);

  if (state.view === 'idle') {
    const buckets = [
      { key: 'bucket:today', title: t('bucket.today'), freshness: ['fresh'], tabs: [] },
      { key: 'bucket:week', title: t('bucket.week'), freshness: ['warm'], tabs: [] },
      { key: 'bucket:idle', title: t('bucket.idle'), freshness: ['idle'], tabs: [] },
      { key: 'bucket:stale', title: t('bucket.stale'), freshness: ['stale'], tabs: [] },
      { key: 'bucket:unknown', title: t('bucket.unknown'), freshness: ['unknown'], tabs: [] },
    ];

    for (const tab of snapshot.tabs) {
      if (!match(tab)) continue;
      const freshness = freshnessOf(tabAge(tab, snapshot.now));
      buckets.find(bucket => bucket.freshness.includes(freshness)).tabs.push(tab);
    }

    return buckets
      .filter(bucket => bucket.tabs.length > 0)
      .map(bucket => ({
        key: bucket.key,
        kind: 'bucket',
        title: bucket.title,
        caption: '',
        tone: bucket.freshness[0],
        tabs: bucket.tabs.sort(sortByLastUsed),
        park: { kind: 'idle', label: bucket.title },
      }));
  }

  const { ruleGroups, unmatched } = assignRuleGroups(snapshot.ungroupedTabs, state.rules);

  const sections = [
    ...snapshot.tabGroups.map(group => {
      const title = group.title || t('fallback.untitledGroup');
      return {
        key: `group:${group.id}`,
        kind: 'group',
        title,
        caption: t('section.chromeGroup'),
        accent: COLOR_ACCENTS[group.color] || COLOR_ACCENTS.grey,
        tabs: group.tabs.filter(match),
        park: { kind: 'group', label: title, color: group.color },
      };
    }),
    ...ruleGroups.map(({ rule, tabs }) => {
      const title = rule.name.trim() || t('rules.untitled');
      return {
        key: `rule:${rule.id}`,
        kind: 'rule',
        title,
        caption: '',
        accent: COLOR_ACCENTS[rule.color] || COLOR_ACCENTS.grey,
        tabs: tabs.filter(match),
        park: { kind: 'domain', label: title, color: rule.color },
      };
    }),
    ...buildAutoGroups(unmatched).map(group => {
      const title = formatAutoGroupLabel(group);
      return {
        key: group.key,
        kind: group.kind,
        title,
        caption: title.toLowerCase() === group.caption.toLowerCase() ? '' : group.caption,
        tone: group.kind === 'dev' ? 'dev' : '',
        tabs: group.tabs.filter(match),
        park: { kind: 'domain', label: title },
      };
    }),
  ];

  return sections.filter(section => section.tabs.length > 0);
}

// ─── Rendering: board ────────────────────────────────────────────────────────

function renderTag(label, variant = '') {
  return `<span class="tag ${variant}">${escapeHtml(label)}</span>`;
}

function renderTabTags(tab) {
  const tags = [];
  if (tab.active) tags.push(renderTag(t('badge.active'), 'is-active'));
  if (tab.duplicateCount > 1) tags.push(renderTag(t('badge.duplicate', { count: tab.duplicateCount }), 'is-duplicate'));
  if (tab.pinned) tags.push(renderTag(t('badge.pinned')));
  if (tab.audible) tags.push(renderTag(t('badge.audio')));
  return tags.join('');
}

function renderIconButton({ action, icon, label, variant = '', data = '' }) {
  return `
    <button class="icon-button ${variant}" type="button" data-action="${action}" ${data}
      title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${ICONS[icon]}</button>
  `;
}

function renderTabRow(tab, now) {
  const age = tabAge(tab, now);
  const freshness = freshnessOf(age);
  const ageLabel = formatAge(age);
  const lastUsed = age === null ? '' : t('tab.lastUsed', { ago: age < MINUTE_MS ? t('ago.now') : t('ago.value', { age: ageLabel }) });
  const host = tab.hostname === 'local-files' ? t('tab.localFile') : tab.hostDisplay;
  const tabData = `data-tab-id="${tab.id}"`;

  return `
    <div class="tab-row is-${freshness}" ${tabData}>
      <button class="tab-focus" type="button" data-action="focus-tab" ${tabData}
        data-window-id="${tab.windowId}" title="${escapeHtml(tab.url)}">
        ${renderTabAvatar(tab)}
        <span class="tab-title">${escapeHtml(tab.title || t('fallback.untitledTab'))}</span>
        <span class="tab-tags">${renderTabTags(tab)}</span>
      </button>
      <span class="tab-host">${escapeHtml(host)}</span>
      <span class="tab-age" title="${escapeHtml(lastUsed)}">
        <span class="age-dot" aria-hidden="true"></span>${escapeHtml(ageLabel)}
      </span>
      <div class="row-actions">
        ${renderIconButton({ action: 'park-tab', icon: 'park', label: t('button.parkTab'), data: tabData })}
        ${renderIconButton({ action: 'close-tab', icon: 'close', label: t('button.closeTab'), variant: 'is-danger', data: tabData })}
      </div>
    </div>
  `;
}

function renderSection(section, now) {
  const expanded = state.query || state.expandedSections.has(section.key);
  const visibleTabs = expanded ? section.tabs : section.tabs.slice(0, SECTION_ROW_LIMIT);
  const hiddenCount = section.tabs.length - visibleTabs.length;
  const style = section.accent
    ? ` style="--section-accent:${section.accent};--section-ring:${alphaColor(section.accent, 0.28)};"`
    : '';
  const sectionData = `data-section-key="${escapeHtml(section.key)}"`;

  return `
    <section class="board-section tone-${section.tone || 'plain'}" ${sectionData}${style}>
      <header class="section-head">
        <span class="section-dot" aria-hidden="true"></span>
        <h2 class="section-title">${escapeHtml(section.title)}</h2>
        ${section.caption ? `<span class="section-caption">${escapeHtml(section.caption)}</span>` : ''}
        <span class="section-count">${section.tabs.length}</span>
        <div class="section-actions">
          <button class="text-button" type="button" data-action="park-section" ${sectionData}>
            ${ICONS.park}<span>${escapeHtml(t('button.park'))}</span>
          </button>
          ${renderIconButton({ action: 'copy-section', icon: 'copy', label: t('button.copy'), data: sectionData })}
          ${renderIconButton({ action: 'close-section', icon: 'close', label: t('button.closeAll'), variant: 'is-danger', data: sectionData })}
        </div>
      </header>
      <div class="section-rows">${visibleTabs.map(tab => renderTabRow(tab, now)).join('')}</div>
      ${hiddenCount > 0 ? `
        <button class="more-button" type="button" data-action="show-more" ${sectionData}>
          ${escapeHtml(t('button.showMore', { count: hiddenCount }))}
        </button>
      ` : ''}
    </section>
  `;
}

function renderTopbar(snapshot) {
  const parts = [`<span>${escapeHtml(t('status.tabs', { count: snapshot.tabs.length }))}</span>`];
  if (snapshot.idleTabs.length > 0) {
    parts.push(`<span class="is-idle">${escapeHtml(t('status.idle', { count: snapshot.idleTabs.length }))}</span>`);
  }
  if (snapshot.duplicateCleanup.count > 0) {
    parts.push(`<span class="is-duplicate">${escapeHtml(t('status.duplicates', { count: snapshot.duplicateCleanup.count }))}</span>`);
  }
  document.getElementById('statusLine').innerHTML = parts.join('<span class="status-sep" aria-hidden="true">·</span>');

  const parkIdleButton = document.getElementById('parkIdleButton');
  parkIdleButton.hidden = snapshot.idleTabs.length === 0;
  setText('parkIdleLabel', t('button.parkIdle', { count: snapshot.idleTabs.length }));

  const duplicateButton = document.getElementById('duplicateCleanupButton');
  const duplicateCleanup = snapshot.duplicateCleanup;
  duplicateButton.hidden = duplicateCleanup.count === 0;
  if (duplicateCleanup.count > 0) {
    setText('duplicateCleanupLabel', t('duplicates.cleanupCta', { count: duplicateCleanup.count }));
    duplicateButton.title = t('duplicates.summary', { count: duplicateCleanup.count, groupCount: duplicateCleanup.groupCount });
  }
}

function captureRowFocus() {
  const row = document.activeElement?.closest?.('#sections .tab-row');
  if (!row) return null;
  const rows = [...document.querySelectorAll('#sections .tab-row')];
  return { tabId: row.dataset.tabId, index: rows.indexOf(row) };
}

function restoreRowFocus(focus) {
  if (!focus) return;
  const rows = [...document.querySelectorAll('#sections .tab-row')];
  if (rows.length === 0) return;
  const row = rows.find(candidate => candidate.dataset.tabId === focus.tabId)
    || rows[Math.min(focus.index, rows.length - 1)];
  row.querySelector('.tab-focus')?.focus({ preventScroll: true });
}

function renderBoard() {
  const snapshot = state.snapshot;
  if (!snapshot) return;

  const sections = buildSections(snapshot);
  state.sections = new Map(sections.map(section => [section.key, section]));

  const focus = captureRowFocus();
  document.getElementById('sections').innerHTML = sections.map(section => renderSection(section, snapshot.now)).join('');
  restoreRowFocus(focus);

  const matchCount = sections.reduce((count, section) => count + section.tabs.length, 0);
  setText('boardSummary', state.query ? t('search.results', { count: matchCount }) : '');

  const empty = document.getElementById('boardEmpty');
  empty.hidden = sections.length > 0;
  if (sections.length === 0) {
    const searching = Boolean(state.query) && snapshot.tabs.length > 0;
    setText('boardEmptyTitle', searching ? t('empty.search.title', { query: state.query }) : t('empty.board.title'));
    setText('boardEmptyBody', searching ? t('empty.search.body') : t('empty.board.body'));
  }

  for (const button of document.querySelectorAll('[data-action="set-view"]')) {
    button.setAttribute('aria-pressed', String(button.dataset.value === state.view));
  }
}

function renderDashboard(snapshot) {
  state.snapshot = snapshot;
  renderTopbar(snapshot);
  renderBoard();
}

// ─── Rendering: parked rail ──────────────────────────────────────────────────

function sessionName(session) {
  if (session.label) return session.label;
  if (session.kind === 'idle') return t('session.idle');

  const time = new Intl.DateTimeFormat(getResolvedLocale() === 'zh' ? 'zh-CN' : 'en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(session.createdAt);
  return t('session.window', { time });
}

function renderSession(session) {
  const expanded = state.expandedSessions.has(session.id);
  const sessionData = `data-session-id="${escapeHtml(session.id)}"`;
  const accent = session.color && COLOR_ACCENTS[session.color];
  const favicons = session.tabs.slice(0, 4).map(tab => `
    <span class="tab-avatar">
      <span class="tab-avatar-fallback">${escapeHtml((tab.title || 'T').trim().charAt(0).toUpperCase())}</span>
      ${renderFaviconImg(tab.url)}
    </span>
  `).join('');

  const links = expanded ? `
    <ul class="session-links">
      ${session.tabs.map((tab, index) => `
        <li>
          <button class="session-link" type="button" data-action="open-parked-tab" ${sessionData}
            data-index="${index}" title="${escapeHtml(tab.url)}">
            ${renderFaviconImg(tab.url)}<span>${escapeHtml(tab.title || tab.url)}</span>
          </button>
        </li>
      `).join('')}
    </ul>
  ` : '';

  return `
    <article class="session${session.id === state.highlightSessionId ? ' is-new' : ''}" ${sessionData}
      ${accent ? `style="--section-accent:${accent};"` : ''}>
      <div class="session-head">
        <button class="session-toggle" type="button" data-action="toggle-session" ${sessionData}
          aria-expanded="${expanded}" title="${escapeHtml(t('session.showLinks'))}">
          <span class="session-favicons">${favicons}</span>
          <span class="session-copy">
            <span class="session-name">${accent ? '<span class="section-dot" aria-hidden="true"></span>' : ''}${escapeHtml(sessionName(session))}</span>
            <span class="session-meta">${escapeHtml(t('session.meta', { count: session.tabs.length, ago: formatAgo(session.createdAt) }))}</span>
          </span>
        </button>
      </div>
      <div class="session-actions">
        <button class="text-button is-primary" type="button" data-action="restore-session" ${sessionData}>
          ${ICONS.restore}<span>${escapeHtml(t('session.restore'))}</span>
        </button>
        ${renderIconButton({ action: 'copy-session', icon: 'copy', label: t('button.copy'), data: sessionData })}
        ${renderIconButton({ action: 'delete-session', icon: 'trash', label: t('session.delete'), variant: 'is-danger', data: sessionData })}
      </div>
      ${links}
    </article>
  `;
}

function renderRail() {
  const sessions = state.sessions;
  const totalTabs = sessions.reduce((count, session) => count + session.tabs.length, 0);
  setText('railCount', totalTabs > 0 ? String(totalTabs) : '');
  document.getElementById('sessionList').innerHTML = sessions.map(renderSession).join('');
  document.getElementById('railEmpty').hidden = sessions.length > 0;
  // The landing animation plays once; later re-renders show the session at rest.
  state.highlightSessionId = null;
}

async function refreshSessions() {
  try {
    state.sessions = await TabKillerSessions.list();
  } catch {
    state.sessions = [];
  }
  renderRail();
}

// ─── Rules panel ─────────────────────────────────────────────────────────────

let ruleSaveTimer = null;

function ruleMatchCounts() {
  const tabs = state.snapshot?.ungroupedTabs || [];
  return assignRuleGroups(tabs, state.rules).countsById;
}

function renderRule(rule, index, counts) {
  const ruleData = `data-rule-id="${escapeHtml(rule.id)}"`;
  const count = counts.get(rule.id) || 0;
  const swatches = Object.entries(COLOR_ACCENTS).map(([color, hex]) => `
    <button class="swatch" type="button" data-action="set-rule-color" ${ruleData} data-value="${color}"
      style="--swatch:${hex};" aria-pressed="${rule.color === color}"
      title="${escapeHtml(t(`color.${color}`))}" aria-label="${escapeHtml(t('rules.color', { color: t(`color.${color}`) }))}"></button>
  `).join('');

  return `
    <div class="rule" ${ruleData}>
      <div class="rule-top">
        <span class="section-dot" style="--section-accent:${COLOR_ACCENTS[rule.color]};" aria-hidden="true"></span>
        <input class="rule-name" type="text" data-field="name" ${ruleData} value="${escapeHtml(rule.name)}"
          placeholder="${escapeHtml(t('rules.namePlaceholder'))}" aria-label="${escapeHtml(t('rules.namePlaceholder'))}"
          autocomplete="off" spellcheck="false">
        <span class="rule-count${count === 0 ? ' is-zero' : ''}" data-count-for="${escapeHtml(rule.id)}">${escapeHtml(t('rules.matches', { count }))}</span>
        <button class="icon-button" type="button" data-action="move-rule" data-value="-1" ${ruleData}
          title="${escapeHtml(t('rules.moveUp'))}" aria-label="${escapeHtml(t('rules.moveUp'))}" ${index === 0 ? 'disabled' : ''}>${ICONS.up}</button>
        <button class="icon-button" type="button" data-action="move-rule" data-value="1" ${ruleData}
          title="${escapeHtml(t('rules.moveDown'))}" aria-label="${escapeHtml(t('rules.moveDown'))}" ${index === state.rules.length - 1 ? 'disabled' : ''}>${ICONS.down}</button>
        ${renderIconButton({ action: 'delete-rule', icon: 'trash', label: t('rules.delete'), variant: 'is-danger', data: ruleData })}
      </div>
      <div class="rule-colors">${swatches}</div>
      <textarea class="rule-patterns" data-field="patterns" ${ruleData} rows="${Math.max(2, rule.patterns.length + 1)}"
        placeholder="${escapeHtml(t('rules.patternsPlaceholder'))}" aria-label="${escapeHtml(t('rules.patternsLabel'))}"
        autocomplete="off" spellcheck="false">${escapeHtml(rule.patterns.join('\n'))}</textarea>
    </div>
  `;
}

function renderRulesPanel() {
  const counts = ruleMatchCounts();
  document.getElementById('rulesList').innerHTML = state.rules.map((rule, index) => renderRule(rule, index, counts)).join('');
  document.getElementById('rulesEmpty').hidden = state.rules.length > 0;
}

// Typing only refreshes the counts, so the field being edited keeps its focus and caret.
function refreshRuleCounts() {
  const counts = ruleMatchCounts();
  for (const node of document.querySelectorAll('[data-count-for]')) {
    const count = counts.get(node.dataset.countFor) || 0;
    node.textContent = t('rules.matches', { count });
    node.classList.toggle('is-zero', count === 0);
  }
}

async function persistRules() {
  window.clearTimeout(ruleSaveTimer);
  try {
    await chrome.storage.local.set({ [RULES_STORAGE_KEY]: state.rules });
  } catch {}
}

function scheduleRuleSave() {
  window.clearTimeout(ruleSaveTimer);
  ruleSaveTimer = window.setTimeout(persistRules, RULE_SAVE_DELAY_MS);
}

function commitRules({ rerenderPanel = true } = {}) {
  if (rerenderPanel) renderRulesPanel();
  renderBoard();
  return persistRules();
}

function findRule(id) {
  return state.rules.find(rule => rule.id === id) || null;
}

// A plain fixed panel rather than a popover: popovers sit in the top layer, which would
// cover the toast and light-dismiss the panel when its Undo button is clicked.
let rulesPanelOpener = null;

function isRulesPanelOpen() {
  return !document.getElementById('rulesPanel').hidden;
}

function openRulesPanel() {
  const settingsMenu = document.getElementById('settingsMenu');
  if (settingsMenu.matches(':popover-open')) settingsMenu.hidePopover();
  rulesPanelOpener = document.activeElement;
  renderRulesPanel();
  document.getElementById('rulesPanel').hidden = false;
  const firstField = document.querySelector('#rulesList .rule-name') || document.getElementById('addRuleButton');
  firstField.focus();
}

function closeRulesPanel() {
  persistRules();
  document.getElementById('rulesPanel').hidden = true;
  if (rulesPanelOpener?.isConnected) rulesPanelOpener.focus();
  else document.getElementById('rulesButton').focus();
}

function addRule() {
  const usedColors = new Set(state.rules.map(rule => rule.color));
  const color = Object.keys(COLOR_ACCENTS).find(name => name !== 'grey' && !usedColors.has(name)) || 'blue';
  const rule = { id: crypto.randomUUID(), name: '', color, patterns: [] };
  state.rules.push(rule);
  commitRules();
  document.querySelector(`.rule-name[data-rule-id="${CSS.escape(rule.id)}"]`)?.focus();
}

function deleteRule(rule) {
  const index = state.rules.indexOf(rule);
  if (index === -1) return;
  state.rules.splice(index, 1);
  commitRules();
  showToast(t('toast.ruleDeleted', { name: rule.name.trim() || t('rules.untitled') }), {
    label: t('toast.undo'),
    run: () => {
      state.rules.splice(Math.min(index, state.rules.length), 0, rule);
      commitRules();
    },
  });
}

function moveRule(rule, delta) {
  const index = state.rules.indexOf(rule);
  const target = index + delta;
  if (index === -1 || target < 0 || target >= state.rules.length) return;
  state.rules.splice(index, 1);
  state.rules.splice(target, 0, rule);
  commitRules();
  document.querySelector(`.rule[data-rule-id="${CSS.escape(rule.id)}"] [data-action="move-rule"][data-value="${delta}"]`)?.focus();
}

function handleRuleInput(event) {
  const field = event.target.dataset.field;
  const rule = field ? findRule(event.target.dataset.ruleId) : null;
  if (!rule) return;

  if (field === 'name') {
    rule.name = event.target.value;
  } else if (field === 'patterns') {
    rule.patterns = event.target.value.split('\n').map(line => line.trim()).filter(Boolean);
    event.target.rows = Math.max(2, event.target.value.split('\n').length + 1);
  }

  renderBoard();
  refreshRuleCounts();
  scheduleRuleSave();
}

// ─── Preferences ─────────────────────────────────────────────────────────────

function getResolvedTheme() {
  if (state.themePreference === 'light' || state.themePreference === 'dark') {
    return state.themePreference;
  }
  return THEME_QUERY.matches ? 'dark' : 'light';
}

function syncPressed(action, value) {
  for (const button of document.querySelectorAll(`[data-action="${action}"]`)) {
    button.setAttribute('aria-pressed', String(button.dataset.value === value));
  }
}

function applyTheme() {
  document.documentElement.dataset.theme = getResolvedTheme();
  syncPressed('set-theme', state.themePreference);
}

function applyLocale() {
  const locale = getResolvedLocale();
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  document.title = t('app.title');

  setText('appTitle', t('app.title'));
  setText('settingsThemeLabel', t('settings.theme'));
  setText('settingsLanguageLabel', t('settings.language'));
  setText('themeSystemLabel', t('theme.system'));
  setText('themeLightLabel', t('theme.light'));
  setText('themeDarkLabel', t('theme.dark'));
  setText('viewGroupsLabel', t('view.groups'));
  setText('viewIdleLabel', t('view.idle'));
  setText('railTitle', t('rail.title'));
  setText('railEmptyTitle', t('rail.emptyTitle'));
  setText('railEmptyBody', t('rail.emptyBody'));
  setText('rulesButtonLabel', t('rules.open'));
  setText('rulesMenuLabel', t('rules.open'));
  setText('rulesTitle', t('rules.title'));
  setText('rulesHint', t('rules.hint'));
  setText('rulesEmpty', t('rules.empty'));
  setText('addRuleLabel', t('rules.add'));
  document.getElementById('rulesCloseButton').setAttribute('aria-label', t('rules.close'));
  if (isRulesPanelOpen()) renderRulesPanel();

  const searchInput = document.getElementById('searchInput');
  searchInput.placeholder = t('search.placeholder');
  searchInput.setAttribute('aria-label', t('search.placeholder'));

  const settingsButton = document.getElementById('settingsButton');
  settingsButton.title = t('settings.label');
  settingsButton.setAttribute('aria-label', t('settings.label'));

  const keys = [
    ['/', t('keys.search')],
    ['j k', t('keys.move')],
    ['↵', t('keys.open')],
    ['s', t('keys.park')],
    ['x', t('keys.close')],
    ['c', t('keys.copy')],
    ['v', t('keys.view')],
  ];
  document.getElementById('keyHints').innerHTML = keys
    .map(([key, label]) => `<span><kbd>${escapeHtml(key)}</kbd>${escapeHtml(label)}</span>`)
    .join('');

  syncPressed('set-locale', locale);
  applyTheme();
  if (state.snapshot) renderDashboard(state.snapshot);
  renderRail();
}

async function loadPreferences() {
  let needsThemeMigration = false;

  try {
    const stored = await chrome.storage.local.get([
      THEME_STORAGE_KEY,
      THEME_PREF_VERSION_KEY,
      LOCALE_STORAGE_KEY,
      VIEW_STORAGE_KEY,
      RULES_STORAGE_KEY,
    ]);
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
    state.view = stored[VIEW_STORAGE_KEY] === 'idle' ? 'idle' : 'groups';
    state.rules = sanitizeRules(stored[RULES_STORAGE_KEY]);
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

async function setTheme(value) {
  if (!['system', 'light', 'dark'].includes(value)) return;
  state.themePreference = value;
  applyTheme();

  try {
    await chrome.storage.local.set({
      [THEME_STORAGE_KEY]: value,
      [THEME_PREF_VERSION_KEY]: THEME_PREF_VERSION,
    });
  } catch {}
}

async function setLocale(value) {
  if (value !== 'zh' && value !== 'en') return;
  state.localePreference = value;
  applyLocale();

  try {
    await chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: value });
  } catch {}
}

async function setView(value) {
  if (value !== 'groups' && value !== 'idle') return;
  state.view = value;
  renderBoard();

  try {
    await chrome.storage.local.set({ [VIEW_STORAGE_KEY]: value });
  } catch {}
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function showToast(message, action = null) {
  const toast = document.getElementById('toast');
  const actionButton = document.getElementById('toastAction');
  if (!toast || !actionButton) return;

  setText('toastText', message);
  actionButton.hidden = !action;
  actionButton.textContent = action?.label || '';
  actionButton.onclick = action
    ? () => {
      toast.classList.remove('visible');
      action.run();
    }
    : null;
  toast.classList.add('visible');

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove('visible');
  }, action ? 6000 : 2400);
}

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

async function animateOut(elements) {
  const nodes = elements.filter(Boolean);
  if (nodes.length === 0) return;
  for (const node of nodes) node.classList.add('is-leaving');
  await wait(LEAVE_ANIMATION_MS);
}

function rowsForTabs(tabs) {
  const ids = new Set(tabs.map(tab => String(tab.id)));
  return [...document.querySelectorAll('#sections .tab-row')].filter(row => ids.has(row.dataset.tabId));
}

function findTab(tabId) {
  return state.snapshot?.tabs.find(tab => tab.id === tabId) || null;
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

async function closeTabs(tabs) {
  if (tabs.length === 0) return;
  await animateOut(rowsForTabs(tabs));
  await closeTabsByIds(tabs.map(tab => tab.id));
  showToast(tabs.length === 1 ? t('toast.closedTab') : t('toast.closedTabs', { count: tabs.length }));
  requestRender();
}

async function parkTabs(tabs, meta) {
  const parkable = tabs.filter(tab => TabKillerSessions.isParkableUrl(tab.url));
  if (parkable.length === 0) return;

  // Write first, close second: if storage fails, every tab stays open.
  let session;
  try {
    session = await TabKillerSessions.save({ ...meta, tabs: parkable });
  } catch {
    showToast(t('toast.saveError'));
    return;
  }
  if (!session) return;

  state.highlightSessionId = session.id;
  await animateOut(rowsForTabs(parkable));
  await closeTabsByIds(parkable.map(tab => tab.id));
  showToast(t('toast.parked', { count: session.tabs.length }), {
    label: t('toast.undo'),
    run: () => restoreSession(session),
  });
  requestRender();
}

async function restoreSession(session) {
  try {
    const tabIds = [];
    for (const tab of session.tabs) {
      const created = await chrome.tabs.create({ url: tab.url, active: false });
      tabIds.push(created.id);
    }

    if (session.kind === 'group' && tabIds.length > 0) {
      try {
        const groupId = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(groupId, {
          title: session.label || '',
          ...(COLOR_ACCENTS[session.color] ? { color: session.color } : {}),
        });
      } catch {}
    }

    await TabKillerSessions.remove(session.id);
    showToast(t('toast.restored', { count: tabIds.length }));
  } catch {
    showToast(t('toast.restoreError'));
  }
  await refreshSessions();
}

async function openParkedTab(session, index) {
  const tab = session.tabs[index];
  if (!tab) return;

  await chrome.tabs.create({ url: tab.url, active: true });
  const remaining = session.tabs.filter((_, tabIndex) => tabIndex !== index);
  if (remaining.length === 0) {
    await TabKillerSessions.remove(session.id);
  } else {
    await TabKillerSessions.put({ ...session, tabs: remaining });
  }
}

async function deleteSession(session) {
  const node = document.querySelector(`.session[data-session-id="${CSS.escape(session.id)}"]`);
  await animateOut([node]);
  await TabKillerSessions.remove(session.id);
  showToast(t('toast.deleted'), {
    label: t('toast.undo'),
    run: async () => {
      await TabKillerSessions.put(session);
      await refreshSessions();
    },
  });
  await refreshSessions();
}

function escapeMarkdown(text) {
  return String(text).replace(/([\[\]\\])/g, '\\$1');
}

async function copyMarkdown(title, tabs) {
  const lines = tabs.map(tab => `- [${escapeMarkdown(tab.title || tab.url)}](${tab.url})`);
  const markdown = title ? `## ${title}\n\n${lines.join('\n')}\n` : `${lines.join('\n')}\n`;

  try {
    await navigator.clipboard.writeText(markdown);
    showToast(t('toast.copied', { count: tabs.length }));
  } catch {
    showToast(t('toast.copyError'));
  }
}

function findSession(id) {
  return state.sessions.find(session => session.id === id) || null;
}

async function handleAction(action, actionEl) {
  const sectionKey = actionEl.dataset.sectionKey;
  const section = sectionKey ? state.sections.get(sectionKey) : null;
  const session = actionEl.dataset.sessionId ? findSession(actionEl.dataset.sessionId) : null;
  const rule = actionEl.dataset.ruleId ? findRule(actionEl.dataset.ruleId) : null;
  const tab = actionEl.dataset.tabId ? findTab(Number(actionEl.dataset.tabId)) : null;

  switch (action) {
    case 'set-theme':
      return setTheme(actionEl.dataset.value);
    case 'set-locale':
      return setLocale(actionEl.dataset.value);
    case 'set-view':
      return setView(actionEl.dataset.value);
    case 'focus-tab':
      return focusTab(Number(actionEl.dataset.tabId), Number(actionEl.dataset.windowId));
    case 'close-tab':
      return tab && closeTabs([tab]);
    case 'park-tab':
      return tab && parkTabs([tab], { kind: 'tab', label: tab.title });
    case 'show-more':
      state.expandedSections.add(sectionKey);
      return renderBoard();
    case 'park-section':
      // Pinned tabs were pinned on purpose; a bulk park leaves them where they are.
      return section && parkTabs(section.tabs.filter(item => !item.pinned), section.park);
    case 'copy-section':
      return section && copyMarkdown(section.title, section.tabs);
    case 'close-section':
      return section && closeTabs(section.tabs);
    case 'park-idle':
      return state.snapshot && parkTabs(state.snapshot.idleTabs, { kind: 'idle' });
    case 'close-duplicate-tabs': {
      const ids = state.snapshot?.duplicateCleanup.closeIds || [];
      if (ids.length === 0) return;
      await closeTabsByIds(ids);
      showToast(t('toast.closedTabs', { count: ids.length }));
      return requestRender();
    }
    case 'toggle-session':
      if (!session) return;
      if (state.expandedSessions.has(session.id)) state.expandedSessions.delete(session.id);
      else state.expandedSessions.add(session.id);
      return renderRail();
    case 'restore-session':
      return session && restoreSession(session);
    case 'copy-session':
      return session && copyMarkdown(sessionName(session), session.tabs);
    case 'delete-session':
      return session && deleteSession(session);
    case 'open-parked-tab':
      return session && openParkedTab(session, Number(actionEl.dataset.index));
    case 'open-rules':
      return openRulesPanel();
    case 'close-rules':
      return closeRulesPanel();
    case 'add-rule':
      return addRule();
    case 'delete-rule':
      return rule && deleteRule(rule);
    case 'move-rule':
      return rule && moveRule(rule, Number(actionEl.dataset.value));
    case 'set-rule-color':
      if (!rule || !COLOR_ACCENTS[actionEl.dataset.value]) return;
      rule.color = actionEl.dataset.value;
      await commitRules();
      return document.querySelector(`.swatch[data-rule-id="${CSS.escape(rule.id)}"][data-value="${rule.color}"]`)?.focus();
    default:
      return undefined;
  }
}

// ─── Keyboard ────────────────────────────────────────────────────────────────

function focusableRows() {
  return [...document.querySelectorAll('#sections .tab-focus')];
}

function moveRowFocus(delta) {
  const rows = focusableRows();
  if (rows.length === 0) return;

  const current = document.activeElement?.closest?.('.tab-row')?.querySelector('.tab-focus');
  const index = rows.indexOf(current);
  const nextIndex = index === -1
    ? (delta > 0 ? 0 : rows.length - 1)
    : Math.min(rows.length - 1, Math.max(0, index + delta));

  rows[nextIndex].focus({ preventScroll: true });
  rows[nextIndex].scrollIntoView({ block: 'nearest' });
}

function handleKeydown(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (document.getElementById('settingsMenu').matches(':popover-open')) return;

  if (isRulesPanelOpen()) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeRulesPanel();
    }
    return;
  }

  const searchInput = document.getElementById('searchInput');
  if (event.target === searchInput) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (searchInput.value) {
        searchInput.value = '';
        state.query = '';
        renderBoard();
      } else {
        searchInput.blur();
      }
    } else if (event.key === 'ArrowDown' || event.key === 'Enter') {
      event.preventDefault();
      const first = focusableRows()[0];
      if (!first) return;
      if (event.key === 'Enter') first.click();
      else first.focus();
    }
    return;
  }

  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

  const row = document.activeElement?.closest?.('#sections .tab-row');
  const rowTab = row ? findTab(Number(row.dataset.tabId)) : null;

  switch (event.key) {
    case '/':
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
      break;
    case 'j':
    case 'ArrowDown':
      event.preventDefault();
      moveRowFocus(1);
      break;
    case 'k':
    case 'ArrowUp':
      event.preventDefault();
      moveRowFocus(-1);
      break;
    case 'v':
      setView(state.view === 'groups' ? 'idle' : 'groups');
      break;
    case 'x':
      if (rowTab) closeTabs([rowTab]);
      break;
    case 's':
      if (rowTab) parkTabs([rowTab], { kind: 'tab', label: rowTab.title });
      break;
    case 'c':
      if (rowTab) copyMarkdown('', [rowTab]);
      break;
    case 'Escape':
      document.activeElement?.blur?.();
      break;
    default:
      break;
  }
}

// ─── Wiring ──────────────────────────────────────────────────────────────────

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
    console.error('[tab-killer] failed to render dashboard', error);
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
  chrome.tabs.onActivated.addListener(requestRender);
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (
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

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (Object.keys(changes).some(key => key.startsWith(TabKillerSessions.PREFIX))) refreshSessions();

    // Rules edited in another Tab Killer tab. Our own saves echo back identical and are skipped.
    if (RULES_STORAGE_KEY in changes) {
      const rules = sanitizeRules(changes[RULES_STORAGE_KEY].newValue);
      if (JSON.stringify(rules) === JSON.stringify(state.rules)) return;
      state.rules = rules;
      renderBoard();
      if (isRulesPanelOpen() && !document.getElementById('rulesPanel').contains(document.activeElement)) renderRulesPanel();
    }
  });
}

function positionSettingsMenu() {
  const button = document.getElementById('settingsButton');
  const menu = document.getElementById('settingsMenu');
  const rect = button.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 8}px`;
  menu.style.right = `${Math.max(12, document.documentElement.clientWidth - rect.right)}px`;
}

function bindUiListeners() {
  document.addEventListener('click', async event => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    await handleAction(actionEl.dataset.action, actionEl);
  });

  document.addEventListener('keydown', handleKeydown);

  document.getElementById('searchInput').addEventListener('input', event => {
    state.query = event.target.value.trim().toLowerCase();
    renderBoard();
  });

  document.getElementById('rulesList').addEventListener('input', handleRuleInput);

  document.getElementById('settingsMenu').addEventListener('beforetoggle', event => {
    if (event.newState === 'open') positionSettingsMenu();
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

// The toolbar button parks a window, then opens this page with ?parked=<id>.
async function announceParkedWindow() {
  const params = new URLSearchParams(location.search);
  const parkedId = params.get('parked');
  if (!parkedId) return;

  history.replaceState(null, '', location.pathname);
  const session = findSession(parkedId);
  if (!session) return;

  state.highlightSessionId = session.id;
  renderRail();
  showToast(t('toast.parkedWindow', { count: session.tabs.length }), {
    label: t('toast.undo'),
    run: () => restoreSession(session),
  });
}

async function init() {
  await loadPreferences();
  bindChromeListeners();
  bindUiListeners();
  await refreshSessions();
  await refreshDashboard();
  await announceParkedWindow();
}

init();
