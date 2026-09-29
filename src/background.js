importScripts("shared.js");

let syncChain = Promise.resolve();

chrome.runtime.onInstalled.addListener(() => {
  ensureDefaults().then(syncUserScripts);
});

chrome.runtime.onStartup.addListener(() => {
  syncUserScripts();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.customMods || changes.remoteMods)) syncUserScripts();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "sync-user-scripts") {
    syncUserScripts().then(sendResponse);
    return true;
  }
  if (message?.type === "check-updates") {
    checkUpdates().then(sendResponse).catch((error) => {
      sendResponse({
        ok: false,
        error: error?.message || String(error),
        urls: SAI.updateUrls(),
        localVersion: SAI.localVersion(),
      });
    });
    return true;
  }
  return undefined;
});

async function ensureDefaults() {
  const data = await SAI.storageGet("builtinEnabled");
  if (!data.builtinEnabled) {
    await SAI.storageSet({ builtinEnabled: SAI.builtinEnabledMap(null) });
  }
}

function syncUserScripts() {
  const run = syncChain.then(registerRunnableScripts, registerRunnableScripts);
  syncChain = run.then(
    () => {},
    () => {}
  );
  return run;
}

async function registerRunnableScripts() {
  if (!chrome.userScripts?.getScripts) {
    return {
      ok: false,
      needsPermission: true,
      message: permissionMessage(),
    };
  }

  let existing = [];
  try {
    existing = await chrome.userScripts.getScripts();
  } catch {
    return {
      ok: false,
      needsPermission: true,
      message: permissionMessage(),
    };
  }

  const ours = existing
    .map((script) => script.id)
    .filter((id) => id.startsWith("custom-") || id.startsWith("remote-"));
  if (ours.length) {
    try {
      await chrome.userScripts.unregister({ ids: ours });
    } catch {
      /* already gone */
    }
  }

  const data = await SAI.storageGet(["customMods", "remoteMods"]);
  const mods = [
    ...(Array.isArray(data.customMods) ? data.customMods : []),
    ...(Array.isArray(data.remoteMods) ? data.remoteMods : []),
  ];
  const errors = [];

  for (const mod of mods) {
    if (!mod?.enabled || !String(mod.js || "").trim() || !mod.matches?.length) continue;
    try {
      await chrome.userScripts.register([
        {
          id: mod.id,
          matches: mod.matches,
          js: [{ code: wrapUserCode(mod.js) }],
          runAt: "document_end",
          world: mod.mainWorld ? "MAIN" : "USER_SCRIPT",
        },
      ]);
    } catch (error) {
      errors.push({ id: mod.id, name: mod.name, message: error?.message || String(error) });
    }
  }

  return {
    ok: errors.length === 0,
    needsPermission: false,
    errors,
  };
}

async function checkUpdates() {
  const urls = SAI.updateUrls();
  const localVersion = SAI.localVersion();
  const manifest = await fetchUpdateManifest(urls);
  const remoteMods = await syncRemoteMods(manifest.remoteMods || []);
  await syncUserScripts();

  const remoteVersion = String(manifest.version || "").replace(/^v/i, "") || null;
  const updateAvailable = remoteVersion
    ? SAI.compareVersions(remoteVersion, localVersion) > 0
    : false;

  await SAI.storageSet({
    lastUpdateCheck: {
      at: Date.now(),
      localVersion,
      remoteVersion,
      updateAvailable,
      releaseNotes: manifest.releaseNotes || "",
    },
  });

  return {
    ok: true,
    localVersion,
    remoteVersion,
    updateAvailable,
    releaseNotes: manifest.releaseNotes || "",
    urls: {
      ...urls,
      downloadZipUrl: manifest.downloadZipUrl || urls.downloadZipUrl,
      releasesUrl: manifest.releasesUrl || urls.releasesUrl,
      repoUrl: manifest.repoUrl || urls.repoUrl,
    },
    remoteModsSynced: remoteMods.length,
    remoteMods,
  };
}

async function fetchUpdateManifest(urls) {
  try {
    const response = await fetch(urls.manifestUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("update.json HTTP " + response.status);
    const data = await response.json();
    if (!data || typeof data !== "object") throw new Error("Invalid update.json");
    return data;
  } catch (primaryError) {
    try {
      const release = await fetchJson(urls.apiLatestRelease);
      return {
        version: String(release.tag_name || release.name || "").replace(/^v/i, ""),
        releaseNotes: release.body || "",
        downloadZipUrl: release.zipball_url || urls.downloadZipUrl,
        releasesUrl: release.html_url || urls.releasesUrl,
        repoUrl: urls.repoUrl,
        remoteMods: [],
      };
    } catch {
      throw new Error(primaryError?.message || "Could not reach GitHub updates.");
    }
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) throw new Error("GitHub API HTTP " + response.status);
  return response.json();
}

async function syncRemoteMods(incoming) {
  const normalized = [];
  for (const item of incoming) {
    const mod = SAI.normalizeRemoteMod(item);
    if (mod) normalized.push(mod);
  }

  const data = await SAI.storageGet("remoteMods");
  const previous = Array.isArray(data.remoteMods) ? data.remoteMods : [];
  const enabledMap = new Map(previous.map((mod) => [mod.id, !!mod.enabled]));

  const merged = normalized.map((mod) => ({
    ...mod,
    enabled: enabledMap.has(mod.id) ? enabledMap.get(mod.id) : !!mod.enabledByDefault,
    updatedAt: Date.now(),
  }));

  await SAI.storageSet({ remoteMods: merged });
  return merged;
}

function wrapUserCode(code) {
  return "'use strict';\ntry {\n" + code + "\n} catch (error) {\n  console.error('[SAI Mods]', error);\n}\n";
}

function permissionMessage() {
  return "To run pasted JavaScript, open chrome://extensions, find SAI Mods, and turn on Allow user scripts. CSS works without that permission.";
}
