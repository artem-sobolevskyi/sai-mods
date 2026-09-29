(() => {
  function collectMods(data) {
    const enabledMap = data.builtinEnabled && typeof data.builtinEnabled === "object" ? data.builtinEnabled : {};
    const synced = Array.isArray(data.syncedMods) ? data.syncedMods : [];
    const custom = Array.isArray(data.customMods) ? data.customMods : [];

    const fromSynced = synced.map((mod) => {
      const enabled = Object.prototype.hasOwnProperty.call(enabledMap, mod.id)
        ? enabledMap[mod.id] !== false
        : mod.enabled !== false;
      return { ...mod, enabled };
    });

    return [...fromSynced, ...custom];
  }

  function apply() {
    chrome.storage.local.get(["customMods", "syncedMods", "builtinEnabled"], (data) => {
      const mods = collectMods(data);
      const active = new Set();

      for (const mod of mods) {
        const css = String(mod.css || "");
        if (!mod.enabled || !css.trim() || !SAI.urlMatches(location.href, mod.matches)) continue;
        active.add(mod.id);
        const id = "sai-mod-css-" + mod.id;
        let style = document.getElementById(id);
        if (!style) {
          style = document.createElement("style");
          style.id = id;
          (document.head || document.documentElement).appendChild(style);
        }
        if (style.textContent !== css) style.textContent = css;
      }

      document.querySelectorAll('style[id^="sai-mod-css-"], style[id^="sai-custom-"]').forEach((style) => {
        const id = style.id.startsWith("sai-mod-css-")
          ? style.id.slice("sai-mod-css-".length)
          : style.id.slice("sai-custom-".length);
        if (!active.has(id)) style.remove();
      });
    });
  }

  apply();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.customMods || changes.syncedMods || changes.builtinEnabled)) apply();
  });
})();
