(() => {
  const MOD_ID = "ytmusic-classic";
  const STYLE_ID = "sai-ytm-classic-css";
  const homes = new Map();
  let observer = null;
  let scheduled = false;
  let enabled = false;

  const CSS = `
    html.sai-ytm-classic #player-bar-background,
    html.sai-ytm-classic ytmusic-app-layout,
    :host(.sai-classic-on),
    html.sai-ytm-classic ytmusic-miniplayer.sai-classic-on {
      overflow: visible !important;
    }

    :host(.sai-classic-on),
    html.sai-ytm-classic ytmusic-miniplayer.sai-classic-on {
      position: relative !important;
      display: block !important;
      height: 72px !important;
      min-height: 72px !important;
      max-height: 72px !important;
      box-sizing: border-box !important;
    }

    :host-context(html.sai-ytm-classic) .ytMusicMiniPlayerProgressBarWrapper,
    html.sai-ytm-classic .sai-classic-on .ytMusicMiniPlayerProgressBarWrapper {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      width: auto !important;
      height: auto !important;
      margin: 0 !important;
      z-index: 5 !important;
      pointer-events: none !important;
    }

    :host-context(html.sai-ytm-classic) .ytMusicMiniPlayerProgressBar,
    html.sai-ytm-classic .sai-classic-on .ytMusicMiniPlayerProgressBar {
      width: 100% !important;
      margin: 0 !important;
      pointer-events: auto !important;
      cursor: pointer;
    }

    :host-context(html.sai-ytm-classic) .sai-classic-row,
    html.sai-ytm-classic .sai-classic-row {
      display: flex !important;
      align-items: center !important;
      height: 72px !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 0 8px 0 4px !important;
      gap: 12px !important;
      position: relative !important;
      z-index: 1 !important;
      overflow: visible !important;
    }

    :host-context(html.sai-ytm-classic) .sai-left,
    :host-context(html.sai-ytm-classic) .sai-right,
    html.sai-ytm-classic .sai-left,
    html.sai-ytm-classic .sai-right {
      flex: 1 1 0 !important;
      display: flex !important;
      align-items: center !important;
      min-width: 0 !important;
      overflow: visible !important;
    }

    :host-context(html.sai-ytm-classic) .sai-left,
    html.sai-ytm-classic .sai-left {
      justify-content: flex-start !important;
    }

    :host-context(html.sai-ytm-classic) .sai-right,
    html.sai-ytm-classic .sai-right {
      justify-content: flex-end !important;
    }

    :host-context(html.sai-ytm-classic) .sai-middle,
    html.sai-ytm-classic .sai-middle {
      flex: 0 1 auto !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4px !important;
      min-width: 0 !important;
      max-width: 46% !important;
      overflow: visible !important;
    }

    :host-context(html.sai-ytm-classic) .sai-vacated,
    html.sai-ytm-classic .sai-vacated {
      display: none !important;
    }

    :host-context(html.sai-ytm-classic) .ytmusicPlayerControlsControlButton:not([hidden]) button,
    :host-context(html.sai-ytm-classic) .ytMusicMiniPlayerVolumeWrapper button,
    :host-context(html.sai-ytm-classic) .sai-middle .ytMusicMiniPlayerActionBar button,
    :host-context(html.sai-ytm-classic) .sai-middle [client-ve-type="7591"] button,
    html.sai-ytm-classic .sai-classic-on .ytmusicPlayerControlsControlButton:not([hidden]) button,
    html.sai-ytm-classic .sai-classic-on .ytMusicMiniPlayerVolumeWrapper button,
    html.sai-ytm-classic .sai-classic-on .sai-middle .ytMusicMiniPlayerActionBar button,
    html.sai-ytm-classic .sai-classic-on .sai-middle [client-ve-type="7591"] button {
      width: 36px !important;
      height: 36px !important;
      min-width: 36px !important;
      min-height: 36px !important;
      padding: 0 !important;
      border-radius: 50% !important;
      background: transparent !important;
      box-shadow: none !important;
    }

    :host-context(html.sai-ytm-classic) .ytmusicPlayerControlsControlButton:not([hidden]) button:hover,
    :host-context(html.sai-ytm-classic) .ytMusicMiniPlayerVolumeWrapper button:hover,
    :host-context(html.sai-ytm-classic) .sai-middle .ytMusicMiniPlayerActionBar button:hover,
    :host-context(html.sai-ytm-classic) .sai-middle [client-ve-type="7591"] button:hover,
    html.sai-ytm-classic .sai-classic-on .ytmusicPlayerControlsControlButton:not([hidden]) button:hover,
    html.sai-ytm-classic .sai-classic-on .ytMusicMiniPlayerVolumeWrapper button:hover,
    html.sai-ytm-classic .sai-classic-on .sai-middle .ytMusicMiniPlayerActionBar button:hover,
    html.sai-ytm-classic .sai-classic-on .sai-middle [client-ve-type="7591"] button:hover {
      background: rgba(255, 255, 255, 0.1) !important;
    }

    :host-context(html.sai-ytm-classic) .ytmusicPlayerControlsPlayPauseButton.ytmusicPlayerControlsControlButton:not([hidden]) button,
    html.sai-ytm-classic .sai-classic-on .ytmusicPlayerControlsPlayPauseButton.ytmusicPlayerControlsControlButton:not([hidden]) button {
      width: 48px !important;
      height: 48px !important;
      min-width: 48px !important;
      min-height: 48px !important;
    }

    :host-context(html.sai-ytm-classic) .ytmusicPlayerControlsControlButton .ytIconWrapperHost,
    :host-context(html.sai-ytm-classic) .ytMusicMiniPlayerVolumeWrapper .ytIconWrapperHost,
    :host-context(html.sai-ytm-classic) .sai-middle .ytIconWrapperHost,
    :host-context(html.sai-ytm-classic) .sai-middle yt-icon,
    html.sai-ytm-classic .sai-classic-on .ytmusicPlayerControlsControlButton .ytIconWrapperHost,
    html.sai-ytm-classic .sai-classic-on .ytMusicMiniPlayerVolumeWrapper .ytIconWrapperHost,
    html.sai-ytm-classic .sai-classic-on .sai-middle .ytIconWrapperHost,
    html.sai-ytm-classic .sai-classic-on .sai-middle yt-icon {
      width: 24px !important;
      height: 24px !important;
    }

    :host-context(html.sai-ytm-classic) .ytmusicPlayerControlsPlayPauseButton .ytIconWrapperHost,
    html.sai-ytm-classic .sai-classic-on .ytmusicPlayerControlsPlayPauseButton .ytIconWrapperHost {
      width: 28px !important;
      height: 28px !important;
    }

    :host-context(html.sai-ytm-classic) .ytMusicMiniPlayerTimeInfo,
    html.sai-ytm-classic .sai-classic-on .ytMusicMiniPlayerTimeInfo {
      margin: 0 8px 0 10px !important;
      font-size: 12px !important;
      line-height: 1.2 !important;
      color: rgb(170, 170, 170) !important;
      white-space: nowrap !important;
      font-variant-numeric: tabular-nums;
      flex: none !important;
    }

    :host-context(html.sai-ytm-classic) ytmusic-track-info,
    :host-context(html.sai-ytm-classic) .ytmusicTrackInfoHost,
    html.sai-ytm-classic .sai-classic-on ytmusic-track-info,
    html.sai-ytm-classic .sai-classic-on .ytmusicTrackInfoHost {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 16px !important;
      min-width: 0 !important;
      max-width: 360px !important;
      flex: 0 1 auto !important;
    }

    :host-context(html.sai-ytm-classic) .ytmusicTrackInfoThumbnailWrapper,
    html.sai-ytm-classic .sai-classic-on .ytmusicTrackInfoThumbnailWrapper {
      width: 40px !important;
      height: 40px !important;
      flex: none !important;
      border-radius: 2px !important;
      overflow: hidden !important;
    }

    :host-context(html.sai-ytm-classic) .ytmusicTrackInfoThumbnail,
    html.sai-ytm-classic .sai-classic-on .ytmusicTrackInfoThumbnail {
      width: 40px !important;
      height: 40px !important;
      object-fit: cover !important;
      border-radius: 2px !important;
    }

    :host-context(html.sai-ytm-classic) .ytmusicTrackInfoContentInfoWrapper,
    html.sai-ytm-classic .sai-classic-on .ytmusicTrackInfoContentInfoWrapper {
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      min-width: 0 !important;
      gap: 2px !important;
    }

    :host-context(html.sai-ytm-classic) .ytmusicTrackInfoTitle,
    html.sai-ytm-classic .sai-classic-on .ytmusicTrackInfoTitle {
      font-size: 16px !important;
      line-height: 1.2 !important;
      color: #fff !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      max-width: 280px !important;
    }

    :host-context(html.sai-ytm-classic) .ytmusicTrackInfoByline,
    html.sai-ytm-classic .sai-classic-on .ytmusicTrackInfoByline {
      font-size: 12px !important;
      line-height: 1.2 !important;
      color: rgb(144, 144, 144) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      max-width: 280px !important;
    }

    :host-context(html.sai-ytm-classic) .sai-middle .ytMusicMiniPlayerActionBar,
    :host-context(html.sai-ytm-classic) .sai-middle [client-ve-type="7591"],
    :host-context(html.sai-ytm-classic) .ytMusicMiniPlayerVolumeWrapper,
    html.sai-ytm-classic .sai-middle .ytMusicMiniPlayerActionBar,
    html.sai-ytm-classic .sai-middle [client-ve-type="7591"],
    html.sai-ytm-classic .ytMusicMiniPlayerVolumeWrapper {
      flex: none !important;
      position: relative !important;
      overflow: visible !important;
    }

    :host-context(html.sai-ytm-classic) .ytMusicMiniPlayerActionBar .ytSpecButtonShapeNextButtonTextContent,
    :host-context(.ytMusicMiniPlayerActionBar) .ytSpecButtonShapeNextButtonTextContent,
    html.sai-ytm-classic .sai-classic-on .ytMusicMiniPlayerActionBar .ytSpecButtonShapeNextButtonTextContent {
      display: none !important;
    }

    :host-context(.ytMusicMiniPlayerActionBar) button,
    :host-context(.ytMusicMiniPlayerVolumeWrapper) button,
    :host-context([client-ve-type="7591"]) button {
      width: 36px !important;
      height: 36px !important;
      min-width: 36px !important;
      min-height: 36px !important;
      padding: 0 !important;
      border-radius: 50% !important;
      background: transparent !important;
      box-shadow: none !important;
    }

    :host(.ytmusicTrackInfoHost),
    :host(ytmusic-track-info) {
      max-width: 360px;
    }

    :host(.ytmusicTrackInfoHost) .ytmusicTrackInfoThumbnailWrapper,
    :host(ytmusic-track-info) .ytmusicTrackInfoThumbnailWrapper,
    :host(.ytmusicTrackInfoHost) .ytmusicTrackInfoThumbnail,
    :host(ytmusic-track-info) .ytmusicTrackInfoThumbnail {
      width: 40px !important;
      height: 40px !important;
      border-radius: 2px !important;
      object-fit: cover !important;
    }

    :host(.ytmusicTrackInfoHost) .ytmusicTrackInfoTitle,
    :host(ytmusic-track-info) .ytmusicTrackInfoTitle {
      font-size: 16px !important;
      color: #fff !important;
    }

    :host(.ytmusicTrackInfoHost) .ytmusicTrackInfoByline,
    :host(ytmusic-track-info) .ytmusicTrackInfoByline {
      font-size: 12px !important;
      color: rgb(144, 144, 144) !important;
    }

    :host-context(html.sai-ytm-classic) .ytSegmentedLikeDislikeButtonViewModelSegmentedButtonsWrapper,
    html.sai-ytm-classic .sai-classic-on .ytSegmentedLikeDislikeButtonViewModelSegmentedButtonsWrapper {
      display: flex !important;
      align-items: center !important;
      background: transparent !important;
      gap: 0 !important;
    }

    :host-context(html.sai-ytm-classic) .ytMusicMiniPlayerVolumePopup,
    html.sai-ytm-classic .sai-classic-on .ytMusicMiniPlayerVolumePopup {
      z-index: 40 !important;
    }
  `;

  function readEnabled(data) {
    const map = Object.assign(
      {},
      data.builtinEnabled && typeof data.builtinEnabled === "object" ? data.builtinEnabled : null,
      data.modEnabled && typeof data.modEnabled === "object" ? data.modEnabled : null
    );
    return map[MOD_ID] === true;
  }

  function applyEnabled(on) {
    if (on) {
      if (enabled) {
        schedule();
        return;
      }
      enabled = true;
      document.documentElement.classList.add("sai-ytm-classic");
      start();
      return;
    }
    if (!enabled) return;
    enabled = false;
    stop();
  }

  function boot() {
    injectStyle(document.head || document.documentElement);
    const storage = globalThis.chrome?.storage?.local;
    if (!storage) return;
    storage.get(["modEnabled", "builtinEnabled"], (data) => {
      applyEnabled(readEnabled(data));
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (!changes.modEnabled && !changes.builtinEnabled) return;
      storage.get(["modEnabled", "builtinEnabled"], (data) => {
        applyEnabled(readEnabled(data));
      });
    });
  }

  function start() {
    if (!observer) {
      observer = new MutationObserver(() => schedule());
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    schedule();
  }

  function stop() {
    observer?.disconnect();
    observer = null;
    restore();
    document.documentElement.classList.remove("sai-ytm-classic");
  }

  function schedule() {
    if (!enabled || scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      if (enabled) apply();
    });
  }

  function injectStyle(root) {
    if (!root) return;
    if (root.getElementById?.(STYLE_ID) || root.querySelector?.("#" + STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    root.appendChild(style);
  }

  function walkShadows(node, visit) {
    if (!node?.querySelectorAll) return;
    node.querySelectorAll("*").forEach((el) => {
      if (!el.shadowRoot) return;
      visit(el.shadowRoot);
      walkShadows(el.shadowRoot, visit);
    });
  }

  function queryDeep(root, selector, acc) {
    if (!root?.querySelectorAll) return acc || null;
    if (acc) {
      root.querySelectorAll(selector).forEach((el) => acc.push(el));
      root.querySelectorAll("*").forEach((el) => {
        if (el.shadowRoot) queryDeep(el.shadowRoot, selector, acc);
      });
      return acc;
    }
    const direct = root.querySelector(selector);
    if (direct) return direct;
    for (const el of root.querySelectorAll("*")) {
      if (!el.shadowRoot) continue;
      const found = queryDeep(el.shadowRoot, selector);
      if (found) return found;
    }
    return null;
  }

  function findPlayer() {
    return (
      document.querySelector("ytmusic-miniplayer") ||
      document.querySelector("ytmusic-app")?.shadowRoot?.querySelector("ytmusic-miniplayer") ||
      null
    );
  }

  function placementRoot(player) {
    if (player.querySelector(".ytMusicMiniPlayerProgressBarWrapper, .ytMusicMiniPlayerLeftSection")) {
      return player;
    }
    if (player.shadowRoot?.querySelector(".ytMusicMiniPlayerProgressBarWrapper, .ytMusicMiniPlayerLeftSection")) {
      return player.shadowRoot;
    }
    return player.shadowRoot || player;
  }

  function q(root, selector) {
    return root.querySelector?.(selector) || queryDeep(root, selector);
  }

  function remember(el) {
    if (!el || homes.has(el)) return;
    const parent = el.parentNode;
    if (!parent || parent.classList?.contains("sai-left") || parent.classList?.contains("sai-middle") || parent.classList?.contains("sai-right")) {
      return;
    }
    homes.set(el, {
      parent,
      index: [...parent.childNodes].indexOf(el),
    });
  }

  function placeSequence(container, elements) {
    let previous = null;
    elements.forEach((el) => {
      if (!el) return;
      remember(el);
      const inPlace =
        el.parentNode === container &&
        (previous ? previous.nextSibling === el : container.firstChild === el);
      if (!inPlace) {
        try {
          if (previous) previous.after(el);
          else container.prepend(el);
        } catch {
          return;
        }
      }
      previous = el;
    });
  }

  function ensureColumns(root) {
    let row = root.querySelector(":scope > .sai-classic-row");
    if (!row) {
      row = document.createElement("div");
      row.className = "sai-classic-row";
      row.append(column("sai-left"), column("sai-middle"), column("sai-right"));
      root.appendChild(row);
    }
    return {
      row,
      left: row.querySelector(".sai-left"),
      middle: row.querySelector(".sai-middle"),
      right: row.querySelector(".sai-right"),
    };
  }

  function column(className) {
    const el = document.createElement("div");
    el.className = className;
    return el;
  }

  function findMore(root) {
    const all = queryDeep(root, '[client-ve-type="7591"]', []);
    return (
      all.find((el) => el.parentElement?.classList?.contains("ytMusicMiniPlayerRightSection")) ||
      all.find((el) => el.parentElement?.classList?.contains("sai-middle")) ||
      all.find((el) => !el.closest(".ytMusicMiniPlayerVolumePopup")) ||
      null
    );
  }

  function sectionHas(section, selectors) {
    return selectors.some((selector) => q(section, selector));
  }

  function vacate(root) {
    [".ytMusicMiniPlayerLeftSection", ".ytMusicMiniPlayerMiddleSection", ".ytMusicMiniPlayerRightSection"].forEach(
      (selector) => {
        const section = q(root, selector);
        if (!section) return;
        const busy = sectionHas(section, [
          ".ytmusicPlayerControlsPreviousButton",
          ".ytmusicPlayerControlsPlayPauseButton",
          ".ytmusicPlayerControlsNextButton",
          "ytmusic-track-info",
          ".ytMusicMiniPlayerTimeInfo",
          ".ytMusicMiniPlayerActionBar",
          ".ytMusicMiniPlayerVolumeWrapper",
          ".ytmusicPlayerControlsRepeatButton",
          ".ytmusicPlayerControlsShuffleButton",
          '[client-ve-type="7591"]',
        ]);
        section.classList.toggle("sai-vacated", !busy);
      }
    );
  }

  function apply() {
    homes.forEach((_home, el) => {
      if (!el.isConnected) homes.delete(el);
    });
    const player = findPlayer();
    if (!player) return;
    player.classList.add("sai-classic-on");
    injectStyle(document.head || document.documentElement);
    if (player.shadowRoot) injectStyle(player.shadowRoot);
    walkShadows(player, injectStyle);

    const root = placementRoot(player);
    const columns = ensureColumns(root);
    const previous = q(root, ".ytmusicPlayerControlsPreviousButton");
    const seekBack = q(root, ".ytmusicPlayerControlsSeekBackwardButton");
    const play = q(root, ".ytmusicPlayerControlsPlayPauseButton");
    const seekForward = q(root, ".ytmusicPlayerControlsSeekForwardButton");
    const next = q(root, ".ytmusicPlayerControlsNextButton");
    const time = q(root, ".ytMusicMiniPlayerTimeInfo");
    const track = q(root, "ytmusic-track-info") || q(root, ".ytMusicMiniPlayerTrackInfo");
    const likes = q(root, ".ytMusicMiniPlayerActionBar") || q(root, "yt-video-action-bar-view-model");
    const more = findMore(root);
    const volume = q(root, ".ytMusicMiniPlayerVolumeWrapper");
    const rate = q(root, ".ytmusicPlayerControlsPlaybackRateButton");
    const repeat = q(root, ".ytmusicPlayerControlsRepeatButton");
    const shuffle = q(root, ".ytmusicPlayerControlsShuffleButton");

    placeSequence(columns.left, [previous, seekBack, play, seekForward, next, time]);
    placeSequence(columns.middle, [track, likes, more]);
    placeSequence(columns.right, [volume, rate, repeat, shuffle]);
    vacate(root);
  }

  function restore() {
    document.querySelectorAll(".sai-vacated").forEach((el) => el.classList.remove("sai-vacated"));
    const groups = new Map();
    homes.forEach((home, el) => {
      if (!home.parent) return;
      if (!groups.has(home.parent)) groups.set(home.parent, []);
      groups.get(home.parent).push({ el, index: home.index });
    });
    groups.forEach((items, parent) => {
      items.sort((a, b) => a.index - b.index);
      items.forEach((item) => {
        try {
          const ref = parent.childNodes[item.index] || null;
          parent.insertBefore(item.el, ref && ref !== item.el ? ref : null);
        } catch {
          try {
            parent.appendChild(item.el);
          } catch {
            /* node already moved by the page */
          }
        }
      });
    });
    homes.clear();
    const player = findPlayer();
    [document, player, player?.shadowRoot].forEach((root) => {
      root?.querySelectorAll?.(".sai-classic-row").forEach((row) => row.remove());
      root?.querySelectorAll?.(".sai-vacated").forEach((el) => el.classList.remove("sai-vacated"));
      root?.querySelectorAll?.(".sai-classic-on").forEach((el) => el.classList.remove("sai-classic-on"));
    });
    player?.classList.remove("sai-classic-on");
  }

  boot();
})();
