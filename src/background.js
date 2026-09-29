importScripts("shared.js");

let syncChain = Promise.resolve();
let seedPromise = null;

chrome.runtime.onInstalled.addListener(() => {
  seedAndSync(true);
});

chrome.runtime.onStartup.addListener(() => {
  seedAndSync(true);
});

seedAndSync(true);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.customMods || changes.syncedMods || changes.modEnabled || changes.builtinEnabled)) {
    syncUserScripts();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "sync-user-scripts") {
    syncUserScripts().then(sendResponse);
    return true;
  }
  if (message?.type === "ensure-mods") {
    seedAndSync(true)
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

function seedAndSync(force = false) {
  if (force) seedPromise = null;
  if (!seedPromise) {
    seedPromise = ensureSyncedMods()
      .then(syncUserScripts)
      .catch((error) => {
        console.error("[SAI Mods] seed failed", error);
        seedPromise = null;
        throw error;
      });
  }
  return seedPromise;
}

async function ensureSyncedMods() {
  const data = await SAI.storageGet(["syncedMods", "builtinEnabled", "modEnabled"]);
  const bundled = await loadBundledCatalog();
  const existing = Array.isArray(data.syncedMods) ? data.syncedMods : [];
  const existingMap = new Map(existing.map((mod) => [mod.id, mod]));

  const needsRefresh =
    !existing.length ||
    bundled.some((bundledMod) => {
      const current = existingMap.get(bundledMod.id);
      if (!current) return true;
      if (String(bundledMod.js || "").trim() && !String(current.js || "").trim()) return true;
      if (String(bundledMod.css || "").trim() && !String(current.css || "").trim()) return true;
      return false;
    });

  const enabledSource = SAI.mergeEnabledMaps(data.builtinEnabled, data.modEnabled);

  if (!needsRefresh) {
    const enabledMap = SAI.modEnabledMap(enabledSource, existing);
    await SAI.storageSet({ modEnabled: enabledMap, builtinEnabled: enabledMap });
    return existing;
  }

  const enabledMap = SAI.modEnabledMap(enabledSource, [...existing, ...bundled]);
  const merged = bundled.map((mod) => {
    const old = existingMap.get(mod.id);
    const enabled = Object.prototype.hasOwnProperty.call(enabledMap, mod.id)
      ? enabledMap[mod.id] === true
      : old
        ? old.enabled === true
        : mod.enabledByDefault === true;
    return { ...mod, enabled };
  });

  for (const old of existing) {
    if (merged.some((mod) => mod.id === old.id)) continue;
    if (String(old.js || "").trim() || String(old.css || "").trim()) merged.push(old);
  }

  for (const mod of merged) {
    if (typeof enabledMap[mod.id] !== "boolean") enabledMap[mod.id] = mod.enabled === true;
  }

  await SAI.storageSet({
    syncedMods: merged,
    modEnabled: enabledMap,
    builtinEnabled: enabledMap,
  });
  return merged;
}

async function loadBundledCatalog() {
  const localUpdate = await fetchJson(chrome.runtime.getURL("update.json"));
  return hydrateMods(localUpdate.mods || [], "github", true);
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

    // loader = runs via content-script mod-loader (packaged player-bar scripts)
    // remote = CSS/JS applied via content CSS injector / userScripts
    const runViaLoader = raw.group === "builtin" || raw.runViaLoader === true || /^mods\//.test(jsPath);

    result.push({
      id: raw.id,
      name: String(raw.name || raw.id),
      description: String(raw.description || ""),
      matches,
      js,
      css,
      mainWorld: !!raw.mainWorld,
      group: runViaLoader ? "builtin" : "remote",
      enabled: raw.enabledByDefault === true,
      enabledByDefault: raw.enabledByDefault === true,
      source: source === "bundle" ? "github" : source,
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

  const data = await SAI.storageGet(["customMods", "syncedMods", "modEnabled", "builtinEnabled"]);
  const enabledMap = SAI.modEnabledMap(
    SAI.mergeEnabledMaps(data.builtinEnabled, data.modEnabled),
    data.syncedMods
  );
  const runnable = [];

  for (const mod of Array.isArray(data.customMods) ? data.customMods : []) {
    if (mod?.enabled && String(mod.js || "").trim() && mod.matches?.length) runnable.push(mod);
  }

  for (const mod of Array.isArray(data.syncedMods) ? data.syncedMods : []) {
    if (mod.group === "builtin") continue;
    if (!String(mod.js || "").trim() || !mod.matches?.length) continue;
    const on = Object.prototype.hasOwnProperty.call(enabledMap, mod.id)
      ? enabledMap[mod.id] === true
      : mod.enabled === true;
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
  await seedAndSync(true);
  const urls = SAI.updateUrls();
  const localVersion = SAI.localVersion();
  const manifest = await fetchUpdateManifest(urls);
  const previous = await SAI.storageGet(["syncedMods", "builtinEnabled", "modEnabled"]);
  const prevEnabled = SAI.modEnabledMap(
    SAI.mergeEnabledMaps(previous.builtinEnabled, previous.modEnabled),
    previous.syncedMods
  );
  const prevMap = new Map((previous.syncedMods || []).map((mod) => [mod.id, mod]));

  let hydrated;
  try {
    hydrated = await hydrateMods(manifest.mods || [], "github", false);
  } catch (error) {
    hydrated = await hydrateMods(manifest.mods || [], "github", true);
    console.warn("[SAI Mods] GitHub mod fetch failed, using bundle", error);
  }

  const merged = hydrated.map((mod) => {
    const old = prevMap.get(mod.id);
    const enabled = Object.prototype.hasOwnProperty.call(prevEnabled, mod.id)
      ? prevEnabled[mod.id] === true
      : old
        ? old.enabled === true
        : mod.enabledByDefault === true;
    return { ...mod, enabled };
  });

  const enabledMap = { ...prevEnabled };
  for (const mod of merged) {
    if (typeof enabledMap[mod.id] !== "boolean") enabledMap[mod.id] = mod.enabled === true;
  }

  await SAI.storageSet({
    syncedMods: merged,
    modEnabled: enabledMap,
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
