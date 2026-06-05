(function () {
  const ns = (window.StudioSlides = window.StudioSlides || {});
  ns.services = ns.services || {};
  ns.services.presenter = ns.services.presenter || {};

  function serializeForScript(value) {
    return JSON.stringify(value)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");
  }

  function normalizeStartSlideIndex(state, startSlideId) {
    const slideIndex = (state.slides || []).findIndex((slide) => slide.id === startSlideId);
    return Math.max(0, slideIndex);
  }

  function buildNoteMarkup(note) {
    const source = String(note || "").trim();
    if (!source) {
      return '<p class="presenter-note-empty">Aucune note pour cette slide.</p>';
    }
    return ns.utils.plainTextToRichHtml(source, 600);
  }

  function getAvailableMediaItems(items) {
    return ns.data.augmentMediaItems ? ns.data.augmentMediaItems(items || []) : (items || []);
  }

  function getAvailableMediaUrls(urlMap) {
    return ns.data.augmentMediaUrlMap ? ns.data.augmentMediaUrlMap(urlMap || {}) : (urlMap || {});
  }

  async function buildPresenterHtml(state, options) {
    const opts = options || {};
    const startSlideId = opts.startSlideId || "";
    const initialSlideIndex = normalizeStartSlideIndex(state, startSlideId);
    const sessionId = opts.sessionId || ns.utils.createId("presenter-session");
    const slideLogoSources = ns.ui.getSlideLogoSources();
    const availableMediaItems = getAvailableMediaItems(state.mediaLibrary || []);
    const mediaUrls = getAvailableMediaUrls(await ns.services.media.resolveExportMediaUrls(availableMediaItems));
    const slideTemplatesMarkup = (state.slides || [])
      .map((slide, index) => {
        return `
          <template data-slide-template="${index}">
            ${ns.ui.createSlideMarkup(slide, state.settings, {
              compact: false,
              logoSources: slideLogoSources,
              mediaItems: availableMediaItems,
              mediaUrls,
            })}
          </template>
        `;
      })
      .join("");
    const slideMeta = (state.slides || []).map((slide, index) => ({
      id: slide.id || "",
      number: slide.number || String(index + 1).padStart(2, "0"),
      title: slide.title || `Slide ${index + 1}`,
      noteHtml: buildNoteMarkup(slide.presenterNotes),
    }));
    const deckTitle = ns.utils.escapeHtml(state.settings.title || "Presentation");

    return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${deckTitle} - Mode presentateur</title>
    <link rel="icon" type="image/png" href="assets/images/icon.png" />
    <link rel="stylesheet" href="styles/base.css" />
    <link rel="stylesheet" href="styles/layout.css" />
    <link rel="stylesheet" href="styles/components.css" />
    <link rel="stylesheet" href="styles/slide.css" />
    <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
    <style>
      :root {
        color-scheme: light;
        --presenter-bg: #f3efe7;
        --presenter-ink: #1d1917;
        --presenter-muted: #685b52;
        --presenter-panel: rgba(255, 252, 247, 0.92);
        --presenter-line: rgba(29, 25, 23, 0.1);
        --presenter-accent: #145da0;
        --presenter-accent-soft: rgba(20, 93, 160, 0.12);
        --presenter-shadow: 0 24px 60px rgba(39, 29, 23, 0.12);
      }
      body.theme-night {
        color-scheme: dark;
        --presenter-bg: #07111d;
        --presenter-ink: #eef4ff;
        --presenter-muted: #a9b9d1;
        --presenter-panel: rgba(8, 17, 29, 0.92);
        --presenter-line: rgba(166, 193, 230, 0.12);
        --presenter-accent: #7fb4ff;
        --presenter-accent-soft: rgba(127, 180, 255, 0.16);
        --presenter-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        height: 100vh;
        overflow: hidden;
        color: var(--presenter-ink);
        background:
          radial-gradient(circle at top left, rgba(20, 93, 160, 0.12), transparent 28%),
          radial-gradient(circle at bottom right, rgba(184, 116, 50, 0.12), transparent 26%),
          linear-gradient(160deg, #f5f0e8 0%, #ebe4da 100%);
      }
      body.theme-night {
        background:
          radial-gradient(circle at top left, rgba(50, 126, 214, 0.2), transparent 24%),
          radial-gradient(circle at bottom right, rgba(18, 44, 79, 0.34), transparent 28%),
          linear-gradient(160deg, #08111d 0%, #0c1a2a 52%, #122236 100%);
      }
      .presenter-shell {
        height: 100vh;
        padding: 0.85rem;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 0.75rem;
      }
      .presenter-topbar,
      .presenter-panel {
        border: 1px solid var(--presenter-line);
        border-radius: 26px;
        background: var(--presenter-panel);
        box-shadow: var(--presenter-shadow);
        backdrop-filter: blur(18px);
      }
      .presenter-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.75rem 1rem;
      }
      .presenter-brand {
        display: grid;
        gap: 0.25rem;
      }
      .presenter-brand-kicker {
        margin: 0;
        color: var(--presenter-accent);
        font-size: 0.78rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 700;
      }
      .presenter-title {
        margin: 0;
        font-size: clamp(1.05rem, 1.35vw, 1.35rem);
      }
      .presenter-subtitle {
        margin: 0;
        color: var(--presenter-muted);
        font-size: 0.84rem;
      }
      .presenter-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
        justify-content: flex-end;
      }
      .presenter-toolbar-group {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      .presenter-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.78fr) minmax(300px, 0.82fr);
        gap: 0.75rem;
        min-height: 0;
      }
      body.presenter-projector-focus .presenter-layout {
        grid-template-columns: 1fr;
      }
      .presenter-main {
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto minmax(180px, 0.62fr);
        grid-template-areas:
          "current"
          "carousel"
          "next";
        gap: 0.75rem;
        min-height: 0;
      }
      body.presenter-stages-swapped .presenter-main {
        grid-template-rows: minmax(0, 1fr) auto minmax(180px, 0.62fr);
        grid-template-areas:
          "next"
          "carousel"
          "current";
      }
      body.presenter-projector-focus .presenter-main,
      body.presenter-projector-focus.presenter-stages-swapped .presenter-main {
        grid-template-rows: minmax(0, 1fr);
      }
      body.presenter-projector-focus .presenter-main {
        grid-template-areas: "current";
      }
      body.presenter-projector-focus.presenter-stages-swapped .presenter-main {
        grid-template-areas: "next";
      }
      .presenter-panel {
        padding: 0.8rem;
        min-height: 0;
      }
      .presenter-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.6rem;
      }
      .presenter-panel-kicker {
        margin: 0 0 0.15rem;
        color: var(--presenter-accent);
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
      }
      .presenter-panel-title {
        margin: 0;
        font-size: 0.96rem;
      }
      .presenter-panel-title-line {
        display: grid;
        gap: 0.2rem;
      }
      .presenter-slide-meta {
        color: var(--presenter-muted);
        font-size: 0.8rem;
        font-weight: 700;
      }
      .presenter-projector-signal {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        color: var(--presenter-muted);
        font-size: 0.78rem;
        font-weight: 700;
      }
      .presenter-projector-signal::before {
        content: "";
        width: 0.58rem;
        height: 0.58rem;
        border-radius: 999px;
        background: rgba(104, 91, 82, 0.32);
        box-shadow: 0 0 0 0.2rem rgba(20, 93, 160, 0.08);
      }
      .presenter-projector-signal.is-active {
        color: var(--presenter-accent);
      }
      .presenter-projector-signal.is-active::before {
        background: var(--presenter-accent);
        box-shadow: 0 0 0 0.2rem var(--presenter-accent-soft);
      }
      .presenter-slide-panel {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
      }
      .presenter-stage {
        position: relative;
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        border-radius: 18px;
        background: linear-gradient(160deg, rgba(20, 93, 160, 0.08), rgba(255, 255, 255, 0.72));
        border: 1px solid rgba(20, 93, 160, 0.08);
        padding: 0.55rem;
      }
      .presenter-stage-current .presenter-stage {
        box-shadow:
          inset 0 0 0 1px rgba(44, 115, 218, 0.26),
          0 0 0 1px rgba(44, 115, 218, 0.08);
      }
      .presenter-stage-next-panel .presenter-stage {
        box-shadow:
          inset 0 0 0 1px rgba(220, 133, 52, 0.28),
          0 0 0 1px rgba(220, 133, 52, 0.08);
      }
      body.theme-night .presenter-topbar,
      body.theme-night .presenter-panel {
        background: linear-gradient(180deg, rgba(9, 19, 33, 0.96), rgba(7, 14, 24, 0.92));
        border-color: rgba(166, 193, 230, 0.12);
      }
      body.theme-night .presenter-stage {
        background: linear-gradient(160deg, rgba(18, 42, 71, 0.72), rgba(10, 20, 33, 0.88));
        border-color: rgba(127, 180, 255, 0.12);
      }
      body.theme-night .presenter-stage-current .presenter-stage {
        box-shadow:
          inset 0 0 0 1px rgba(127, 180, 255, 0.34),
          0 0 0 1px rgba(127, 180, 255, 0.10);
      }
      body.theme-night .presenter-stage-next-panel .presenter-stage {
        box-shadow:
          inset 0 0 0 1px rgba(255, 179, 111, 0.34),
          0 0 0 1px rgba(255, 179, 111, 0.10);
      }
      body.theme-night .presenter-hint,
      body.theme-night .presenter-subtitle,
      body.theme-night .presenter-slide-meta,
      body.theme-night .presenter-note-empty,
      body.theme-night .presenter-projector-signal {
        color: var(--presenter-muted);
      }
      body.theme-night .presenter-carousel-dot {
        background: rgba(127, 180, 255, 0.24);
        box-shadow: inset 0 0 0 1px rgba(210, 228, 255, 0.08);
      }
      body.theme-night .presenter-carousel-step.is-active .presenter-carousel-dot {
        background: linear-gradient(90deg, rgba(127, 180, 255, 0.86), rgba(178, 209, 255, 0.64));
        box-shadow:
          0 8px 18px rgba(127, 180, 255, 0.14),
          inset 0 0 0 1px rgba(255, 255, 255, 0.22);
      }
      body.theme-night .presenter-notes-body {
        color: var(--presenter-ink);
      }
      .presenter-toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        min-height: 2.8rem;
        padding: 0.45rem 0.75rem;
        border-radius: 999px;
        border: 1px solid var(--presenter-line);
        background: rgba(255, 255, 255, 0.66);
        color: var(--presenter-ink);
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      body.theme-night .presenter-toggle {
        background: rgba(10, 21, 36, 0.92);
        color: var(--presenter-ink);
      }
      .presenter-toggle-dot {
        width: 1.05rem;
        height: 1.05rem;
        border-radius: 999px;
        background: linear-gradient(180deg, #145da0, #3f7cff);
        box-shadow: 0 0 0 0.22rem var(--presenter-accent-soft);
      }
      body.theme-night .presenter-toggle-dot {
        background: linear-gradient(180deg, #dfeeff, #7fb4ff);
      }
      .presenter-toolbar-action {
        min-width: 0;
      }
      .presenter-stage-preview {
        position: relative;
        display: block;
        overflow: hidden;
        max-width: 100%;
        max-height: 100%;
      }
      .presenter-stage-layer {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        opacity: 0;
        filter: blur(10px) saturate(0.96);
        transform: scale(0.99);
        pointer-events: none;
        transition:
          opacity 320ms cubic-bezier(0.22, 1, 0.36, 1),
          filter 320ms cubic-bezier(0.22, 1, 0.36, 1),
          transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .presenter-stage-layer.is-visible {
        opacity: 1;
        filter: blur(0) saturate(1);
        transform: scale(1);
        pointer-events: auto;
      }
      .presenter-stage-layer.is-exiting {
        opacity: 0;
        filter: blur(12px) saturate(0.95);
        transform: scale(0.99);
        pointer-events: none;
      }
      .presenter-stage-image {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        pointer-events: none;
        border-radius: 18px;
        box-shadow: 0 18px 32px rgba(18, 32, 51, 0.12);
      }
      .presenter-stage-hotspot {
        position: absolute;
        z-index: 2;
        border: 0;
        padding: 0;
        background: transparent;
        cursor: pointer;
        pointer-events: auto;
        border-radius: 18px;
      }
      .presenter-stage-hotspot.is-projector-active {
        box-shadow:
          inset 0 0 0 0.22rem rgba(173, 61, 61, 0.42),
          0 0 0 0.5rem rgba(173, 61, 61, 0.12);
      }
      .presenter-stage-hotspot:focus-visible {
        outline: 2px solid rgba(44, 115, 218, 0.32);
        outline-offset: 0.16rem;
      }
      body.theme-night .presenter-stage-hotspot.is-projector-active {
        box-shadow:
          inset 0 0 0 0.22rem rgba(215, 112, 112, 0.52),
          0 0 0 0.52rem rgba(215, 112, 112, 0.14);
      }
      .presenter-stage-loading {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        color: var(--presenter-muted);
        font-size: 0.9rem;
      }
      @media (prefers-reduced-motion: reduce) {
        .presenter-stage-layer {
          transition: none;
        }
      }
      .presenter-stage-current {
        grid-area: current;
        min-height: 0;
      }
      .presenter-stage-next {
        min-height: 140px;
      }
      .presenter-stage-next-panel {
        grid-area: next;
      }
      .presentation-reveal-hidden {
        opacity: 0;
        transform: translateY(0.6rem);
        visibility: hidden;
      }
      .presentation-reveal-visible {
        opacity: 1;
        transform: translateY(0);
        visibility: visible;
        transition: opacity 220ms ease, transform 220ms ease;
      }
      .presenter-side {
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        gap: 0.75rem;
        min-height: 0;
      }
      body.presenter-projector-focus .presenter-side,
      body.presenter-projector-focus #presenter-carousel,
      body.presenter-projector-focus .presenter-stage-next-panel {
        display: none;
      }
      body.presenter-projector-focus.presenter-stages-swapped .presenter-stage-current {
        display: none;
      }
      body.presenter-projector-focus.presenter-stages-swapped .presenter-stage-next-panel {
        display: grid;
      }
      body.presenter-projector-focus .presenter-stage-current {
        min-height: 0;
      }
      body.presenter-projector-focus.presenter-stages-swapped .presenter-stage-next-panel {
        min-height: 0;
      }
      .presenter-notes {
        min-height: 0;
      }
      .presenter-notes-body {
        display: grid;
        gap: 0.5rem;
        color: var(--presenter-ink);
        font-size: 1.42rem;
        line-height: 1.62;
        overflow: auto;
        max-height: 100%;
        padding-right: 0.15rem;
      }
      .presenter-notes-body p {
        margin: 0;
        line-height: 1.62;
      }
      .presenter-note-empty {
        color: var(--presenter-muted);
        font-style: italic;
      }
      .presenter-controls {
        display: grid;
        gap: 0.55rem;
      }
      .presenter-carousel {
        grid-area: carousel;
        display: flex;
        align-items: center;
        gap: 0.48rem;
        min-height: 0;
        padding: 0.55rem 0.65rem;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: thin;
      }
      .presenter-carousel-step {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 1rem;
        height: 1rem;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: inherit;
        transition: transform 0.18s ease;
      }
      .presenter-carousel-step:hover,
      .presenter-carousel-step:focus-visible {
        transform: scale(1.08);
      }
      .presenter-carousel-step:focus-visible {
        outline: 2px solid rgba(44, 115, 218, 0.28);
        outline-offset: 0.14rem;
      }
      .presenter-carousel-dot {
        width: 0.44rem;
        height: 0.44rem;
        border-radius: 999px;
        background: rgba(44, 115, 218, 0.22);
        box-shadow: inset 0 0 0 1px rgba(23, 71, 139, 0.08);
        transition:
          width 0.18s ease,
          height 0.18s ease,
          border-radius 0.18s ease,
          background 0.18s ease,
          box-shadow 0.18s ease;
      }
      .presenter-carousel-step.is-active {
        width: 2.2rem;
        height: 1rem;
      }
      .presenter-carousel-step.is-active .presenter-carousel-dot {
        width: 1.55rem;
        height: 0.44rem;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(44, 115, 218, 0.8), rgba(97, 151, 234, 0.58));
        box-shadow:
          0 8px 18px rgba(44, 115, 218, 0.14),
          inset 0 0 0 1px rgba(255, 255, 255, 0.35);
      }
      .presenter-control-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.65rem;
      }
      .presenter-hint {
        margin: 0;
        color: var(--presenter-muted);
        font-size: 0.76rem;
        line-height: 1.35;
      }
      .presenter-mini-button {
        min-width: 0;
        padding-inline: 0.8rem;
        font-size: 0.82rem;
        opacity: 0.92;
      }
      .presenter-keycap {
        display: inline-grid;
        place-items: center;
        min-width: 2.1rem;
        height: 2.1rem;
        padding: 0 0.45rem;
        border-radius: 0.7rem;
        border: 1px solid rgba(20, 93, 160, 0.18);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(236, 243, 251, 0.92));
        box-shadow:
          inset 0 -0.12rem 0 rgba(20, 93, 160, 0.08),
          0 0.35rem 0.9rem rgba(18, 32, 51, 0.08);
        color: var(--presenter-accent);
        font-size: 0.95rem;
        font-weight: 800;
        line-height: 1;
        letter-spacing: 0.02em;
      }
      .presenter-mini-button[aria-pressed="true"] .presenter-keycap {
        border-color: rgba(220, 133, 52, 0.34);
        background: linear-gradient(180deg, rgba(255, 241, 228, 0.98), rgba(255, 232, 208, 0.94));
        color: #b46120;
        box-shadow:
          inset 0 -0.12rem 0 rgba(220, 133, 52, 0.12),
          0 0.35rem 1rem rgba(220, 133, 52, 0.12);
      }
      #presenter-projector-focus-toggle[aria-pressed="true"] .presenter-keycap {
        border-color: rgba(82, 166, 104, 0.34);
        background: linear-gradient(180deg, rgba(236, 249, 239, 0.98), rgba(220, 243, 226, 0.94));
        color: #2f7b45;
        box-shadow:
          inset 0 -0.12rem 0 rgba(82, 166, 104, 0.12),
          0 0.35rem 1rem rgba(82, 166, 104, 0.10);
      }
      #presenter-image-zoom-in[aria-pressed="true"] .presenter-keycap {
        border-color: rgba(231, 188, 71, 0.38);
        background: linear-gradient(180deg, rgba(255, 248, 220, 0.98), rgba(255, 240, 185, 0.94));
        color: #9e6b05;
        box-shadow:
          inset 0 -0.12rem 0 rgba(231, 188, 71, 0.14),
          0 0.35rem 1rem rgba(231, 188, 71, 0.12);
      }
      .presenter-keycap-hint {
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--presenter-muted);
      }
      body.theme-night .presenter-keycap {
        border-color: rgba(127, 180, 255, 0.18);
        background: linear-gradient(180deg, rgba(18, 34, 54, 0.96), rgba(11, 23, 38, 0.94));
        color: #dfeeff;
        box-shadow:
          inset 0 -0.12rem 0 rgba(127, 180, 255, 0.08),
          0 0.35rem 0.9rem rgba(0, 0, 0, 0.18);
      }
      body.theme-night .presenter-mini-button[aria-pressed="true"] .presenter-keycap {
        border-color: rgba(255, 179, 111, 0.38);
        background: linear-gradient(180deg, rgba(63, 34, 14, 0.94), rgba(42, 23, 10, 0.94));
        color: #ffd3ab;
        box-shadow:
          inset 0 -0.12rem 0 rgba(255, 179, 111, 0.12),
          0 0.35rem 1rem rgba(255, 179, 111, 0.10);
      }
      body.theme-night #presenter-projector-focus-toggle[aria-pressed="true"] .presenter-keycap {
        border-color: rgba(126, 214, 148, 0.36);
        background: linear-gradient(180deg, rgba(19, 45, 28, 0.94), rgba(13, 33, 20, 0.94));
        color: #c9f3d3;
        box-shadow:
          inset 0 -0.12rem 0 rgba(126, 214, 148, 0.12),
          0 0.35rem 1rem rgba(126, 214, 148, 0.10);
      }
      body.theme-night #presenter-image-zoom-in[aria-pressed="true"] .presenter-keycap {
        border-color: rgba(241, 211, 116, 0.4);
        background: linear-gradient(180deg, rgba(58, 48, 12, 0.94), rgba(42, 34, 9, 0.94));
        color: #ffe8a6;
        box-shadow:
          inset 0 -0.12rem 0 rgba(241, 211, 116, 0.14),
          0 0.35rem 1rem rgba(241, 211, 116, 0.10);
      }
      .presenter-image-zoom-controls[hidden] {
        display: none;
      }
      .presenter-reset-button {
        min-height: 2.2rem;
        padding-inline: 0.8rem;
        font-size: 0.8rem;
        font-weight: 700;
      }
      body.theme-night .presenter-keycap-hint {
        color: var(--presenter-muted);
      }
      .presenter-templates {
        display: none;
      }
      @media (max-width: 1180px) {
        body {
          height: auto;
          overflow: auto;
        }
        .presenter-shell {
          height: auto;
        }
        .presenter-layout {
          grid-template-columns: 1fr;
        }
        .presenter-main,
        .presenter-side {
          grid-template-rows: auto;
        }
      }
      @media (max-width: 760px) {
        .presenter-shell {
          padding: 0.8rem;
        }
        .presenter-topbar {
          padding: 0.9rem;
          align-items: flex-start;
          flex-direction: column;
        }
        .presenter-toolbar,
        .presenter-control-row {
          width: 100%;
          grid-template-columns: 1fr;
        }
        .presenter-stage {
          padding: 0.5rem;
        }
      }
    </style>
  </head>
  <body>
    <div class="presenter-shell">
      <header class="presenter-topbar">
        <div class="presenter-brand">
          <p class="presenter-brand-kicker">Console presentateur</p>
          <h1 class="presenter-title">${deckTitle}</h1>
          <p class="presenter-subtitle">Slide projetee, prochaine slide, notes et pilotage synchronise.</p>
        </div>
        <div class="presenter-toolbar">
          <button id="presenter-theme-toggle" class="presenter-toggle" type="button" aria-pressed="false">
            <span class="presenter-toggle-dot" aria-hidden="true"></span>
            <span id="presenter-theme-label">Mode nuit</span>
          </button>
          <button
            id="presenter-swap-stages"
            class="button button-soft presenter-mini-button presenter-toolbar-action"
            type="button"
            aria-pressed="false"
            aria-label="Inverser Projection et A venir"
            title="Inverser Projection et A venir (touche i)"
          >
            <span class="presenter-keycap" aria-hidden="true">I</span>
          </button>
          <button
            id="presenter-projector-focus-toggle"
            class="button button-soft presenter-mini-button presenter-toolbar-action"
            type="button"
            aria-pressed="false"
            aria-label="Focus projection"
            title="Focus projection (touche p)"
          >
            <span class="presenter-keycap" aria-hidden="true">P</span>
          </button>
          <div id="presenter-image-zoom-controls" class="presenter-toolbar-group presenter-image-zoom-controls" hidden>
            <button
              id="presenter-image-zoom-in"
              class="button button-soft presenter-mini-button presenter-toolbar-action"
              type="button"
              aria-pressed="false"
              aria-label="Activer le zoom image projetée"
              title="Zoom image projetée (touche +)"
            >
              <span class="presenter-keycap" aria-hidden="true">+</span>
            </button>
            <button
              id="presenter-image-zoom-reset"
              class="button button-soft presenter-reset-button presenter-toolbar-action"
              type="button"
              aria-label="Réinitialiser le zoom image projetée"
              title="Réinitialiser le zoom image projetée (touche -)"
            >Reset</button>
          </div>
          <button
            id="presenter-toolbar-prev"
            class="button button-soft presenter-mini-button presenter-toolbar-action"
            type="button"
            aria-label="Slide précédente"
            title="Slide précédente (flèche gauche)"
          >
            <span class="presenter-keycap" aria-hidden="true">&lt;</span>
          </button>
          <button
            id="presenter-toolbar-next"
            class="button button-soft presenter-mini-button presenter-toolbar-action"
            type="button"
            aria-label="Slide suivante"
            title="Slide suivante (flèche droite)"
          >
            <span class="presenter-keycap" aria-hidden="true">&gt;</span>
          </button>
          <button id="presenter-fullscreen-toggle" class="button button-soft presenter-toolbar-action" type="button">Plein écran</button>
          <button id="presenter-open-projector" class="button button-primary" type="button">Ouvrir l'ecran projete</button>
          <button id="presenter-refresh-projector" class="button button-soft" type="button">Resynchroniser</button>
        </div>
      </header>

      <div class="presenter-layout">
        <section class="presenter-main">
          <section class="presenter-panel presenter-slide-panel presenter-stage-current">
            <div class="presenter-panel-header">
              <div class="presenter-panel-title-line">
                <p class="presenter-panel-kicker">Projection</p>
                <h2 class="presenter-panel-title" id="presenter-current-title">Slide en cours</h2>
                <span id="presenter-projector-signal" class="presenter-projector-signal">Aucun agrandissement actif</span>
              </div>
              <span class="presenter-slide-meta" id="presenter-current-meta"></span>
            </div>
            <div id="presenter-current-stage" class="presenter-stage" aria-live="polite"></div>
          </section>

          <section id="presenter-carousel" class="presenter-panel presenter-carousel" aria-label="Progression de la presentation">
            ${slideMeta.map((slide, index) => `
              <button
                class="presenter-carousel-step${index === initialSlideIndex ? " is-active" : ""}"
                type="button"
                data-presenter-carousel-index="${index}"
                aria-label="Aller à la slide ${ns.utils.escapeHtml(slide.number)} : ${ns.utils.escapeHtml(slide.title)}"
                title="${ns.utils.escapeHtml(slide.number)} - ${ns.utils.escapeHtml(slide.title)}"
              >
                <span class="presenter-carousel-dot"></span>
              </button>
            `).join("")}
          </section>

          <section class="presenter-panel presenter-slide-panel presenter-stage-next-panel">
            <div class="presenter-panel-header">
              <div>
                <p class="presenter-panel-kicker">A venir</p>
                <h2 class="presenter-panel-title" id="presenter-next-title">Prochaine slide</h2>
              </div>
              <span class="presenter-slide-meta" id="presenter-next-meta"></span>
            </div>
            <div id="presenter-next-stage" class="presenter-stage presenter-stage-next"></div>
          </section>
        </section>

        <aside class="presenter-side">
          <section class="presenter-panel presenter-notes">
            <div class="presenter-panel-header">
              <div>
                <p class="presenter-panel-kicker">Notes</p>
                <h2 class="presenter-panel-title">Commentaires intervenant</h2>
              </div>
            </div>
            <div id="presenter-notes-body" class="presenter-notes-body"></div>
          </section>

          <section class="presenter-panel presenter-controls">
            <div class="presenter-panel-header">
              <div>
                <p class="presenter-panel-kicker">Commandes</p>
                <h2 class="presenter-panel-title">Navigation</h2>
              </div>
            </div>
            <div class="presenter-control-row">
              <button id="presenter-prev" class="button button-soft" type="button">Precedent</button>
              <button id="presenter-reveal" class="button button-soft" type="button">Reveler</button>
              <button id="presenter-next" class="button button-primary" type="button">Suivant</button>
            </div>
            <p class="presenter-hint">Raccourcis: fleches gauche/droite, espace pour avancer, fleche haut pour revenir.</p>
          </section>
        </aside>
      </div>

      <div class="presenter-templates">
        ${slideTemplatesMarkup}
      </div>
      <div id="presenter-render-host" style="position:fixed;left:-10000px;top:0;width:1280px;height:720px;pointer-events:none;opacity:0;overflow:hidden;" aria-hidden="true">
        <div id="presenter-buffer-current"></div>
        <div id="presenter-buffer-next"></div>
        <div id="presenter-buffer-cache"></div>
      </div>
    </div>

    <script>
      const presenterSessionId = ${serializeForScript(sessionId)};
      const presenterControllerId = ${serializeForScript(ns.utils.createId("presenter-controller"))};
      const slideMeta = ${serializeForScript(slideMeta)};
      const initialSlideIndex = ${initialSlideIndex};
      const currentStage = document.querySelector("#presenter-current-stage");
      const nextStage = document.querySelector("#presenter-next-stage");
      const presenterCarousel = document.querySelector("#presenter-carousel");
      const renderHost = document.querySelector("#presenter-render-host");
      const currentBuffer = document.querySelector("#presenter-buffer-current");
      const nextBuffer = document.querySelector("#presenter-buffer-next");
      const cacheBuffer = document.querySelector("#presenter-buffer-cache");
      const notesBody = document.querySelector("#presenter-notes-body");
      const currentTitle = document.querySelector("#presenter-current-title");
      const currentMeta = document.querySelector("#presenter-current-meta");
      const nextTitle = document.querySelector("#presenter-next-title");
      const nextMeta = document.querySelector("#presenter-next-meta");
      const projectorSignal = document.querySelector("#presenter-projector-signal");
      const themeToggle = document.querySelector("#presenter-theme-toggle");
      const themeLabel = document.querySelector("#presenter-theme-label");
      const swapStagesButton = document.querySelector("#presenter-swap-stages");
      const projectorFocusButton = document.querySelector("#presenter-projector-focus-toggle");
      const imageZoomControls = document.querySelector("#presenter-image-zoom-controls");
      const imageZoomInButton = document.querySelector("#presenter-image-zoom-in");
      const imageZoomResetButton = document.querySelector("#presenter-image-zoom-reset");
      const toolbarPrevButton = document.querySelector("#presenter-toolbar-prev");
      const toolbarNextButton = document.querySelector("#presenter-toolbar-next");
      const fullscreenToggle = document.querySelector("#presenter-fullscreen-toggle");
      const prevButton = document.querySelector("#presenter-prev");
      const revealButton = document.querySelector("#presenter-reveal");
      const nextButton = document.querySelector("#presenter-next");
      const openProjectorButton = document.querySelector("#presenter-open-projector");
      const refreshProjectorButton = document.querySelector("#presenter-refresh-projector");
      const slideTemplates = Array.from(document.querySelectorAll("[data-slide-template]"));
      const carouselSteps = Array.from(document.querySelectorAll("[data-presenter-carousel-index]"));
      let currentIndex = Math.max(0, Math.min(slideMeta.length - 1, Number(initialSlideIndex) || 0));
      let currentRevealStep = 0;
      let projectorWindow = null;
      let projectorConnected = false;
      let projectorBlocked = false;
      let lastProjectorContactAt = 0;
      let projectorMediaState = { isOpen: false, kind: "", index: -1, imageZoomActive: false };
      let currentRenderToken = 0;
      let isNightTheme = false;
      let areStagesSwapped = false;
      let isProjectorFocusMode = false;
      let lastPublishedStateSignature = "";
      let previewWarmRequestId = 0;
      let previewWarmQueue = Promise.resolve();
      const previewCache = new Map();
      const presenterThemeStorageKey = "studio-presenter-theme-v1";
      const presenterStagesLayoutStorageKey = "studio-presenter-stages-layout-v1";
      const presenterProjectorFocusStorageKey = "studio-presenter-projector-focus-v1";

      function syncThemeUi() {
        document.body.classList.toggle("theme-night", isNightTheme);
        themeToggle.setAttribute("aria-pressed", isNightTheme ? "true" : "false");
        themeLabel.textContent = isNightTheme ? "Mode clair" : "Mode nuit";
      }

      function syncStagesLayoutUi() {
        document.body.classList.toggle("presenter-stages-swapped", areStagesSwapped);
        swapStagesButton.setAttribute("aria-pressed", areStagesSwapped ? "true" : "false");
        swapStagesButton.setAttribute(
          "title",
          areStagesSwapped
            ? "Revenir a l'ordre normal (touche i)"
            : "Inverser Projection et A venir (touche i)"
        );
      }

      function syncProjectorFocusUi() {
        document.body.classList.toggle("presenter-projector-focus", isProjectorFocusMode);
        projectorFocusButton.setAttribute("aria-pressed", isProjectorFocusMode ? "true" : "false");
        projectorFocusButton.setAttribute(
          "title",
          isProjectorFocusMode
            ? "Quitter le focus projection (touche p)"
            : "Focus projection (touche p)"
        );
      }

      function loadThemePreference() {
        try {
          isNightTheme = localStorage.getItem(presenterThemeStorageKey) === "night";
        } catch (error) {
          isNightTheme = false;
        }
        syncThemeUi();
      }

      function loadStagesLayoutPreference() {
        try {
          areStagesSwapped = localStorage.getItem(presenterStagesLayoutStorageKey) === "swapped";
        } catch (error) {
          areStagesSwapped = false;
        }
        syncStagesLayoutUi();
      }

      function loadProjectorFocusPreference() {
        try {
          isProjectorFocusMode = localStorage.getItem(presenterProjectorFocusStorageKey) === "focused";
        } catch (error) {
          isProjectorFocusMode = false;
        }
        syncProjectorFocusUi();
      }

      function toggleTheme() {
        isNightTheme = !isNightTheme;
        try {
          localStorage.setItem(presenterThemeStorageKey, isNightTheme ? "night" : "day");
        } catch (error) {
          // ignore storage failures
        }
        syncThemeUi();
      }

      function toggleStagesLayout() {
        areStagesSwapped = !areStagesSwapped;
        try {
          localStorage.setItem(presenterStagesLayoutStorageKey, areStagesSwapped ? "swapped" : "default");
        } catch (error) {
          // ignore storage failures
        }
        syncStagesLayoutUi();
        void renderPresenter();
      }

      function toggleProjectorFocusMode() {
        isProjectorFocusMode = !isProjectorFocusMode;
        try {
          localStorage.setItem(presenterProjectorFocusStorageKey, isProjectorFocusMode ? "focused" : "default");
        } catch (error) {
          // ignore storage failures
        }
        syncProjectorFocusUi();
        fitStagePreviews();
      }

      function syncFullscreenUi() {
        fullscreenToggle.textContent = document.fullscreenElement ? "Quitter le plein écran" : "Plein écran";
        fullscreenToggle.setAttribute("aria-pressed", document.fullscreenElement ? "true" : "false");
      }

      async function toggleFullscreen() {
        if (!document.fullscreenElement) {
          try {
            await document.documentElement.requestFullscreen();
          } catch (error) {
            return;
          }
          return;
        }
        try {
          await document.exitFullscreen();
        } catch (error) {
          return;
        }
      }

      function createSyncBridge(sessionId) {
        const bridgeName = "studio-slides-presenter-" + sessionId;
        const listeners = [];
        let channel = null;

        function notify(payload) {
          listeners.slice().forEach((listener) => listener(payload || {}));
        }

        if (window.BroadcastChannel) {
          try {
            channel = new BroadcastChannel(bridgeName);
            channel.addEventListener("message", (event) => notify(event.data));
          } catch (error) {
            channel = null;
          }
        }

        if (!channel) {
          window.addEventListener("storage", (event) => {
            if (event.key !== bridgeName || !event.newValue) {
              return;
            }
            try {
              notify(JSON.parse(event.newValue));
            } catch (error) {
              return;
            }
          });
        }

        return {
          post(payload) {
            if (!payload || typeof payload !== "object") {
              return;
            }
            const envelope = Object.assign({
              sentAt: Date.now(),
              nonce: Math.random().toString(36).slice(2),
            }, payload);
            if (channel) {
              channel.postMessage(envelope);
              return;
            }
            try {
              localStorage.setItem(bridgeName, JSON.stringify(envelope));
              localStorage.removeItem(bridgeName);
            } catch (error) {
              return;
            }
          },
          subscribe(listener) {
            listeners.push(listener);
            return () => {
              const index = listeners.indexOf(listener);
              if (index >= 0) {
                listeners.splice(index, 1);
              }
            };
          },
          close() {
            if (channel) {
              channel.close();
            }
          },
        };
      }

      const syncBridge = createSyncBridge(presenterSessionId);

      function getTemplateByIndex(index) {
        return slideTemplates.find((template) => Number(template.getAttribute("data-slide-template")) === index) || null;
      }

      function getCurrentBufferSlide() {
        return currentBuffer.querySelector(".deck-slide");
      }

      function mountSlide(index, mountNode) {
        mountNode.innerHTML = "";
        const template = getTemplateByIndex(index);
        if (!template || !template.content) {
          return null;
        }
        const fragment = template.content.cloneNode(true);
        mountNode.appendChild(fragment);
        return mountNode.querySelector(".deck-slide");
      }

      function getPreviewCacheKey(index, revealStep) {
        return String(normalizeIndex(index)) + ":" + String(Math.max(0, Number(revealStep) || 0));
      }

      function waitForFrame() {
        return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
      }

      function waitForFonts() {
        if (!document.fonts || typeof document.fonts.ready === "undefined") {
          return Promise.resolve();
        }
        return document.fonts.ready.then(() => undefined, () => undefined);
      }

      function waitForSlideAssets(slideNode) {
        if (!slideNode) {
          return Promise.resolve();
        }
        const images = Array.from(slideNode.querySelectorAll("img")).filter((image) => !image.complete);
        if (!images.length) {
          return Promise.resolve();
        }
        return Promise.all(images.map((image) => new Promise((resolve) => {
          const done = () => {
            image.removeEventListener("load", done);
            image.removeEventListener("error", done);
            resolve();
          };
          image.addEventListener("load", done, { once: true });
          image.addEventListener("error", done, { once: true });
        }))).then(() => undefined);
      }

      async function waitForSlideLayout(slideNode) {
        if (!slideNode) {
          return;
        }
        await waitForFonts();
        await waitForSlideAssets(slideNode);
        await waitForFrame();
        await waitForFrame();
      }

      function collectInteractiveDescriptors(slide) {
        if (!slide) {
          return [];
        }
        const slideRect = slide.getBoundingClientRect();
        if (!slideRect.width || !slideRect.height) {
          return [];
        }
        const descriptors = [];
        Array.from(slide.querySelectorAll(".slide-media-image")).forEach((node, index) => {
          const rect = node.getBoundingClientRect();
          descriptors.push({
            kind: "image",
            index,
            left: (rect.left - slideRect.left) / slideRect.width,
            top: (rect.top - slideRect.top) / slideRect.height,
            width: rect.width / slideRect.width,
            height: rect.height / slideRect.height,
          });
        });
        Array.from(slide.querySelectorAll(".slide-table[data-table-lightbox='true']")).forEach((node, index) => {
          const rect = node.getBoundingClientRect();
          descriptors.push({
            kind: "table",
            index,
            left: (rect.left - slideRect.left) / slideRect.width,
            top: (rect.top - slideRect.top) / slideRect.height,
            width: rect.width / slideRect.width,
            height: rect.height / slideRect.height,
          });
        });
        Array.from(slide.querySelectorAll(".slide-visual-chart-card")).forEach((node, index) => {
          const rect = node.getBoundingClientRect();
          descriptors.push({
            kind: "chart",
            index,
            left: (rect.left - slideRect.left) / slideRect.width,
            top: (rect.top - slideRect.top) / slideRect.height,
            width: rect.width / slideRect.width,
            height: rect.height / slideRect.height,
          });
        });
        return descriptors.filter((item) => item.width > 0 && item.height > 0);
      }

      function buildPreviewMarkup(dataUrl, descriptors, isCurrent, ratio, occupancy) {
        const safeUrl = String(dataUrl || "");
        const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : (16 / 9);
        const safeOccupancy = Number.isFinite(occupancy) && occupancy > 0 && occupancy <= 1 ? occupancy : 0.94;
        let hotspots = "";
        if (isCurrent) {
          hotspots = descriptors.map((item) => {
            const isActive =
              projectorMediaState.isOpen &&
              projectorMediaState.kind === item.kind &&
              projectorMediaState.index === item.index;
            const label =
              item.kind === "image"
                ? "Agrandir l'image sur l'ecran projete"
                : item.kind === "table"
                  ? "Agrandir le tableau sur l'ecran projete"
                  : "Agrandir le graphique sur l'ecran projete";
            return (
              '<button' +
              ' class="presenter-stage-hotspot' + (isActive ? ' is-projector-active' : '') + '"' +
              ' type="button"' +
              ' data-hotspot-kind="' + item.kind + '"' +
              ' data-hotspot-index="' + item.index + '"' +
              ' style="left:' + (item.left * 100).toFixed(4) + '%;top:' + (item.top * 100).toFixed(4) + '%;width:' + (item.width * 100).toFixed(4) + '%;height:' + (item.height * 100).toFixed(4) + '%;"' +
              ' aria-label="' + label + '"' +
              '></button>'
            );
          }).join("");
        }
        return (
          '<div class="presenter-stage-preview" data-preview-ratio="' + safeRatio + '" data-preview-occupancy="' + safeOccupancy + '">' +
            '<img class="presenter-stage-image" src="' + safeUrl + '" alt="" />' +
            hotspots +
          '</div>'
        );
      }

      function buildPreviewAssetFromCache(asset, options) {
        const opts = options || {};
        if (!asset || !asset.dataUrl) {
          return "";
        }
        return buildPreviewMarkup(
          asset.dataUrl,
          Array.isArray(asset.descriptors) ? asset.descriptors : [],
          Boolean(opts.interactive),
          Number(asset.ratio) || (16 / 9),
          opts.occupancy
        );
      }

      function shouldAnimatePreviewSwap() {
        return !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      }

      function ensureStageLoading(stageNode, message) {
        if (!stageNode || stageNode.querySelector(".presenter-stage-layer")) {
          return;
        }
        stageNode.innerHTML = '<div class="presenter-stage-loading">' + String(message || "Aperçu en préparation...") + '</div>';
      }

      function fitStagePreview(stageNode) {
        if (!stageNode) {
          return;
        }
        const stageRect = stageNode.getBoundingClientRect();
        stageNode.querySelectorAll(".presenter-stage-preview").forEach((preview) => {
          const ratio = Number(preview.getAttribute("data-preview-ratio")) || (16 / 9);
          const occupancy = Math.min(1, Math.max(0.2, Number(preview.getAttribute("data-preview-occupancy")) || 0.94));
          const availableWidth = Math.max(0, (stageRect.width - 4) * occupancy);
          const availableHeight = Math.max(0, (stageRect.height - 4) * occupancy);
          if (!availableWidth || !availableHeight) {
            return;
          }
          let fittedWidth = availableWidth;
          let fittedHeight = fittedWidth / ratio;
          if (fittedHeight > availableHeight) {
            fittedHeight = availableHeight;
            fittedWidth = fittedHeight * ratio;
          }
          preview.style.width = fittedWidth.toFixed(2) + "px";
          preview.style.height = fittedHeight.toFixed(2) + "px";
        });
      }

      function fitStagePreviews() {
        fitStagePreview(currentStage);
        fitStagePreview(nextStage);
      }

      async function createPreviewAsset(slideNode) {
        if (!slideNode || typeof window.html2canvas !== "function") {
          return null;
        }
        await waitForSlideLayout(slideNode);
        const descriptors = collectInteractiveDescriptors(slideNode);
        const canvas = await window.html2canvas(slideNode, {
          backgroundColor: null,
          scale: 1,
          useCORS: true,
          logging: false,
        });
        return {
          dataUrl: canvas.toDataURL("image/png"),
          descriptors,
          ratio: 16 / 9,
        };
      }

      async function getOrCreatePreviewAsset(index, revealStep, mountNode, existingSlideNode) {
        const key = getPreviewCacheKey(index, revealStep);
        if (previewCache.has(key)) {
          return previewCache.get(key);
        }
        const slideNode = existingSlideNode || mountSlide(index, mountNode || cacheBuffer);
        if (!slideNode) {
          return null;
        }
        resetRevealState(slideNode);
        applyRevealState(slideNode, revealStep);
        const asset = await createPreviewAsset(slideNode);
        if (asset) {
          previewCache.set(key, asset);
        }
        return asset;
      }

      function getDesiredPreviewCacheKeys(centerIndex, revealStep) {
        const desiredKeys = new Set();
        const seen = new Set();
        for (let offset = -2; offset <= 2; offset += 1) {
          const index = normalizeIndex(centerIndex + offset);
          const key = getPreviewCacheKey(index, index === centerIndex ? revealStep : 0);
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);
          desiredKeys.add(key);
        }
        return desiredKeys;
      }

      function prunePreviewCache(centerIndex, revealStep) {
        const desiredKeys = getDesiredPreviewCacheKeys(centerIndex, revealStep);
        Array.from(previewCache.keys()).forEach((key) => {
          if (!desiredKeys.has(key)) {
            previewCache.delete(key);
          }
        });
        return desiredKeys;
      }

      function schedulePreviewCacheWarm(centerIndex, revealStep) {
        const requestId = ++previewWarmRequestId;
        previewWarmQueue = previewWarmQueue
          .then(async () => {
            const desiredKeys = prunePreviewCache(centerIndex, revealStep);
            for (let offset = -2; offset <= 2; offset += 1) {
              if (requestId !== previewWarmRequestId) {
                return;
              }
              const index = normalizeIndex(centerIndex + offset);
              const targetRevealStep = index === centerIndex ? revealStep : 0;
              const key = getPreviewCacheKey(index, targetRevealStep);
              if (!desiredKeys.has(key) || previewCache.has(key)) {
                continue;
              }
              await getOrCreatePreviewAsset(index, targetRevealStep, cacheBuffer, null);
            }
          })
          .catch(() => undefined);
      }

      async function renderPreviewIntoStage(stageNode, asset, options) {
        const opts = options || {};
        if (!stageNode || !asset) {
          return;
        }
        const markup = buildPreviewAssetFromCache(asset, opts);
        const currentLayer = stageNode.querySelector(".presenter-stage-layer.is-visible");
        const nextLayer = document.createElement("div");
        nextLayer.className = "presenter-stage-layer";
        nextLayer.innerHTML = markup;
        stageNode.querySelectorAll(".presenter-stage-loading").forEach((node) => node.remove());
        stageNode.appendChild(nextLayer);
        fitStagePreview(stageNode);
        if (!currentLayer || !shouldAnimatePreviewSwap()) {
          stageNode.querySelectorAll(".presenter-stage-layer").forEach((node) => {
            if (node !== nextLayer) {
              node.remove();
            }
          });
          nextLayer.classList.add("is-visible");
          return;
        }
        window.requestAnimationFrame(() => {
          nextLayer.classList.add("is-visible");
          currentLayer.classList.add("is-exiting");
        });
        window.setTimeout(() => {
          if (currentLayer.parentNode === stageNode) {
            currentLayer.remove();
          }
        }, 340);
      }

      function syncCarousel() {
        carouselSteps.forEach((step, index) => {
          const isActive = index === currentIndex;
          step.classList.toggle("is-active", isActive);
          if (isActive) {
            step.setAttribute("aria-current", "step");
            step.scrollIntoView({ block: "nearest", inline: "nearest" });
          } else {
            step.removeAttribute("aria-current");
          }
        });
      }

      function getProjectorSignalLabel(kind) {
        if (kind === "image") {
          return "Image agrandie sur l'ecran projete";
        }
        if (kind === "table") {
          return "Tableau agrandi sur l'ecran projete";
        }
        if (kind === "chart") {
          return "Graphique agrandi sur l'ecran projete";
        }
        return "Aucun agrandissement actif";
      }

      function syncProjectorSignal() {
        projectorSignal.classList.toggle("is-active", Boolean(projectorMediaState.isOpen));
        projectorSignal.textContent = getProjectorSignalLabel(projectorMediaState.kind);
      }

      function syncProjectorZoomUi() {
        const imageActive = Boolean(projectorMediaState.isOpen) && projectorMediaState.kind === "image";
        imageZoomControls.hidden = !imageActive;
        imageZoomInButton.setAttribute("aria-pressed", imageActive && projectorMediaState.imageZoomActive ? "true" : "false");
        imageZoomResetButton.disabled = !imageActive;
      }

      function syncProjectorHighlight() {
        currentStage.querySelectorAll(".presenter-stage-hotspot.is-projector-active").forEach((node) => {
          node.classList.remove("is-projector-active");
        });
        if (!projectorMediaState.isOpen || !projectorMediaState.kind || projectorMediaState.index < 0) {
          return;
        }
        const activeTarget = currentStage.querySelector(
          '[data-hotspot-kind="' + projectorMediaState.kind + '"][data-hotspot-index="' + projectorMediaState.index + '"]'
        );
        if (activeTarget) {
          activeTarget.classList.add("is-projector-active");
        }
      }

      function getProjectorMediaDescriptor(target) {
        const hotspot = target.closest("[data-hotspot-kind][data-hotspot-index]");
        if (!hotspot || !currentStage.contains(hotspot)) {
          return null;
        }
        return {
          kind: String(hotspot.getAttribute("data-hotspot-kind") || ""),
          index: Number(hotspot.getAttribute("data-hotspot-index") || -1),
        };
      }

      function toggleProjectorMediaFromConsole(target) {
        const descriptor = getProjectorMediaDescriptor(target);
        if (!descriptor || descriptor.index < 0) {
          return;
        }
        const willClose =
          projectorMediaState.isOpen &&
          projectorMediaState.kind === descriptor.kind &&
          projectorMediaState.index === descriptor.index;
        projectorMediaState = willClose
          ? { isOpen: false, kind: "", index: -1, imageZoomActive: false }
          : { isOpen: true, kind: descriptor.kind, index: descriptor.index, imageZoomActive: false };
        syncProjectorSignal();
        syncProjectorZoomUi();
        syncProjectorHighlight();
        syncBridge.post({
          type: "projector-media-toggle",
          origin: presenterControllerId,
          currentIndex,
          mediaKind: descriptor.kind,
          mediaIndex: descriptor.index,
        });
      }

      function sendProjectorImageZoom(mode) {
        if (!projectorMediaState.isOpen || projectorMediaState.kind !== "image") {
          return;
        }
        projectorMediaState = Object.assign({}, projectorMediaState, {
          imageZoomActive: mode === "in",
        });
        syncProjectorZoomUi();
        syncProjectorHighlight();
        syncBridge.post({
          type: "projector-image-zoom",
          origin: presenterControllerId,
          currentIndex,
          mode,
        });
      }

      function getRevealItems(root) {
        return Array.from((root || document).querySelectorAll("[data-reveal-step]"));
      }

      function resetRevealState(root) {
        const revealItems = getRevealItems(root);
        if (!root || root.getAttribute("data-progressive-content") !== "true") {
          revealItems.forEach((item) => {
            item.classList.remove("presentation-reveal-hidden", "presentation-reveal-visible");
          });
          return;
        }
        revealItems.forEach((item) => {
          item.classList.add("presentation-reveal-hidden");
          item.classList.remove("presentation-reveal-visible");
        });
      }

      function applyRevealState(root, revealStep) {
        if (!root || root.getAttribute("data-progressive-content") !== "true") {
          return;
        }
        const safeRevealStep = Math.max(0, Number(revealStep) || 0);
        getRevealItems(root).forEach((item) => {
          const step = Number(item.getAttribute("data-reveal-step")) || 0;
          if (step > 0 && step <= safeRevealStep) {
            item.classList.remove("presentation-reveal-hidden");
            item.classList.add("presentation-reveal-visible");
            return;
          }
          item.classList.add("presentation-reveal-hidden");
          item.classList.remove("presentation-reveal-visible");
        });
      }

      function collectRevealSteps(root) {
        return Array.from(new Set(
          getRevealItems(root)
            .map((item) => Number(item.getAttribute("data-reveal-step")) || 0)
            .filter((step) => step > 0)
            .sort((a, b) => a - b)
        ));
      }

      function getNextRevealStep(root, activeRevealStep) {
        return collectRevealSteps(root).find((step) => step > activeRevealStep) || 0;
      }

      function getPreviousRevealStep(root, activeRevealStep) {
        const steps = collectRevealSteps(root).filter((step) => step < activeRevealStep);
        return steps.length ? steps[steps.length - 1] : 0;
      }

      function normalizeIndex(index) {
        if (!slideMeta.length) {
          return 0;
        }
        const raw = Number(index);
        if (!Number.isFinite(raw)) {
          return 0;
        }
        return ((raw % slideMeta.length) + slideMeta.length) % slideMeta.length;
      }

      function publishState(options) {
        const opts = options || {};
        const signature = String(currentIndex) + ":" + String(currentRevealStep);
        if (!opts.force && signature === lastPublishedStateSignature) {
          return;
        }
        lastPublishedStateSignature = signature;
        syncBridge.post({
          type: "deck-state",
          origin: presenterControllerId,
          currentIndex,
          revealStep: currentRevealStep,
        });
      }

      async function renderPresenter() {
        const renderToken = ++currentRenderToken;
        const currentSlideMeta = slideMeta[currentIndex] || null;
        const nextSlideIndex = slideMeta.length ? normalizeIndex(currentIndex + 1) : 0;
        const nextSlideMeta = slideMeta[nextSlideIndex] || null;
        ensureStageLoading(currentStage, "Aperçu en préparation...");
        ensureStageLoading(nextStage, "Aperçu en préparation...");
        const currentArticle = mountSlide(currentIndex, currentBuffer);
        const nextArticle = currentIndex === nextSlideIndex && slideMeta.length <= 1
          ? null
          : mountSlide(nextSlideIndex, nextBuffer);
        if (!nextArticle) {
          nextBuffer.innerHTML = "";
        }

        if (currentArticle) {
          resetRevealState(currentArticle);
          applyRevealState(currentArticle, currentRevealStep);
        }
        if (nextArticle) {
          resetRevealState(nextArticle);
        } else {
          nextStage.innerHTML = '<div class="presenter-note-empty">Aucune slide suivante.</div>';
        }

        currentTitle.textContent = currentSlideMeta ? currentSlideMeta.title : "Slide en cours";
        currentMeta.textContent = currentSlideMeta ? (currentSlideMeta.number + " / " + slideMeta.length) : "";
        nextTitle.textContent = nextSlideMeta ? nextSlideMeta.title : "Fin du diaporama";
        nextMeta.textContent = nextSlideMeta && slideMeta.length > 1 ? (nextSlideMeta.number + " / " + slideMeta.length) : "";
        notesBody.innerHTML = currentSlideMeta ? currentSlideMeta.noteHtml : '<p class="presenter-note-empty">Aucune note.</p>';

        const nextRevealStep = currentArticle ? getNextRevealStep(currentArticle, currentRevealStep) : 0;
        revealButton.disabled = !nextRevealStep;
        revealButton.textContent = nextRevealStep ? "Reveler l'etape suivante" : "Aucun reveal";
        const hasSameProjectedKind = projectorMediaState.isOpen && typeof projectorMediaState.kind === "string";
        if (!hasSameProjectedKind) {
          projectorMediaState = { isOpen: false, kind: "", index: -1, imageZoomActive: false };
        }
        syncCarousel();
        syncProjectorSignal();
        syncProjectorZoomUi();
        if (typeof window.html2canvas !== "function") {
          return;
        }
        if (currentArticle) {
          const currentAsset = await getOrCreatePreviewAsset(currentIndex, currentRevealStep, currentBuffer, currentArticle);
          if (renderToken !== currentRenderToken) {
            return;
          }
          await renderPreviewIntoStage(currentStage, currentAsset, {
            interactive: true,
            occupancy: isProjectorFocusMode ? 0.96 : (areStagesSwapped ? 0.68 : 0.96),
          });
        }
        if (renderToken !== currentRenderToken) {
          return;
        }
        if (nextArticle) {
          const nextAsset = await getOrCreatePreviewAsset(nextSlideIndex, 0, nextBuffer, nextArticle);
          if (renderToken !== currentRenderToken) {
            return;
          }
          await renderPreviewIntoStage(nextStage, nextAsset, {
            interactive: false,
            occupancy: areStagesSwapped ? 0.96 : 0.68,
          });
          if (renderToken !== currentRenderToken) {
            return;
          }
        }
        fitStagePreviews();
        syncProjectorHighlight();
        schedulePreviewCacheWarm(currentIndex, currentRevealStep);
      }

      function setPresenterState(index, revealStep, options) {
        currentIndex = normalizeIndex(index);
        currentRevealStep = Math.max(0, Number(revealStep) || 0);
        void renderPresenter();
        if (!options || !options.silent) {
          publishState();
        }
      }

      function goToSlide(index, options) {
        setPresenterState(index, 0, options);
      }

      function advancePresentation() {
        const currentArticle = getCurrentBufferSlide();
        const nextRevealStep = currentArticle ? getNextRevealStep(currentArticle, currentRevealStep) : 0;
        if (nextRevealStep) {
          setPresenterState(currentIndex, nextRevealStep);
          return;
        }
        goToSlide(currentIndex + 1);
      }

      function rewindPresentation() {
        const currentArticle = getCurrentBufferSlide();
        const previousRevealStep = currentArticle ? getPreviousRevealStep(currentArticle, currentRevealStep) : 0;
        if (currentRevealStep > 0) {
          setPresenterState(currentIndex, previousRevealStep);
          return;
        }
        goToSlide(currentIndex - 1);
      }

      function buildProjectorUrl() {
        const projectorUrl = new URL(window.location.href);
        projectorUrl.searchParams.delete("presenter");
        projectorUrl.searchParams.set("present", "1");
        projectorUrl.searchParams.set("session", presenterSessionId);
        if (slideMeta[currentIndex] && slideMeta[currentIndex].id) {
          projectorUrl.searchParams.set("start", slideMeta[currentIndex].id);
        } else {
          projectorUrl.searchParams.delete("start");
        }
        return projectorUrl.toString();
      }

      function openProjectorWindow() {
        projectorBlocked = false;
        const projectorUrl = buildProjectorUrl();
        if (projectorWindow && !projectorWindow.closed) {
          try {
            projectorWindow.location.href = projectorUrl;
            projectorWindow.focus();
          } catch (error) {
            projectorWindow = null;
          }
        }
        if (!projectorWindow || projectorWindow.closed) {
          projectorWindow = window.open(projectorUrl, "_blank", "noopener");
        }
        projectorBlocked = !projectorWindow;
        projectorConnected = false;
        if (projectorWindow) {
          window.setTimeout(() => publishState({ force: true }), 380);
          window.setTimeout(() => publishState({ force: true }), 900);
        }
      }

      syncBridge.subscribe((payload) => {
        if (!payload || payload.origin === presenterControllerId) {
          return;
        }
        if (payload.type === "projector-ready") {
          projectorConnected = true;
          lastProjectorContactAt = Date.now();
          publishState({ force: true });
          return;
        }
        if (payload.type === "deck-state") {
          projectorConnected = true;
          lastProjectorContactAt = Date.now();
          setPresenterState(payload.currentIndex, payload.revealStep, { silent: true });
          return;
        }
        if (payload.type === "projector-media-state") {
          projectorMediaState = {
            isOpen: Boolean(payload.isOpen),
            kind: payload.mediaKind || "",
            index: Number.isInteger(payload.mediaIndex) ? payload.mediaIndex : -1,
            imageZoomActive: Boolean(payload.imageZoomActive),
          };
          syncProjectorSignal();
          syncProjectorZoomUi();
          syncProjectorHighlight();
        }
      });

      prevButton.addEventListener("click", rewindPresentation);
      revealButton.addEventListener("click", () => setPresenterState(currentIndex, getNextRevealStep(getCurrentBufferSlide(), currentRevealStep)));
      nextButton.addEventListener("click", advancePresentation);
      presenterCarousel.addEventListener("click", (event) => {
        const target = event.target.closest("[data-presenter-carousel-index]");
        if (!target) {
          return;
        }
        goToSlide(Number(target.getAttribute("data-presenter-carousel-index")));
      });
      currentStage.addEventListener("click", (event) => {
        const interactiveTarget = event.target.closest("[data-hotspot-kind][data-hotspot-index]");
        if (!interactiveTarget) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        toggleProjectorMediaFromConsole(interactiveTarget);
      });
      themeToggle.addEventListener("click", toggleTheme);
      swapStagesButton.addEventListener("click", toggleStagesLayout);
      projectorFocusButton.addEventListener("click", toggleProjectorFocusMode);
      imageZoomInButton.addEventListener("click", () => sendProjectorImageZoom("in"));
      imageZoomResetButton.addEventListener("click", () => sendProjectorImageZoom("reset"));
      toolbarPrevButton.addEventListener("click", rewindPresentation);
      toolbarNextButton.addEventListener("click", advancePresentation);
      fullscreenToggle.addEventListener("click", toggleFullscreen);
      openProjectorButton.addEventListener("click", openProjectorWindow);
      refreshProjectorButton.addEventListener("click", publishState);
      window.addEventListener("focus", () => publishState({ force: true }));
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          publishState({ force: true });
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.target && event.target.matches("input, textarea, select, [contenteditable='true']")) {
          return;
        }
        if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " " || event.code === "Space") {
          event.preventDefault();
          advancePresentation();
          return;
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "PageUp") {
          event.preventDefault();
          rewindPresentation();
          return;
        }
        if (String(event.key || "").toLowerCase() === "i") {
          event.preventDefault();
          toggleStagesLayout();
          return;
        }
        if (String(event.key || "").toLowerCase() === "p") {
          event.preventDefault();
          toggleProjectorFocusMode();
          return;
        }
        if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          sendProjectorImageZoom("in");
          return;
        }
        if (event.key === "-" || event.key === "_") {
          event.preventDefault();
          sendProjectorImageZoom("reset");
        }
      });

      document.addEventListener("fullscreenchange", syncFullscreenUi);
      window.addEventListener("resize", fitStagePreviews);
      window.addEventListener("beforeunload", () => syncBridge.close());
      window.setInterval(() => {
        if (projectorWindow && projectorWindow.closed) {
          projectorWindow = null;
          projectorConnected = false;
        } else if (projectorConnected && Date.now() - lastProjectorContactAt > 12000) {
          projectorConnected = false;
        }
      }, 1200);
      window.setInterval(() => publishState({ force: true }), 2200);

      loadThemePreference();
      loadStagesLayoutPreference();
      loadProjectorFocusPreference();
      syncFullscreenUi();
      void renderPresenter();
      window.setTimeout(openProjectorWindow, 120);
      window.setTimeout(() => publishState({ force: true }), 620);
    </script>
  </body>
</html>`;
  }

  async function renderPresenterDocument(state) {
    const startSlideId = new URLSearchParams(window.location.search).get("start") || "";
    const html = await buildPresenterHtml(state, { startSlideId });
    document.open();
    document.write(html);
    document.close();
  }

  ns.services.presenter.buildPresenterHtml = buildPresenterHtml;
  ns.services.presenter.renderPresenterDocument = renderPresenterDocument;
})();
