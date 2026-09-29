importScripts("shared.js");

let syncChain = Promise.resolve();
let seedPromise = null;

chrome.runtime.onInstalled.addListener(() => {
  seedAndSync();
});

chrome.runtime.onStartup.addListener(() => {
  seedAndSync();
});

seedAndSync();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.customMods || changes.syncedMods)) syncUserScripts();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "sync-user-scripts") {
    syncUserScripts().then(sendResponse);
    return true;
  }
  if (message?.type === "ensure-mods") {
    seedAndSync()
      .then(async () => {
        const data = await SAI.storageGet("syncedMods");
        sendResponse({ ok: true, count: (data.syncedMods || []).length });
      })
      .catch((error) => sendResponse({ ok: false, error: error?.message || String(error) }));
    return true;
  }
  if (message?.type === "check-updates") {
    checkUpdates()
      .then(sendResponse)
      .catch((error) => {
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

function seedAndSync() {
  if (!seedPromise) {
    seedPromise = ensureSyncedMods()
      .then(syncUserScripts)
      .catch((error) => console.error("[SAI Mods] seed failed", error));
  }
  return seedPromise;
}

async function ensureSyncedMods() {
  const data = await SAI.storageGet(["syncedMods", "builtinEnabled"]);
  if (!Array.isArray(data.syncedMods) || !data.syncedMods.length) {
    const seeded = await loadBundledCatalog();
    await SAI.storageSet({
      syncedMods: seeded,
      builtinEnabled: SAI.builtinEnabledMap(data.builtinEnabled),
    });
    return seeded;
  }
  if (!data.builtinEnabled) {
    await SAI.storageSet({ builtinEnabled: SAI.builtinEnabledMap(null) });
  }
  return data.syncedMods;
}

async function loadBundledCatalog() {
  const localUpdate = await fetchJson(chrome.runtime.getURL("update.json"));
  return hydrateMods(localUpdate.mods || [], "bundle", true);
}

async function hydrateMods(modDefs, source, preferBundleFiles) {
  const urls = SAI.updateUrls();
  const result = [];
  for (const raw of modDefs) {
    if (!raw?.id) continue;
    let js = String(raw.jsContent || "");
    let css = String(raw.css || "");
    const jsPath = typeof raw.js === "string" && !raw.js.includes("\n") ? raw.js.trim() : "";
    const cssPath = typeof raw.css === "string" && raw.css.endsWith(".css") ? raw.css.trim() : "";

    if (!js && jsPath) {
      const bundled = chrome.runtime.getURL(jsPath);
      const remote = `${urls.rawBase}/${jsPath}?_=${Date.now()}`;
      js = await fetchText(preferBundleFiles ? bundled : remote, bundled);
    }
    if (cssPath) {
      const bundled = chrome.runtime.getURL(cssPath);
      const remote = `${urls.rawBase}/${cssPath}?_=${Date.now()}`;
      css = await fetchText(preferBundleFiles ? bundled : remote, bundled);
    } else if (typeof raw.css === "string" && !cssPath) {
      css = raw.css;
    }

    // Inline JS string in update.json (rare)
    if (!js && typeof raw.js === "string" && raw.js.includes("\n")) js = raw.js;

    let matches;
    try {
      matches = SAI.normalizeMatchList(
        Array.isArray(raw.matches) ? raw.matches.join("\n") : String(raw.matches || "*://music.youtube.com/*")
      );
    } catch {
      continue;
    }

    if (!js.trim() && !css.trim()) continue;

    result.push({
      id: raw.id,
      name: String(raw.name || raw.id),
      description: String(raw.description || ""),
      matches,
      js,
      css,
      mainWorld: !!raw.mainWorld,
      group: raw.group === "remote" ? "remote" : "builtin",
      enabled: raw.enabledByDefault !== false,
      enabledByDefault: raw.enabledByDefault !== false,
      source,
      updatedAt: Date.now(),
    });
  }
  return result;
}

async function fetchText(url, fallbackUrl) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    return await response.text();
  } catch (error) {
    if (!fallbackUrl || fallbackUrl === url) throw error;
    const response = await fetch(fallbackUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.text();
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("HTTP " + response.status + " for " + url);
  return response.json();
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
    return { ok: false, needsPermission: true, message: permissionMessage() };
  }

  let existing = [];
  try {
    existing = await chrome.userScripts.getScripts();
  } catch {
    return { ok: false, needsPermission: true, message: permissionMessage() };
  }

  const ours = existing
    .map((script) => script.id)
    .filter((id) => id.startsWith("custom-") || id.startsWith("remote-"));
  if (ours.length) {
    try {
      await chrome.userScripts.unregister({ ids: ours });
    } catch {
      /* gone */
    }
  }

  const data = await SAI.storageGet(["customMods", "syncedMods", "builtinEnabled"]);
  const enabledMap = SAI.builtinEnabledMap(data.builtinEnabled);
  const runnable = [];

  for (const mod of Array.isArray(data.customMods) ? data.customMods : []) {
    if (mod?.enabled && String(mod.js || "").trim() && mod.matches?.length) runnable.push(mod);
  }

  for (const mod of Array.isArray(data.syncedMods) ? data.syncedMods : []) {
    if (mod.group === "builtin") continue;
    if (!String(mod.js || "").trim() || !mod.matches?.length) continue;
    const on = Object.prototype.hasOwnProperty.call(enabledMap, mod.id)
      ? enabledMap[mod.id] !== false
      : mod.enabled !== false;
    if (on) runnable.push(mod);
  }

  const errors = [];
  for (const mod of runnable) {
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

  return { ok: errors.length === 0, needsPermission: false, errors };
}

async function checkUpdates() {
  await seedAndSync();
  const urls = SAI.updateUrls();
  const localVersion = SAI.localVersion();
  const manifest = await fetchUpdateManifest(urls);
  const previous = await SAI.storageGet(["syncedMods", "builtinEnabled"]);
  const prevEnabled = SAI.builtinEnabledMap(previous.builtinEnabled);
  const prevMap = new Map((previous.syncedMods || []).map((mod) => [mod.id, mod]));

  let hydrated;
  try {
    hydrated = await hydrateMods(manifest.mods || [], "github", false);
  } catch (error) {
    // Fall back to bundled files if raw fetch fails
    hydrated = await hydrateMods(manifest.mods || [], "bundle", true);
    console.warn("[SAI Mods] GitHub mod fetch failed, using bundle", error);
  }

  const merged = hydrated.map((mod) => {
    const old = prevMap.get(mod.id);
    const enabled = Object.prototype.hasOwnProperty.call(prevEnabled, mod.id)
      ? prevEnabled[mod.id] !== false
      : old
        ? old.enabled !== false
        : mod.enabledByDefault !== false;
    return { ...mod, enabled };
  });

  const enabledMap = { ...prevEnabled };
  for (const mod of merged) {
    if (typeof enabledMap[mod.id] !== "boolean") enabledMap[mod.id] = mod.enabled !== false;
  }

  await SAI.storageSet({
    syncedMods: merged,
    builtinEnabled: enabledMap,
    lastUpdateCheck: {
      at: Date.now(),
      localVersion,
      remoteVersion: String(manifest.version || "").replace(/^v/i, "") || null,
      updateAvailable: manifest.version
        ? SAI.compareVersions(String(manifest.version).replace(/^v/i, ""), localVersion) > 0
        : false,
      releaseNotes: manifest.releaseNotes || "",
    },
  });

  await syncUserScripts();

  const remoteVersion = String(manifest.version || "").replace(/^v/i, "") || null;
  const updateAvailable = remoteVersion ? SAI.compareVersions(remoteVersion, localVersion) > 0 : false;

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
    remoteModsSynced: merged.length,
    syncedMods: merged,
  };
}

async function fetchUpdateManifest(urls) {
  try {
    return await fetchJson(urls.manifestUrl);
  } catch (primaryError) {
    try {
      const release = await fetchJson(urls.apiLatestRelease);
      return {
        version: String(release.tag_name || release.name || "").replace(/^v/i, ""),
        releaseNotes: release.body || "",
        downloadZipUrl: release.zipball_url || urls.downloadZipUrl,
        releasesUrl: release.html_url || urls.releasesUrl,
        repoUrl: urls.repoUrl,
        mods: [],
      };
    } catch {
      // Offline / before push: use packaged update.json
      try {
        return await fetchJson(chrome.runtime.getURL("update.json"));
      } catch {
        throw new Error(primaryError?.message || "Could not reach GitHub updates.");
      }
    }
  }
}

function wrapUserCode(code) {
  return "'use strict';\ntry {\n" + code + "\n} catch (error) {\n  console.error('[SAI Mods]', error);\n}\n";
}

function permissionMessage() {
  return "To run pasted JavaScript, open chrome://extensions, find SAI Mods, and turn on Allow user scripts. CSS works without that permission.";
}
