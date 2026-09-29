# SAI Mods

Chrome extension for site appearance mods. Ships with YouTube Music player-bar layouts and a place to add your own CSS or JavaScript.

## Features

- **Classic player bar** — restyles the new YouTube Music miniplayer to the older layout (controls left, track center, volume right). Keeps the new volume popup above the button.
- **Modern player bar** — restyles the old YouTube Music player bar to the newer layout (track left, controls center, actions right).
- **Custom mods** — create your own CSS/JS mods for any site from the popup.
- **Updates** — check GitHub for a newer extension version, open the download zip / releases page, and sync remote mods without reinstalling.

## Install (unpacked)

1. Clone or download this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select this folder.
5. Open [music.youtube.com](https://music.youtube.com) and reload the tab.

Optional: for custom JavaScript mods, open the extension details and turn on **Allow user scripts**.

## Updates

In the extension popup click **Update**. That:

1. Fetches [`update.json`](./update.json) from GitHub
2. Downloads every listed mod script under [`mods/`](./mods/) (classic bar, modern bar, and extras)
3. Saves them into extension storage so pages pick them up after a tab refresh
4. If the GitHub package version is newer than your installed `manifest.json`, offers **Download ZIP** / **Open GitHub**

Chrome cannot overwrite an unpacked extension folder by itself. Config/mod code syncs live from GitHub; a newer extension shell still needs a manual ZIP replace + Reload on `chrome://extensions`.

## Mod files

Built-in layouts live in:

- `mods/ytmusic-classic.js`
- `mods/ytmusic-modern.js`

Edit those files, bump `version` in both `manifest.json` and `update.json`, push to `main`, then press **Update** in the popup.

## Create a custom mod

1. Open the popup → **Create mod**.
2. Set a name and match patterns (`music.youtube.com` or `*://example.com/*`).
3. Paste CSS and/or JavaScript.
4. Save. CSS applies immediately; JS needs Allow user scripts and a tab reload.

## Remote mods

Editors can add entries under `remoteMods` in [`update.json`](./update.json) on `main`. Users pick up those entries with **Update**. Remote mods support `css`, optional `js`, `matches`, and `enabledByDefault`.

## Permissions

- `storage` — save mod settings
- `userScripts` — run user-pasted JavaScript (optional until you use JS mods)
- Host access — apply mods on matched sites and fetch update metadata from GitHub

## Development

```bash
git clone https://github.com/artem-sobolevskyi/sai-mods.git
cd sai-mods
```

Load the folder as an unpacked extension. After code changes, press **Reload** on `chrome://extensions`, then refresh the target site.

Bump `version` in both `manifest.json` and `update.json` when you publish a new package.

## License

MIT
