(() => {
  function collectMods(data) {
    return [
      ...(Array.isArray(data.customMods) ? data.customMods : []),
      ...(Array.isArray(data.remoteMods) ? data.remoteMods : []),
    ];
  }

  function apply() {
    chrome.storage.local.get(["customMods", "remoteMods"], (data) => {
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
    if (area === "local" && (changes.customMods || changes.remoteMods)) apply();
  });
})();
