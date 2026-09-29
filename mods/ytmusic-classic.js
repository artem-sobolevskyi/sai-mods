(() => {
  const MOD_ID = "ytmusic-classic";
  const STYLE_ID = "sai-ytm-classic-css";
  const homes = new Map();
  let observer = null;
  let scheduled = false;
  let enabled = false;

  const SLIDER_BOX = 32;
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
    ${p}.translucent-knob {
      display: none !important;
    }
    `;
  }

  const CSS = `
    html.sai-ytm-classic #player-bar-background,
    html.sai-ytm-classic ytmusic-app-layout,
    :host(.sai-classic-on),
    html.sai-ytm-classic ytmusic-miniplayer.sai-classic-on,
    html.sai-ytm-classic ytmusic-player-bar.sai-classic-on {
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

    html.sai-ytm-classic ytmusic-player-bar.sai-classic-on {
      position: relative !important;
      overflow: visible !important;
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

    html.sai-ytm-classic ytmusic-player-bar.sai-classic-on > .sai-classic-row {
      position: absolute !important;
      inset: 0 !important;
      height: 100% !important;
      padding: 0 12px !important;
      z-index: 20 !important;
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
      gap: 8px !important;
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
    html.sai-ytm-classic .sai-classic-on .sai-middle [client-ve-type="7591"] button,
    html.sai-ytm-classic .sai-classic-on .sai-left yt-icon-button button,
    html.sai-ytm-classic .sai-classic-on .sai-right yt-icon-button button,
    html.sai-ytm-classic .sai-classic-on .sai-middle yt-icon-button button,
    html.sai-ytm-classic .sai-classic-on .sai-volume-wrap yt-icon-button button {
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
    html.sai-ytm-classic .sai-classic-on .sai-middle [client-ve-type="7591"] button:hover,
    html.sai-ytm-classic .sai-classic-on .sai-left yt-icon-button:hover button,
    html.sai-ytm-classic .sai-classic-on .sai-right yt-icon-button:hover button,
    html.sai-ytm-classic .sai-classic-on .sai-middle yt-icon-button:hover button,
    html.sai-ytm-classic .sai-classic-on .sai-volume-wrap yt-icon-button:hover button {
      background: rgba(255, 255, 255, 0.1) !important;
    }

    :host-context(html.sai-ytm-classic) .ytmusicPlayerControlsPlayPauseButton.ytmusicPlayerControlsControlButton:not([hidden]) button,
    html.sai-ytm-classic .sai-classic-on .ytmusicPlayerControlsPlayPauseButton.ytmusicPlayerControlsControlButton:not([hidden]) button,
    html.sai-ytm-classic .sai-classic-on .sai-left #play-pause-button button {
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
    html.sai-ytm-classic .sai-classic-on .sai-middle yt-icon,
    html.sai-ytm-classic .sai-classic-on .sai-left yt-icon,
    html.sai-ytm-classic .sai-classic-on .sai-right yt-icon,
    html.sai-ytm-classic .sai-classic-on .sai-volume-wrap yt-icon {
      width: 24px !important;
      height: 24px !important;
    }

    :host-context(html.sai-ytm-classic) .ytmusicPlayerControlsPlayPauseButton .ytIconWrapperHost,
    html.sai-ytm-classic .sai-classic-on .ytmusicPlayerControlsPlayPauseButton .ytIconWrapperHost,
    html.sai-ytm-classic .sai-classic-on .sai-left #play-pause-button yt-icon {
      width: 28px !important;
      height: 28px !important;
    }

    :host-context(html.sai-ytm-classic) .ytMusicMiniPlayerTimeInfo,
    html.sai-ytm-classic .sai-classic-on .ytMusicMiniPlayerTimeInfo,
    html.sai-ytm-classic .sai-classic-on .sai-left .time-info {
      margin: 0 8px 0 10px !important;
      font-size: 12px !important;
      line-height: 1.2 !important;
      color: rgb(170, 170, 170) !important;
      white-space: nowrap !important;
      font-variant-numeric: tabular-nums;
      flex: none !important;
    }

    :host-context(html.sai-ytm-classic) .sai-middle ytmusic-track-info,
    :host-context(html.sai-ytm-classic) .sai-middle .ytmusicTrackInfoHost,
    :host-context(html.sai-ytm-classic) .sai-middle .ytMusicMiniPlayerTrackInfo,
    :host-context(html.sai-ytm-classic) .sai-middle [class*="TrackInfo"],
    html.sai-ytm-classic .sai-middle ytmusic-track-info,
    html.sai-ytm-classic .sai-middle .ytmusicTrackInfoHost,
    html.sai-ytm-classic .sai-middle .ytMusicMiniPlayerTrackInfo,
    html.sai-ytm-classic .sai-middle [class*="TrackInfo"],
    html.sai-ytm-classic .sai-middle .content-info-wrapper,
    html.sai-ytm-classic .sai-middle .thumbnail-image-wrapper {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 12px !important;
      min-width: 0 !important;
      max-width: 360px !important;
      flex: 0 1 auto !important;
      overflow: hidden !important;
    }

    html.sai-ytm-classic .sai-middle .content-info-wrapper {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 2px !important;
      max-width: 280px !important;
    }

    html.sai-ytm-classic .sai-middle .thumbnail-image-wrapper {
      width: 40px !important;
      height: 40px !important;
      flex: none !important;
      max-width: 40px !important;
      border-radius: 2px !important;
      overflow: hidden !important;
    }

    html.sai-ytm-classic .sai-middle .thumbnail-image-wrapper img,
    html.sai-ytm-classic .sai-middle .thumbnail-image-wrapper .image {
      width: 40px !important;
      height: 40px !important;
      object-fit: cover !important;
      border-radius: 2px !important;
    }

    html.sai-ytm-classic .sai-middle .content-info-wrapper .title {
      font-size: 16px !important;
      line-height: 1.2 !important;
      color: #fff !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      max-width: 280px !important;
    }

    html.sai-ytm-classic .sai-middle .content-info-wrapper .subtitle,
    html.sai-ytm-classic .sai-middle .content-info-wrapper .byline,
    html.sai-ytm-classic .sai-middle .content-info-wrapper .byline-wrapper {
      font-size: 12px !important;
      line-height: 1.2 !important;
      color: rgb(144, 144, 144) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      max-width: 280px !important;
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
    html.sai-ytm-classic .sai-classic-on .ytmusicTrackInfoTitle,
    html.sai-ytm-classic .sai-middle [class*="TrackInfoTitle"],
    html.sai-ytm-classic .sai-middle [class*="track-info"] .title {
      font-size: 16px !important;
      line-height: 1.2 !important;
      color: #fff !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      max-width: 280px !important;
    }

    :host-context(html.sai-ytm-classic) .ytmusicTrackInfoByline,
    html.sai-ytm-classic .sai-classic-on .ytmusicTrackInfoByline,
    html.sai-ytm-classic .sai-middle [class*="TrackInfoByline"],
    html.sai-ytm-classic .sai-middle [class*="track-info"] .subtitle {
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

    html.sai-ytm-classic .sai-volume-wrap {
      position: relative !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: visible !important;
      flex: none !important;
    }

    html.sai-ytm-classic .sai-volume-pop,
    html.sai-ytm-classic .ytMusicMiniPlayerVolumePopup.sai-volume-bound {
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

    html.sai-ytm-classic .sai-volume-pop::after,
    html.sai-ytm-classic .ytMusicMiniPlayerVolumePopup.sai-volume-bound::after {
      content: "" !important;
      position: absolute !important;
      left: 0 !important;
      right: 0 !important;
      top: 100% !important;
      height: 12px !important;
    }

    html.sai-ytm-classic .sai-volume-wrap.sai-volume-open .sai-volume-pop,
    html.sai-ytm-classic .sai-volume-wrap.sai-volume-open .ytMusicMiniPlayerVolumePopup.sai-volume-bound,
    html.sai-ytm-classic .ytMusicMiniPlayerVolumeWrapper.sai-volume-open .ytMusicMiniPlayerVolumePopup.sai-volume-bound {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    html.sai-ytm-classic .sai-volume-wrap.sai-volume-open .sai-volume-pop #volume-slider,
    html.sai-ytm-classic .sai-volume-wrap.sai-volume-open .sai-volume-pop #volume-slider *,
    html.sai-ytm-classic .sai-volume-open .ytMusicMiniPlayerVolumePopup tp-yt-paper-slider,
    html.sai-ytm-classic .sai-volume-open .ytMusicMiniPlayerVolumePopup tp-yt-paper-slider * {
      pointer-events: auto !important;
    }

    html.sai-ytm-classic .sai-volume-pop #volume-slider,
    html.sai-ytm-classic .ytMusicMiniPlayerVolumePopup.sai-volume-bound tp-yt-paper-slider,
    html.sai-ytm-classic .ytMusicMiniPlayerVolumePopup.sai-volume-bound #volume-slider {
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

    ${sliderCss("html.sai-ytm-classic .sai-volume-pop #volume-slider", VOLUME_LOOK)}
    ${sliderCss("html.sai-ytm-classic .ytMusicMiniPlayerVolumePopup.sai-volume-bound tp-yt-paper-slider", VOLUME_LOOK)}
    ${sliderCss("html.sai-ytm-classic .ytMusicMiniPlayerVolumePopup.sai-volume-bound #volume-slider", VOLUME_LOOK)}

    html.sai-ytm-classic .sai-classic-on [hidden] {
      display: none !important;
    }

    html.sai-ytm-classic ytmusic-player-bar.sai-classic-on .expand-button,
    html.sai-ytm-classic ytmusic-player-bar.sai-classic-on .toggle-player-page-button,
    html.sai-ytm-classic ytmusic-player-bar.sai-classic-on .exit-fullscreen-button,
    html.sai-ytm-classic ytmusic-player-bar.sai-classic-on ytmusic-player-expanding-menu,
    html.sai-ytm-classic ytmusic-player-bar.sai-classic-on #expand-repeat,
    html.sai-ytm-classic ytmusic-player-bar.sai-classic-on #expand-shuffle,
    html.sai-ytm-classic ytmusic-player-bar.sai-classic-on #expand-volume,
    html.sai-ytm-classic ytmusic-player-bar.sai-classic-on #expand-volume-slider,
    html.sai-ytm-classic ytmusic-player-bar.sai-classic-on #right-controls .captions,
    html.sai-ytm-classic ytmusic-player-bar.sai-classic-on .sai-vacated .captions {
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
    let style = root.getElementById?.(STYLE_ID) || root.querySelector?.("#" + STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      root.appendChild(style);
    }
    if (style.textContent !== CSS) style.textContent = CSS;
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
      document.querySelector("ytmusic-player-bar") ||
      null
    );
  }

  function isPlayerBar(player) {
    return player?.tagName === "YTMUSIC-PLAYER-BAR";
  }

  function placementRoot(player) {
    if (isPlayerBar(player)) return player;
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
    if (
      !parent ||
      parent.classList?.contains("sai-left") ||
      parent.classList?.contains("sai-middle") ||
      parent.classList?.contains("sai-right") ||
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

  function looksLikeTrack(el) {
    if (!el || el.classList?.contains("sai-classic-row")) return false;
    if (el.classList?.contains("ytMusicMiniPlayerActionBar")) return false;
    if (el.matches?.('[client-ve-type="7591"]')) return false;
    if (el.classList?.contains("ytMusicMiniPlayerVolumeWrapper")) return false;
    const cls = typeof el.className === "string" ? el.className : "";
    if (/TrackInfo|track-info|SongInfo|song-info|content-info/i.test(cls + " " + (el.tagName || ""))) {
      return true;
    }
    return !!(
      el.querySelector?.(".ytmusicTrackInfoTitle, [class*='TrackInfoTitle'], .title, img, yt-img-shadow") &&
      (el.textContent || "").trim().length > 0
    );
  }

  function findTrack(root) {
    const known =
      q(root, "ytmusic-track-info") ||
      q(root, ".ytmusicTrackInfoHost") ||
      q(root, ".ytMusicMiniPlayerTrackInfo") ||
      q(root, "[class*='TrackInfoHost']") ||
      q(root, "[class*='MiniPlayerTrackInfo']");
    if (known) return known;

    const mid = q(root, ".ytMusicMiniPlayerMiddleSection");
    if (mid) {
      for (const child of mid.children) {
        if (looksLikeTrack(child)) return child;
      }
      for (const child of mid.querySelectorAll(":scope > *")) {
        if (looksLikeTrack(child)) return child;
      }
    }
    return null;
  }

  function sectionHas(section, selectors) {
    return selectors.some((selector) => q(section, selector));
  }

  function vacateMini(root) {
    [".ytMusicMiniPlayerLeftSection", ".ytMusicMiniPlayerMiddleSection", ".ytMusicMiniPlayerRightSection"].forEach(
      (selector) => {
        const section = q(root, selector);
        if (!section) return;
        const busy = sectionHas(section, [
          ".ytmusicPlayerControlsPreviousButton",
          ".ytmusicPlayerControlsPlayPauseButton",
          ".ytmusicPlayerControlsNextButton",
          "ytmusic-track-info",
          ".ytmusicTrackInfoHost",
          ".ytMusicMiniPlayerTrackInfo",
          "[class*='TrackInfo']",
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

  function vacateBar(bar) {
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
        ".sai-classic-row",
      ].some((sel) => section.querySelector(sel));
      section.classList.toggle("sai-vacated", !busy);
    });
  }

  function bindVerticalVolume(pop) {
    if (pop.dataset.saiVolBound) return;
    pop.dataset.saiVolBound = "1";
    let dragging = false;
    let forwarding = false;
    const sliderBar = () =>
      pop.querySelector("#volume-slider #sliderBar") ||
      pop.querySelector("tp-yt-paper-slider #sliderBar") ||
      pop.querySelector("#sliderBar");

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
        const slider =
          pop.querySelector("#volume-slider") || pop.querySelector("tp-yt-paper-slider");
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

  function bindHoverOpen(wrap) {
    if (wrap.dataset.saiBound) return;
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
    bindHoverOpen(wrap);
    return wrap;
  }

  function ensureMiniVolume(volumeWrap) {
    if (!volumeWrap) return null;
    const pop =
      volumeWrap.querySelector(".ytMusicMiniPlayerVolumePopup") ||
      q(volumeWrap, ".ytMusicMiniPlayerVolumePopup");
    if (pop) {
      pop.classList.add("sai-volume-bound");
      bindVerticalVolume(pop);
      styleSliderShadow(
        pop.querySelector("tp-yt-paper-slider, #volume-slider"),
        "sai-volume-fix",
        VOLUME_LOOK
      );
    }
    bindHoverOpen(volumeWrap);
    return volumeWrap;
  }

  function styleSliderShadow(slider, styleId, look) {
    if (!slider) return;
    slider.querySelectorAll(":scope > #sai-progress-fix, :scope > #sai-volume-fix").forEach((el) => el.remove());
    const root = slider.shadowRoot;
    if (!root) return;
    let style = root.getElementById(styleId);
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      root.appendChild(style);
    }
    const next = sliderCss("", look);
    if (style.textContent !== next) style.textContent = next;
  }

  function applyMini(player) {
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
    const track = findTrack(root);
    const likes = q(root, ".ytMusicMiniPlayerActionBar") || q(root, "yt-video-action-bar-view-model");
    const more = findMore(root);
    const volume = q(root, ".ytMusicMiniPlayerVolumeWrapper");
    const rate = q(root, ".ytmusicPlayerControlsPlaybackRateButton");
    const repeat = q(root, ".ytmusicPlayerControlsRepeatButton");
    const shuffle = q(root, ".ytmusicPlayerControlsShuffleButton");

    placeSequence(columns.left, [previous, seekBack, play, seekForward, next, time]);
    placeSequence(columns.middle, [track, likes, more]);
    placeSequence(columns.right, [volume, rate, repeat, shuffle]);
    ensureMiniVolume(volume);
    vacateMini(root);
  }

  function applyBar(bar) {
    const columns = ensureColumns(bar);
    const previous = bar.querySelector(".previous-button");
    const rewind = bar.querySelector(".rewind-button");
    const play = bar.querySelector("#play-pause-button");
    const spinner = bar.querySelector(".spinner-container");
    const seekForward = bar.querySelector(
      ".left-controls-buttons > yt-icon-button[aria-label*='30'], .left-controls-buttons > yt-icon-button[title*='30']"
    );
    const next = bar.querySelector(".next-button");
    const time = bar.querySelector(".time-info");
    const thumb = bar.querySelector(".thumbnail-image-wrapper");
    const content = bar.querySelector(".content-info-wrapper");
    const likes = bar.querySelector("#like-button-renderer");
    const menu =
      bar.querySelector("ytmusic-menu-renderer.menu") ||
      bar.querySelector(".middle-controls-buttons ytmusic-menu-renderer");
    const volumeBtn =
      bar.querySelector(".right-controls-buttons > .volume") ||
      bar.querySelector(".volume:not(#expand-volume)");
    const volumeSlider = bar.querySelector("#volume-slider:not(#expand-volume-slider)");
    const rate = bar.querySelector("ytmusic-playback-rate-renderer");
    const repeat =
      bar.querySelector(".right-controls-buttons > .repeat") ||
      bar.querySelector(".repeat:not(#expand-repeat)");
    const shuffle =
      bar.querySelector(".right-controls-buttons > .shuffle") ||
      bar.querySelector(".shuffle:not(#expand-shuffle)");

    placeSequence(columns.left, [previous, rewind, play, spinner, seekForward, next, time]);
    placeSequence(columns.middle, [thumb, content, likes, menu]);
    const wrap = ensureVolumeWrap(columns.right, volumeBtn, volumeSlider);
    placeSequence(columns.right, [wrap, rate, repeat, shuffle]);
    styleSliderShadow(bar.querySelector(".sai-volume-pop #volume-slider"), "sai-volume-fix", VOLUME_LOOK);
    vacateBar(bar);
  }

  function apply() {
    homes.forEach((_home, el) => {
      if (!el.isConnected) homes.delete(el);
    });
    const player = findPlayer();
    if (!player) return;
    player.classList.add("sai-classic-on");
    injectStyle(document.head || document.documentElement);

    if (isPlayerBar(player)) applyBar(player);
    else applyMini(player);
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
      root?.querySelectorAll?.(".sai-volume-pop, .sai-volume-wrap, .sai-classic-row").forEach((el) => {
        while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
        el.remove();
      });
      root?.querySelectorAll?.(".sai-vacated").forEach((el) => el.classList.remove("sai-vacated"));
      root?.querySelectorAll?.(".sai-classic-on").forEach((el) => el.classList.remove("sai-classic-on"));
      root?.querySelectorAll?.(".sai-volume-bound").forEach((el) => el.classList.remove("sai-volume-bound"));
      root?.querySelectorAll?.(".sai-volume-open").forEach((el) => el.classList.remove("sai-volume-open"));
    });
    player?.classList.remove("sai-classic-on");
    document.querySelectorAll("#volume-slider").forEach((slider) => {
      slider.shadowRoot?.querySelectorAll?.("#sai-volume-fix").forEach((style) => style.remove());
    });
  }

  boot();
})();
