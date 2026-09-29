(() => {
  const ran = new Set();

  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  async function ensureCatalog() {
    const data = await storageGet("syncedMods");
    if (Array.isArray(data.syncedMods) && data.syncedMods.length) return;
    try {
      await chrome.runtime.sendMessage({ type: "ensure-mods" });
    } catch {
      /* service worker may be waking up */
    }
  }

  async function runFromStorage() {
    await ensureCatalog();
    const data = await storageGet(["syncedMods", "builtinEnabled"]);
    const mods = Array.isArray(data.syncedMods) ? data.syncedMods : [];
    const enabledMap = data.builtinEnabled && typeof data.builtinEnabled === "object" ? data.builtinEnabled : {};

    for (const mod of mods) {
      if (!mod?.id || !String(mod.js || "").trim()) continue;
      const enabled = Object.prototype.hasOwnProperty.call(enabledMap, mod.id)
        ? enabledMap[mod.id] !== false
        : mod.enabled !== false;
      if (!enabled) continue;
      if (mod.matches?.length && typeof SAI !== "undefined" && !SAI.urlMatches(location.href, mod.matches)) {
        continue;
      }
      if (ran.has(mod.id)) continue;
      try {
        ran.add(mod.id);
        // eslint-disable-next-line no-new-func
        new Function(mod.js)();
      } catch (error) {
        ran.delete(mod.id);
        console.error("[SAI Mods] Failed to run", mod.id, error);
      }
    }
  }

  runFromStorage();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.syncedMods || changes.builtinEnabled)) runFromStorage();
  });
})();
