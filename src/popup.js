const builtinRoot = document.querySelector("#builtin");
const remoteRoot = document.querySelector("#remote");
const customRoot = document.querySelector("#custom");
const empty = document.querySelector("#empty");
const remoteEmpty = document.querySelector("#remote-empty");
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

versionLine.textContent = "Installed " + SAI.localVersion();
render();

if (globalThis.chrome?.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (
      area === "local" &&
      (changes.builtinEnabled || changes.customMods || changes.remoteMods || changes.lastUpdateCheck)
    ) {
      render();
    }
  });
}

async function render() {
  const data = await SAI.storageGet(["builtinEnabled", "customMods", "remoteMods", "lastUpdateCheck"]);
  const enabled = SAI.builtinEnabledMap(data.builtinEnabled);
  const custom = Array.isArray(data.customMods) ? data.customMods : [];
  const remote = Array.isArray(data.remoteMods) ? data.remoteMods : [];
  const last = data.lastUpdateCheck;

  versionLine.textContent = last?.remoteVersion
    ? `Installed ${SAI.localVersion()} · GitHub ${last.remoteVersion}`
    : `Installed ${SAI.localVersion()}`;

  if (last?.updateAvailable) {
    updateActions.hidden = false;
  }

  builtinRoot.replaceChildren(
    ...SAI.BUILTIN_MODS.map((mod) =>
      modCard({
        title: mod.name,
        text: mod.description,
        chips: mod.sites,
        checked: enabled[mod.id] !== false,
        onToggle: (value) => setBuiltin(mod.id, value),
      })
    )
  );

  remoteRoot.replaceChildren(
    ...remote.map((mod) =>
      modCard({
        title: mod.name,
        text: mod.description || summary(mod),
        chips: ["GitHub", ...(mod.matches || []).slice(0, 2)],
        checked: !!mod.enabled,
        onToggle: (value) => setRemoteEnabled(mod.id, value),
      })
    )
  );
  remoteEmpty.hidden = remote.length > 0;

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

async function setBuiltin(id, value) {
  const data = await SAI.storageGet("builtinEnabled");
  const map = SAI.builtinEnabledMap(data.builtinEnabled);
  map[id] = value;
  await SAI.storageSet({ builtinEnabled: map });
}

async function setCustomEnabled(id, value) {
  const data = await SAI.storageGet("customMods");
  const mods = Array.isArray(data.customMods) ? data.customMods : [];
  const next = mods.map((mod) => (mod.id === id ? { ...mod, enabled: value } : mod));
  await SAI.storageSet({ customMods: next });
}

async function setRemoteEnabled(id, value) {
  const data = await SAI.storageGet("remoteMods");
  const mods = Array.isArray(data.remoteMods) ? data.remoteMods : [];
  const next = mods.map((mod) => (mod.id === id ? { ...mod, enabled: value } : mod));
  await SAI.storageSet({ remoteMods: next });
}

async function runUpdate() {
  updateButton.disabled = true;
  updateButton.textContent = "Updating…";
  showUpdateStatus("Checking GitHub and syncing remote mods…", "pending");
  try {
    const result = await chrome.runtime.sendMessage({ type: "check-updates" });
    if (!result?.ok) {
      showUpdateStatus(result?.error || "Update check failed.", "error");
      updateActions.hidden = false;
      latestUrls = result?.urls || SAI.updateUrls();
      return;
    }

    latestUrls = result.urls || SAI.updateUrls();
    const remoteLine =
      result.remoteModsSynced === 1
        ? "1 remote mod synced"
        : `${result.remoteModsSynced} remote mods synced`;

    if (result.updateAvailable) {
      updateActions.hidden = false;
      showUpdateStatus(
        `Update available: ${result.localVersion} → ${result.remoteVersion}. ${remoteLine}. Download the ZIP, replace this folder, then Reload on chrome://extensions.`,
        "ok"
      );
    } else {
      updateActions.hidden = false;
      showUpdateStatus(
        `You are on the latest package (${result.localVersion}). ${remoteLine}.`,
        "ok"
      );
    }
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
