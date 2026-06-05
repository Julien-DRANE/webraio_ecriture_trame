(function () {
  const ns = (window.StudioSlides = window.StudioSlides || {});
  ns.services = ns.services || {};
  const SLIDE_CLIPBOARD_KEY = "studio-ingenierie-slide-clipboard-v1";

  const themeOptions = ["random", "mix", "circles", "waves", "clean"];
  const viewOptions = ["engineering", "presentation"];
  const paletteOptions = ((ns.data && ns.data.colorPalettes) || []).map((item) => item.id);
  const decorativeAccentOptions = ((ns.data && ns.data.decorativeAccents) || []).map((item) => item.id);
  const fontOptions = ((ns.data && ns.data.fontOptions) || []).map((item) => item.id);
  const transitionOptions = ["fade", "slide", "zoom", "rise", "none"];

  function normalizeContentFontScale(value, fallback) {
    const parsed = Number(value);
    const fallbackValue = Number.isFinite(Number(fallback)) ? Number(fallback) : 100;
    if (!Number.isFinite(parsed)) {
      return fallbackValue;
    }
    const stepped = Math.round(parsed / 5) * 5;
    return Math.max(85, Math.min(140, stepped));
  }

  function normalizeHexColor(value, fallback) {
    return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value.toLowerCase() : (fallback || "#60b2e5");
  }

  function clampCanvasMetric(value, fallback, min, max) {
    const parsed = Number(value);
    const safeValue = Number.isFinite(parsed) ? parsed : fallback;
    const lowerBound = Number.isFinite(min) ? min : 0;
    const upperBound = Number.isFinite(max) ? max : 100;
    const clamped = Math.max(lowerBound, Math.min(upperBound, safeValue));
    return Math.round(clamped * 10) / 10;
  }

  function normalizeCanvasRotation(value, fallback) {
    const parsed = Number(value);
    const safeValue = Number.isFinite(parsed) ? parsed : (Number.isFinite(Number(fallback)) ? Number(fallback) : 0);
    return Math.round(Math.max(-360, Math.min(360, safeValue)));
  }

  function normalizeCanvasArrowLength(value, fallback) {
    const parsed = Number(value);
    const safeValue = Number.isFinite(parsed) ? parsed : (Number.isFinite(Number(fallback)) ? Number(fallback) : 100);
    return Math.round(Math.max(40, Math.min(800, safeValue)));
  }

  function normalizeCanvasShapeKind(value) {
    return value === "square" || value === "bubble" ? value : "circle";
  }

  function safeRead(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      return;
    }
  }

  function sanitizeState(input) {
    const utils = ns.utils;
    const bloomLevels = (ns.data && ns.data.bloomLevels) || [];
    const principles = (ns.data && ns.data.cognitivePrinciples) || [];
    const allowedBloomIds = bloomLevels.map((item) => item.id);
    const allowedPrincipleIds = principles.map((item) => item.id);

    const slides = Array.isArray(input.slides)
      ? input.slides.map((slide, index) => sanitizeSlide(slide, index, allowedBloomIds, allowedPrincipleIds)).filter(Boolean)
      : [];

    const fallbackState = ns.stateFactory.createDefaultState();

    if (slides.length === 0) {
      return fallbackState;
    }

    const selectedSlideId = slides.some((slide) => slide.id === input.selectedSlideId)
      ? input.selectedSlideId
      : slides[0].id;
    const hasFooterValue = Boolean(input.settings) && typeof input.settings.footer === "string";

    return {
      view: viewOptions.includes(input.view) ? input.view : fallbackState.view,
      uiNightMode: Boolean(input.uiNightMode),
      uiGlobalPanelCollapsed: Boolean(input.uiGlobalPanelCollapsed),
      uiMediaPanelCollapsed: Boolean(input.uiMediaPanelCollapsed),
      uiThumbStripCollapsed: Boolean(input.uiThumbStripCollapsed),
      settings: {
        title: utils.clampText(input.settings && input.settings.title, 60) || fallbackState.settings.title,
        subtitle: utils.clampText(input.settings && input.settings.subtitle, 90) || fallbackState.settings.subtitle,
        footer: hasFooterValue ? utils.clampText(input.settings.footer, 50) : fallbackState.settings.footer,
        theme: themeOptions.includes(input.settings && input.settings.theme) ? input.settings.theme : fallbackState.settings.theme,
        palette: paletteOptions.includes(input.settings && input.settings.palette) ? input.settings.palette : fallbackState.settings.palette,
        font: fontOptions.includes(input.settings && input.settings.font) ? input.settings.font : fallbackState.settings.font,
        contentFontScale: normalizeContentFontScale(
          input.settings && input.settings.contentFontScale,
          fallbackState.settings.contentFontScale
        ),
        transition: transitionOptions.includes(input.settings && input.settings.transition) ? input.settings.transition : fallbackState.settings.transition,
        frameShadow: Boolean(input.settings && input.settings.frameShadow),
      },
      mediaLibrary: Array.isArray(input.mediaLibrary)
        ? input.mediaLibrary.map((item) => ns.services.media.sanitizeMediaItem(item)).filter(Boolean)
        : [],
      selectedSlideId,
      slides,
    };
  }

  function sanitizeSlide(slide, index, allowedBloomIds, allowedPrincipleIds) {
    if (!slide || typeof slide !== "object") {
      return null;
    }

    const utils = ns.utils;
    const bullets = Array.isArray(slide.bullets) ? slide.bullets.slice(0, 12) : [];
    while (bullets.length < 3) {
      bullets.push("");
    }
    const table = sanitizeTable(slide.table);
    const tableHighlights = sanitizeTableHighlights(slide.tableHighlights, table);
    const freeLinks = sanitizeFreeLinks(slide.freeLinks);
    const freeMediaIds = sanitizeFreeMediaIds(slide.freeMediaIds);
    const visualData = sanitizeVisualData(slide.visualData);
    const canvasData = sanitizeCanvasData(slide.canvasData);
    const subBullets = sanitizeSubBullets(slide.subBullets);

    const principleIds = utils.uniqueStrings(slide.principleIds || []).filter((id) => allowedPrincipleIds.includes(id));

    return {
      id: typeof slide.id === "string" && slide.id ? slide.id : utils.createId("slide"),
      label: utils.clampText(slide.label, 24) || `Slide ${index + 1}`,
      number: utils.clampText(slide.number, 8) || String(index + 1).padStart(2, "0"),
      contentType: slide.contentType === "table"
        ? "table"
        : slide.contentType === "free"
          ? "free"
          : slide.contentType === "visual"
            ? "visual"
            : slide.contentType === "canvas"
              ? "canvas"
              : "bullets",
      bulletsNumbered: Boolean(slide.bulletsNumbered),
      bulletsProgressive: Boolean(slide.bulletsProgressive),
      bulletsSubProgressive: Boolean(slide.bulletsSubProgressive),
      tableProgressive: Boolean(slide.tableProgressive),
      tableProgressiveOrder: slide.tableProgressiveOrder === "column" ? "column" : "row",
      paletteOverride: paletteOptions.includes(slide.paletteOverride) ? slide.paletteOverride : "",
      decorativeAccentOverride: decorativeAccentOptions.includes(slide.decorativeAccentOverride) ? slide.decorativeAccentOverride : "clay",
      decorativeAccentSolid: slide.decorativeAccentSolid === undefined ? true : Boolean(slide.decorativeAccentSolid),
      tableHighlights,
      table,
      freeBody: utils.sanitizeRichText(slide.freeBody, 3200),
      freeLinks,
      freeMediaIds,
      visualData,
      canvasData,
      subBullets,
      mediaId: utils.clampText(slide.mediaId, 80),
      secondaryMediaId: utils.clampText(slide.secondaryMediaId, 80),
      bloomLevel: allowedBloomIds.includes(slide.bloomLevel) ? slide.bloomLevel : allowedBloomIds[0],
      objective: utils.clampText(slide.objective, 180),
      evidence: utils.clampText(slide.evidence, 120),
      principleIds,
      title: utils.clampText(slide.title, 72),
      subtitle: utils.clampText(slide.subtitle, 170),
      bullets: bullets.map((item) => utils.clampText(item, 220)),
      note: utils.clampText(slide.note, 180),
      presenterNotes: utils.clampText(slide.presenterNotes, 2000),
    };
  }

  function sanitizeTable(input) {
    const utils = ns.utils;
    const rows = Array.isArray(input) ? input.slice(0, 8) : [];
    const sanitizedRows = rows
      .map((row) => Array.isArray(row) ? row.slice(0, 6).map((cell) => utils.clampText(cell, 120)) : null)
      .filter(Boolean);

    const rowCount = Math.max(2, sanitizedRows.length);
    const colCount = Math.max(2, sanitizedRows.reduce((max, row) => Math.max(max, row.length), 0));
    while (sanitizedRows.length < rowCount) {
      sanitizedRows.push([]);
    }
    sanitizedRows.forEach((row) => {
      while (row.length < colCount) {
        row.push("");
      }
    });
    return sanitizedRows;
  }

  function sanitizeVisualData(input) {
    const utils = ns.utils;
    const fallback = ns.stateFactory.createDefaultVisualData();
    const raw = input && typeof input === "object" ? input : {};
    const chartBarsInput = Array.isArray(raw.chartBars) ? raw.chartBars.slice(0, 6) : [];
    const chartBars = chartBarsInput.map((item, index) => {
      const fallbackBar = fallback.chartBars[index] || fallback.chartBars[0];
      const value = Number(item && item.value);
      return {
        label: utils.clampText(item && item.label, 18) || fallbackBar.label,
        value: Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : fallbackBar.value,
        color: normalizeHexColor(item && item.color, fallbackBar.color),
      };
    });

    while (chartBars.length < 6) {
      chartBars.push(utils.clone(fallback.chartBars[chartBars.length]));
    }

    return {
      primaryMediaId: utils.clampText(raw.primaryMediaId, 80),
      secondaryMediaId: utils.clampText(raw.secondaryMediaId, 80),
      showImages: raw.showImages !== false,
      primaryMediaReveal: Boolean(raw.primaryMediaReveal),
      secondaryMediaReveal: Boolean(raw.secondaryMediaReveal),
      showBody: raw.showBody !== false,
      showCallout: raw.showCallout !== false,
      body: typeof raw.body === "string" ? utils.clampText(raw.body, 320) : fallback.body,
      callout: typeof raw.callout === "string" ? utils.clampText(raw.callout, 180) : fallback.callout,
      arrowDirection: raw.arrowDirection === "up" || raw.arrowDirection === "down" || raw.arrowDirection === "left" ? raw.arrowDirection : "right",
      arrowColor: normalizeHexColor(raw.arrowColor, fallback.arrowColor),
      showChart: raw.showChart !== false,
      chartReveal: Boolean(raw.chartReveal),
      chartBarCount: Math.max(1, Math.min(6, Number(raw.chartBarCount) || fallback.chartBarCount || 3)),
      chartTitle: typeof raw.chartTitle === "string" ? utils.clampText(raw.chartTitle, 48) : fallback.chartTitle,
      chartBars,
    };
  }

  function sanitizeCanvasData(input) {
    const fallback = ns.stateFactory.createDefaultCanvasData
      ? ns.stateFactory.createDefaultCanvasData()
      : { elements: [] };
    const raw = input && typeof input === "object" ? input : {};
    const elements = Array.isArray(raw.elements)
      ? raw.elements.slice(0, 24).map((item, index) => sanitizeCanvasElement(item, index)).filter(Boolean)
      : [];

    return {
      progressive: Boolean(raw.progressive),
      elements: elements.length ? elements : fallback.elements.slice(),
    };
  }

  function normalizeCanvasRevealGroup(value) {
    const normalized = String(value || '').trim().toUpperCase();
    return /^[A-Z]$/.test(normalized) ? normalized : '';
  }

  function sanitizeCanvasElement(input, index) {
    if (!input || typeof input !== "object") {
      return null;
    }

    const utils = ns.utils;
    const type = input.type === "image" || input.type === "arrow" || input.type === "shape" ? input.type : "text";
    const base = {
      id: typeof input.id === "string" && input.id ? input.id : utils.createId("canvas"),
      type,
      x: clampCanvasMetric(input.x, 10 + ((index % 3) * 8), 0, 94),
      y: clampCanvasMetric(input.y, 10 + ((index % 4) * 6), -14, 94),
      w: clampCanvasMetric(input.w, type === "arrow" ? 18 : type === "image" ? 26 : type === "shape" ? 22 : 32, 6, 100),
      h: clampCanvasMetric(input.h, type === "arrow" ? 10 : type === "image" ? 28 : type === "shape" ? 22 : 18, 6, 100),
      revealOrder: Math.max(1, Math.min(24, Math.round(Number(input.revealOrder) || (index + 1)))),
      revealGroup: normalizeCanvasRevealGroup(input.revealGroup),
      locked: Boolean(input.locked),
    };

    base.w = Math.min(base.w, Math.max(6, 100 - base.x));
    base.h = Math.min(base.h, Math.max(6, 100 - Math.max(0, base.y)));

    if (type === "image") {
      return Object.assign(base, {
        mediaId: utils.clampText(input.mediaId, 80),
      });
    }

    if (type === "arrow") {
      return Object.assign(base, {
        direction: input.direction === "up" || input.direction === "down" || input.direction === "left" ? input.direction : "right",
        color: normalizeHexColor(input.color, "#0a66ff"),
        rotation: normalizeCanvasRotation(input.rotation, 0),
        arrowLength: normalizeCanvasArrowLength(input.arrowLength, 100),
      });
    }

    if (type === "shape") {
      return Object.assign(base, {
        shapeKind: normalizeCanvasShapeKind(input.shapeKind),
        color: normalizeHexColor(input.color, "#0a66ff"),
      });
    }

    return Object.assign(base, {
      text: typeof input.text === "string" ? utils.sanitizeRichText(input.text, 2000) : utils.plainTextToRichHtml("Zone de texte", 2000),
      fontSize: clampCanvasMetric(input.fontSize, 28, 16, 72),
      fontOptionId: fontOptions.includes(input.fontOptionId) ? input.fontOptionId : "",
      color: normalizeHexColor(input.color, "#1d1917"),
      showFrame: input.showFrame !== false,
      bold: Boolean(input.bold),
      italic: Boolean(input.italic),
      underline: Boolean(input.underline),
    });
  }

  function sanitizeTableHighlights(input, table) {
    const rowCount = Array.isArray(table) ? table.length : 0;
    const colCount = Array.isArray(table) && table[0] ? table[0].length : 0;
    const sanitizeMap = (mapInput, maxIndex) => {
      const result = {};
      if (!mapInput || typeof mapInput !== "object") {
        return result;
      }
      Object.keys(mapInput).forEach((key) => {
        const index = Number(key);
        const value = typeof mapInput[key] === "string" ? mapInput[key].trim() : "";
        if (!Number.isInteger(index) || index < 0 || index >= maxIndex) {
          return;
        }
        if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
          return;
        }
        result[String(index)] = value.toLowerCase();
      });
      return result;
    };

    const sanitizeCellMap = (mapInput, maxRow, maxCol) => {
      const result = {};
      if (!mapInput || typeof mapInput !== "object") {
        return result;
      }
      Object.keys(mapInput).forEach((key) => {
        const match = String(key).match(/^(\d+)-(\d+)$/);
        const value = typeof mapInput[key] === "string" ? mapInput[key].trim() : "";
        if (!match) {
          return;
        }
        const rowIndex = Number(match[1]);
        const columnIndex = Number(match[2]);
        if (!Number.isInteger(rowIndex) || !Number.isInteger(columnIndex) || rowIndex < 0 || columnIndex < 0 || rowIndex >= maxRow || columnIndex >= maxCol) {
          return;
        }
        if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
          return;
        }
        result[`${rowIndex}-${columnIndex}`] = value.toLowerCase();
      });
      return result;
    };

    return {
      rows: sanitizeMap(input && input.rows, rowCount),
      columns: sanitizeMap(input && input.columns, colCount),
      cells: sanitizeCellMap(input && input.cells, rowCount, colCount),
    };
  }

  function sanitizeSubBullets(input) {
    const utils = ns.utils;
    const result = {};
    if (!input || typeof input !== "object") {
      return result;
    }

    Object.keys(input).forEach((key) => {
      const index = Number(key);
      if (!Number.isInteger(index) || index < 0 || index > 11) {
        return;
      }
      const items = Array.isArray(input[key]) ? input[key].slice(0, 6) : [];
      const sanitized = items.map((item) => utils.clampText(item, 320)).filter(Boolean);
      if (sanitized.length) {
        result[String(index)] = sanitized;
      }
    });

    return result;
  }

  function sanitizeFreeLinks(input) {
    const utils = ns.utils;
    if (!Array.isArray(input)) {
      return [];
    }

    return input
      .slice(0, 12)
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const label = utils.clampText(item.label, 80);
        const url = utils.clampText(item.url, 500);
        if (!url) {
          return null;
        }
        return { label, url };
      })
      .filter(Boolean);
  }

  function sanitizeFreeMediaIds(input) {
    const utils = ns.utils;
    if (!Array.isArray(input)) {
      return [];
    }
    return utils.uniqueStrings(input.map((id) => utils.clampText(id, 80)).filter(Boolean)).slice(0, 12);
  }

  function loadState(key) {
    const raw = safeRead(key);
    if (!raw) {
      return ns.stateFactory.createDefaultState();
    }

    try {
      return sanitizeState(JSON.parse(raw));
    } catch (error) {
      return ns.stateFactory.createDefaultState();
    }
  }

  function saveState(key, value) {
    safeWrite(key, JSON.stringify(value));
  }

  function sanitizeSlideClipboard(input) {
    if (!input || typeof input !== "object") {
      return null;
    }

    const bloomLevels = (ns.data && ns.data.bloomLevels) || [];
    const principles = (ns.data && ns.data.cognitivePrinciples) || [];
    const allowedBloomIds = bloomLevels.map((item) => item.id);
    const allowedPrincipleIds = principles.map((item) => item.id);
    const slide = sanitizeSlide(input.slide, 0, allowedBloomIds, allowedPrincipleIds);

    if (!slide) {
      return null;
    }

    const mediaItems = Array.isArray(input.mediaItems)
      ? input.mediaItems.map((item) => ns.services.media.sanitizeMediaItem(item)).filter(Boolean)
      : [];

    return {
      copiedAt: typeof input.copiedAt === "string" ? input.copiedAt : "",
      slide,
      mediaItems,
    };
  }

  function loadSlideClipboard() {
    const raw = safeRead(SLIDE_CLIPBOARD_KEY);
    if (!raw) {
      return null;
    }

    try {
      return sanitizeSlideClipboard(JSON.parse(raw));
    } catch (error) {
      return null;
    }
  }

  function saveSlideClipboard(value) {
    const sanitized = sanitizeSlideClipboard(value);
    if (!sanitized) {
      return;
    }
    safeWrite(SLIDE_CLIPBOARD_KEY, JSON.stringify(sanitized));
  }

  ns.services.storage = {
    loadState,
    saveState,
    sanitizeState,
    loadSlideClipboard,
    saveSlideClipboard,
    sanitizeSlideClipboard,
    slideClipboardKey: SLIDE_CLIPBOARD_KEY,
  };
})();
