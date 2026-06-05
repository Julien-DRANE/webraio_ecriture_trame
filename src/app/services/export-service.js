(function () {
  const ns = (window.StudioSlides = window.StudioSlides || {});
  ns.services = ns.services || {};
  let pdfProgressListener = null;

  function setPdfProgressListener(listener) {
    pdfProgressListener = typeof listener === "function" ? listener : null;
  }

  function notifyPdfProgress(detail) {
    if (!pdfProgressListener) {
      return;
    }
    try {
      pdfProgressListener(Object.assign({
        state: "idle",
        percent: 0,
        label: "Exporter PDF",
        detail: "",
      }, detail || {}));
    } catch (error) {
      return;
    }
  }

  function waitForNextFrame() {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        window.setTimeout(resolve, 0);
      });
    });
  }

  function getAvailableMediaItems(items) {
    return ns.data.augmentMediaItems ? ns.data.augmentMediaItems(items || []) : (items || []);
  }

  function getAvailableMediaUrls(urlMap) {
    return ns.data.augmentMediaUrlMap ? ns.data.augmentMediaUrlMap(urlMap || {}) : (urlMap || {});
  }

  function getContainedRect(containerWidth, containerHeight, sourceWidth, sourceHeight) {
    const safeContainerWidth = Math.max(1, Number(containerWidth) || 1);
    const safeContainerHeight = Math.max(1, Number(containerHeight) || 1);
    const safeSourceWidth = Math.max(1, Number(sourceWidth) || 1);
    const safeSourceHeight = Math.max(1, Number(sourceHeight) || 1);
    const scale = Math.min(safeContainerWidth / safeSourceWidth, safeContainerHeight / safeSourceHeight);
    const width = safeSourceWidth * scale;
    const height = safeSourceHeight * scale;
    return {
      x: (safeContainerWidth - width) / 2,
      y: (safeContainerHeight - height) / 2,
      width,
      height,
    };
  }

  function serializeForScript(value) {
    return JSON.stringify(value)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function exportJson(state) {
    const fileName = `${ns.utils.slugify(state.settings.title || "presentation")}.json`;
    const mediaDataMap = await ns.services.media.resolveExportMediaUrls(state.mediaLibrary || []);
    const exportPayload = Object.assign({}, state, { mediaDataMap });
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, fileName);
  }

  function richTextToPlainText(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${raw}</div>`, "text/html");
    return String(doc.body.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  function getCanvasTextLines(slide) {
    const elements = slide && slide.canvasData && Array.isArray(slide.canvasData.elements)
      ? slide.canvasData.elements
      : [];
    return elements
      .filter((item) => item && item.type === "text")
      .sort((a, b) => (Number(a.y) || 0) - (Number(b.y) || 0) || (Number(a.x) || 0) - (Number(b.x) || 0))
      .map((item) => richTextToPlainText(item.text || ""))
      .filter(Boolean);
  }

  function buildSlideTextExport(slide, index) {
    const lines = [];
    const slideNumber = slide && slide.number ? String(slide.number).trim() : String(index + 1);
    lines.push(`SLIDE ${slideNumber}`);

    if (slide && slide.title) {
      lines.push(`Titre : ${String(slide.title).trim()}`);
    }
    if (slide && slide.subtitle) {
      lines.push(`Sous-titre : ${String(slide.subtitle).trim()}`);
    }

    const bullets = Array.isArray(slide && slide.bullets) ? slide.bullets : [];
    const subBullets = slide && slide.subBullets && typeof slide.subBullets === "object" ? slide.subBullets : {};
    const bulletLines = bullets
      .map((bullet, bulletIndex) => {
        const main = String(bullet || "").trim();
        const children = Array.isArray(subBullets[bulletIndex]) ? subBullets[bulletIndex] : [];
        return {
          main,
          children: children.map((item) => String(item || "").trim()).filter(Boolean),
        };
      })
      .filter((item) => item.main || item.children.length);

    if (bulletLines.length) {
      lines.push("Points :");
      bulletLines.forEach((item) => {
        if (item.main) {
          lines.push(`- ${item.main}`);
        }
        item.children.forEach((child) => {
          lines.push(`  - ${child}`);
        });
      });
    }

    const freeText = richTextToPlainText(slide && slide.freeBody);
    if (freeText) {
      lines.push("Texte libre :");
      lines.push(freeText);
    }

    const canvasTextLines = getCanvasTextLines(slide);
    if (canvasTextLines.length) {
      lines.push("Textes canvas :");
      canvasTextLines.forEach((item) => {
        lines.push(`- ${item}`);
      });
    }

    return lines.join("\n");
  }

  function exportTxt(state) {
    const fileName = `${ns.utils.slugify(state.settings.title || "presentation")}.txt`;
    const sections = [];

    if (state && state.settings && state.settings.title) {
      sections.push(`Présentation : ${String(state.settings.title).trim()}`);
    }
    if (state && state.settings && state.settings.subtitle) {
      sections.push(`Sous-titre général : ${String(state.settings.subtitle).trim()}`);
    }

    const slidesText = (state.slides || [])
      .map((slide, index) => buildSlideTextExport(slide, index))
      .filter(Boolean);

    if (slidesText.length) {
      if (sections.length) {
        sections.push("");
      }
      sections.push(slidesText.join("\n\n--------------------\n\n"));
    }

    const blob = new Blob([sections.join("\n")], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, fileName);
  }

  async function resolveLogoAsDataUrl(src) {
    try {
      const response = await fetch(src);
      if (!response.ok) {
        return src;
      }
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      return src;
    }
  }

  async function resolveLogoSources() {
    const defaults = ns.ui.getSlideLogoSources();
    const [region, drane] = await Promise.all([
      resolveLogoAsDataUrl(defaults.region),
      resolveLogoAsDataUrl(defaults.drane),
    ]);

    return { region, drane };
  }

  async function buildPresentationHtml(state, logoSources, options) {
    const opts = options || {};
    const startSlideId = opts.startSlideId || "";
    const availableMediaItems = getAvailableMediaItems(state.mediaLibrary || []);
    const pdfMediaAssets = opts.pdfMode || opts.exportMode === "html"
      ? await ns.services.media.resolvePdfMediaAssets(availableMediaItems)
      : null;
    const mediaUrls = opts.pdfMode
      ? pdfMediaAssets.previewMap
      : await ns.services.media.resolveExportMediaUrls(availableMediaItems);
    const mediaLinks = pdfMediaAssets ? pdfMediaAssets.linkMap : {};
    const mergedMediaUrls = getAvailableMediaUrls(mediaUrls);

    if (opts.exportMode === "html" && pdfMediaAssets) {
      availableMediaItems.forEach((item) => {
        if (item.kind === "embed") {
          mergedMediaUrls[item.id] = pdfMediaAssets.previewMap[item.id] || mergedMediaUrls[item.id] || "";
        }
      });
    }

    const slidesMarkup = state.slides
      .map((slide) => {
        return `<section class="slide-screen">${ns.ui.createSlideMarkup(slide, state.settings, {
          compact: false,
          pdfMode: Boolean(opts.pdfMode),
          exportMode: opts.exportMode || "",
          logoSources,
          mediaItems: availableMediaItems,
          mediaUrls: mergedMediaUrls,
          mediaLinks,
        })}</section>`;
      })
      .join("");
    const progressMarkup = state.slides
      .map((slide, index) => {
        const slideNumber = slide.number || String(index + 1).padStart(2, "0");
        const slideTitle = slide.title || `Slide ${slideNumber}`;
        return `
          <button
            class="deck-progress-step"
            type="button"
            data-progress-index="${index}"
            aria-label="Aller à la slide ${ns.utils.escapeHtml(slideNumber)} : ${ns.utils.escapeHtml(slideTitle)}"
            title="${ns.utils.escapeHtml(slideNumber)} - ${ns.utils.escapeHtml(slideTitle)}"
          >
            <span class="deck-progress-dot"></span>
          </button>
        `;
      })
      .join("");
    const initialSlideIndex = Math.max(0, state.slides.findIndex((slide) => slide.id === startSlideId));
    const isPdfMode = Boolean(opts.pdfMode);
    const isPresentMode = opts.exportMode === "present";
    const bodyAttributes = isPdfMode
      ? ' class="pdf-export"'
      : ` class="${isPresentMode ? "presentation-runtime" : ""}" data-transition="${ns.utils.escapeHtml(state.settings.transition || "fade")}"`;

    return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${ns.utils.escapeHtml(state.settings.title)}</title>
    <link rel="icon" type="image/png" href="assets/images/icon.png" />
    <style>
      :root {
        --ink: #122033;
        --muted: #5d6c81;
        --blue: #2c73da;
        --blue-deep: #17478b;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--ink);
        font-family: Aptos, "Segoe UI", "Trebuchet MS", sans-serif;
        background: linear-gradient(160deg, #edf3f9, #d7e4f3);
      }
      .deck-shell { min-height: 100vh; padding: 1.2rem; }
      main {
        position: relative;
        display: block;
      }
      .deck-topbar {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 0.85rem 1rem;
        border-radius: 999px;
        background: rgba(15, 33, 55, 0.88);
        color: #ffffff;
        backdrop-filter: blur(12px);
      }
      .deck-meta { display: flex; flex-direction: column; gap: 0.15rem; }
      .deck-meta strong { font-size: 1rem; }
      .deck-meta span { font-size: 0.82rem; color: rgba(255,255,255,0.78); }
      .deck-nav { display: flex; gap: 0.6rem; }
      .deck-nav button {
        min-height: 2.8rem;
        padding: 0.7rem 0.95rem;
        border: 0;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
        color: #ffffff;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      a { color: #17478b; }
      .slide-screen {
        display: none;
        min-height: calc(100vh - 6rem);
        align-items: center;
        justify-content: center;
      }
      body.pdf-export {
        background: #ffffff;
      }
      body.pdf-export .deck-shell {
        min-height: auto;
        padding: 0;
      }
      body.pdf-export .slide-screen {
        display: flex;
        min-height: auto;
      }
      .slide-screen.is-active { display: flex; }
      .deck-slide {
        --slide-bg-start: #ffffff;
        --slide-bg-end: #eef5fd;
        --slide-accent: #2c73da;
        --slide-accent-strong: #17478b;
        --slide-accent-soft: rgba(44,115,218,0.22);
        --slide-accent-softer: rgba(44,115,218,0.08);
        --slide-accent-wave: rgba(44,115,218,0.2);
        --slide-accent-wave-soft: rgba(44,115,218,0.08);
        --slide-accent-deep-soft: rgba(23,71,139,0.14);
        --slide-decor-soft: rgba(44,115,218,0.22);
        --slide-decor-softer: rgba(44,115,218,0.08);
        --slide-decor-wave: rgba(44,115,218,0.2);
        --slide-decor-wave-soft: rgba(44,115,218,0.08);
        --slide-decor-deep-soft: rgba(23,71,139,0.14);
        --slide-surface: rgba(255,255,255,0.72);
        --slide-surface-strong: rgba(255,255,255,0.76);
        --slide-text: var(--ink);
        --slide-text-muted: var(--muted);
        --slide-text-soft: rgba(18,32,51,0.44);
        --slide-line: rgba(18,32,51,0.12);
        --slide-frame-shadow: none;
        --slide-font-body: Aptos, "Segoe UI", "Trebuchet MS", sans-serif;
        --slide-font-heading: "Iowan Old Style", Georgia, serif;
        --slide-content-font-scale: 1;
        position: relative;
        overflow: hidden;
        width: min(1280px, calc(100vw - 3rem));
        aspect-ratio: 16 / 9;
        padding: clamp(1.15rem, 2vw, 1.8rem);
        border-radius: 26px;
        background: linear-gradient(155deg, var(--slide-bg-start), var(--slide-bg-end) 68%);
        color: var(--slide-text);
        font-family: var(--slide-font-body);
        box-shadow: 0 20px 44px rgba(11, 22, 42, 0.2);
      }
      body.presentation-runtime main {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: calc(100vh - 6rem);
        overflow: hidden;
        --deck-window-scale: 1;
      }
      body.presentation-runtime .slide-screen {
        width: 100%;
        min-height: calc(720px * var(--deck-window-scale, 1));
        padding: 0;
        overflow: visible;
      }
      body.presentation-runtime .deck-slide {
        width: 1280px;
        height: 720px;
        max-width: none;
        max-height: none;
        aspect-ratio: auto;
        transform: scale(var(--deck-window-scale, 1));
        transform-origin: center center;
      }
      main:fullscreen {
        width: 100vw;
        height: 100vh;
        background: linear-gradient(160deg, #edf3f9, #d7e4f3);
        overflow: hidden;
      }
      main:fullscreen .slide-screen {
        min-height: 100vh;
        width: 100vw;
        padding: 0;
      }
      main:fullscreen .deck-slide {
        width: 1280px;
        height: 720px;
        max-width: none;
        max-height: none;
        border-radius: 0;
        transform: scale(var(--deck-fullscreen-scale, 1));
        transform-origin: center center;
      }
      body.deck-is-fullscreen .deck-shell {
        padding: 0;
      }
      body.deck-is-fullscreen .deck-topbar {
        display: none;
      }
      .deck-progress {
        position: fixed;
        top: 50%;
        right: 1.1rem;
        z-index: 25;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.45rem;
        padding: 0.7rem 0.46rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.16);
        border: 1px solid rgba(255, 255, 255, 0.14);
        backdrop-filter: blur(12px);
        transform: translateY(-50%);
        box-shadow: 0 10px 24px rgba(11, 22, 42, 0.08);
      }
      .deck-progress-step {
        display: grid;
        place-items: center;
        width: 0.9rem;
        height: 0.9rem;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: transparent;
        cursor: pointer;
      }
      .deck-progress-dot {
        width: 0.38rem;
        height: 0.38rem;
        border-radius: 999px;
        background: rgba(23, 71, 139, 0.28);
        transition:
          width 0.18s ease,
          height 0.18s ease,
          border-radius 0.18s ease,
          background 0.18s ease,
          transform 0.18s ease;
      }
      .deck-progress-step:hover .deck-progress-dot,
      .deck-progress-step:focus-visible .deck-progress-dot {
        transform: scale(1.12);
        background: rgba(23, 71, 139, 0.42);
      }
      .deck-progress-step:focus-visible {
        outline: 2px solid rgba(44, 115, 218, 0.18);
        outline-offset: 0.12rem;
      }
      .deck-progress-step.is-active {
        width: 0.96rem;
        height: 2.2rem;
      }
      .deck-progress-step.is-active .deck-progress-dot {
        width: 0.34rem;
        height: 1.5rem;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(44, 115, 218, 0.7), rgba(44, 115, 218, 0.42));
        transform: none;
      }
      .deck-slide::before,
      .deck-slide::after { content: ""; position: absolute; pointer-events: none; }
      .deck-slide.theme-circles::before,
      .deck-slide.theme-mix::before {
        top: -15%;
        right: calc(-10% - 1.2cm);
        width: 29%;
        aspect-ratio: 1;
        border-radius: 50%;
        background:
          radial-gradient(circle at 45% 40%, rgba(255,255,255,0.9) 0 18%, transparent 19%),
          radial-gradient(circle at center, var(--slide-decor-soft) 0 56%, var(--slide-decor-softer) 57% 74%, transparent 75%);
      }
      .deck-slide.theme-circles::after,
      .deck-slide.theme-mix::after {
        left: -8%;
        bottom: -14%;
        width: 20%;
        aspect-ratio: 1;
        border-radius: 50%;
        background:
          radial-gradient(circle at center, var(--slide-decor-deep-soft) 0 56%, var(--slide-decor-softer) 57% 72%, transparent 73%);
      }
      .slide-wave {
        position: absolute;
        right: -31%;
        bottom: -145%;
        width: 95%;
        aspect-ratio: 1;
        display: none;
        border-radius: 50%;
        background:
          radial-gradient(
            circle closest-side at center,
            transparent 0 92.8%,
            var(--slide-decor-wave-soft) 93.2% 99.4%,
            transparent 100%
          );
      }
      .slide-wave::before,
      .slide-wave::after {
        display: none;
      }
      .deck-slide.theme-waves .slide-wave,
      .deck-slide.theme-mix .slide-wave { display: block; }
      .slide-logo {
        position: absolute;
        z-index: 1;
        object-fit: contain;
        pointer-events: none;
      }
      .slide-logo-region {
        top: clamp(0.9rem, 1.8vw, 1.5rem);
        left: clamp(1rem, 2vw, 1.7rem);
        width: clamp(8.075rem, 15.2vw, 10.925rem);
        max-width: 22.8%;
      }
      .slide-logo-drane {
        right: clamp(1rem, 2vw, 1.5rem);
        bottom: clamp(0.8rem, 1.7vw, 1.3rem);
        width: clamp(3.2rem, 7vw, 4.8rem);
        max-width: 11%;
        border-radius: 10px;
      }
      .slide-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        height: 100%;
        padding-top: clamp(2.15rem, 4.1vw, 3.15rem);
        padding-right: clamp(2.1rem, 4.8vw, 3.35rem);
      }
      .slide-floating-top-right-media {
        position: absolute;
        top: clamp(4.9rem, 10.4vw, 6.1rem);
        right: clamp(4rem, 7.4vw, 5.8rem);
        z-index: 3;
        display: flex;
        justify-content: flex-end;
        width: min(100%, 16rem);
        pointer-events: auto;
      }
      .slide-floating-top-right-media.is-balanced {
        top: clamp(7.2rem, 16vh, 9.8rem);
        right: clamp(4.8rem, 8.2vw, 7rem);
        width: min(100%, 18.6rem);
        justify-content: center;
      }
      .slide-floating-top-right-media .slide-media-image,
      .slide-floating-top-right-media .slide-media-video,
      .slide-floating-top-right-media .slide-media-print-card,
      .slide-floating-top-right-media .slide-media-embed-wrap,
      .slide-floating-top-right-media .slide-media-external-link {
        width: auto;
        max-width: min(100%, 15.5rem);
        max-height: clamp(7rem, 15vh, 8.8rem);
      }
      .slide-floating-top-right-media.is-balanced .slide-media-image,
      .slide-floating-top-right-media.is-balanced .slide-media-video,
      .slide-floating-top-right-media.is-balanced .slide-media-print-card,
      .slide-floating-top-right-media.is-balanced .slide-media-embed-wrap,
      .slide-floating-top-right-media.is-balanced .slide-media-external-link {
        max-width: min(100%, 18.2rem);
        max-height: clamp(9.2rem, 21vh, 12.6rem);
      }
      .deck-slide.is-canvas-slide .slide-content {
        padding-top: clamp(1.45rem, 2.8vw, 2.15rem);
        padding-right: clamp(0.75rem, 1.8vw, 1.2rem);
      }
      .slide-topline {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 1rem;
        padding-left: clamp(8.8rem, 16vw, 12rem);
      }
      .slide-label-pill,
      .slide-bloom-pill {
        display: inline-flex;
        align-items: center;
        min-height: 1.95rem;
        padding: 0.35rem 0.72rem;
        border-radius: 999px;
        font-size: calc(0.76rem * var(--slide-content-font-scale));
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .slide-label-pill {
        background: var(--slide-accent-softer);
        color: var(--slide-accent-strong);
      }
      .slide-meta-right {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        margin-left: auto;
        max-width: 100%;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .slide-bloom-pill {
        background: var(--slide-line);
        color: var(--slide-text);
      }
      .slide-number-badge {
        color: var(--slide-text-soft);
        font-size: 0.86rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .slide-headline {
        margin-top: calc(0.88rem + 1cm);
        margin-bottom: 0.22rem;
        max-width: min(86%, 38ch);
        font-family: var(--slide-font-heading);
        font-size: clamp(1.56rem, 2.82vw, 2.56rem);
        line-height: 0.98;
      }
      .slide-body-no-media .slide-headline {
        max-width: min(92%, 40ch);
      }
      .slide-body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) clamp(16rem, 37%, 23.5rem);
        gap: clamp(1rem, 2vw, 1.4rem);
        align-items: start;
      }
      .slide-body.has-media-stack-layout {
        grid-template-columns: minmax(0, 1fr) clamp(11.75rem, 29%, 17.1rem);
        gap: clamp(0.85rem, 1.7vw, 1.15rem);
      }
      .slide-body.has-top-right-media-layout > .slide-media-slot {
        align-self: start;
        align-items: flex-start;
        justify-content: flex-start;
        min-height: 0;
        margin-top: 0.2rem;
      }
      .slide-body.has-top-right-media-layout > .slide-media-slot .slide-media-image,
      .slide-body.has-top-right-media-layout > .slide-media-slot .slide-media-video,
      .slide-body.has-top-right-media-layout > .slide-media-slot .slide-media-print-card,
      .slide-body.has-top-right-media-layout > .slide-media-slot .slide-media-embed-wrap,
      .slide-body.has-top-right-media-layout > .slide-media-slot .slide-media-external-link {
        max-height: clamp(8.4rem, 19vh, 11.2rem);
      }
      .slide-main { min-width: 0; }
      .deck-slide:not(.is-canvas-slide) .slide-main,
      .deck-slide:not(.is-canvas-slide) .slide-footer {
        font-size: calc(1rem * var(--slide-content-font-scale));
      }
      .slide-body-canvas {
        display: block;
        height: 100%;
      }
      .slide-body-canvas .slide-main {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
      }
      .deck-slide.is-canvas-slide .slide-body-canvas {
        flex: 1 1 auto;
        min-height: 0;
      }
      .deck-slide.is-canvas-slide .slide-main {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        position: relative;
        overflow: visible;
      }
      .slide-canvas-surface {
        position: relative;
        flex: 1;
        min-height: 18.5rem;
        margin-top: 0.72rem;
        border-radius: 24px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.14)),
          linear-gradient(135deg, rgba(255, 255, 255, 0.14), transparent);
        border: 1px solid rgba(255, 255, 255, 0.32);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
        overflow: hidden;
      }
      .deck-slide.is-canvas-slide .slide-canvas-surface {
        position: absolute;
        inset: 0;
        min-height: 0;
        height: auto;
        margin-top: 0;
        z-index: 2;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }
      .slide-canvas-empty {
        display: grid;
        place-items: center;
        height: 100%;
        padding: 1.5rem;
        color: var(--slide-text-muted);
        text-align: center;
        font-size: 1rem;
        line-height: 1.45;
      }
      .canvas-element {
        position: absolute;
        min-width: 3.5rem;
        min-height: 2.5rem;
        overflow: visible;
      }
      .canvas-element-content {
        width: 100%;
        height: 100%;
      }
      .canvas-element-text-content {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        box-sizing: border-box;
        width: fit-content;
        max-width: 100%;
        min-height: 0;
        height: auto;
        padding: 0.55rem 0.7rem;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.66);
        line-height: 1.12;
        overflow-wrap: anywhere;
        white-space: normal;
        box-shadow: 0 10px 24px rgba(18, 32, 51, 0.10);
      }
      .canvas-element-text-content.is-frameless {
        padding: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }
      .canvas-element-text-content p {
        margin: 0 0 0.18em;
      }
      .canvas-element-text-content p:last-child {
        margin-bottom: 0;
      }
      .canvas-element-text-content ul {
        display: block;
        width: 100%;
        margin: 0.05em 0 0.18em;
        padding-left: 1.15em;
        list-style: disc outside;
      }
      .canvas-element-text-content li {
        margin: 0 0 0.12em;
      }
      .canvas-element-text-content li:last-child {
        margin-bottom: 0;
      }
      .canvas-element-shape-content {
        position: relative;
        width: 100%;
        height: 100%;
        border: clamp(0.14rem, 0.28vw, 0.22rem) solid var(--canvas-shape-color, #0a66ff);
        background: var(--canvas-shape-fill, rgba(10, 102, 255, 0.14));
        box-shadow: 0 8px 20px rgba(18, 32, 51, 0.08);
      }
      .canvas-element-shape-content.is-circle {
        border-radius: 999px;
      }
      .canvas-element-shape-content.is-square {
        border-radius: 20px;
      }
      .canvas-element-shape-content.is-bubble {
        border-radius: 22px;
      }
      .canvas-shape-bubble-tail {
        position: absolute;
        left: clamp(0.8rem, 18%, 1.4rem);
        bottom: calc(-1 * clamp(0.42rem, 10%, 0.7rem));
        width: clamp(0.95rem, 18%, 1.4rem);
        height: clamp(0.95rem, 18%, 1.4rem);
        border-right: clamp(0.14rem, 0.28vw, 0.22rem) solid var(--canvas-shape-color, #0a66ff);
        border-bottom: clamp(0.14rem, 0.28vw, 0.22rem) solid var(--canvas-shape-color, #0a66ff);
        background: var(--canvas-shape-fill, rgba(10, 102, 255, 0.14));
        transform: rotate(40deg);
        border-bottom-right-radius: 0.3rem;
      }
      .canvas-element-media-content {
        overflow: hidden;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0 12px 28px rgba(18, 32, 51, 0.12);
      }
      .canvas-element-media-content.is-transparent-png {
        overflow: visible;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }
      .canvas-element-media-content .slide-media-image,
      .canvas-element-media-content .slide-media-video,
      .canvas-element-media-content .slide-media-print-card,
      .canvas-element-media-content .slide-media-external-link,
      .canvas-element-media-content .slide-media-embed-wrap {
        width: 100%;
        height: 100%;
      }
      .canvas-element-media-content .slide-media-image,
      .canvas-element-media-content .slide-media-video {
        display: block;
        max-height: none;
        object-fit: cover;
        object-position: center;
      }
      .canvas-element-media-content.is-transparent-png .slide-media-image {
        object-fit: contain;
        background: transparent;
        border-radius: 0;
        box-shadow: none;
        filter:
          drop-shadow(0 6px 10px rgba(18, 32, 51, 0.16))
          drop-shadow(0 16px 28px rgba(18, 32, 51, 0.24));
      }
      .canvas-element-arrow-content {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        transform-origin: center center;
        overflow: visible;
        max-width: none;
        gap: 0;
        min-width: 2.75rem;
        filter:
          drop-shadow(0 5px 10px rgba(18, 32, 51, 0.14))
          drop-shadow(0 14px 24px rgba(18, 32, 51, 0.2));
      }
      .canvas-arrow-shaft {
        flex: 1 1 auto;
        min-width: 0.9rem;
        height: clamp(0.28rem, 15%, 0.65rem);
        border-radius: 999px;
        background: var(--canvas-arrow-color, #0a66ff);
      }
      .canvas-arrow-head {
        flex: 0 0 clamp(1.8rem, 18%, 3rem);
        width: clamp(1.8rem, 18%, 3rem);
        height: 100%;
        min-height: 1rem;
        background: var(--canvas-arrow-color, #0a66ff);
        clip-path: polygon(0 0, 100% 50%, 0 100%, 26% 68%, 26% 32%);
      }
      .canvas-element-placeholder {
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        padding: 0.9rem;
        border-radius: 22px;
        border: 1px dashed rgba(18, 32, 51, 0.2);
        background: rgba(255, 255, 255, 0.7);
        color: var(--slide-text-muted);
        text-align: center;
        line-height: 1.35;
      }
      .slide-main,
      .slide-body > .slide-media-slot,
      .slide-bullets-row > .slide-media-slot {
        margin-left: clamp(1.2rem, 2.4vw, 2rem);
      }
      .slide-bullets-row > .slide-side-bullets-slot {
        margin-left: -1.8rem;
      }
      .slide-body-no-media { grid-template-columns: minmax(0, 1fr); }
      .deck-slide.is-canvas-slide .slide-footer {
        padding-top: 0.65rem;
      }
      .slide-bullets-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) clamp(16rem, 37%, 23.5rem);
        gap: clamp(1rem, 2vw, 1.4rem);
        align-items: start;
      }
      .slide-bullets-row-extra {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.24fr);
        gap: clamp(1.2rem, 2.4vw, 1.8rem);
      }
      .slide-bullets-row-inline-media {
        grid-template-columns: minmax(0, 1fr) clamp(18.2rem, 38%, 25.8rem);
        gap: clamp(1.2rem, 2.5vw, 2rem);
        align-items: center;
      }
      .slide-bullets-row-inline-media.is-roomy-inline-media {
        grid-template-columns: minmax(0, 0.94fr) clamp(20.6rem, 43%, 28.2rem);
        gap: clamp(1.45rem, 3vw, 2.55rem);
      }
      .slide-bullets-row-second-heavy {
        align-items: start;
      }
      .slide-subtitle-text {
        max-width: 54ch;
        margin-top: 0;
        color: var(--slide-text-muted);
        font-size: calc(clamp(1.12rem, 1.7vw, 1.38rem) * var(--slide-content-font-scale));
        line-height: 1.46;
      }
      .slide-bullets {
        display: grid;
        gap: 0.7rem;
        margin-top: 0.86rem;
        padding: 0;
        list-style: none;
      }
      .slide-main > .slide-headline:last-of-type + .slide-bullets,
      .slide-main > .slide-headline:last-of-type + .slide-bullets-row {
        margin-top: 2.62rem;
      }
      .slide-bullets li {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 0.7rem;
        align-items: start;
        max-width: 48ch;
        font-size: calc(1.12rem * var(--slide-content-font-scale));
        line-height: 1.56;
      }
      .slide-bullets li::before {
        content: "";
        width: 0.8rem;
        height: 0.8rem;
        margin-top: 0.35rem;
        border-radius: 50%;
        background: linear-gradient(145deg, var(--slide-accent), var(--slide-accent-strong));
        box-shadow: 0 0 0 2px var(--slide-accent-softer);
      }
      .slide-bullets.is-numbered li::before,
      .slide-side-bullets.is-numbered li::before {
        content: none;
        display: none;
      }
      .slide-bullets.is-numbered .slide-sub-bullets li::before,
      .slide-side-bullets.is-numbered .slide-sub-bullets li::before {
        content: "";
        display: block;
      }
      .slide-bullet-marker {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        min-height: 2rem;
        padding: 0.2rem 0.45rem;
        border-radius: 999px;
        background: var(--slide-accent-softer);
        color: var(--slide-accent-strong);
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        line-height: 1;
      }
      .slide-bullet-text {
        min-width: 0;
      }
      .slide-bullet-text a,
      .slide-sub-bullets a {
        color: var(--slide-accent-strong);
        text-decoration: underline;
        overflow-wrap: anywhere;
      }
      .slide-bullet-text-content,
      .slide-sub-bullet-text,
      .slide-table-cell-text {
        display: block;
        overflow-wrap: anywhere;
      }
      .slide-link-bubbles {
        display: flex;
        flex-wrap: wrap;
        gap: 0.42rem;
        margin-top: 0.42rem;
      }
      .slide-link-bubbles-inline {
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
        margin-top: 0;
      }
      .slide-link-bubbles-sub {
        margin-top: 0.28rem;
      }
      .slide-link-bubbles-table,
      .slide-link-bubbles-visual,
      .slide-link-bubbles-note {
        margin-top: 0.48rem;
      }
      .slide-sub-bullets {
        display: grid;
        gap: 0.38rem;
        margin-top: 0.5rem;
        padding-left: 1rem;
        list-style: none;
      }
      .slide-sub-bullets li {
        position: relative;
        color: var(--slide-text-muted);
        font-size: 0.92em;
        line-height: 1.38;
      }
      .slide-sub-bullets li::before {
        content: "";
        position: absolute;
        left: -0.8rem;
        top: 0.48rem;
        width: 0.34rem;
        height: 0.34rem;
        border-radius: 50%;
        background: var(--slide-accent-strong);
      }
      .slide-bullets.is-numbered li::before,
      .slide-side-bullets.is-numbered li::before {
        content: none;
        display: none;
      }
      .slide-bullet-marker {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        min-height: 2rem;
        padding: 0.2rem 0.45rem;
        border-radius: 999px;
        background: rgba(44,115,218,0.12);
        color: var(--blue-deep);
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        line-height: 1;
      }
      .slide-bullet-text {
        min-width: 0;
      }
      .slide-table {
        display: grid;
        gap: 0;
        margin-top: 1.3rem;
        margin-inline: auto;
        width: min(100%, 64rem);
        border: 1px solid var(--slide-line);
        border-radius: 8px;
        overflow: hidden;
        box-shadow: var(--slide-frame-shadow);
      }
      .slide-table[data-table-lightbox="true"] {
        cursor: zoom-in;
      }
      .deck-slide.is-table-slide .slide-content {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        padding-right: clamp(1.2rem, 2.4vw, 1.9rem);
      }
      .deck-slide.is-table-slide .slide-body {
        grid-template-columns: minmax(0, 1fr);
        align-self: stretch;
        height: 100%;
        min-height: 0;
      }
      .deck-slide.is-table-slide .slide-main {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        gap: 0.18rem;
      }
      .deck-slide.is-table-slide .slide-headline {
        max-width: 24ch;
        line-height: 1.04;
      }
      .deck-slide.is-table-slide .slide-subtitle-text {
        max-width: 74ch;
        margin-bottom: 0.1rem;
        font-size: calc(clamp(0.98rem, 1.22vw, 1.12rem) * var(--slide-content-font-scale));
        line-height: 1.24;
      }
      .deck-slide.is-table-slide .slide-table {
        width: 100%;
        max-width: none;
        margin-top: 0.42rem;
        margin-bottom: 0.92rem;
        flex: 1 1 auto;
        min-height: 0;
        max-height: none;
        height: auto;
        grid-template-rows: repeat(var(--table-row-count, 1), minmax(0, 1fr));
        align-content: stretch;
      }
      .deck-slide.is-table-slide .slide-table-row {
        min-height: 0;
      }
      .deck-slide.is-table-slide .slide-table-cell {
        min-height: 0;
        padding: 0.84rem 0.96rem;
        font-size: calc(clamp(1.2rem, 1.84vw, 1.52rem) * var(--slide-content-font-scale));
        line-height: 1.2;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .deck-slide.is-table-slide .slide-table.slide-table-dense-1 .slide-table-cell {
        padding: 0.74rem 0.86rem;
        font-size: calc(clamp(1.1rem, 1.66vw, 1.36rem) * var(--slide-content-font-scale));
        line-height: 1.17;
      }
      .deck-slide.is-table-slide .slide-table.slide-table-dense-2 .slide-table-cell {
        padding: 0.64rem 0.78rem;
        font-size: calc(clamp(1rem, 1.5vw, 1.24rem) * var(--slide-content-font-scale));
        line-height: 1.15;
      }
      .deck-slide.is-table-slide .slide-table.slide-table-dense-3 .slide-table-cell {
        padding: 0.58rem 0.72rem;
        font-size: calc(clamp(0.92rem, 1.36vw, 1.12rem) * var(--slide-content-font-scale));
        line-height: 1.12;
      }
      .deck-slide.is-table-slide .slide-table.slide-table-dense-4 .slide-table-cell {
        padding: 0.46rem 0.58rem;
        font-size: calc(clamp(0.84rem, 1.18vw, 1rem) * var(--slide-content-font-scale));
        line-height: 1.08;
      }
      .deck-slide.is-table-slide .slide-table.slide-table-dense-5 .slide-table-cell {
        padding: 0.34rem 0.46rem;
        font-size: clamp(0.76rem, 1.02vw, 0.9rem);
        line-height: 1;
      }
      .deck-slide.is-table-slide .slide-table[data-row-count="8"] .slide-table-cell {
        padding: 0.42rem 0.56rem;
        font-size: clamp(0.84rem, 1.18vw, 1rem);
        line-height: 1.04;
      }
      .deck-slide.is-table-slide .slide-table.slide-table-dense-4[data-row-count="8"] .slide-table-cell {
        padding: 0.32rem 0.44rem;
        font-size: clamp(0.74rem, 0.98vw, 0.88rem);
        line-height: 0.98;
      }
      .deck-slide.is-table-slide .slide-table.slide-table-dense-5[data-row-count="8"] .slide-table-cell {
        padding: 0.24rem 0.36rem;
        font-size: clamp(0.68rem, 0.9vw, 0.8rem);
        line-height: 0.96;
      }
      .deck-slide.is-table-slide .slide-footer {
        flex: 0 0 auto;
        min-height: clamp(3.8rem, 7.4vh, 5.1rem);
        padding-top: 0.7rem;
        margin-top: 0.1rem;
      }
      .deck-slide.is-table-slide .slide-note {
        min-height: clamp(3rem, 5.8vh, 4rem);
      }
      .slide-table-row {
        display: grid;
        gap: 0;
        min-width: 0;
      }
      .slide-table-cell {
        min-height: 3rem;
        min-width: 0;
        padding: 0.68rem 0.8rem;
        border-right: 1px solid var(--slide-line);
        border-bottom: 1px solid var(--slide-line);
        background: var(--slide-surface);
        line-height: 1.4;
        overflow-wrap: anywhere;
      }
      .slide-table-row .slide-table-cell:last-child {
        border-right: 0;
      }
      .slide-table-row:last-child .slide-table-cell {
        border-bottom: 0;
      }
      .slide-table-cell-header {
        font-weight: 800;
      }
      .slide-table.slide-table-dense-1 .slide-table-cell {
        min-height: 2.7rem;
        padding: 0.58rem 0.72rem;
        font-size: 0.94rem;
        line-height: 1.34;
      }
      .slide-table.slide-table-dense-2 .slide-table-cell {
        min-height: 2.45rem;
        padding: 0.5rem 0.66rem;
        font-size: 0.88rem;
        line-height: 1.28;
      }
      .slide-table.slide-table-dense-3 .slide-table-cell {
        min-height: 2.2rem;
        padding: 0.42rem 0.58rem;
        font-size: 0.82rem;
        line-height: 1.22;
      }
      .slide-table.slide-table-dense-4 .slide-table-cell {
        min-height: 1.95rem;
        padding: 0.34rem 0.5rem;
        font-size: 0.74rem;
        line-height: 1.14;
      }
      .slide-table.slide-table-dense-5 .slide-table-cell {
        min-height: 1.72rem;
        padding: 0.26rem 0.4rem;
        font-size: 0.66rem;
        line-height: 1.06;
      }
      .slide-free-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 0.72rem;
        max-width: 70rem;
        margin-top: 1.2rem;
      }
      .slide-free-layout.has-side-gallery {
        grid-template-columns: minmax(0, 1fr) clamp(12rem, 29%, 15.8rem);
        column-gap: clamp(1rem, 2vw, 1.45rem);
        row-gap: 0.72rem;
        align-items: start;
      }
      .slide-free-layout.has-side-gallery.has-roomy-side-gallery {
        grid-template-columns: minmax(0, 0.98fr) clamp(15rem, 34%, 19.8rem);
        column-gap: clamp(1.35rem, 2.7vw, 2rem);
      }
      .slide-free-text-block {
        display: grid;
        gap: 0.72rem;
        min-width: 0;
      }
      .slide-free-body {
        display: grid;
        gap: 0.72rem;
        min-width: 0;
      }
      .slide-free-gallery-wrap {
        min-width: 0;
      }
      .slide-free-gallery-wrap.has-breathing-space {
        margin-top: clamp(0.7rem, 1.8vh, 1.2rem);
      }
      .slide-free-gallery-wrap.is-side-column {
        align-self: start;
      }
      .slide-free-body p {
        margin: 0;
        color: var(--slide-text);
        font-size: 1rem;
        line-height: 1.36;
      }
      .slide-free-body ul {
        margin: 0;
        padding-left: 1.45rem;
        color: var(--slide-text);
        font-size: 1rem;
      }
      .slide-free-body li + li {
        margin-top: 0.2rem;
      }
      .slide-free-body [data-rich-layout="two-columns"] {
        column-count: 2;
        column-gap: clamp(1rem, 2vw, 1.6rem);
      }
      .slide-free-body [data-rich-layout="two-columns"] > * {
        break-inside: avoid;
      }
      .slide-free-links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
      }
      .slide-free-link {
        display: inline-flex;
        align-items: center;
        min-height: 2.1rem;
        padding: 0.42rem 0.75rem;
        border-radius: 999px;
        background: var(--slide-accent-softer);
        color: var(--slide-accent-strong);
        font-size: 0.92rem;
        font-weight: 700;
        text-decoration: none;
      }
      .slide-link-bubble {
        min-height: 1.55rem;
        max-width: min(100%, 20rem);
        padding: 0.24rem 0.58rem;
        font-size: 0.76rem;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .slide-link-bubbles .slide-link-bubble {
        color: var(--slide-accent-strong);
        text-decoration: none;
      }
      .slide-free-gallery {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.7rem;
        align-items: start;
      }
      .slide-free-gallery.is-side-column {
        grid-template-columns: minmax(0, 1fr);
        gap: 0.82rem;
      }
      .slide-free-gallery.is-single {
        grid-template-columns: minmax(0, 1fr);
      }
      .slide-free-gallery-item {
        min-width: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }
      .slide-free-gallery-item .slide-media-image,
      .slide-free-gallery-item .slide-media-video,
      .slide-free-gallery-item .slide-media-print-card,
      .slide-free-gallery-item .slide-media-embed-wrap,
      .slide-free-gallery-item .slide-media-external-link {
        display: inline-block;
        width: auto;
        max-width: 100%;
        margin: 0;
        max-height: 8.6rem;
        border-radius: 12px;
        background: transparent;
        box-shadow: var(--slide-frame-shadow);
      }
      .slide-free-gallery.is-side-column .slide-free-gallery-item .slide-media-image,
      .slide-free-gallery.is-side-column .slide-free-gallery-item .slide-media-video,
      .slide-free-gallery.is-side-column .slide-free-gallery-item .slide-media-print-card,
      .slide-free-gallery.is-side-column .slide-free-gallery-item .slide-media-embed-wrap,
      .slide-free-gallery.is-side-column .slide-free-gallery-item .slide-media-external-link {
        width: auto;
        max-width: 100%;
        max-height: clamp(5.8rem, 13vh, 8.4rem);
      }
      .slide-free-layout.has-side-gallery.has-roomy-side-gallery .slide-free-gallery.is-side-column .slide-free-gallery-item .slide-media-image,
      .slide-free-layout.has-side-gallery.has-roomy-side-gallery .slide-free-gallery.is-side-column .slide-free-gallery-item .slide-media-video,
      .slide-free-layout.has-side-gallery.has-roomy-side-gallery .slide-free-gallery.is-side-column .slide-free-gallery-item .slide-media-print-card,
      .slide-free-layout.has-side-gallery.has-roomy-side-gallery .slide-free-gallery.is-side-column .slide-free-gallery-item .slide-media-embed-wrap,
      .slide-free-layout.has-side-gallery.has-roomy-side-gallery .slide-free-gallery.is-side-column .slide-free-gallery-item .slide-media-external-link {
        max-width: min(100%, 19rem);
        max-height: clamp(8.4rem, 19vh, 12.2rem);
      }
      .slide-body-visual {
        grid-template-columns: minmax(0, 1fr);
        min-height: 0;
      }
      .slide-body-visual .slide-main {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .deck-slide.is-visual-slide .slide-body-visual .slide-main {
        gap: 0.18rem;
      }
      .slide-visual-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.22fr) minmax(11rem, 0.78fr);
        gap: clamp(0.75rem, 1.6vw, 1.1rem);
        margin-top: 0.72rem;
        align-items: stretch;
        flex: 1 1 auto;
        min-height: 0;
        position: relative;
      }
      .slide-visual-flow,
      .slide-visual-support-column,
      .slide-visual-relation-card {
        display: grid;
        gap: 0.7rem;
        min-height: 0;
      }
      .slide-visual-flow {
        position: relative;
      }
      .slide-visual-flow-horizontal {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: stretch;
        gap: 1rem;
      }
      .slide-visual-flow-vertical {
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }
      .slide-visual-flow-count-1 {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr);
      }
      .slide-visual-support-column {
        align-content: start;
        align-self: start;
      }
      .slide-visual-support-column.has-chart {
        grid-template-rows: auto auto minmax(0, 1fr);
      }
      .slide-visual-layout.is-media-hidden {
        grid-template-columns: minmax(0, 1fr);
      }
      .slide-visual-support-column.is-expanded.has-chart {
        grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.22fr);
        grid-template-rows: auto minmax(0, 1fr);
        align-items: stretch;
      }
      .slide-visual-support-column.is-expanded.has-chart .slide-visual-text-card {
        grid-column: 1;
        grid-row: 1;
      }
      .slide-visual-support-column.is-expanded.has-chart .slide-visual-callout-card {
        grid-column: 1;
        grid-row: 2;
      }
      .slide-visual-support-column.is-expanded.has-chart .slide-visual-chart-card {
        grid-column: 2;
        grid-row: 1 / span 2;
      }
      .slide-visual-media-card,
      .slide-visual-text-card,
      .slide-visual-callout-card,
      .slide-visual-relation-card,
      .slide-visual-chart-card {
        min-width: 0;
        min-height: 0;
        border: 1px solid var(--slide-line);
        border-radius: 22px;
        background: var(--slide-surface-strong);
        overflow: hidden;
        box-shadow: var(--slide-frame-shadow);
      }
      .slide-visual-media-card {
        display: grid;
        place-items: center;
        width: 100%;
        padding: 0.45rem;
        background:
          linear-gradient(145deg, rgba(255,255,255,0.68), rgba(255,255,255,0.34)),
          var(--slide-surface-strong);
      }
      .slide-visual-media-frame {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
      }
      .slide-visual-flow-horizontal .slide-visual-media-card {
        aspect-ratio: 1 / 0.92;
      }
      .slide-visual-flow-vertical .slide-visual-media-card {
        aspect-ratio: 16 / 5.05;
      }
      .slide-visual-media-card .slide-media-image,
      .slide-visual-media-card .slide-media-video,
      .slide-visual-media-card .slide-media-print-card,
      .slide-visual-media-card .slide-media-embed-wrap {
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: 100%;
        margin: 0;
        border-radius: 16px;
        box-sizing: border-box;
      }
      .slide-visual-media-card .slide-media-print-card,
      .slide-visual-media-card .slide-media-external-link {
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
      }
      .slide-visual-media-card .slide-media-image,
      .slide-visual-media-card .slide-media-video {
        object-fit: contain;
        object-position: center;
        background: rgba(255,255,255,0.42);
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: 100%;
      }
      .slide-visual-media-card .slide-media-print-card .slide-media-image,
      .slide-visual-media-card .slide-media-external-link .slide-media-image {
        object-fit: contain;
        object-position: center;
      }
      .deck-slide.is-visual-slide.is-visual-has-header .slide-visual-layout {
        gap: clamp(0.6rem, 1.3vw, 0.9rem);
        margin-top: 0.38rem;
      }
      .deck-slide.is-visual-slide.is-visual-has-header .slide-visual-flow-horizontal .slide-visual-media-card {
        aspect-ratio: 1 / 0.76;
      }
      .deck-slide.is-visual-slide.is-visual-has-header .slide-visual-flow-vertical .slide-visual-media-card {
        aspect-ratio: 16 / 4.15;
      }
      .deck-slide.is-visual-slide.is-visual-has-header .slide-visual-text-card,
      .deck-slide.is-visual-slide.is-visual-has-header .slide-visual-callout-card,
      .deck-slide.is-visual-slide.is-visual-has-header .slide-visual-chart-card {
        padding: 0.72rem 0.82rem;
      }
      .slide-visual-media-placeholder {
        display: grid;
        place-items: center;
        min-height: inherit;
        padding: 1rem;
        color: var(--slide-text-muted);
        text-align: center;
        line-height: 1.35;
        background:
          linear-gradient(145deg, rgba(255,255,255,0.5), transparent),
          var(--slide-surface);
      }
      .slide-visual-text-card,
      .slide-visual-callout-card,
      .slide-visual-relation-card,
      .slide-visual-chart-card {
        padding: 0.82rem 0.9rem;
      }
      .slide-visual-text-card {
        display: flex;
        align-items: flex-start;
      }
      .slide-visual-text-card p,
      .slide-visual-callout-text p {
        margin: 0;
        color: var(--slide-text-muted);
        font-size: calc(0.94rem * var(--slide-content-font-scale));
        line-height: 1.34;
      }
      .slide-visual-text-card p + p,
      .slide-visual-callout-text p + p {
        margin-top: 0.32rem;
      }
      .slide-visual-relation-card {
        position: absolute;
        inset: 50% auto auto 50%;
        align-content: center;
        justify-items: center;
        padding: 0;
        border: 0;
        background: transparent;
        overflow: visible;
        z-index: 2;
        box-shadow: none;
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
      .slide-visual-flow-horizontal .slide-visual-relation-card {
        top: calc(50% + 0.9rem);
        left: 50%;
        text-align: center;
        transform: translate(-50%, -50%);
      }
      .slide-visual-flow-vertical .slide-visual-relation-card {
        top: 50%;
        left: calc(50% - 0.1rem);
        align-items: center;
        justify-items: center;
        transform: translate(-50%, -50%);
      }
      .slide-visual-arrow-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 2.9rem;
        padding: 0;
        pointer-events: none;
      }
      .slide-visual-arrow-svg {
        width: 100%;
        max-width: 12rem;
        height: 2.8rem;
        filter: drop-shadow(0 8px 18px rgba(18,32,51,0.12));
      }
      .slide-visual-flow-vertical .slide-visual-arrow-svg {
        max-width: 3.4rem;
        height: 6rem;
      }
      .slide-visual-chart-card {
        display: grid;
        gap: 0.6rem;
        min-height: 0;
        cursor: zoom-in;
        transition: transform 180ms ease, box-shadow 180ms ease;
      }
      .slide-visual-chart-card:hover {
        transform: translateY(-0.08rem);
        box-shadow: 0 14px 34px rgba(18,32,51,0.12);
      }
      .slide-visual-chart-title {
        font-size: calc(0.8rem * var(--slide-content-font-scale));
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--slide-accent-strong);
      }
      .slide-visual-chart-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.55rem;
        align-items: end;
        min-height: 0;
        height: 100%;
      }
      .slide-visual-chart-grid.is-dense {
        gap: 0.38rem;
      }
      .slide-visual-chart-bar-card {
        display: grid;
        gap: 0.4rem;
        min-height: 0;
      }
      .slide-visual-chart-bar-shell {
        display: flex;
        align-items: end;
        min-height: clamp(4.6rem, 7vw, 6rem);
        padding: 0.24rem;
        border-radius: 16px;
        background:
          repeating-linear-gradient(
            to top,
            rgba(23,71,139,0.1) 0,
            rgba(23,71,139,0.1) 1px,
            transparent 1px,
            transparent 1.35rem
          ),
          linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.58));
        box-shadow: inset 0 0 0 1px rgba(23,71,139,0.08);
      }
      .slide-visual-chart-bar-fill {
        width: 100%;
        min-height: 0.85rem;
        border-radius: 14px 14px 6px 6px;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
      }
      .slide-visual-chart-meta {
        display: grid;
        gap: 0.12rem;
        justify-items: center;
        text-align: center;
      }
      .slide-visual-chart-label {
        font-size: calc(0.72rem * var(--slide-content-font-scale));
        color: var(--slide-text-muted);
      }
      .slide-visual-chart-value {
        font-size: calc(0.92rem * var(--slide-content-font-scale));
        color: var(--slide-text);
      }
      .slide-visual-chart-grid.is-dense .slide-visual-chart-label {
        font-size: calc(0.64rem * var(--slide-content-font-scale));
      }
      .slide-visual-chart-grid.is-dense .slide-visual-chart-value {
        font-size: calc(0.82rem * var(--slide-content-font-scale));
      }
      .slide-media-slot {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: clamp(14.25rem, 34vh, 19.8rem);
        margin-top: 1rem;
        padding: 0.6rem;
        border: 1px solid var(--slide-line);
        border-radius: 22px;
        background: var(--slide-surface);
        overflow: hidden;
      }
      .slide-media-slot.has-media-stack {
        align-items: stretch;
        justify-content: stretch;
      }
      .slide-media-slot.is-media-bare {
        padding: 0;
        border: 0;
        background: transparent;
        box-shadow: none;
        overflow: visible;
      }
      .slide-inline-bullet-media-slot {
        align-self: end;
        justify-self: end;
        min-height: clamp(11rem, 26vh, 14.8rem);
        margin-top: clamp(0.45rem, 1.2vh, 0.95rem);
        margin-left: clamp(0.45rem, 1vw, 0.85rem);
      }
      .slide-inline-bullet-media-slot.is-roomy-inline-media {
        min-height: clamp(12rem, 28vh, 16rem);
        margin-top: clamp(0.6rem, 1.5vh, 1.15rem);
        margin-left: clamp(0.55rem, 1.15vw, 1rem);
      }
      .slide-media-slot:not(.has-media-stack):has(> .slide-media-image),
      .slide-media-slot:not(.has-media-stack):has(> .slide-media-external-link) {
        width: fit-content;
        max-width: 100%;
        justify-self: start;
        justify-content: flex-start;
      }
      .slide-media-slot:not(.has-media-stack):has(> .slide-media-image) > .slide-media-image,
      .slide-media-slot:not(.has-media-stack):has(> .slide-media-external-link) > .slide-media-external-link,
      .slide-media-slot:not(.has-media-stack):has(> .slide-media-external-link) > .slide-media-external-link > .slide-media-image {
        width: auto;
        max-width: min(100%, 26rem);
      }
      .slide-inline-bullet-media-slot > .slide-media-image,
      .slide-inline-bullet-media-slot > .slide-media-video,
      .slide-inline-bullet-media-slot > .slide-media-print-card,
      .slide-inline-bullet-media-slot > .slide-media-embed-wrap,
      .slide-inline-bullet-media-slot > .slide-media-external-link {
        width: auto;
        max-width: min(100%, 23rem);
        max-height: clamp(11rem, 25vh, 14.4rem);
      }
      .slide-inline-bullet-media-slot.is-roomy-inline-media > .slide-media-image,
      .slide-inline-bullet-media-slot.is-roomy-inline-media > .slide-media-video,
      .slide-inline-bullet-media-slot.is-roomy-inline-media > .slide-media-print-card,
      .slide-inline-bullet-media-slot.is-roomy-inline-media > .slide-media-embed-wrap,
      .slide-inline-bullet-media-slot.is-roomy-inline-media > .slide-media-external-link {
        max-width: min(100%, 25.6rem);
        max-height: clamp(12.4rem, 28vh, 16rem);
      }
      .slide-body.has-media-stack-layout > .slide-media-slot.has-media-stack {
        min-height: clamp(11.4rem, 28vh, 15.9rem);
        padding: 0.45rem;
      }
      .slide-body.has-media-stack-layout > .slide-media-slot.is-media-bare.has-media-stack {
        padding: 0;
      }
      .slide-media-stack {
        display: grid;
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: 0.55rem;
        width: 100%;
        height: 100%;
      }
      .slide-media-stack-card {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 0;
        padding: 0.3rem;
        border-radius: 18px;
        background: rgba(255,255,255,0.28);
      }
      .slide-body.has-media-stack-layout .slide-media-stack {
        gap: 0.42rem;
      }
      .slide-body.has-media-stack-layout .slide-media-stack-card {
        padding: 0.24rem;
        border-radius: 16px;
      }
      .slide-media-slot.is-media-bare .slide-media-stack-card {
        padding: 0;
        background: transparent;
        box-shadow: none;
      }
      .slide-media-slot.is-media-bare .slide-media-image,
      .slide-media-slot.is-media-bare .slide-media-video,
      .slide-media-slot.is-media-bare .slide-media-embed-wrap,
      .slide-media-slot.is-media-bare .slide-media-print-card {
        background: transparent;
      }
      .slide-media-stack-card .slide-media-image,
      .slide-media-stack-card .slide-media-video,
      .slide-media-stack-card .slide-media-print-card,
      .slide-media-stack-card .slide-media-embed-wrap,
      .slide-media-stack-card .slide-media-external-link {
        width: 100%;
        height: 100%;
        max-height: 100%;
        min-height: 0;
      }
      .slide-media-stack-card .slide-media-image,
      .slide-media-stack-card .slide-media-video {
        object-fit: contain;
        object-position: center;
      }
      .slide-media-image,
      .slide-media-video {
        width: 100%;
        max-width: 100%;
        height: auto;
        max-height: clamp(13.2rem, 32vh, 18.7rem);
        border-radius: 16px;
        object-fit: contain;
        background: var(--slide-line);
      }
      .slide-media-slot .slide-media-image,
      .slide-media-slot .slide-media-video,
      .slide-media-slot .slide-media-print-card,
      .slide-media-slot .slide-media-embed-wrap,
      .slide-media-slot .slide-media-external-link,
      .slide-free-gallery-item .slide-media-image {
        cursor: zoom-in;
        transition: transform 180ms ease, box-shadow 180ms ease;
      }
      .slide-media-slot .slide-media-image,
      .slide-media-slot .slide-media-video,
      .slide-media-slot .slide-media-print-card,
      .slide-media-slot .slide-media-embed-wrap,
      .slide-media-slot .slide-media-external-link {
        box-shadow: var(--slide-frame-shadow);
      }
      .slide-media-slot .slide-media-image:hover,
      .slide-free-gallery-item .slide-media-image:hover {
        transform: scale(1.02);
        box-shadow: 0 12px 30px rgba(18,32,51,0.18);
      }
      .slide-media-video {
        width: 100%;
      }
      .slide-media-embed-wrap {
        width: 100%;
        aspect-ratio: 16 / 9;
        border-radius: 16px;
        overflow: hidden;
        background: var(--slide-line);
      }
      .slide-media-embed-wrap[data-embed-layout="audio"] {
        aspect-ratio: auto;
        height: var(--slide-embed-height, 144px);
        min-height: var(--slide-embed-height, 144px);
        max-height: 100%;
      }
      .slide-media-embed {
        width: 100%;
        height: 100%;
        border: 0;
      }
      .slide-media-slot .slide-media-embed-wrap {
        cursor: default;
      }
      .slide-media-print-card {
        display: grid;
        gap: 0.6rem;
        width: 100%;
      }
      .slide-side-bullets-slot {
        align-items: stretch;
        justify-content: flex-start;
        min-height: 0;
        margin-top: 0.86rem;
        padding: 0 0 0 0.82rem;
        transform: none;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        border: 0;
        border-radius: 0;
        background: transparent;
        overflow: visible;
      }
      .slide-side-bullets-slot-second-heavy {
        margin-top: 0.9rem;
      }
      .slide-side-bullets-slot.is-numbered-layout {
        position: relative;
        transform: none;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        padding-left: 1.42rem;
        padding-right: 0;
        padding-bottom: clamp(9.5rem, 20vh, 12rem);
      }
      .slide-side-bullets-slot.is-numbered-layout .slide-side-column-media {
        position: absolute;
        right: -0.2rem;
        bottom: 0.1rem;
        display: flex;
        justify-content: flex-end;
        width: auto;
        max-width: min(100%, 20rem);
        padding-left: 0;
        padding-right: 0;
      }
      .slide-side-bullets-slot.is-numbered-layout .slide-side-column-media .slide-media-image,
      .slide-side-bullets-slot.is-numbered-layout .slide-side-column-media .slide-media-video,
      .slide-side-bullets-slot.is-numbered-layout .slide-side-column-media .slide-media-print-card,
      .slide-side-bullets-slot.is-numbered-layout .slide-side-column-media .slide-media-embed-wrap,
      .slide-side-bullets-slot.is-numbered-layout .slide-side-column-media .slide-media-external-link {
        width: auto;
        margin-left: auto;
        max-width: min(100%, 19.2rem);
        max-height: clamp(8.4rem, 18vh, 10.4rem);
      }
      .slide-side-column {
        display: grid;
        gap: 0.9rem;
        width: 100%;
      }
      .slide-side-column.is-media-first {
        align-content: start;
      }
      .slide-side-column.is-media-first.is-media-centered .slide-side-column-media {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: clamp(10.6rem, 24vh, 14.2rem);
      }
      .slide-primary-column {
        display: grid;
        gap: 0.9rem;
        min-width: 0;
      }
      .slide-primary-column-bullets,
      .slide-primary-column-media {
        min-width: 0;
      }
      .slide-primary-column-media {
        display: inline-flex;
        align-self: start;
        justify-content: flex-start;
        min-height: 0;
        margin-top: 0;
        width: fit-content;
        max-width: 100%;
      }
      .slide-primary-column-media .slide-media-image,
      .slide-primary-column-media .slide-media-video,
      .slide-primary-column-media .slide-media-print-card,
      .slide-primary-column-media .slide-media-embed-wrap,
      .slide-primary-column-media .slide-media-external-link {
        width: auto;
        max-width: min(100%, 26rem);
        max-height: clamp(9.6rem, 22vh, 12.8rem);
      }
      .slide-side-column-bullets,
      .slide-side-column-media {
        min-width: 0;
      }
      .slide-side-column-media .slide-media-stack {
        height: auto;
      }
      .slide-side-column-media .slide-media-stack-card,
      .slide-side-column-media > .slide-media-image,
      .slide-side-column-media > .slide-media-video,
      .slide-side-column-media > .slide-media-print-card,
      .slide-side-column-media > .slide-media-embed-wrap,
      .slide-side-column-media > .slide-media-external-link {
        box-shadow: var(--slide-frame-shadow);
      }
      .slide-side-column-media .slide-media-image,
      .slide-side-column-media .slide-media-video,
      .slide-side-column-media .slide-media-print-card,
      .slide-side-column-media .slide-media-embed-wrap,
      .slide-side-column-media .slide-media-external-link {
        max-height: clamp(9.2rem, 21vh, 12.4rem);
      }
      .slide-side-column.is-media-first.is-media-centered .slide-side-column-media .slide-media-image,
      .slide-side-column.is-media-first.is-media-centered .slide-side-column-media .slide-media-video,
      .slide-side-column.is-media-first.is-media-centered .slide-side-column-media .slide-media-print-card,
      .slide-side-column.is-media-first.is-media-centered .slide-side-column-media .slide-media-embed-wrap,
      .slide-side-column.is-media-first.is-media-centered .slide-side-column-media .slide-media-external-link {
        width: auto;
        max-width: min(100%, 17.8rem);
        max-height: clamp(10.8rem, 24vh, 14rem);
      }
      .slide-side-column.has-compact-media .slide-side-column-media {
        display: flex;
        justify-content: flex-start;
      }
      .slide-side-column.has-compact-media .slide-side-column-media .slide-media-image,
      .slide-side-column.has-compact-media .slide-side-column-media .slide-media-video,
      .slide-side-column.has-compact-media .slide-side-column-media .slide-media-print-card,
      .slide-side-column.has-compact-media .slide-side-column-media .slide-media-embed-wrap,
      .slide-side-column.has-compact-media .slide-side-column-media .slide-media-external-link {
        width: auto;
        max-width: min(100%, 15.5rem);
        max-height: clamp(7rem, 15vh, 8.8rem);
      }
      .slide-side-bullets {
        display: grid;
        gap: 0.7rem;
        width: 100%;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .slide-side-bullets li {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 0.65rem;
        align-items: start;
        font-size: calc(1.08rem * var(--slide-content-font-scale));
        line-height: 1.54;
      }
      .slide-side-bullets li::before {
        content: "";
        width: 0.75rem;
        height: 0.75rem;
        margin-top: 0.35rem;
        border-radius: 50%;
        background: linear-gradient(145deg, var(--slide-accent), var(--slide-accent-strong));
        box-shadow: 0 0 0 2px var(--slide-accent-softer);
      }
      .slide-side-bullets .slide-sub-bullets li::before {
        width: 0.34rem;
        height: 0.34rem;
        margin-top: 0;
        left: -0.8rem;
        top: 0.48rem;
        box-shadow: 0 0 0 4px var(--slide-accent-softer);
        background: var(--slide-accent-strong);
      }
      .slide-media-link {
        display: block;
        overflow-wrap: anywhere;
        font-size: 0.8rem;
        line-height: 1.35;
        text-decoration: underline;
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
      .deck-slide.is-transitioning {
        pointer-events: none;
      }
      .deck-slide.transition-fade-out {
        animation: deckFadeOut 220ms ease both;
      }
      .deck-slide.transition-fade-in {
        animation: deckFadeIn 260ms ease both;
      }
      .deck-slide.transition-slide-out.direction-next {
        animation: deckSlideOutNext 260ms ease both;
      }
      .deck-slide.transition-slide-in.direction-next {
        animation: deckSlideInNext 300ms ease both;
      }
      .deck-slide.transition-slide-out.direction-prev {
        animation: deckSlideOutPrev 260ms ease both;
      }
      .deck-slide.transition-slide-in.direction-prev {
        animation: deckSlideInPrev 300ms ease both;
      }
      .deck-slide.transition-zoom-out {
        animation: deckZoomOut 240ms ease both;
      }
      .deck-slide.transition-zoom-in {
        animation: deckZoomIn 300ms ease both;
      }
      .deck-slide.transition-rise-out {
        animation: deckRiseOut 220ms ease both;
      }
      .deck-slide.transition-rise-in {
        animation: deckRiseIn 280ms ease both;
      }
      @keyframes deckFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes deckFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes deckSlideOutNext {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(-4rem); }
      }
      @keyframes deckSlideInNext {
        from { opacity: 0; transform: translateX(4rem); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes deckSlideOutPrev {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(4rem); }
      }
      @keyframes deckSlideInPrev {
        from { opacity: 0; transform: translateX(-4rem); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes deckZoomOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.94); }
      }
      @keyframes deckZoomIn {
        from { opacity: 0; transform: scale(1.06); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes deckRiseOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-2rem); }
      }
      @keyframes deckRiseIn {
        from { opacity: 0; transform: translateY(2rem); }
        to { opacity: 1; transform: translateY(0); }
      }
      .image-lightbox {
        position: fixed;
        inset: 0;
        z-index: 80;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: rgba(8, 15, 28, 0.82);
        opacity: 0;
        pointer-events: none;
        transition: opacity 220ms ease;
      }
      .image-lightbox.is-open {
        opacity: 1;
        pointer-events: auto;
      }
      body.deck-is-fullscreen .image-lightbox {
        padding: 0.75rem;
      }
      .image-lightbox-frame {
        position: relative;
        max-width: min(98vw, 2160px);
        max-height: 96vh;
        transform: scale(0.94);
        transition: transform 220ms ease;
      }
      body.deck-is-fullscreen .image-lightbox-frame {
        max-width: 99vw;
        max-height: 99vh;
      }
      .image-lightbox.is-open .image-lightbox-frame {
        transform: scale(1);
      }
      .image-lightbox-image {
        display: block;
        max-width: 100%;
        max-height: 96vh;
        border-radius: 20px;
        box-shadow: 0 28px 70px rgba(0,0,0,0.35);
        background: #ffffff;
        transform: scale(1);
        transform-origin: center center;
        transition: transform 220ms ease;
      }
      .image-lightbox-image.is-zoomed {
        transform: scale(1.22);
      }
      body.deck-is-fullscreen .image-lightbox-image {
        max-height: 99vh;
      }
      .image-lightbox-close {
        position: absolute;
        top: -0.9rem;
        right: -0.9rem;
        width: 2.6rem;
        height: 2.6rem;
        border: 0;
        border-radius: 999px;
        background: rgba(255,255,255,0.95);
        color: #122033;
        font: inherit;
        font-size: 1.35rem;
        line-height: 1;
        cursor: pointer;
        box-shadow: 0 12px 28px rgba(0,0,0,0.2);
      }
      .chart-lightbox {
        position: fixed;
        inset: 0;
        z-index: 85;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: rgba(8,15,28,0.82);
        opacity: 0;
        pointer-events: none;
        transition: opacity 220ms ease;
      }
      .chart-lightbox.is-open {
        opacity: 1;
        pointer-events: auto;
      }
      body.deck-is-fullscreen .chart-lightbox {
        padding: 0.75rem;
      }
      .chart-lightbox-frame {
        position: relative;
        width: min(92vw, 72rem);
        max-height: 92vh;
        transform: scale(0.94);
        transition: transform 220ms ease;
      }
      body.deck-is-fullscreen .chart-lightbox-frame {
        width: min(98vw, 84rem);
        max-height: 98vh;
      }
      .chart-lightbox.is-open .chart-lightbox-frame {
        transform: scale(1);
      }
      .chart-lightbox-content {
        display: grid;
      }
      .chart-lightbox-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.7fr) minmax(17rem, 23rem);
        gap: 1rem;
        align-items: stretch;
      }
      .chart-lightbox-main {
        min-width: 0;
      }
      .chart-lightbox-side {
        display: grid;
        gap: 0.9rem;
        align-content: start;
      }
      .chart-lightbox-panel {
        padding: 1rem 1.05rem;
        border-radius: 22px;
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(18,32,51,0.08);
        box-shadow: 0 16px 36px rgba(7,28,61,0.12);
      }
      .chart-lightbox-kicker {
        margin: 0 0 0.75rem;
        font-size: 0.72rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(18,32,51,0.52);
      }
      .chart-lightbox-legend {
        display: grid;
        gap: 0.55rem;
        padding: 0;
        margin: 0;
        list-style: none;
      }
      .chart-lightbox-legend-item {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.65rem;
        align-items: center;
      }
      .chart-lightbox-swatch {
        width: 0.9rem;
        height: 0.9rem;
        border-radius: 999px;
        box-shadow: inset 0 0 0 1px rgba(18,32,51,0.08);
      }
      .chart-lightbox-legend-label {
        min-width: 0;
        font-size: 0.94rem;
        color: #122033;
      }
      .chart-lightbox-legend-value {
        font-size: 0.98rem;
        color: #122033;
      }
      .chart-lightbox-copy,
      .chart-lightbox-note {
        display: grid;
        gap: 0.45rem;
        color: #223248;
      }
      .chart-lightbox-copy p,
      .chart-lightbox-note p {
        margin: 0;
        line-height: 1.5;
      }
      .chart-lightbox-note {
        margin-top: 0.8rem;
        padding-top: 0.8rem;
        border-top: 1px solid rgba(18,32,51,0.1);
      }
      .chart-lightbox-main .slide-visual-chart-card {
        min-height: min(82vh, 44rem);
        padding: 1.35rem 1.5rem;
        border-radius: 26px;
        box-shadow: 0 28px 70px rgba(0,0,0,0.28);
        transform: none;
      }
      .chart-lightbox-main .slide-visual-chart-title {
        font-size: 1rem;
      }
      .chart-lightbox-chart-grid-wrap {
        display: block;
        min-height: 22rem;
      }
      .chart-lightbox-grid-surface {
        position: relative;
        min-width: 0;
      }
      .chart-lightbox-grid-lines {
        position: absolute;
        inset: 0 0 0.95rem 0;
        pointer-events: none;
        z-index: 2;
      }
      .chart-lightbox-grid-lines span {
        position: absolute;
        left: 0;
        right: 0;
        border-top: 2px solid rgba(18,32,51,0.36);
      }
      .chart-lightbox-grid-lines span[data-chart-line="high"] {
        top: 22%;
      }
      .chart-lightbox-grid-lines span[data-chart-line="mid"] {
        top: 49%;
      }
      .chart-lightbox-grid-lines span[data-chart-line="low"] {
        top: 76%;
      }
      .chart-lightbox-grid-surface .slide-visual-chart-grid {
        position: relative;
        z-index: 1;
      }
      .chart-lightbox-main .slide-visual-chart-grid {
        min-height: 22rem;
      }
      .chart-lightbox-main .slide-visual-chart-bar-shell {
        min-height: min(52vh, 30rem);
        background: linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,255,255,0.62));
      }
      .chart-lightbox-main .slide-visual-chart-label {
        font-size: 0.92rem;
      }
      .chart-lightbox-main .slide-visual-chart-value {
        font-size: 1.18rem;
      }
      .chart-lightbox-close {
        position: absolute;
        top: -0.9rem;
        right: -0.9rem;
        width: 2.6rem;
        height: 2.6rem;
        border: 0;
        border-radius: 999px;
        background: rgba(255,255,255,0.95);
        color: #122033;
        font: inherit;
        font-size: 1.35rem;
        line-height: 1;
        cursor: pointer;
        box-shadow: 0 12px 28px rgba(0,0,0,0.2);
      }
      .table-lightbox {
        position: fixed;
        inset: 0;
        z-index: 85;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: rgba(8,15,28,0.82);
        opacity: 0;
        pointer-events: none;
        transition: opacity 220ms ease;
      }
      .table-lightbox.is-open {
        opacity: 1;
        pointer-events: auto;
      }
      body.deck-is-fullscreen .table-lightbox {
        padding: 0.75rem;
      }
      .table-lightbox-frame {
        position: relative;
        width: min(90vw, 110rem);
        height: min(90vh, 68rem);
        transform: scale(0.94);
        transition: transform 220ms ease;
      }
      .table-lightbox.is-open .table-lightbox-frame {
        transform: scale(1);
      }
      .table-lightbox-content {
        display: grid;
        height: 100%;
      }
      .table-lightbox-surface {
        display: grid;
        padding: 1.2rem;
        height: 100%;
        border-radius: 26px;
        background: rgba(255,255,255,0.96);
        box-shadow: 0 28px 70px rgba(0,0,0,0.28);
      }
      .table-lightbox-table.slide-table {
        width: 100%;
        height: 100%;
        max-width: none;
        margin: 0;
        cursor: default;
        grid-auto-rows: minmax(0, 1fr);
        align-content: stretch;
      }
      .table-lightbox-table .slide-table-row {
        min-height: 0;
      }
      .table-lightbox-table .slide-table-cell {
        min-height: 0;
        padding: 1.14rem 1.22rem;
        font-size: clamp(1.62rem, 2.62vw, 2.44rem);
        line-height: 1.08;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .table-lightbox-table.slide-table.slide-table-dense-1 .slide-table-cell {
        padding: 1.04rem 1.1rem;
        font-size: clamp(1.44rem, 2.28vw, 2.08rem);
        line-height: 1.08;
      }
      .table-lightbox-table.slide-table.slide-table-dense-2 .slide-table-cell {
        padding: 0.96rem 1.02rem;
        font-size: clamp(1.3rem, 2.04vw, 1.82rem);
        line-height: 1.06;
      }
      .table-lightbox-table.slide-table.slide-table-dense-3 .slide-table-cell {
        padding: 0.86rem 0.92rem;
        font-size: clamp(1.18rem, 1.84vw, 1.58rem);
        line-height: 1.04;
      }
      .table-lightbox-table.slide-table.slide-table-dense-4 .slide-table-cell {
        padding: 0.76rem 0.84rem;
        font-size: clamp(1.06rem, 1.64vw, 1.38rem);
        line-height: 1.02;
      }
      .table-lightbox-table.slide-table.slide-table-dense-5 .slide-table-cell {
        padding: 0.66rem 0.76rem;
        font-size: clamp(0.98rem, 1.46vw, 1.22rem);
        line-height: 1;
      }
      .table-lightbox-table[data-row-count="8"] .slide-table-cell {
        padding: 0.82rem 0.92rem;
        font-size: clamp(1.2rem, 1.9vw, 1.62rem);
        line-height: 1.04;
      }
      .table-lightbox-table.slide-table.slide-table-dense-4[data-row-count="8"] .slide-table-cell {
        padding: 0.66rem 0.76rem;
        font-size: clamp(1rem, 1.5vw, 1.26rem);
        line-height: 1;
      }
      .table-lightbox-table.slide-table.slide-table-dense-5[data-row-count="8"] .slide-table-cell {
        padding: 0.58rem 0.68rem;
        font-size: clamp(0.92rem, 1.36vw, 1.12rem);
        line-height: 0.98;
      }
      .table-lightbox-close {
        position: absolute;
        top: -0.9rem;
        right: -0.9rem;
        width: 2.6rem;
        height: 2.6rem;
        border: 0;
        border-radius: 999px;
        background: rgba(255,255,255,0.95);
        color: #122033;
        font: inherit;
        font-size: 1.35rem;
        line-height: 1;
        cursor: pointer;
        box-shadow: 0 12px 28px rgba(0,0,0,0.2);
      }
      @media (max-width: 980px) {
        .chart-lightbox-layout {
          grid-template-columns: minmax(0, 1fr);
        }
        .chart-lightbox-main .slide-visual-chart-card {
          min-height: min(60vh, 36rem);
        }
        .chart-lightbox-chart-grid-wrap {
          min-height: 18rem;
        }
        .chart-lightbox-main .slide-visual-chart-bar-shell {
          min-height: min(34vh, 22rem);
        }
      }
      .slide-footer {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 1rem;
        margin-top: auto;
        padding-top: 1rem;
        padding-right: clamp(5.4rem, 9vw, 7.8rem);
      }
      .slide-note {
        flex: 1 1 auto;
        max-width: min(100%, calc(100% - clamp(0.4rem, 1vw, 0.9rem)));
        padding: 0.75rem 0.95rem;
        border-radius: 18px;
        background: var(--slide-surface);
        color: var(--slide-text-muted);
        font-size: calc(1.08rem * var(--slide-content-font-scale));
        line-height: 1.58;
        box-shadow: var(--slide-frame-shadow);
      }
      .slide-note-content {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.45rem;
        width: 100%;
        min-width: 0;
      }
      .slide-note-text {
        min-width: 0;
        white-space: nowrap;
      }
      .slide-note-content .slide-link-bubble {
        align-self: center;
        position: relative;
        top: -0.2em;
      }
      .slide-note a {
        color: var(--slide-accent-strong);
        text-decoration: underline;
        overflow-wrap: anywhere;
      }
      .slide-signature {
        font-size: calc(0.8rem * var(--slide-content-font-scale));
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(18,32,51,0.44);
      }
      @media print {
        @page { size: A4 landscape; margin: 0; }
        html, body {
          margin: 0;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        body { background: #ffffff; }
        .deck-shell {
          min-height: auto;
          padding: 0;
        }
        main {
          margin: 0;
          padding: 0;
        }
        .deck-topbar { display: none; }
        .deck-progress { display: none; }
        .slide-screen {
          display: flex !important;
          width: 297mm;
          height: 210mm;
          min-width: 297mm;
          min-height: 210mm;
          margin: 0;
          align-items: center;
          justify-content: center;
          break-inside: avoid-page;
          page-break-inside: avoid;
          overflow: hidden;
        }
        .deck-slide {
          width: 285mm;
          height: 160.3125mm;
          max-width: 285mm;
          max-height: 160.3125mm;
          border-radius: 0;
          box-shadow: none;
          margin: 0;
        }
      }
      @media (max-width: 960px) {
        .deck-progress {
          top: auto;
          right: 50%;
          bottom: 0.85rem;
          flex-direction: row;
          padding: 0.42rem 0.7rem;
          transform: translateX(50%);
        }
        .deck-progress-step.is-active {
          width: 2rem;
          height: 0.96rem;
        }
        .deck-progress-step.is-active .deck-progress-dot {
          width: 1.3rem;
          height: 0.34rem;
        }
        .table-lightbox {
          padding: 1rem;
        }
        .table-lightbox-surface {
          padding: 0.85rem;
        }
        .table-lightbox-frame {
          width: 94vw;
          height: 88vh;
        }
        .table-lightbox-table .slide-table-cell {
          padding: 0.64rem 0.7rem;
          font-size: 1.04rem;
          line-height: 1.08;
        }
        .table-lightbox-table.slide-table.slide-table-dense-1 .slide-table-cell {
          padding: 0.58rem 0.64rem;
          font-size: 0.98rem;
        }
        .table-lightbox-table.slide-table.slide-table-dense-2 .slide-table-cell {
          padding: 0.54rem 0.6rem;
          font-size: 0.94rem;
        }
        .table-lightbox-table.slide-table.slide-table-dense-3 .slide-table-cell {
          padding: 0.5rem 0.56rem;
          font-size: 0.9rem;
        }
        .slide-side-column {
          gap: 0.7rem;
        }
        .slide-primary-column {
          gap: 0.7rem;
        }
      }
    </style>
  </head>
  <body${bodyAttributes}>
    <div class="deck-shell">
      ${isPdfMode ? "" : `<header class="deck-topbar">
        <div class="deck-meta">
          <strong>${ns.utils.escapeHtml(state.settings.title)}</strong>
          <span>${ns.utils.escapeHtml(state.settings.subtitle)}</span>
        </div>
        <div class="deck-nav">
          <button type="button" id="prev-slide">Précédent</button>
          <button type="button" id="next-slide">Suivant</button>
          <button type="button" id="fullscreen-deck">Plein écran</button>
          <button type="button" id="print-deck">Imprimer</button>
        </div>
      </header>`}
      <main>
        ${slidesMarkup}
        ${isPdfMode ? "" : `<div class="deck-progress" id="deck-progress" aria-label="Progression de la présentation">
          ${progressMarkup}
        </div>
        <div class="image-lightbox" id="image-lightbox" aria-hidden="true">
          <div class="image-lightbox-frame">
            <button class="image-lightbox-close" type="button" id="image-lightbox-close" aria-label="Fermer l’image">×</button>
            <img class="image-lightbox-image" id="image-lightbox-image" alt="" />
          </div>
        </div>
        <div class="chart-lightbox" id="chart-lightbox" aria-hidden="true">
          <div class="chart-lightbox-frame">
            <button class="chart-lightbox-close" type="button" id="chart-lightbox-close" aria-label="Fermer le graphique">×</button>
            <div class="chart-lightbox-content" id="chart-lightbox-content"></div>
          </div>
        </div>
        <div class="table-lightbox" id="table-lightbox" aria-hidden="true">
          <div class="table-lightbox-frame">
            <button class="table-lightbox-close" type="button" id="table-lightbox-close" aria-label="Fermer le tableau">×</button>
            <div class="table-lightbox-content" id="table-lightbox-content"></div>
          </div>
        </div>`}
      </main>
    </div>
    ${isPdfMode ? "" : `<script>
      const screens = Array.from(document.querySelectorAll(".slide-screen"));
      const prevButton = document.querySelector("#prev-slide");
      const nextButton = document.querySelector("#next-slide");
      const fullscreenButton = document.querySelector("#fullscreen-deck");
      const printButton = document.querySelector("#print-deck");
      const main = document.querySelector("main");
      const lightbox = document.querySelector("#image-lightbox");
      const lightboxImage = document.querySelector("#image-lightbox-image");
      const lightboxClose = document.querySelector("#image-lightbox-close");
      const chartLightbox = document.querySelector("#chart-lightbox");
      const chartLightboxContent = document.querySelector("#chart-lightbox-content");
      const chartLightboxClose = document.querySelector("#chart-lightbox-close");
      const tableLightbox = document.querySelector("#table-lightbox");
      const tableLightboxContent = document.querySelector("#table-lightbox-content");
      const tableLightboxClose = document.querySelector("#table-lightbox-close");
      const progressSteps = Array.from(document.querySelectorAll("[data-progress-index]"));
      let currentIndex = 0;
      let isTransitioning = false;
      let activeProjectorMedia = { kind: "", index: -1 };
      let imageLightboxZoomActive = false;
      let pendingRemoteDeckState = null;
      const presentationSearchParams = new URLSearchParams(window.location.search);
      const syncSessionId = presentationSearchParams.get("session") || "";
      const syncClientId = "present-view-" + Math.random().toString(36).slice(2);
      const syncBridge = syncSessionId ? createSyncBridge(syncSessionId) : null;

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

      function getTransitionName() {
        return document.body.getAttribute("data-transition") || "fade";
      }

      function getDirection(nextIndex) {
        if (screens.length <= 1) {
          return "next";
        }
        if ((currentIndex === screens.length - 1 && nextIndex === 0) || nextIndex > currentIndex) {
          return "next";
        }
        return "prev";
      }

      function clearTransitionClasses(slideNode) {
        if (!slideNode) {
          return;
        }
        slideNode.classList.remove(
          "is-transitioning",
          "transition-fade-out",
          "transition-fade-in",
          "transition-slide-out",
          "transition-slide-in",
          "transition-zoom-out",
          "transition-zoom-in",
          "transition-rise-out",
          "transition-rise-in",
          "direction-next",
          "direction-prev"
        );
      }

      function getActiveScreen() {
        return screens[currentIndex] || null;
      }

      function resetSlideReveals(screen) {
        if (!screen) {
          return;
        }
        const slide = screen.querySelector(".deck-slide");
        const revealItems = Array.from(screen.querySelectorAll("[data-reveal-step]"));
        if (!slide || slide.getAttribute("data-progressive-content") !== "true") {
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

      function applyRevealState(screen, revealStep) {
        if (!screen) {
          return;
        }
        const slide = screen.querySelector(".deck-slide");
        if (!slide || slide.getAttribute("data-progressive-content") !== "true") {
          return;
        }
        const safeRevealStep = Math.max(0, Number(revealStep) || 0);
        Array.from(screen.querySelectorAll("[data-reveal-step]")).forEach((item) => {
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

      function getCurrentRevealStep() {
        const screen = getActiveScreen();
        if (!screen) {
          return 0;
        }
        return Array.from(screen.querySelectorAll("[data-reveal-step].presentation-reveal-visible"))
          .map((item) => Number(item.getAttribute("data-reveal-step")) || 0)
          .reduce((max, step) => Math.max(max, step), 0);
      }

      function broadcastDeckState() {
        if (!syncBridge) {
          return;
        }
        syncBridge.post({
          type: "deck-state",
          origin: syncClientId,
          currentIndex,
          revealStep: getCurrentRevealStep(),
        });
      }

      function broadcastProjectorReady() {
        if (!syncBridge) {
          return;
        }
        syncBridge.post({ type: "projector-ready", origin: syncClientId });
      }

      function broadcastProjectorMediaState() {
        if (!syncBridge) {
          return;
        }
        syncBridge.post({
          type: "projector-media-state",
          origin: syncClientId,
          isOpen: Boolean(activeProjectorMedia.kind),
          mediaKind: activeProjectorMedia.kind || "",
          mediaIndex: Number.isInteger(activeProjectorMedia.index) ? activeProjectorMedia.index : -1,
          imageZoomActive: Boolean(imageLightboxZoomActive && activeProjectorMedia.kind === "image"),
        });
      }

      function resetProjectorMediaState() {
        activeProjectorMedia = { kind: "", index: -1 };
        imageLightboxZoomActive = false;
        broadcastProjectorMediaState();
      }

      function setImageLightboxZoom(active) {
        imageLightboxZoomActive = Boolean(active);
        lightboxImage.classList.toggle("is-zoomed", imageLightboxZoomActive);
        if (activeProjectorMedia.kind === "image") {
          broadcastProjectorMediaState();
        }
      }

      function revealNextItemInCurrentSlide() {
        const screen = getActiveScreen();
        if (!screen) {
          return false;
        }
        const slide = screen.querySelector(".deck-slide");
        if (!slide || slide.getAttribute("data-progressive-content") !== "true") {
          return false;
        }
        const hiddenItems = Array.from(screen.querySelectorAll("[data-reveal-step].presentation-reveal-hidden"))
          .sort((a, b) => Number(a.getAttribute("data-reveal-step")) - Number(b.getAttribute("data-reveal-step")));
        if (!hiddenItems.length) {
          return false;
        }
        const nextStep = Number(hiddenItems[0].getAttribute("data-reveal-step")) || 0;
        hiddenItems
          .filter((item) => (Number(item.getAttribute("data-reveal-step")) || 0) === nextStep)
          .forEach((item) => {
            item.classList.remove("presentation-reveal-hidden");
            item.classList.add("presentation-reveal-visible");
          });
        broadcastDeckState();
        return true;
      }

      function updateFullscreenScale() {
        if (document.fullscreenElement !== main) {
          main.style.removeProperty("--deck-fullscreen-scale");
          return;
        }

        const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
        main.style.setProperty("--deck-fullscreen-scale", String(scale));
      }

      function updateWindowScale() {
        if (!main || document.fullscreenElement === main) {
          if (main) {
            main.style.removeProperty("--deck-window-scale");
          }
          return;
        }
        const topbar = document.querySelector(".deck-topbar");
        const availableWidth = Math.max(320, window.innerWidth - 32);
        const availableHeight = Math.max(180, window.innerHeight - (topbar ? (topbar.offsetHeight || 0) : 0) - 32);
        const scale = Math.min(availableWidth / 1280, availableHeight / 720);
        main.style.setProperty("--deck-window-scale", String(scale));
      }

      function syncProgress() {
        progressSteps.forEach((step, index) => {
          const isActive = index === currentIndex;
          step.classList.toggle("is-active", isActive);
          if (isActive) {
            step.setAttribute("aria-current", "step");
          } else {
            step.removeAttribute("aria-current");
          }
        });
      }

      function showSlide(nextIndex, options) {
        const opts = options || {};
        if (isTransitioning || screens.length === 0) {
          return;
        }
        const normalizedIndex = (nextIndex + screens.length) % screens.length;
        const hasActiveScreen = screens.some((screen) => screen.classList.contains("is-active"));
        if (normalizedIndex === currentIndex && hasActiveScreen) {
          return;
        }
        const transitionName = getTransitionName();
        const outgoingScreen = getActiveScreen();
        const incomingScreen = screens[normalizedIndex];
        closeAllProjectorMedia();

        if (!outgoingScreen || transitionName === "none") {
          currentIndex = normalizedIndex;
          screens.forEach((screen, index) => {
            screen.classList.toggle("is-active", index === currentIndex);
          });
          resetSlideReveals(getActiveScreen());
          applyRevealState(getActiveScreen(), opts.revealStep);
          syncProgress();
          updateFullscreenScale();
          if (!opts.silent) {
            broadcastDeckState();
          }
          if (pendingRemoteDeckState) {
            const queuedState = pendingRemoteDeckState;
            pendingRemoteDeckState = null;
            showSlide(queuedState.index, { silent: true, revealStep: queuedState.revealStep });
          }
          return;
        }

        const direction = getDirection(normalizedIndex);
        const outgoingSlide = outgoingScreen.querySelector(".deck-slide");
        const incomingSlide = incomingScreen.querySelector(".deck-slide");
        isTransitioning = true;

        clearTransitionClasses(outgoingSlide);
        clearTransitionClasses(incomingSlide);
        outgoingSlide.classList.add("is-transitioning", "transition-" + transitionName + "-out", "direction-" + direction);

        setTimeout(() => {
          outgoingScreen.classList.remove("is-active");
          clearTransitionClasses(outgoingSlide);
          currentIndex = normalizedIndex;
          incomingScreen.classList.add("is-active");
          resetSlideReveals(incomingScreen);
          applyRevealState(incomingScreen, opts.revealStep);
          syncProgress();
          clearTransitionClasses(incomingSlide);
          incomingSlide.classList.add("is-transitioning", "transition-" + transitionName + "-in", "direction-" + direction);
          updateFullscreenScale();

          setTimeout(() => {
            clearTransitionClasses(incomingSlide);
            isTransitioning = false;
            if (!opts.silent) {
              broadcastDeckState();
            }
            if (pendingRemoteDeckState) {
              const queuedState = pendingRemoteDeckState;
              pendingRemoteDeckState = null;
              showSlide(queuedState.index, { silent: true, revealStep: queuedState.revealStep });
            }
          }, 320);
        }, 240);
      }

      function openImageLightbox(image) {
        const src = image.getAttribute("src");
        if (!src) {
          return;
        }
        lightboxImage.src = src;
        lightboxImage.alt = image.getAttribute("alt") || "";
        setImageLightboxZoom(false);
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
      }

      function closeImageLightbox() {
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");
        if (activeProjectorMedia.kind === "image") {
          resetProjectorMediaState();
        }
        setImageLightboxZoom(false);
        setTimeout(() => {
          if (!lightbox.classList.contains("is-open")) {
            lightboxImage.removeAttribute("src");
            lightboxImage.alt = "";
          }
        }, 220);
      }

      function normalizeChartHexColor(value) {
        return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value.toLowerCase() : "#60b2e5";
      }

      function clampChartBarValue(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : 0;
      }

      function getChartLightboxBars(chartCard) {
        if (!chartCard) {
          return [];
        }
        try {
          const parsed = JSON.parse(chartCard.getAttribute("data-chart-bars") || "[]");
          if (!Array.isArray(parsed)) {
            return [];
          }
          return parsed.slice(0, 6).map((bar) => ({
            label: typeof (bar && bar.label) === "string" && bar.label.trim() ? bar.label.trim().slice(0, 18) : "Point",
            value: clampChartBarValue(bar && bar.value),
            color: normalizeChartHexColor(bar && bar.color),
          }));
        } catch (error) {
          return [];
        }
      }

      function decorateChartCloneForLightbox(chartClone) {
        if (!chartClone) {
          return chartClone;
        }
        const chartGrid = chartClone.querySelector(".slide-visual-chart-grid");
        if (!chartGrid || chartGrid.closest(".chart-lightbox-chart-grid-wrap")) {
          return chartClone;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "chart-lightbox-chart-grid-wrap";

        const gridSurface = document.createElement("div");
        gridSurface.className = "chart-lightbox-grid-surface";
        const gridLines = document.createElement("div");
        gridLines.className = "chart-lightbox-grid-lines";
        ["high", "mid", "low"].forEach((labelText) => {
          const line = document.createElement("span");
          line.setAttribute("aria-hidden", "true");
          line.setAttribute("data-chart-line", labelText);
          gridLines.appendChild(line);
        });

        const parent = chartGrid.parentNode;
        parent.replaceChild(wrapper, chartGrid);
        gridSurface.appendChild(gridLines);
        gridSurface.appendChild(chartGrid);
        wrapper.appendChild(gridSurface);
        return chartClone;
      }

      function appendChartLightboxText(container, text) {
        const linked = window.StudioSlides.utils.extractLinks(text || "");
        if (linked.text) {
          linked.text
            .split(/\\r?\\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .forEach((line) => {
              const paragraph = document.createElement("p");
              paragraph.textContent = line;
              container.appendChild(paragraph);
            });
        }
        if (linked.links.length) {
          const linksWrap = document.createElement("div");
          linksWrap.className = "slide-link-bubbles";
          linked.links.forEach((url) => {
            const link = document.createElement("a");
            link.className = "slide-free-link slide-link-bubble";
            link.href = url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = window.StudioSlides.utils.formatUrlLabel(url);
            linksWrap.appendChild(link);
          });
          container.appendChild(linksWrap);
        }
      }

      function createChartLightboxPanel(title) {
        const panel = document.createElement("section");
        panel.className = "chart-lightbox-panel";
        const kicker = document.createElement("p");
        kicker.className = "chart-lightbox-kicker";
        kicker.textContent = title;
        panel.appendChild(kicker);
        return panel;
      }

      function createChartLightboxMarkup(chartCard, chartClone) {
        const layout = document.createElement("div");
        layout.className = "chart-lightbox-layout";

        const mainColumn = document.createElement("div");
        mainColumn.className = "chart-lightbox-main";
        mainColumn.appendChild(chartClone);
        layout.appendChild(mainColumn);

        const sideColumn = document.createElement("aside");
        sideColumn.className = "chart-lightbox-side";

        const chartBars = getChartLightboxBars(chartCard);
        if (chartBars.length) {
          const legendPanel = createChartLightboxPanel("Legende");
          const legend = document.createElement("ul");
          legend.className = "chart-lightbox-legend";
          chartBars.forEach((bar) => {
            const item = document.createElement("li");
            item.className = "chart-lightbox-legend-item";

            const swatch = document.createElement("span");
            swatch.className = "chart-lightbox-swatch";
            swatch.style.background = bar.color;

            const label = document.createElement("span");
            label.className = "chart-lightbox-legend-label";
            label.textContent = bar.label;

            const value = document.createElement("strong");
            value.className = "chart-lightbox-legend-value";
            value.textContent = String(bar.value) + "%";

            item.appendChild(swatch);
            item.appendChild(label);
            item.appendChild(value);
            legend.appendChild(item);
          });
          legendPanel.appendChild(legend);
          sideColumn.appendChild(legendPanel);
        }

        const bodyText = chartCard.getAttribute("data-chart-body") || "";
        const calloutText = chartCard.getAttribute("data-chart-callout") || "";
        if (bodyText.trim() || calloutText.trim()) {
          const textPanel = createChartLightboxPanel("Texte des indicateurs");
          if (bodyText.trim()) {
            const copy = document.createElement("div");
            copy.className = "chart-lightbox-copy";
            appendChartLightboxText(copy, bodyText);
            textPanel.appendChild(copy);
          }
          if (calloutText.trim()) {
            const note = document.createElement("div");
            note.className = "chart-lightbox-note";
            appendChartLightboxText(note, calloutText);
            textPanel.appendChild(note);
          }
          sideColumn.appendChild(textPanel);
        }

        if (sideColumn.childElementCount > 0) {
          layout.appendChild(sideColumn);
        }

        return layout;
      }

      function openChartLightbox(chartCard) {
        if (!chartCard) {
          return;
        }
        const chartClone = chartCard.cloneNode(true);
        decorateChartCloneForLightbox(chartClone);
        chartClone.classList.remove("slide-reveal-item", "presentation-reveal-hidden", "presentation-reveal-visible");
        chartClone.querySelectorAll(".slide-reveal-item, .presentation-reveal-hidden, .presentation-reveal-visible").forEach((node) => {
          node.classList.remove("slide-reveal-item", "presentation-reveal-hidden", "presentation-reveal-visible");
        });
        chartLightboxContent.innerHTML = "";
        chartLightboxContent.appendChild(createChartLightboxMarkup(chartCard, chartClone));
        chartLightbox.classList.add("is-open");
        chartLightbox.setAttribute("aria-hidden", "false");
      }

      function closeChartLightbox() {
        chartLightbox.classList.remove("is-open");
        chartLightbox.setAttribute("aria-hidden", "true");
        chartLightboxContent.innerHTML = "";
        if (activeProjectorMedia.kind === "chart") {
          resetProjectorMediaState();
        }
      }

      function applySlidePaletteVarsToNode(sourceNode, targetNode) {
        if (!sourceNode || !targetNode) {
          return;
        }
        const slideRoot = sourceNode.closest(".deck-slide");
        if (!slideRoot) {
          return;
        }
        const computed = window.getComputedStyle(slideRoot);
        [
          "--slide-bg-start",
          "--slide-bg-end",
          "--slide-accent",
          "--slide-accent-strong",
          "--slide-accent-soft",
          "--slide-accent-softer",
          "--slide-decor-soft",
          "--slide-decor-softer",
          "--slide-decor-wave",
          "--slide-decor-wave-soft",
          "--slide-decor-deep-soft",
          "--slide-surface",
          "--slide-surface-strong",
          "--slide-text",
          "--slide-text-muted",
          "--slide-text-soft",
          "--slide-line",
          "--slide-frame-shadow",
          "--slide-font-body",
          "--slide-font-heading",
        ].forEach((name) => {
          const value = computed.getPropertyValue(name);
          if (value) {
            targetNode.style.setProperty(name, value.trim());
          }
        });
      }

      function createTableLightboxMarkup(tableClone) {
        const wrapper = document.createElement("div");
        wrapper.className = "table-lightbox-surface";
        tableClone.classList.add("table-lightbox-table");
        wrapper.appendChild(tableClone);
        return wrapper;
      }

      function openTableLightbox(tableNode) {
        if (!tableNode) {
          return;
        }
        const tableClone = tableNode.cloneNode(true);
        applySlidePaletteVarsToNode(tableNode, tableClone);
        tableClone.querySelectorAll(".slide-reveal-item, .presentation-reveal-hidden, .presentation-reveal-visible").forEach((node) => {
          node.classList.remove("slide-reveal-item", "presentation-reveal-hidden", "presentation-reveal-visible");
        });
        tableLightboxContent.innerHTML = "";
        tableLightboxContent.appendChild(createTableLightboxMarkup(tableClone));
        tableLightbox.classList.add("is-open");
        tableLightbox.setAttribute("aria-hidden", "false");
      }

      function closeTableLightbox() {
        tableLightbox.classList.remove("is-open");
        tableLightbox.setAttribute("aria-hidden", "true");
        tableLightboxContent.innerHTML = "";
        if (activeProjectorMedia.kind === "table") {
          resetProjectorMediaState();
        }
      }

      function closeAllProjectorMedia() {
        if (lightbox.classList.contains("is-open")) {
          closeImageLightbox();
        }
        if (chartLightbox.classList.contains("is-open")) {
          closeChartLightbox();
        }
        if (tableLightbox.classList.contains("is-open")) {
          closeTableLightbox();
        }
      }

      function getProjectorMediaTargets(kind) {
        const screen = getActiveScreen();
        if (!screen) {
          return [];
        }
        if (kind === "image") {
          return Array.from(screen.querySelectorAll(".slide-media-image"));
        }
        if (kind === "table") {
          return Array.from(screen.querySelectorAll(".slide-table[data-table-lightbox='true']"));
        }
        if (kind === "chart") {
          return Array.from(screen.querySelectorAll(".slide-visual-chart-card"));
        }
        return [];
      }

      function getProjectorMediaIndex(kind, target) {
        return getProjectorMediaTargets(kind).indexOf(target);
      }

      function toggleProjectorMedia(kind, index) {
        const mediaIndex = Number(index);
        if (!kind || mediaIndex < 0) {
          return;
        }
        const targets = getProjectorMediaTargets(kind);
        const target = targets[mediaIndex];
        if (!target) {
          return;
        }
        if (activeProjectorMedia.kind === kind && activeProjectorMedia.index === mediaIndex) {
          closeAllProjectorMedia();
          resetProjectorMediaState();
          return;
        }
        closeAllProjectorMedia();
        if (kind === "image") {
          openImageLightbox(target);
        } else if (kind === "table") {
          openTableLightbox(target);
        } else if (kind === "chart") {
          openChartLightbox(target);
        }
        activeProjectorMedia = { kind, index: mediaIndex };
        broadcastProjectorMediaState();
      }

      function applyProjectorImageZoom(mode) {
        if (!lightbox.classList.contains("is-open") || activeProjectorMedia.kind !== "image") {
          return;
        }
        if (mode === "in") {
          setImageLightboxZoom(true);
          return;
        }
        setImageLightboxZoom(false);
      }

      if (syncBridge) {
        syncBridge.subscribe((payload) => {
          if (!payload || payload.origin === syncClientId) {
            return;
          }
          if (payload.type === "projector-media-toggle") {
            if (Number(payload.currentIndex) !== currentIndex) {
              return;
            }
            toggleProjectorMedia(payload.mediaKind, payload.mediaIndex);
            return;
          }
          if (payload.type === "projector-image-zoom") {
            if (Number(payload.currentIndex) !== currentIndex) {
              return;
            }
            applyProjectorImageZoom(payload.mode);
            return;
          }
          if (payload.type !== "deck-state") {
            return;
          }
          const targetIndex = Number(payload.currentIndex);
          const targetRevealStep = Number(payload.revealStep) || 0;
          if (isTransitioning) {
            pendingRemoteDeckState = {
              index: targetIndex,
              revealStep: targetRevealStep,
            };
            return;
          }
          const hasActiveScreen = screens.some((screen) => screen.classList.contains("is-active"));
          if (targetIndex !== currentIndex || !hasActiveScreen) {
            showSlide(targetIndex, { silent: true, revealStep: targetRevealStep });
            return;
          }
          applyRevealState(getActiveScreen(), targetRevealStep);
          syncProgress();
          updateFullscreenScale();
        });
      }

      prevButton.addEventListener("click", () => showSlide(currentIndex - 1));
      nextButton.addEventListener("click", () => showSlide(currentIndex + 1));
      progressSteps.forEach((step) => {
        step.addEventListener("click", (event) => {
          event.stopPropagation();
          showSlide(Number(step.getAttribute("data-progress-index")));
        });
      });
      main.addEventListener("click", (event) => {
        if (isTransitioning) {
          return;
        }
        if (lightbox.classList.contains("is-open")) {
          return;
        }
        if (chartLightbox.classList.contains("is-open")) {
          return;
        }
        if (tableLightbox.classList.contains("is-open")) {
          return;
        }
        const slideImage = event.target.closest(".slide-media-image");
        if (slideImage && !event.target.closest(".slide-media-print-card")) {
          openImageLightbox(slideImage);
          activeProjectorMedia = { kind: "image", index: getProjectorMediaIndex("image", slideImage) };
          broadcastProjectorMediaState();
          return;
        }
        const slideTable = event.target.closest(".slide-table[data-table-lightbox='true']");
        if (slideTable) {
          openTableLightbox(slideTable);
          activeProjectorMedia = { kind: "table", index: getProjectorMediaIndex("table", slideTable) };
          broadcastProjectorMediaState();
          return;
        }
        const chartCard = event.target.closest(".slide-visual-chart-card");
        if (chartCard) {
          openChartLightbox(chartCard);
          activeProjectorMedia = { kind: "chart", index: getProjectorMediaIndex("chart", chartCard) };
          broadcastProjectorMediaState();
          return;
        }
        if (
          event.target.closest("a, button, video, iframe") ||
          event.target.closest(".slide-media-link")
        ) {
          return;
        }
        if (revealNextItemInCurrentSlide()) {
          return;
        }
        showSlide(currentIndex + 1);
      });
      lightbox.addEventListener("click", (event) => {
        event.stopPropagation();
        if (event.target === lightbox || event.target === lightboxClose || event.target === lightboxImage) {
          closeImageLightbox();
        }
      });
      chartLightbox.addEventListener("click", (event) => {
        event.stopPropagation();
        if (event.target === chartLightbox || event.target === chartLightboxClose) {
          closeChartLightbox();
        }
      });
      tableLightbox.addEventListener("click", (event) => {
        event.stopPropagation();
        if (event.target === tableLightbox || event.target === tableLightboxClose) {
          closeTableLightbox();
        }
      });
      fullscreenButton.addEventListener("click", async () => {
        if (!document.fullscreenElement) {
          try {
            await main.requestFullscreen();
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
      });
      document.addEventListener("fullscreenchange", () => {
        document.body.classList.toggle("deck-is-fullscreen", Boolean(document.fullscreenElement));
        fullscreenButton.textContent = document.fullscreenElement ? "Quitter le plein écran" : "Plein écran";
        updateFullscreenScale();
        updateWindowScale();
      });
      window.addEventListener("resize", () => {
        updateFullscreenScale();
        updateWindowScale();
      });
      printButton.addEventListener("click", () => window.print());
      document.addEventListener("keydown", (event) => {
        if (isTransitioning && event.key !== "Escape") {
          return;
        }
        if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
          closeImageLightbox();
          return;
        }
        if (event.key === "Escape" && chartLightbox.classList.contains("is-open")) {
          closeChartLightbox();
          return;
        }
        if (event.key === "Escape" && tableLightbox.classList.contains("is-open")) {
          closeTableLightbox();
          return;
        }
        if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " " || event.code === "Space") {
          event.preventDefault();
          if (revealNextItemInCurrentSlide()) {
            return;
          }
          showSlide(currentIndex + 1);
        }
        if (event.key === "ArrowLeft" || event.key === "PageUp") showSlide(currentIndex - 1);
      });
      if (syncBridge) {
        broadcastProjectorReady();
        window.setInterval(broadcastProjectorReady, 2200);
        window.addEventListener("focus", broadcastProjectorReady);
        window.addEventListener("pageshow", broadcastProjectorReady);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            broadcastProjectorReady();
          }
        });
        window.addEventListener("beforeunload", () => syncBridge.close());
      }
      updateWindowScale();
      showSlide(${initialSlideIndex}, { silent: Boolean(syncBridge) });
    </script>`}
  </body>
</html>`;
  }

  function buildPdfWorkerHtml(state) {
    return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Export PDF en cours</title>
    <link rel="icon" type="image/png" href="assets/images/icon.png" />
    <link rel="stylesheet" href="styles/base.css" />
    <link rel="stylesheet" href="styles/layout.css" />
    <link rel="stylesheet" href="styles/components.css" />
    <link rel="stylesheet" href="styles/slide.css" />
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: linear-gradient(160deg, #edf3f9, #d7e4f3);
        color: #122033;
        font-family: Aptos, "Segoe UI", "Trebuchet MS", sans-serif;
      }
      .pdf-export-worker {
        width: min(32rem, calc(100vw - 2rem));
        padding: 1.4rem 1.5rem;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 24px 60px rgba(18, 31, 52, 0.18);
      }
      .pdf-export-worker h1 {
        margin: 0 0 0.35rem;
        font-size: 1.45rem;
      }
      .pdf-export-worker p {
        margin: 0;
        line-height: 1.45;
      }
      .pdf-export-worker-status {
        margin-top: 0.95rem;
        font-weight: 700;
      }
      .pdf-export-worker-progress {
        height: 0.7rem;
        margin-top: 1rem;
        border-radius: 999px;
        background: rgba(18, 32, 51, 0.08);
        overflow: hidden;
      }
      .pdf-export-worker-progress-bar {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #2c73da, #72a8f5);
        transition: width 0.2s ease;
      }
      .pdf-export-worker-note {
        margin-top: 0.95rem;
        color: #5d6c81;
        font-size: 0.92rem;
      }
    </style>
    <script defer src="src/app/data/bloom-levels.js"></script>
    <script defer src="src/app/data/cognitive-principles.js"></script>
    <script defer src="src/app/data/color-palettes.js"></script>
    <script defer src="src/app/data/font-options.js"></script>
    <script defer src="src/app/state/default-state.js"></script>
    <script defer src="src/app/utils/helpers.js"></script>
    <script defer src="src/app/services/storage-service.js"></script>
    <script defer src="src/app/services/media-service.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
    <script defer src="src/app/ui/slide-markup.js"></script>
    <script defer src="src/app/services/export-service.js"></script>
  </head>
  <body>
    <div class="pdf-export-worker">
      <h1>Export PDF en cours</h1>
      <p>La génération se fait dans cette fenêtre pour laisser l’éditeur principal réactif.</p>
      <p id="pdf-export-worker-status" class="pdf-export-worker-status">Préparation…</p>
      <div class="pdf-export-worker-progress" aria-hidden="true">
        <div id="pdf-export-worker-progress-bar" class="pdf-export-worker-progress-bar"></div>
      </div>
      <p id="pdf-export-worker-note" class="pdf-export-worker-note">La fenêtre se fermera automatiquement après l’export.</p>
    </div>
    <script>
      window.__PDF_EXPORT_STATE__ = ${serializeForScript(state)};
      window.addEventListener("load", () => {
        const statusNode = document.querySelector("#pdf-export-worker-status");
        const progressBar = document.querySelector("#pdf-export-worker-progress-bar");
        const noteNode = document.querySelector("#pdf-export-worker-note");

        function syncProgress(detail) {
          const payload = detail || {};
          const percent = Math.max(0, Math.min(100, Number(payload.percent) || 0));
          const message = payload.detail || payload.label || "Export PDF";
          if (statusNode) {
            statusNode.textContent = payload.state === "running"
              ? message + " (" + percent + "%)"
              : message;
          }
          if (progressBar) {
            progressBar.style.width = percent + "%";
          }
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: "studio-pdf-export-progress", detail: payload }, window.location.origin);
          }
        }

        window.StudioSlides.services.exporter.setPdfProgressListener(syncProgress);
        syncProgress({ state: "running", percent: 0, label: "Exporter PDF", detail: "Préparation de l'export PDF" });

        window.StudioSlides.services.exporter.runPdfExportJob(window.__PDF_EXPORT_STATE__)
          .then(() => {
            if (noteNode) {
              noteNode.textContent = "PDF généré. Téléchargement lancé.";
            }
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ type: "studio-pdf-export-finished" }, window.location.origin);
            }
            window.setTimeout(() => window.close(), 900);
          })
          .catch((error) => {
            const message = error && error.message ? error.message : "Échec de l'export PDF";
            if (statusNode) {
              statusNode.textContent = message;
            }
            if (noteNode) {
              noteNode.textContent = "Tu peux laisser cette fenêtre ouverte pour lire l'erreur.";
            }
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ type: "studio-pdf-export-error", detail: message }, window.location.origin);
            }
          });
      });
    </script>
  </body>
