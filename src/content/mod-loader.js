(() => {
  const ran = new Set();

  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  async function ensureCatalog() {
    const data = await storageGet("syncedMods");
    const mods = Array.isArray(data.syncedMods) ? data.syncedMods : [];
    const missingPlayerJs = SAI.BUILTIN_IDS.some((id) => {
      const mod = mods.find((item) => item?.id === id);
      return !mod || !String(mod.js || "").trim();
    });
    if (mods.length && !missingPlayerJs) return;
    try {
      await chrome.runtime.sendMessage({ type: "ensure-mods" });
    } catch {
      /* service worker may be waking up */
    }
  }

  async function runFromStorage() {
    await ensureCatalog();
    const data = await storageGet(["syncedMods", "modEnabled", "builtinEnabled"]);
    const mods = Array.isArray(data.syncedMods) ? data.syncedMods : [];
    const enabledMap = SAI.modEnabledMap(
      SAI.mergeEnabledMaps(data.modEnabled, data.builtinEnabled),
      mods
    );

    for (const mod of mods) {
      if (!mod?.id || !String(mod.js || "").trim()) continue;
      // Packaged player-bar mods run as content scripts — avoid double start.
      // MV3 also blocks new Function/eval in content scripts, so those must stay packaged.
      if (SAI.BUILTIN_IDS.includes(mod.id)) continue;
      if (!SAI.isModEnabled(mod.id, enabledMap, mod)) continue;
      if (mod.matches?.length && !SAI.urlMatches(location.href, mod.matches)) continue;
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
    if (area === "local" && (changes.syncedMods || changes.modEnabled || changes.builtinEnabled)) {
      runFromStorage();
    }
  });
})();
