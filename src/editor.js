const params = new URLSearchParams(location.search);
const editingId = params.get("id");
const title = document.querySelector("#title");
const form = document.querySelector("#form");
const message = document.querySelector("#message");
const removeButton = document.querySelector("#remove");

const fields = {
  name: document.querySelector("#name"),
  matches: document.querySelector("#matches"),
  css: document.querySelector("#css"),
  js: document.querySelector("#js"),
  enabled: document.querySelector("#enabled"),
  mainWorld: document.querySelector("#mainWorld"),
};

document.querySelector("#back").addEventListener("click", () => {
  location.href = "popup.html";
});

removeButton.addEventListener("click", removeMod);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  save();
});

load();

async function load() {
  if (!editingId) return;
  title.textContent = "Edit mod";
  removeButton.hidden = false;
  const data = await SAI.storageGet("customMods");
  const mod = (data.customMods || []).find((item) => item.id === editingId);
  if (!mod) {
    show("This mod no longer exists.", "error");
    return;
  }
  fields.name.value = mod.name || "";
  fields.matches.value = (mod.matches || []).join("\n");
  fields.css.value = mod.css || "";
  fields.js.value = mod.js || "";
  fields.enabled.checked = !!mod.enabled;
  fields.mainWorld.checked = !!mod.mainWorld;
}

async function save() {
  clearMessage();
  let matches;
  try {
    matches = SAI.normalizeMatchList(fields.matches.value);
  } catch (error) {
    show(error.message, "error");
    return;
  }

  const name = fields.name.value.trim();
  const css = fields.css.value;
  const js = fields.js.value;
  if (!name) {
    show("Give the mod a name.", "error");
    return;
  }
  if (!css.trim() && !js.trim()) {
    show("Paste some CSS or JavaScript.", "error");
    return;
  }

  const data = await SAI.storageGet("customMods");
  const mods = Array.isArray(data.customMods) ? [...data.customMods] : [];
  const now = Date.now();
  const mod = {
    id: editingId || "custom-" + crypto.randomUUID(),
    name,
    enabled: fields.enabled.checked,
    matches,
    css,
    js,
    mainWorld: fields.mainWorld.checked,
    updatedAt: now,
  };

  const index = mods.findIndex((item) => item.id === mod.id);
  if (index >= 0) mods[index] = { ...mods[index], ...mod };
  else mods.push({ ...mod, createdAt: now });

  try {
    await SAI.storageSet({ customMods: mods });
  } catch (error) {
    show(error.message, "error");
    return;
  }

  const status = await syncScripts();
  if (js.trim() && status?.needsPermission) {
    show("CSS saved. " + status.message, "error");
    return;
  }
  if (status?.errors?.length) {
    const own = status.errors.find((error) => error.id === mod.id);
    show(own ? "Mod saved, but the script was not registered: " + own.message : "Mod saved.", own ? "error" : "ok");
    return;
  }
  show("Saved. Reload the site tab if you changed the JavaScript.", "ok");
  if (!editingId) {
    history.replaceState(null, "", "editor.html?id=" + encodeURIComponent(mod.id));
    title.textContent = "Edit mod";
    removeButton.hidden = false;
  }
}

async function removeMod() {
  if (!editingId) return;
  const data = await SAI.storageGet("customMods");
  const mods = (data.customMods || []).filter((mod) => mod.id !== editingId);
  await SAI.storageSet({ customMods: mods });
  await syncScripts();
  location.href = "popup.html";
}

function syncScripts() {
  if (!chrome.runtime?.sendMessage) return Promise.resolve(null);
  return chrome.runtime.sendMessage({ type: "sync-user-scripts" });
}

function show(text, kind) {
  message.hidden = false;
  message.className = kind;
  message.textContent = text;
}

function clearMessage() {
  message.hidden = true;
  message.textContent = "";
  message.className = "";
}