</html>`;
  }

  async function exportHtml(state, openOnly) {
    const fileName = `${ns.utils.slugify(state.settings.title || "presentation")}.html`;
    const logoSources = await resolveLogoSources();
    const html = await buildPresentationHtml(state, logoSources, {
      pdfMode: false,
      exportMode: openOnly ? "present" : "html",
    });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });

    if (openOnly) {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      return;
    }

    downloadBlob(blob, fileName);
  }

  async function runPdfExportJob(state) {
    if (!window.html2canvas) {
      window.alert("La librairie de rendu n'est pas chargée. Vérifie la connexion internet puis réessaie.");
      return;
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      window.alert("La librairie PDF n'est pas chargée. Vérifie la connexion internet puis réessaie.");
      return;
    }

    const logoSources = await resolveLogoSources();
    const availableMediaItems = getAvailableMediaItems(state.mediaLibrary || []);
    const mediaAssets = await ns.services.media.resolvePdfMediaAssets(availableMediaItems);
    const mediaPreviewMap = mediaAssets.previewMap || {};
    const mediaLinkMap = mediaAssets.linkMap || {};
    const { jsPDF } = window.jspdf;
    const pageWidth = 297;
    const pageHeight = 210;
    const slideX = 0;
    const slideY = (pageHeight - ((pageWidth / 16) * 9)) / 2;
    const slideW = pageWidth;
    const slideH = (pageWidth / 16) * 9;
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
      putOnlyUsedFonts: true,
    });

    notifyPdfProgress({
      state: "running",
      percent: 0,
      label: "Exporter PDF",
      detail: "Préparation de l'export PDF",
    });

    try {
      for (let index = 0; index < state.slides.length; index += 1) {
        const slide = state.slides[index];
        notifyPdfProgress({
          state: "running",
          percent: Math.round((index / Math.max(1, state.slides.length)) * 100),
          label: `Slide ${index + 1}/${state.slides.length}`,
          detail: `Rendu de la slide ${index + 1} sur ${state.slides.length}`,
        });
        await waitForNextFrame();

        const mounted = mountSlideExportNode(slide, state, {
          logoSources,
          mediaUrls: mediaPreviewMap,
          mediaLinks: mediaLinkMap,
          pdfMode: true,
        });
        const host = mounted.host;
        const slideNode = mounted.slideNode;

        try {
          await waitForRenderAssets(host);
          const linkRects = collectSlideLinkRects(slideNode, 1280, 720);
          const canvas = await window.html2canvas(slideNode, {
            backgroundColor: "#ffffff",
            useCORS: true,
            allowTaint: true,
            scale: 1.2,
            logging: false,
          });
          await waitForNextFrame();
          const imageData = canvas.toDataURL("image/jpeg", 0.72);

          if (index > 0) {
            pdf.addPage("a4", "landscape");
          }

          pdf.addImage(imageData, "JPEG", slideX, slideY, slideW, slideH, undefined, "FAST");
          linkRects.forEach((link) => {
            pdf.link(
              slideX + ((link.x / 1280) * slideW),
              slideY + ((link.y / 720) * slideH),
              (link.w / 1280) * slideW,
              (link.h / 720) * slideH,
              { url: link.href }
            );
          });
        } finally {
          unmountSlideExportNode(host);
        }
      }

      notifyPdfProgress({
        state: "running",
        percent: 100,
        label: "Finalisation",
        detail: "Création du fichier PDF",
      });
      await waitForNextFrame();

      const fileName = `${ns.utils.slugify(state.settings.title || "presentation")}.pdf`;
      pdf.save(fileName);
      notifyPdfProgress({
        state: "completed",
        percent: 100,
        label: "Exporter PDF",
        detail: "Export PDF terminé",
      });
    } catch (error) {
      notifyPdfProgress({
        state: "error",
        percent: 0,
        label: "Exporter PDF",
        detail: "Échec de l'export PDF",
      });
      throw error;
    }
  }

  async function exportPdf(state) {
    notifyPdfProgress({
      state: "running",
      percent: 0,
      label: "Exporter PDF",
      detail: "Ouverture de la fenêtre d'export PDF",
    });

    const workerWindow = window.open("", "studio-pdf-export", "popup,width=1480,height=980");
    if (!workerWindow) {
      notifyPdfProgress({
        state: "error",
        percent: 0,
        label: "Exporter PDF",
        detail: "La fenêtre d'export a été bloquée",
      });
      window.alert("La fenêtre d'export PDF a été bloquée par le navigateur. Autorise les popups puis réessaie.");
      return;
    }

    try {
      workerWindow.resizeTo(1480, 980);
    } catch (error) {
      // Ignore browsers that block scripted resize.
    }

    workerWindow.document.open();
    workerWindow.document.write(buildPdfWorkerHtml(state));
    workerWindow.document.close();
  }

  async function renderPresentationDocument(state) {
    const logoSources = await resolveLogoSources();
    const startSlideId = new URLSearchParams(window.location.search).get("start") || "";
    const html = await buildPresentationHtml(state, logoSources, {
      pdfMode: false,
      exportMode: "present",
      startSlideId,
    });
    document.open();
    document.write(html);
    document.close();
  }

  function hexToRgbComponents(hex) {
    const value = String(hex || "").replace("#", "");
    const normalized = value.length === 3
      ? value.split("").map((char) => char + char).join("")
      : value.padEnd(6, "0").slice(0, 6);
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    };
  }

  function rgbToHex(r, g, b) {
    return [r, g, b]
      .map((item) => Math.max(0, Math.min(255, Math.round(item))).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  function lightenHex(hex, amount) {
    const rgb = hexToRgbComponents(hex);
    return rgbToHex(
      rgb.r + (255 - rgb.r) * amount,
      rgb.g + (255 - rgb.g) * amount,
      rgb.b + (255 - rgb.b) * amount
    );
  }

  function getMediaItemById(items, id) {
    return (items || []).find((item) => item.id === id) || null;
  }

  function getDeckFontOption(settings) {
    const fonts = (ns.data && ns.data.fontOptions) || [];
    return fonts.find((item) => item.id === (settings && settings.font)) || fonts[0] || {
      pptBody: "Aptos",
      pptHeading: "Georgia",
    };
  }

  function buildVideoLink(mediaItem, mediaLinks) {
    if (!mediaItem) {
      return "";
    }
    return mediaLinks[mediaItem.id] || mediaItem.externalUrl || mediaItem.embedUrl || "";
  }

  async function waitForRenderAssets(root) {
    const images = Array.from(root.querySelectorAll("img"));
    const videos = Array.from(root.querySelectorAll("video"));
    const withTimeout = (promise, timeoutMs) => new Promise((resolve) => {
      let settled = false;
      const timer = window.setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        resolve();
      }, timeoutMs);
      promise.finally(() => {
        if (settled) {
          return;
        }
        settled = true;
        window.clearTimeout(timer);
        resolve();
      });
    });

    await Promise.all(images.map((img) => {
      if (img.complete) {
        return Promise.resolve();
      }
      return withTimeout(new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      }), 4000);
    }));

    await Promise.all(videos.map((video) => {
      if (video.readyState >= 2) {
        return Promise.resolve();
      }
      return withTimeout(new Promise((resolve) => {
        video.addEventListener("loadeddata", resolve, { once: true });
        video.addEventListener("error", resolve, { once: true });
      }), 4000);
    }));
  }

  function mountSlideExportNode(slide, state, options) {
    const opts = options || {};
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-20000px";
    host.style.top = "0";
    host.style.width = "1280px";
    host.style.height = "720px";
    host.style.padding = "0";
    host.style.margin = "0";
    host.style.zIndex = "-1";
    host.style.background = "transparent";
    document.body.appendChild(host);

    host.innerHTML = ns.ui.createSlideMarkup(slide, state.settings, {
      compact: false,
      logoSources: opts.logoSources,
      mediaItems: getAvailableMediaItems(state.mediaLibrary || []),
      mediaUrls: getAvailableMediaUrls(opts.mediaUrls || {}),
      mediaLinks: opts.mediaLinks || {},
      pdfMode: true,
    });

    const slideNode = host.firstElementChild;
    slideNode.style.width = "1280px";
    slideNode.style.height = "720px";
    slideNode.style.aspectRatio = "16 / 9";
    slideNode.style.boxShadow = "none";
    slideNode.style.borderRadius = "0";

    return { host, slideNode };
  }

  function unmountSlideExportNode(host) {
    if (host && host.parentNode) {
      host.parentNode.removeChild(host);
    }
  }

  function collectSlideLinkRects(slideNode, width, height) {
    if (!slideNode) {
      return [];
    }

    const slideRect = slideNode.getBoundingClientRect();
    const safeWidth = width || slideRect.width || 1280;
    const safeHeight = height || slideRect.height || 720;

    return Array.from(slideNode.querySelectorAll("a[href]"))
      .map((link) => {
        const href = String(link.href || link.getAttribute("href") || "").trim();
        if (!href || /^javascript:/i.test(href)) {
          return null;
        }

        const computed = window.getComputedStyle(link);
        if (computed.display === "none" || computed.visibility === "hidden") {
          return null;
        }

        const rect = link.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          return null;
        }

        const x = Math.max(0, rect.left - slideRect.left);
        const y = Math.max(0, rect.top - slideRect.top);
        const w = Math.max(0, Math.min(rect.width, safeWidth - x));
        const h = Math.max(0, Math.min(rect.height, safeHeight - y));

        if (w < 2 || h < 2) {
          return null;
        }

        return { href, x, y, w, h };
      })
      .filter(Boolean);
  }

  async function renderSlideToImage(slide, state, options) {
    if (!window.html2canvas) {
      throw new Error("html2canvas indisponible");
    }

    const opts = options || {};
    const mounted = mountSlideExportNode(slide, state, opts);
    const host = mounted.host;
    const slideNode = mounted.slideNode;

    await waitForRenderAssets(host);

    const canvas = await window.html2canvas(slideNode, {
      backgroundColor: opts.backgroundColor || null,
      useCORS: true,
      allowTaint: true,
      scale: Number.isFinite(opts.scale) ? opts.scale : 2,
      logging: false,
    });

    const mimeType = opts.mimeType === "image/jpeg" ? "image/jpeg" : "image/png";
    const quality = mimeType === "image/jpeg"
      ? Math.max(0.4, Math.min(0.95, Number(opts.quality) || 0.82))
      : undefined;
    unmountSlideExportNode(host);
    return canvas.toDataURL(mimeType, quality);
  }

  async function exportPptx(state) {
    if (!window.PptxGenJS) {
      window.alert("La librairie PPTX n'est pas chargÃ©e. VÃ©rifie la connexion internet puis rÃ©essaie.");
      return;
    }

    if (!window.html2canvas) {
      window.alert("La librairie de rendu n'est pas chargÃ©e. VÃ©rifie la connexion internet puis rÃ©essaie.");
      return;
    }

    const pptx = new window.PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Studio Ingenierie Formation";
    pptx.company = "Studio Ingenierie Formation";
    pptx.subject = state.settings.subtitle || state.settings.title || "Presentation";
    pptx.title = state.settings.title || "Presentation";
    pptx.lang = "fr-FR";
    const deckFont = getDeckFontOption(state.settings);
    pptx.theme = {
      headFontFace: deckFont.pptHeading || deckFont.pptBody || "Aptos",
      bodyFontFace: deckFont.pptBody || "Aptos",
      lang: "fr-FR",
    };

    const logoSources = await resolveLogoSources();
    const availableMediaItems = getAvailableMediaItems(state.mediaLibrary || []);
    const mediaAssets = await ns.services.media.resolvePdfMediaAssets(availableMediaItems);
    const mediaPreviewMap = mediaAssets.previewMap;
    const mediaLinkMap = mediaAssets.linkMap;
    const slideImageMap = {};

    for (const slide of state.slides) {
      slideImageMap[slide.id] = await renderSlideToImage(slide, state, {
        logoSources,
        mediaUrls: mediaPreviewMap,
        mediaLinks: mediaLinkMap,
      });
    }

    state.slides.forEach((slide) => {
      const pptSlide = pptx.addSlide();
      pptSlide.background = { color: "EEF5FD" };
      pptSlide.addImage({
        data: slideImageMap[slide.id],
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
      });

      const mediaItem = getMediaItemById(state.mediaLibrary, slide.mediaId);
      const linkHref = buildVideoLink(mediaItem, mediaLinkMap);
      if (mediaItem && (mediaItem.kind === "video" || mediaItem.kind === "embed") && linkHref) {
        pptSlide.addText(linkHref, {
          x: 9.02,
          y: 4.92,
          w: 3.78,
          h: 0.32,
          fontFace: deckFont.pptBody || "Aptos",
          fontSize: 8,
          color: "17478B",
          underline: { color: "17478B" },
          hyperlink: { url: linkHref },
          fit: "shrink",
          margin: 0,
        });
      }
    });

    const fileName = `${ns.utils.slugify(state.settings.title || "presentation")}.pptx`;
    await pptx.writeFile({ fileName });
  }

  ns.services.exporter = {
    exportJson,
    exportTxt,
    exportPdf,
    runPdfExportJob,
    exportPptx,
    exportHtml,
    buildPresentationHtml,
    renderPresentationDocument,
    setPdfProgressListener,
  };
})();
