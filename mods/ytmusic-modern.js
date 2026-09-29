(() => {
  const MOD_ID = "ytmusic-modern";
  const STYLE_ID = "sai-ytm-modern-css";
  const homes = new Map();
  let observer = null;
  let scheduled = false;
  let enabled = false;

  const SLIDER_BOX = 32;

  const PROGRESS_LOOK = {
    bar: 3,
    hoverBar: 5,
    knob: 12,
    inset: 0,
    track: "rgba(255, 255, 255, 0.22)",
    secondary: "rgba(255, 255, 255, 0.38)",
    active: "linear-gradient(90deg, #ff0033 80%, #ff2791)",
    knobColor: "#ff0033",
    knobOnHover: true,
  };

  const VOLUME_LOOK = {
    bar: 4,
    hoverBar: 4,
    knob: 12,
    inset: 10,
    track: "rgba(255, 255, 255, 0.28)",
    secondary: "transparent",
    active: "#e6e6e6",
    knobColor: "#ffffff",
    knobOnHover: false,
  };

  // tp-yt-paper-slider centers the bar with vertical padding on #sliderBar (that padding is
  // also the click/drag target) and hangs the knob from a zero-height container at the top,
  // so every size must be derived from one box height to keep bar, knob and hit area aligned.
  function sliderCss(prefix, look) {
    const p = prefix ? prefix + " " : "";
    const hover = prefix ? `${prefix}:hover ` : ":host(:hover) ";
    const pad = (bar) => (SLIDER_BOX - bar) / 2;
    return `
    ${p}#sliderContainer {
      height: ${SLIDER_BOX}px !important;
      margin: 0 ${look.inset}px !important;
      width: auto !important;
      opacity: 1 !important;
    }
    ${p}.bar-container {
      top: 0 !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: auto !important;
      opacity: 1 !important;
    }
    ${p}#sliderBar {
      width: 100% !important;
      height: auto !important;
      margin: 0 !important;
      padding: ${pad(look.bar)}px 0 !important;
      box-sizing: content-box !important;
      opacity: 1 !important;
      cursor: pointer !important;
    }
    ${hover}#sliderBar {
      padding: ${pad(look.hoverBar)}px 0 !important;
    }
    ${p}#progressContainer {
      height: ${look.bar}px !important;
      min-height: 0 !important;
      margin: 0 !important;
      border-radius: ${look.hoverBar}px !important;
      overflow: hidden !important;
      background: ${look.track} !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    ${hover}#progressContainer {
      height: ${look.hoverBar}px !important;
    }
    ${p}#primaryProgress {
      height: 100% !important;
      background: ${look.active} !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    ${p}#secondaryProgress {
      height: 100% !important;
      background: ${look.secondary} !important;
      opacity: 1 !important;
    }
    ${p}#sliderKnobContainer {
      height: 0 !important;
      margin: 0 !important;
    }
    ${p}#sliderKnob {
      top: 0 !important;
      width: ${SLIDER_BOX}px !important;
      height: ${SLIDER_BOX}px !important;
      margin: 0 0 0 -${SLIDER_BOX / 2}px !important;
    }
    ${p}.slider-knob-inner {
      width: ${look.knob}px !important;
      height: ${look.knob}px !important;
      margin: ${pad(look.knob)}px !important;
      border: 0 !important;
      box-shadow: none !important;
      box-sizing: border-box !important;
      border-radius: 50% !important;
      background: ${look.knobColor} !important;
      transform: scale(${look.knobOnHover ? 0 : 1}) !important;
      transition: transform 0.12s ease !important;
    }
    ${hover}.slider-knob-inner {
      transform: scale(1) !important;
    }
    ${p}.slider-knob-inner::before,
    ${p}.slider-knob-inner::after,
    ${p}#ink,
    ${p}paper-ripple,
    ${p}.slider-markers {
      display: none !important;
    }
    `;
  }

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
      top: -${SLIDER_BOX / 2 - PROGRESS_LOOK.bar / 2}px !important;
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      height: ${SLIDER_BOX}px !important;
      margin: 0 !important;
      padding: 0 !important;
      transform: none !important;
      z-index: 20 !important;
      opacity: 1 !important;
      visibility: visible !important;
      display: block !important;
      pointer-events: auto !important;
    }

    ${sliderCss("html.sai-ytm-modern ytmusic-player-bar.sai-modern-on #progress-bar", PROGRESS_LOOK)}

    html.sai-ytm-modern .sai-modern-row {
      display: flex !important;
      align-items: center !important;
      height: 72px !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 4px 12px 0 !important;
      gap: 16px !important;
      position: absolute !important;
      left: 0 !important;
      right: 0 !important;
      top: 0 !important;
      bottom: auto !important;
      z-index: 1 !important;
      overflow: visible !important;
      margin: 0 !important;
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

    html.sai-ytm-modern .sai-volume-pop {
      position: absolute !important;
      left: 50% !important;
      bottom: calc(100% + 8px) !important;
      width: 40px !important;
      height: 132px !important;
      transform: translateX(-50%) !important;
      box-sizing: border-box !important;
      background: rgb(40, 40, 40) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-radius: 20px !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      transition: opacity 0.12s ease, visibility 0.12s ease !important;
      z-index: 50 !important;
      overflow: visible !important;
    }

    html.sai-ytm-modern .sai-volume-pop::after {
      content: "" !important;
      position: absolute !important;
      left: 0 !important;
      right: 0 !important;
      top: 100% !important;
      height: 12px !important;
    }

    html.sai-ytm-modern .sai-volume-wrap.sai-volume-open .sai-volume-pop {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    html.sai-ytm-modern .sai-volume-wrap.sai-volume-open .sai-volume-pop #volume-slider,
    html.sai-ytm-modern .sai-volume-wrap.sai-volume-open .sai-volume-pop #volume-slider * {
      pointer-events: auto !important;
    }

    html.sai-ytm-modern .sai-volume-pop #volume-slider {
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      width: 108px !important;
      min-width: 108px !important;
      max-width: 108px !important;
      height: ${SLIDER_BOX}px !important;
      margin: 0 !important;
      padding: 0 !important;
      transform: translate(-50%, -50%) rotate(-90deg) !important;
      transform-origin: center center !important;
      background: transparent !important;
      opacity: 1 !important;
      visibility: visible !important;
      display: block !important;
      overflow: visible !important;
    }

    ${sliderCss("html.sai-ytm-modern .sai-volume-pop #volume-slider", VOLUME_LOOK)}

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
      document.documentElement.classList.add("sai-ytm-modern");
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
      parent.classList?.contains("sai-volume-wrap") ||
      parent.classList?.contains("sai-volume-pop")
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

  // paper-slider maps pointer X against the bar's untransformed width, so the rotated slider
  // is driven by translating the pointer's vertical position into the X it expects.
  function bindVerticalVolume(pop) {
    let dragging = false;
    let forwarding = false;
    const sliderBar = () => pop.querySelector("#volume-slider #sliderBar");

    function pointFor(ratio) {
      const bar = sliderBar();
      const rect = bar.getBoundingClientRect();
      const clamped = Math.min(1, Math.max(0, ratio));
      return { x: rect.left + clamped * bar.offsetWidth, y: rect.top + rect.height / 2 };
    }

    function ratioFromEvent(event) {
      const rect = sliderBar().getBoundingClientRect();
      return rect.height ? (rect.bottom - event.clientY) / rect.height : 0;
    }

    function send(type, target, ratio) {
      const { x, y } = pointFor(ratio);
      forwarding = true;
      try {
        target.dispatchEvent(
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            clientX: x,
            clientY: y,
            screenX: x,
            screenY: y,
            button: 0,
            buttons: type === "mouseup" ? 0 : 1,
          })
        );
      } finally {
        forwarding = false;
      }
    }

    // Polymer gestures listen for mousedown in the document capture phase, so only a window
    // capture listener runs early enough to replace the real event.
    window.addEventListener(
      "mousedown",
      (event) => {
        if (forwarding || event.button !== 0 || !pop.isConnected) return;
        if (!(event.target instanceof Node) || !pop.contains(event.target) || !sliderBar()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        dragging = true;
        send("mousedown", sliderBar(), ratioFromEvent(event));
      },
      true
    );

    // Polymer derives a tap from the real click and paper-slider would re-apply the raw X,
    // so the click never reaches the page's listeners.
    window.addEventListener(
      "click",
      (event) => {
        if (forwarding || !pop.isConnected) return;
        if (!(event.target instanceof Node) || !pop.contains(event.target)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true
    );

    // Polymer's synthetic tap bubbles to ytmusic-player-bar, which toggles the player page.
    pop.addEventListener("tap", (event) => event.stopPropagation());

    window.addEventListener(
      "mousemove",
      (event) => {
        if (!dragging || forwarding) return;
        event.stopImmediatePropagation();
        send("mousemove", document, ratioFromEvent(event));
      },
      true
    );

    window.addEventListener(
      "mouseup",
      (event) => {
        if (!dragging || forwarding) return;
        dragging = false;
        event.stopImmediatePropagation();
        send("mouseup", document, ratioFromEvent(event));
      },
      true
    );

    pop.addEventListener(
      "wheel",
      (event) => {
        const slider = pop.querySelector("#volume-slider");
        if (!slider || !sliderBar()) return;
        event.preventDefault();
        const current = Number(slider.getAttribute("aria-valuenow")) || 0;
        const next = (current + (event.deltaY < 0 ? 5 : -5)) / 100;
        send("mousedown", sliderBar(), next);
        send("mouseup", document, next);
      },
      { passive: false }
    );
  }

  function ensureVolumeWrap(right, volumeBtn, volumeSlider) {
    let wrap = right.querySelector(":scope > .sai-volume-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "sai-volume-wrap";
      right.appendChild(wrap);
    }
    let pop = wrap.querySelector(":scope > .sai-volume-pop");
    if (!pop) {
      pop = document.createElement("div");
      pop.className = "sai-volume-pop";
      bindVerticalVolume(pop);
      wrap.prepend(pop);
    }
    if (volumeSlider && volumeSlider.parentNode !== pop) {
      remember(volumeSlider);
      pop.appendChild(volumeSlider);
    }
    if (volumeBtn && volumeBtn.parentNode !== wrap) {
      remember(volumeBtn);
      wrap.appendChild(volumeBtn);
    }
    if (!wrap.dataset.saiBound) {
      wrap.dataset.saiBound = "1";
      let closeTimer = 0;
      const open = () => {
        clearTimeout(closeTimer);
        wrap.classList.add("sai-volume-open");
      };
      const close = () => {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => wrap.classList.remove("sai-volume-open"), 250);
      };
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
        ".captions",
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
    const captions = bar.querySelector(".right-controls-buttons > .captions") || bar.querySelector("yt-icon-button.captions");
    placeSequence(columns.right, [time, likes, captions]);
    const wrap = ensureVolumeWrap(columns.right, volumeBtn, volumeSlider);
    styleProgressBar(bar);
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

  function styleSliderShadow(slider, styleId, look) {
    if (!slider) return;
    // Light-DOM <style> children leak page-wide under Shady DOM; only real shadow roots get one.
    slider.querySelectorAll(":scope > #sai-progress-fix, :scope > #sai-volume-fix").forEach((el) => el.remove());
    const roots = [];
    if (slider.shadowRoot) roots.push(slider.shadowRoot);
    slider.shadowRoot?.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) roots.push(el.shadowRoot);
    });
    const cssText = sliderCss("", look);
    roots.forEach((root) => {
      let style = root.querySelector(`#${styleId}`);
      if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        root.appendChild(style);
      }
      if (style.textContent !== cssText) style.textContent = cssText;
    });
  }

  function styleProgressBar(bar) {
    styleSliderShadow(bar.querySelector("#progress-bar"), "sai-progress-fix", PROGRESS_LOOK);
    styleSliderShadow(bar.querySelector(".sai-volume-pop #volume-slider"), "sai-volume-fix", VOLUME_LOOK);
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
    document
      .querySelectorAll(
        ".sai-modern-row, .sai-modern-left, .sai-modern-middle, .sai-modern-right, .sai-volume-wrap, .sai-volume-pop"
      )
      .forEach((el) => {
        while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
        el.remove();
      });
    document.querySelectorAll(".sai-modern-on").forEach((el) => el.classList.remove("sai-modern-on"));
    document.querySelectorAll("#progress-bar, #volume-slider").forEach((slider) => {
      [slider, slider.shadowRoot].forEach((root) => {
        root?.querySelectorAll?.("#sai-progress-fix, #sai-volume-fix").forEach((style) => style.remove());
      });
    });
  }

  boot();
})();
