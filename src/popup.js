const modsRoot = document.querySelector("#mods");
const modsEmpty = document.querySelector("#mods-empty");
const customRoot = document.querySelector("#custom");
const empty = document.querySelector("#empty");
const versionLine = document.querySelector("#version-line");
const updateStatus = document.querySelector("#update-status");
const updateActions = document.querySelector("#update-actions");
const updateButton = document.querySelector("#update");
const downloadButton = document.querySelector("#download");
const openGithubButton = document.querySelector("#open-github");

let latestUrls = SAI.updateUrls();

document.querySelector("#create").addEventListener("click", () => openEditor(""));
updateButton.addEventListener("click", runUpdate);
downloadButton.addEventListener("click", () => openUrl(latestUrls.downloadZipUrl));
openGithubButton.addEventListener("click", () => openUrl(latestUrls.repoUrl || latestUrls.releasesUrl));

renderVersions();
chrome.runtime.sendMessage({ type: "ensure-mods" }).finally(render);

if (globalThis.chrome?.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (
      area === "local" &&
      (changes.modEnabled || changes.customMods || changes.syncedMods || changes.lastUpdateCheck)
    ) {
      render();
    }
  });
}

async function render() {
  const data = await SAI.storageGet(["modEnabled", "builtinEnabled", "customMods", "syncedMods", "lastUpdateCheck"]);
  const enabled = SAI.modEnabledMap(
    SAI.mergeEnabledMaps(data.builtinEnabled, data.modEnabled),
    data.syncedMods
  );
  const custom = Array.isArray(data.customMods) ? data.customMods : [];
  const synced = Array.isArray(data.syncedMods) ? data.syncedMods : [];
  const last = data.lastUpdateCheck;

  renderVersions(last?.remoteVersion, last?.updateAvailable);

  if (last?.updateAvailable) updateActions.hidden = false;

  modsRoot.replaceChildren(
    ...synced.map((mod) =>
      modCard({
        title: mod.name,
        text: mod.description || summary(mod),
        chips: siteChips(mod),
        checked: enabled[mod.id] === true,
        onToggle: (value) => setModEnabled(mod.id, value),
      })
    )
  );
  modsEmpty.hidden = synced.length > 0;

  customRoot.replaceChildren(
    ...custom.map((mod) =>
      modCard({
        title: mod.name,
        text: summary(mod),
        chips: (mod.matches || []).slice(0, 3),
        checked: !!mod.enabled,
        edit: true,
        onToggle: (value) => setCustomEnabled(mod.id, value),
        onEdit: () => openEditor(mod.id),
      })
    )
  );
  empty.hidden = custom.length > 0;
}

function siteChips(mod) {
  const sites = (mod.matches || []).map((pattern) => {
    try {
      return pattern.replace(/^\*:\/\//, "").replace(/\/\*$/, "");
    } catch {
      return pattern;
    }
  });
  return sites.slice(0, 2);
}

function summary(mod) {
  const parts = [];
  if (String(mod.css || "").trim()) parts.push("CSS");
  if (String(mod.js || "").trim()) parts.push(mod.mainWorld ? "Page JS" : "JS");
  return parts.length ? parts.join(" · ") : "Empty mod";
}

function modCard({ title, text, chips, checked, edit, onToggle, onEdit }) {
  const article = document.createElement("article");
  article.className = "mod";

  const main = document.createElement("div");
  main.className = "mod-main";
  const heading = document.createElement("h2");
  heading.textContent = title;
  const description = document.createElement("p");
  description.textContent = text;
  main.append(heading, description);

  if (chips?.length) {
    const row = document.createElement("div");
    row.className = "chips";
    chips.forEach((chip) => {
      const span = document.createElement("span");
      span.className = "chip";
      span.textContent = chip;
      row.append(span);
    });
    main.append(row);
  }

  const actions = document.createElement("div");
  actions.className = "mod-actions";
  actions.append(toggle(checked, onToggle));
  if (edit) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "linkish";
    button.textContent = "Edit";
    button.addEventListener("click", onEdit);
    actions.append(button);
  }

  article.append(main, actions);
  return article;
}

function toggle(checked, onToggle) {
  const label = document.createElement("label");
  label.className = "switch";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", () => onToggle(input.checked));
  const knob = document.createElement("span");
  label.append(input, knob);
  return label;
}

