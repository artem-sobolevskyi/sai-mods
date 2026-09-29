(() => {
  const MOD_ID = "ytmusic-modern";
  const STYLE_ID = "sai-ytm-modern-css";
  const homes = new Map();
  let observer = null;
  let scheduled = false;
  let enabled = false;

  const CSS = `
    html.sai-ytm-modern #player-bar-background {
      position: fixed !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      top: auto !important;
      inset: auto 0 0 0 !important;
      width: 100% !important;
      height: 72px !important;
      max-height: 72px !important;
      z-index: 4 !important;
      transform: none !important;
      overflow: visible !important;
      background: rgb(33, 33, 33) !important;
    }

    html.sai-ytm-modern ytmusic-player-bar.sai-modern-on {
      position: fixed !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      top: auto !important;
      inset: auto 0 0 0 !important;
      width: 100% !important;
      height: 72px !important;
      min-height: 72px !important;
      max-height: 72px !important;
      z-index: 5 !important;
      transform: none !important;
      display: block !important;
      box-sizing: border-box !important;
      background: rgb(33, 33, 33) !important;
      overflow: visible !important;
      margin: 0 !important;
    }

    html.sai-ytm-modern ytmusic-player-bar.sai-modern-on #progress-bar {
      position: absolute !important;
      top: -2px !important;
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      height: 20px !important;
      margin: 0 !important;
      padding: 0 !important;
      z-index: 20 !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      --paper-slider-container-color: rgba(255, 255, 255, 0.28);
      --paper-slider-active-color: #ff0033;
      --paper-slider-secondary-color: rgba(255, 255, 255, 0.4);
      --paper-slider-knob-color: #ff0033;
      --paper-slider-knob-start-color: #ff0033;
      --paper-slider-knob-start-border-color: #ff0033;
      --paper-progress-container-color: rgba(255, 255, 255, 0.28);
      --paper-progress-active-color: #ff0033;
      --paper-progress-secondary-color: rgba(255, 255, 255, 0.4);
    }

    html.sai-ytm-modern ytmusic-player-bar.sai-modern-on #progress-bar #sliderContainer,
    html.sai-ytm-modern ytmusic-player-bar.sai-modern-on #progress-bar .bar-container {
      height: 20px !important;
      margin: 0 !important;
      opacity: 1 !important;
    }

    html.sai-ytm-modern ytmusic-player-bar.sai-modern-on #progress-bar #sliderBar {
      height: 3px !important;
      margin: 8.5px 0 !important;
      opacity: 1 !important;
    }

    html.sai-ytm-modern ytmusic-player-bar.sai-modern-on #progress-bar #progressContainer {
      height: 3px !important;
      min-height: 3px !important;
      background: rgba(255, 255, 255, 0.28) !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    html.sai-ytm-modern ytmusic-player-bar.sai-modern-on #progress-bar:hover #sliderBar,
    html.sai-ytm-modern ytmusic-player-bar.sai-modern-on #progress-bar:hover #progressContainer {
      height: 4px !important;
    }

    html.sai-ytm-modern ytmusic-player-bar.sai-modern-on #progress-bar #primaryProgress {
      background: linear-gradient(90deg, #ff0033 80%, #ff2791) !important;
      background-color: #ff0033 !important;
      height: 100% !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    html.sai-ytm-modern ytmusic-player-bar.sai-modern-on #progress-bar #secondaryProgress {
      background: rgba(255, 255, 255, 0.4) !important;
      height: 100% !important;
      opacity: 1 !important;
    }

    html.sai-ytm-modern ytmusic-player-bar.sai-modern-on #progress-bar .slider-knob-inner {
      background: #ff0033 !important;
      border: 0 !important;
      box-shadow: none !important;
      width: 12px !important;
      height: 12px !important;
      z-index: 21 !important;
    }

    html.sai-ytm-modern ytmusic-player-bar.sai-modern-on #progress-bar #sliderKnob {
      z-index: 21 !important;
      margin-top: 0 !important;
    }

    html.sai-ytm-modern .sai-modern-row {
      display: flex !important;
      align-items: center !important;
      height: 72px !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 8px 12px 0 !important;
      gap: 16px !important;
      position: relative !important;
      z-index: 1 !important;
      overflow: visible !important;
      margin: 0 !important;
      top: auto !important;
      bottom: auto !important;
      transform: none !important;
    }

    html.sai-ytm-modern .sai-modern-left,
    html.sai-ytm-modern .sai-modern-right {
      flex: 1 1 0 !important;
      display: flex !important;
      align-items: center !important;
      min-width: 0 !important;
      overflow: visible !important;
    }

    html.sai-ytm-modern .sai-modern-left {
      justify-content: flex-start !important;
      gap: 14px !important;
    }

    html.sai-ytm-modern .sai-modern-right {
      justify-content: flex-end !important;
      gap: 4px !important;
    }

    html.sai-ytm-modern .sai-modern-middle {
      flex: 0 0 auto !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 2px !important;
      overflow: visible !important;
    }

    html.sai-ytm-modern .sai-modern-vacated {
      display: none !important;
    }

    html.sai-ytm-modern .sai-modern-on .thumbnail-image-wrapper {
      width: 48px !important;
      height: 48px !important;
      flex: none !important;
      border-radius: 4px !important;
      overflow: hidden !important;
    }

    html.sai-ytm-modern .sai-modern-on .thumbnail-image-wrapper .image {
      width: 48px !important;
      height: 48px !important;
      object-fit: cover !important;
      border-radius: 4px !important;
    }

    html.sai-ytm-modern .sai-modern-on .content-info-wrapper {
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      gap: 2px !important;
      margin: 0 !important;
      min-width: 0 !important;
      max-width: 280px !important;
    }

    html.sai-ytm-modern .sai-modern-on .content-info-wrapper .title {
      font-size: 14px !important;
      line-height: 1.25 !important;
      color: #fff !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    html.sai-ytm-modern .sai-modern-on .content-info-wrapper .subtitle,
    html.sai-ytm-modern .sai-modern-on .content-info-wrapper .byline {
      font-size: 12px !important;
      line-height: 1.25 !important;
      color: rgb(170, 170, 170) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    html.sai-ytm-modern .sai-modern-middle yt-icon-button,
    html.sai-ytm-modern .sai-modern-right yt-icon-button,
    html.sai-ytm-modern .sai-modern-right ytmusic-like-button-renderer,
    html.sai-ytm-modern .sai-modern-right ytmusic-menu-renderer {
      margin: 0 !important;
    }

    html.sai-ytm-modern .sai-modern-middle yt-icon-button,
    html.sai-ytm-modern .sai-modern-right yt-icon-button {
      width: 40px !important;
      height: 40px !important;
    }

    html.sai-ytm-modern .sai-modern-middle #play-pause-button {
      width: 48px !important;
      height: 48px !important;
      margin: 0 4px !important;
    }

    html.sai-ytm-modern .sai-modern-middle #play-pause-button button,
    html.sai-ytm-modern .sai-modern-middle yt-icon-button button,
    html.sai-ytm-modern .sai-modern-right yt-icon-button button {
      width: 100% !important;
      height: 100% !important;
      border-radius: 50% !important;
      background: transparent !important;
    }

    html.sai-ytm-modern .sai-modern-middle #play-pause-button button {
      background: rgba(255, 255, 255, 0.1) !important;
    }

    html.sai-ytm-modern .sai-modern-middle yt-icon-button:hover button,
    html.sai-ytm-modern .sai-modern-right yt-icon-button:hover button {
      background: rgba(255, 255, 255, 0.08) !important;
    }

    html.sai-ytm-modern .sai-modern-on .time-info {
      margin: 0 10px 0 4px !important;
      font-size: 12px !important;
      color: rgb(170, 170, 170) !important;
      white-space: nowrap !important;
      font-variant-numeric: tabular-nums;
      flex: none !important;
    }

    html.sai-ytm-modern .sai-modern-on ytmusic-like-button-renderer {
      display: flex !important;
      align-items: center !important;
      margin-right: 2px !important;
    }

    html.sai-ytm-modern .sai-volume-wrap {
      position: relative !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: visible !important;
      flex: none !important;
    }

    html.sai-ytm-modern .sai-volume-wrap #volume-slider {
      position: absolute !important;
      left: 50% !important;
      bottom: calc(100% + 12px) !important;
      transform: translateX(-50%) rotate(-90deg) !important;
      transform-origin: center center !important;
      width: 108px !important;
      height: 32px !important;
      margin: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition: opacity 0.12s ease;
      z-index: 50 !important;
      background: rgb(48, 48, 48) !important;
      border-radius: 16px !important;
      padding: 0 10px !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
      overflow: visible !important;
      --paper-slider-container-color: #c8c8c8;
      --paper-progress-container-color: #c8c8c8;
      --paper-slider-active-color: #ffffff;
      --paper-progress-active-color: #ffffff;
      --paper-slider-knob-color: #ffffff;
      --paper-slider-knob-start-color: #ffffff;
      --paper-slider-knob-start-border-color: #ffffff;
    }

    html.sai-ytm-modern .sai-volume-wrap:hover #volume-slider,
    html.sai-ytm-modern .sai-volume-wrap:focus-within #volume-slider,
    html.sai-ytm-modern .sai-volume-wrap.sai-volume-open #volume-slider {
      opacity: 1 !important;
      pointer-events: auto !important;
    }

    html.sai-ytm-modern .sai-volume-wrap #volume-slider #sliderContainer,
    html.sai-ytm-modern .sai-volume-wrap #volume-slider .bar-container {
      height: 32px !important;
      opacity: 1 !important;
    }

    html.sai-ytm-modern .sai-volume-wrap #volume-slider #sliderBar {
      height: 4px !important;
      margin: 14px 0 !important;
      opacity: 1 !important;
    }

    html.sai-ytm-modern .sai-volume-wrap #volume-slider #progressContainer {
      height: 4px !important;
      min-height: 4px !important;
      background: #c8c8c8 !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    html.sai-ytm-modern .sai-volume-wrap #volume-slider #primaryProgress {
      background: #ffffff !important;
      height: 100% !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    html.sai-ytm-modern .sai-volume-wrap #volume-slider .slider-knob-inner {
      background: #ffffff !important;
      border: 0 !important;
      width: 12px !important;
      height: 12px !important;
    }

    html.sai-ytm-modern .sai-modern-on [hidden] {
      display: none !important;
    }

    html.sai-ytm-modern .sai-modern-on .expand-button,
    html.sai-ytm-modern .sai-modern-on .toggle-player-page-button,
    html.sai-ytm-modern .sai-modern-on .exit-fullscreen-button,
    html.sai-ytm-modern .sai-modern-on ytmusic-player-expanding-menu,
    html.sai-ytm-modern .sai-modern-on #expand-repeat,
    html.sai-ytm-modern .sai-modern-on #expand-shuffle,
    html.sai-ytm-modern .sai-modern-on #expand-volume,
    html.sai-ytm-modern .sai-modern-on #expand-volume-slider {
      display: none !important;
    }

    html.sai-ytm-modern .sai-modern-middle > .rewind-button[hidden],
    html.sai-ytm-modern .sai-modern-middle > yt-icon-button[hidden],
    html.sai-ytm-modern .sai-modern-middle > .spinner-container[hidden],
    html.sai-ytm-modern .sai-modern-middle > ytmusic-playback-rate-renderer[hidden] {
      display: none !important;
    }
  `;

  function isEnabledFlag(stored) {
    return !stored || stored[MOD_ID] !== false;
  }

  function boot() {
    injectStyle(document.head || document.documentElement);
    const storage = globalThis.chrome?.storage?.local;
    if (!storage) {
      enabled = true;
      document.documentElement.classList.add("sai-ytm-modern");
      start();
      return;
    }
    storage.get("builtinEnabled", (data) => {
      if (isEnabledFlag(data.builtinEnabled)) {
        enabled = true;
        document.documentElement.classList.add("sai-ytm-modern");
        start();
      } else {
        enabled = false;
        stop();
      }
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes.builtinEnabled) return;
      if (isEnabledFlag(changes.builtinEnabled.newValue)) {
        enabled = true;
        document.documentElement.classList.add("sai-ytm-modern");
        start();
      } else {
        enabled = false;
        stop();
      }
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
    document.documentElement.classList.remove("sai-ytm-modern");
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
    let style = root.getElementById?.(STYLE_ID) || root.querySelector?.("#" + STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      root.appendChild(style);
    }
    if (style.textContent !== CSS) style.textContent = CSS;
  }

  function findBar() {
    return document.querySelector("ytmusic-player-bar");
  }

  function remember(el) {
    if (!el || homes.has(el)) return;
    const parent = el.parentNode;
    if (
      !parent ||
      parent.classList?.contains("sai-modern-left") ||
      parent.classList?.contains("sai-modern-middle") ||
      parent.classList?.contains("sai-modern-right") ||
      parent.classList?.contains("sai-volume-wrap")
    ) {
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

  function column(className) {
    const el = document.createElement("div");
    el.className = className;
    return el;
  }

  function ensureColumns(bar) {
    let row = bar.querySelector(":scope > .sai-modern-row");
    if (!row) {
      row = document.createElement("div");
      row.className = "sai-modern-row";
      row.append(column("sai-modern-left"), column("sai-modern-middle"), column("sai-modern-right"));
      bar.appendChild(row);
    }
    return {
      row,
      left: row.querySelector(".sai-modern-left"),
      middle: row.querySelector(".sai-modern-middle"),
      right: row.querySelector(".sai-modern-right"),
    };
  }

  function ensureVolumeWrap(right, volumeBtn, volumeSlider) {
    let wrap = right.querySelector(":scope > .sai-volume-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "sai-volume-wrap";
      right.appendChild(wrap);
    }
    if (volumeSlider && volumeSlider.parentNode !== wrap) {
      remember(volumeSlider);
      wrap.appendChild(volumeSlider);
    }
    if (volumeBtn && volumeBtn.parentNode !== wrap) {
      remember(volumeBtn);
      wrap.appendChild(volumeBtn);
    }
    if (!wrap.dataset.saiBound) {
      wrap.dataset.saiBound = "1";
      const open = () => wrap.classList.add("sai-volume-open");
      const close = () => wrap.classList.remove("sai-volume-open");
      wrap.addEventListener("mouseenter", open);
      wrap.addEventListener("mouseleave", close);
      wrap.addEventListener("focusin", open);
      wrap.addEventListener("focusout", (event) => {
        if (!wrap.contains(event.relatedTarget)) close();
      });
    }
    return wrap;
  }

  function vacate(bar) {
    ["#left-controls", ".middle-controls", "#right-controls"].forEach((selector) => {
      const section = bar.querySelector(selector);
      if (!section) return;
      const busy = [
        ".previous-button",
        "#play-pause-button",
        ".next-button",
        ".time-info",
        ".thumbnail-image-wrapper",
        ".content-info-wrapper",
        "#like-button-renderer",
        "ytmusic-menu-renderer.menu",
        "#volume-slider",
        ".volume",
        ".repeat",
        ".shuffle",
        ".sai-modern-row",
      ].some((sel) => section.querySelector(sel));
      section.classList.toggle("sai-modern-vacated", !busy);
    });
  }

  function apply() {
    homes.forEach((_home, el) => {
      if (!el.isConnected) homes.delete(el);
    });

    if (document.querySelector("ytmusic-miniplayer")) return;

    const bar = findBar();
    if (!bar) return;

    bar.classList.add("sai-modern-on");
    injectStyle(document.head || document.documentElement);

    const columns = ensureColumns(bar);
    const thumb = bar.querySelector(".thumbnail-image-wrapper");
    const content = bar.querySelector(".content-info-wrapper");
    const shuffle =
      bar.querySelector(".right-controls-buttons > .shuffle") ||
      bar.querySelector(".sai-modern-middle > .shuffle:not(#expand-shuffle)") ||
      bar.querySelector(".shuffle:not(#expand-shuffle)");
    const rate = bar.querySelector("ytmusic-playback-rate-renderer");
    const rewind = bar.querySelector(".rewind-button");
    const previous = bar.querySelector(".previous-button");
    const play = bar.querySelector("#play-pause-button");
    const spinner = bar.querySelector(".spinner-container");
    const next = bar.querySelector(".next-button");
    const repeat =
      bar.querySelector(".right-controls-buttons > .repeat") ||
      bar.querySelector(".sai-modern-middle > .repeat:not(#expand-repeat)") ||
      [...bar.querySelectorAll("yt-icon-button.repeat")].find((el) => el.id !== "expand-repeat");
    const time = bar.querySelector(".time-info");
    const likes = bar.querySelector("#like-button-renderer") || bar.querySelector("ytmusic-like-button-renderer");
    const menu = bar.querySelector("ytmusic-menu-renderer.menu") || bar.querySelector(".middle-controls-buttons ytmusic-menu-renderer");
    const volumeBtn = bar.querySelector(".right-controls-buttons > .volume") || bar.querySelector(".volume:not(#expand-volume)");
    const volumeSlider = bar.querySelector("#volume-slider:not(#expand-volume-slider)");

    const seekForward =
      bar.querySelector(
        ".left-controls-buttons > yt-icon-button[aria-label*='30'], .left-controls-buttons > yt-icon-button[title*='30']"
      ) || null;

    placeSequence(columns.left, [thumb, content]);
    placeSequence(columns.middle, [shuffle, rate, rewind, previous, play, spinner, seekForward, next, repeat]);
    dedupeMiddleControls(columns.middle, { shuffle, repeat });
    styleProgressBar(bar);
    placeSequence(columns.right, [time, likes]);
    const wrap = ensureVolumeWrap(columns.right, volumeBtn, volumeSlider);
    if (menu) {
      remember(menu);
      try {
        if (wrap) wrap.after(menu);
        else columns.right.appendChild(menu);
      } catch {
        /* ignore */
      }
    }
    vacate(bar);
  }

  function dedupeMiddleControls(middle, keep) {
    if (!middle) return;
    middle.querySelectorAll(".repeat, #expand-repeat").forEach((el) => {
      if (el.id === "expand-repeat" || (keep.repeat && el !== keep.repeat)) {
        el.style.setProperty("display", "none", "important");
      }
    });
    middle.querySelectorAll(".shuffle, #expand-shuffle").forEach((el) => {
      if (el.id === "expand-shuffle" || (keep.shuffle && el !== keep.shuffle)) {
        el.style.setProperty("display", "none", "important");
      }
    });
  }

  function styleProgressBar(bar) {
    const progress = bar.querySelector("#progress-bar");
    if (!progress) return;

    const cssText = `
      #sliderContainer, .bar-container { height: 20px !important; opacity: 1 !important; }
      #sliderBar { height: 3px !important; margin: 8.5px 0 !important; opacity: 1 !important; }
      #progressContainer {
        height: 3px !important;
        min-height: 3px !important;
        background: rgba(255, 255, 255, 0.28) !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      #primaryProgress {
        background: linear-gradient(90deg, #ff0033 80%, #ff2791) !important;
        height: 100% !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      #secondaryProgress {
        background: rgba(255, 255, 255, 0.4) !important;
        height: 100% !important;
        opacity: 1 !important;
      }
      .slider-knob-inner {
        background: #ff0033 !important;
        border: 0 !important;
        width: 12px !important;
        height: 12px !important;
      }
    `;

    const targets = [progress];
    if (progress.shadowRoot) targets.push(progress.shadowRoot);
    progress.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) targets.push(el.shadowRoot);
    });

    targets.forEach((root) => {
      if (!root.querySelector) return;
      let style = root.querySelector("#sai-progress-fix");
      if (!style) {
        style = document.createElement("style");
        style.id = "sai-progress-fix";
        root.appendChild(style);
      }
      style.textContent = cssText;
    });

    const vol = bar.querySelector(".sai-volume-wrap #volume-slider");
    if (!vol) return;
    const volCss = `
      #sliderContainer, .bar-container { height: 32px !important; opacity: 1 !important; }
      #sliderBar { height: 4px !important; margin: 14px 0 !important; opacity: 1 !important; }
      #progressContainer {
        height: 4px !important;
        min-height: 4px !important;
        background: #c8c8c8 !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      #primaryProgress {
        background: #ffffff !important;
        height: 100% !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      .slider-knob-inner {
        background: #ffffff !important;
        border: 0 !important;
        width: 12px !important;
        height: 12px !important;
      }
    `;
    const volTargets = [vol];
    if (vol.shadowRoot) volTargets.push(vol.shadowRoot);
    vol.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) volTargets.push(el.shadowRoot);
    });
    volTargets.forEach((root) => {
      if (!root.querySelector) return;
      let style = root.querySelector("#sai-volume-fix");
      if (!style) {
        style = document.createElement("style");
        style.id = "sai-volume-fix";
        root.appendChild(style);
      }
      style.textContent = volCss;
    });
  }

  function restore() {
    document.querySelectorAll(".sai-modern-vacated").forEach((el) => el.classList.remove("sai-modern-vacated"));
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
            /* node already moved */
          }
        }
      });
    });
    homes.clear();
    document.querySelectorAll(".sai-modern-row, .sai-volume-wrap").forEach((el) => {
      while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
      el.remove();
    });
    document.querySelectorAll(".sai-modern-on").forEach((el) => el.classList.remove("sai-modern-on"));
  }

  boot();
})();
