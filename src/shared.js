const SAI = globalThis.SAI || {};

SAI.BUILTIN_IDS = ["ytmusic-classic", "ytmusic-modern"];

SAI.UPDATE = {
  owner: "artem-sobolevskyi",
  repo: "sai-mods",
  branch: "main",
};

SAI.updateUrls = function updateUrls() {
  const { owner, repo, branch } = SAI.UPDATE;
  return {
    repoUrl: `https://github.com/${owner}/${repo}`,
    releasesUrl: `https://github.com/${owner}/${repo}/releases`,
    downloadZipUrl: `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`,
    manifestUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/update.json?_=${Date.now()}`,
    rawBase: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`,
    apiLatestRelease: `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
    apiRepo: `https://api.github.com/repos/${owner}/${repo}`,
  };
};

SAI.localVersion = function localVersion() {
  try {
    return chrome.runtime.getManifest().version;
  } catch {
    return "0.0.0";
  }
};

SAI.parseVersion = function parseVersion(value) {
  return String(value || "0")
    .replace(/^v/i, "")
    .split(/[.+-]/)
    .map((part) => {
      const n = parseInt(part, 10);
      return Number.isFinite(n) ? n : 0;
    });
};

SAI.compareVersions = function compareVersions(a, b) {
  const left = SAI.parseVersion(a);
  const right = SAI.parseVersion(b);
  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (left[i] || 0) - (right[i] || 0);
    if (diff) return diff > 0 ? 1 : -1;
  }
  return 0;
};

SAI.BUILTIN_MODS = [
  {
    id: "ytmusic-classic",
    name: "Classic YouTube Music player bar",
    description:
      "For the new miniplayer. Controls on the left, the track in the center, volume on the right — like the old bar. Keeps the new volume popup above the button.",
    matches: ["*://music.youtube.com/*"],
    sites: ["music.youtube.com"],
  },
  {
    id: "ytmusic-modern",
    name: "Modern YouTube Music player bar",
    description:
      "For the old player bar. Track on the left, playback controls in the center, time and actions on the right — like the new miniplayer. Volume opens above the button.",
    matches: ["*://music.youtube.com/*"],
    sites: ["music.youtube.com"],
  },
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

SAI.normalizeMatch = function normalizeMatch(raw) {
  let line = String(raw || "").trim();
  if (!line) return null;
  if (line === "<all_urls>") return line;

  line = line.replace(/[?#].*$/, "").replace(/\s+/g, "");
  if (!/^[a-z*]+:\/\//i.test(line)) {
    line = "*://" + line.replace(/^\/+/, "");
  }

  const match = /^(\*|https?|file|ftp):\/\/([^/]+)(\/.*)?$/i.exec(line);
  if (!match) {
    throw new Error("Invalid pattern: " + String(raw).trim());
  }

  const scheme = match[1].toLowerCase();
  const host = match[2];
  let path = match[3] || "/*";
  if (path === "/") path = "/*";
  if (!path.includes("*")) {
    if (!path.endsWith("/")) path += "/";
    path += "*";
  }

  const hostOk =
    host === "*" ||
    /^\*\.[^*/]+$/.test(host) ||
    (/^[^*]+$/.test(host) && !host.includes("*"));
  if (!hostOk) {
    throw new Error("Invalid domain in pattern: " + String(raw).trim());
  }

  return scheme + "://" + host + path;
};

SAI.normalizeMatchList = function normalizeMatchList(text) {
  const lines = String(text || "").split(/\n|,/);
  const patterns = [];
  for (const line of lines) {
    const pattern = SAI.normalizeMatch(line);
    if (pattern && !patterns.includes(pattern)) patterns.push(pattern);
  }
  if (!patterns.length) {
    throw new Error("Add at least one site.");
  }
  return patterns;
};

SAI.patternToRegExp = function patternToRegExp(pattern) {
  if (pattern === "<all_urls>") return /^(https?|file|ftp):\/\//i;
  const match = /^(\*|https?|file|ftp):\/\/(\*|\*\.[^/*]+|[^/*]+)(\/.*)$/i.exec(pattern);
  if (!match) return null;

  const scheme = match[1] === "*" ? "https?" : match[1];
  let hostRe;
  if (match[2] === "*") hostRe = "[^/]+";
  else if (match[2].startsWith("*.")) hostRe = "[^/]+\\." + escapeRegex(match[2].slice(2));
  else hostRe = escapeRegex(match[2]);

  const pathRe = match[3].split("*").map(escapeRegex).join(".*");
  return new RegExp("^" + scheme + "://" + hostRe + pathRe + "$", "i");
};

SAI.urlMatches = function urlMatches(url, patterns) {
  let pathnameUrl = url;
  try {
    const parsed = new URL(url);
    pathnameUrl = parsed.origin + parsed.pathname;
  } catch {
    return false;
  }
  return (patterns || []).some((pattern) => {
    const regexp = SAI.patternToRegExp(pattern);
    return regexp ? regexp.test(pathnameUrl) : false;
  });
};

SAI.storageGet = function storageGet(keys) {
  return new Promise((resolve) => {
    if (!globalThis.chrome?.storage?.local) {
      resolve({});
      return;
    }
    chrome.storage.local.get(keys, resolve);
  });
};

SAI.storageSet = function storageSet(value) {
  return new Promise((resolve, reject) => {
    if (!globalThis.chrome?.storage?.local) {
      reject(new Error("Extension storage is unavailable."));
      return;
    }
    chrome.storage.local.set(value, () => {
      const error = chrome.runtime?.lastError;
      if (error) reject(new Error(error.message));
      else resolve();
    });
  });
};

SAI.builtinEnabledMap = function builtinEnabledMap(stored) {
  const map = stored && typeof stored === "object" ? { ...stored } : {};
  for (const id of SAI.BUILTIN_IDS) {
    if (typeof map[id] !== "boolean") map[id] = true;
  }
  return map;
};

SAI.modsFromSynced = function modsFromSynced(syncedMods, group) {
  return (Array.isArray(syncedMods) ? syncedMods : []).filter((mod) =>
    group ? mod.group === group : true
  );
};

SAI.normalizeRemoteMod = function normalizeRemoteMod(raw) {
  if (!raw || typeof raw !== "object") return null;
  let id = String(raw.id || "").trim();
  if (!id) return null;
  if (!id.startsWith("remote-")) id = "remote-" + id;
  let matches;
  try {
    matches = SAI.normalizeMatchList(
      Array.isArray(raw.matches) ? raw.matches.join("\n") : String(raw.matches || "")
    );
  } catch {
    return null;
  }
  const css = String(raw.css || "");
  const js = String(raw.js || "");
  if (!css.trim() && !js.trim()) return null;
  return {
    id,
    name: String(raw.name || id).trim() || id,
    description: String(raw.description || "").trim(),
    matches,
    css,
    js,
    mainWorld: !!raw.mainWorld,
    enabledByDefault: raw.enabledByDefault !== false,
    source: "github",
  };
};

globalThis.SAI = SAI;