async function setModEnabled(id, value) {
  const data = await SAI.storageGet(["modEnabled", "builtinEnabled", "syncedMods"]);
  const synced = Array.isArray(data.syncedMods) ? data.syncedMods : [];
  const map = SAI.modEnabledMap(
    SAI.mergeEnabledMaps(data.builtinEnabled, data.modEnabled),
    synced
  );
  map[id] = value === true;

  // Only one player-bar layout at a time.
  if (value === true && SAI.BUILTIN_IDS.includes(id)) {
    for (const other of SAI.BUILTIN_IDS) {
      if (other !== id) map[other] = false;
    }
  }

  const nextSynced = synced.map((mod) => ({
    ...mod,
    enabled: map[mod.id] === true,
  }));
  await SAI.storageSet({
    modEnabled: map,
    builtinEnabled: map,
    syncedMods: nextSynced,
  });

  const sync = await chrome.runtime.sendMessage({ type: "sync-user-scripts" }).catch(() => null);
  if (value === true && sync?.needsPermission) {
    showUpdateStatus(sync.message || "Turn on Allow user scripts for SAI Mods.", "error");
    updateActions.hidden = false;
  } else if (value === true && sync?.errors?.length) {
    showUpdateStatus(sync.errors.map((item) => item.message).join(" "), "error");
    updateActions.hidden = false;
  }

  await reloadMatchingTabs(nextSynced.find((mod) => mod.id === id) || { matches: ["*://music.youtube.com/*"] });
}

async function setCustomEnabled(id, value) {
  const data = await SAI.storageGet("customMods");
  const mods = Array.isArray(data.customMods) ? data.customMods : [];
  const next = mods.map((mod) => (mod.id === id ? { ...mod, enabled: value } : mod));
  await SAI.storageSet({ customMods: next });
}

async function reloadMatchingTabs(mod) {
  if (!chrome.tabs?.query) return;
  const patterns = mod?.matches?.length ? mod.matches : ["*://music.youtube.com/*"];
  try {
    const tabs = await chrome.tabs.query({ url: patterns });
    await Promise.all(
      tabs
        .filter((tab) => typeof tab.id === "number")
        .map((tab) => chrome.tabs.reload(tab.id).catch(() => {}))
    );
  } catch {
    /* ignore */
  }
}

async function runUpdate() {
  updateButton.disabled = true;
  updateButton.textContent = "Updating…";
  showUpdateStatus("Fetching configs from GitHub…", "pending");
  try {
    const result = await chrome.runtime.sendMessage({ type: "check-updates" });
    if (!result?.ok) {
      showUpdateStatus(result?.error || "Update check failed.", "error");
      updateActions.hidden = false;
      latestUrls = result?.urls || SAI.updateUrls();
      return;
    }

    latestUrls = result.urls || SAI.updateUrls();
    const syncedLine = result.remoteModsSynced === 1 ? "1 mod synced" : `${result.remoteModsSynced} mods synced`;

    if (result.updateAvailable) {
      updateActions.hidden = false;
      showUpdateStatus(
        `Mods synced (${syncedLine}). Extension package ${result.localVersion} → ${result.remoteVersion} is optional — Download ZIP only if the popup/loader itself changed.`,
        "ok"
      );
    } else {
      updateActions.hidden = false;
      showUpdateStatus(`Mods synced from GitHub (${result.localVersion}). ${syncedLine}.`, "ok");
    }
    await chrome.runtime.sendMessage({ type: "sync-user-scripts" }).catch(() => null);
    await reloadMatchingTabs({ matches: ["*://music.youtube.com/*"] });
    await render();
  } catch (error) {
    showUpdateStatus(error?.message || String(error), "error");
    updateActions.hidden = false;
    latestUrls = SAI.updateUrls();
  } finally {
    updateButton.disabled = false;
    updateButton.textContent = "Update";
  }
}

function renderVersions(remoteVersion, updateAvailable) {
  const pills = [versionPill("Installed", SAI.localVersion())];
  if (remoteVersion) pills.push(versionPill("GitHub", remoteVersion, updateAvailable));
  versionLine.replaceChildren(...pills);
}

function versionPill(label, value, highlight) {
  const pill = document.createElement("span");
  pill.className = highlight ? "ver-pill is-new" : "ver-pill";
  const name = document.createElement("span");
  name.textContent = label;
  const version = document.createElement("b");
  version.textContent = value;
  pill.append(name, version);
  return pill;
}

function showUpdateStatus(text, kind) {
  updateStatus.hidden = false;
  updateStatus.className = "update-status " + (kind || "");
  updateStatus.textContent = text;
}

function openUrl(url) {
  if (!url) return;
  if (chrome.tabs?.create) chrome.tabs.create({ url });
  else window.open(url, "_blank", "noopener,noreferrer");
}

function openEditor(id) {
  const page = "editor.html" + (id ? "?id=" + encodeURIComponent(id) : "");
  if (chrome.runtime?.getURL && chrome.tabs?.create) {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/" + page) });
    return;
  }
  location.href = page;
}
