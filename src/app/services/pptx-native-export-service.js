(function () {
  const ns = (window.StudioSlides = window.StudioSlides || {});
  ns.services = ns.services || {};

  const SLIDE_W = 13.333;
  const SLIDE_H = 7.5;
  let pptxProgressListener = null;
  const backgroundImageCache = new Map();

  function setPptxProgressListener(listener) {
    pptxProgressListener = typeof listener === "function" ? listener : null;
  }

  function notifyPptxProgress(detail) {
    if (!pptxProgressListener) {
      return;
    }
    try {
      pptxProgressListener(Object.assign({
        state: "idle",
        percent: 0,
        label: "Exporter PPTX",
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

  function isDataUrl(value) {
    return /^data:/i.test(String(value || "").trim());
  }

  function getImageDimensions(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        resolve({
          width: image.naturalWidth || image.width || 1,
          height: image.naturalHeight || image.height || 1,
        });
      };
      image.onerror = () => resolve({ width: 1, height: 1 });
      image.src = src;
    });
  }

  function getContainRect(box, dimensions) {
    const safeWidth = Math.max(0.01, Number(box.w) || 0.01);
    const safeHeight = Math.max(0.01, Number(box.h) || 0.01);
    const imageWidth = Math.max(1, Number(dimensions && dimensions.width) || 1);
    const imageHeight = Math.max(1, Number(dimensions && dimensions.height) || 1);
    const boxRatio = safeWidth / safeHeight;
    const imageRatio = imageWidth / imageHeight;

    if (imageRatio > boxRatio) {
      const width = safeWidth;
      const height = width / imageRatio;
      return {
        x: box.x,
        y: box.y + ((safeHeight - height) / 2),
        w: width,
        h: height,
      };
    }

    const height = safeHeight;
    const width = height * imageRatio;
    return {
      x: box.x + ((safeWidth - width) / 2),
      y: box.y,
      w: width,
      h: height,
    };
  }

  async function addContainedImage(pptSlide, source, box, hyperlink) {
    if (!source) {
      return null;
    }
    const normalizedSource = String(source || "").trim();
    if (!normalizedSource) {
      return null;
    }
    const imageRect = getContainRect(box, await getImageDimensions(normalizedSource));
    const imageOptions = {
      x: imageRect.x,
      y: imageRect.y,
      w: imageRect.w,
      h: imageRect.h,
    };
    if (isDataUrl(normalizedSource)) {
      imageOptions.data = normalizedSource;
    } else {
      imageOptions.path = normalizedSource;
    }
    if (hyperlink) {
      imageOptions.hyperlink = { url: hyperlink };
    }
    try {
      pptSlide.addImage(imageOptions);
    } catch (error) {
      return null;
    }
    return imageRect;
  }

  function stripHex(value, fallback) {
    const hex = String(value || "").trim();
    const clean = /^#?[0-9a-fA-F]{6}$/.test(hex) ? hex.replace("#", "") : (fallback || "2C73DA");
    return clean.toUpperCase();
  }

  function hexToRgb(hex) {
    const value = stripHex(hex, "000000");
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  }

  function rgbToHex(r, g, b) {
    return [r, g, b]
      .map((item) => Math.max(0, Math.min(255, Math.round(item))).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  function lightenHex(hex, amount) {
    const rgb = hexToRgb(hex);
    return rgbToHex(
      rgb.r + (255 - rgb.r) * amount,
      rgb.g + (255 - rgb.g) * amount,
      rgb.b + (255 - rgb.b) * amount
    );
  }

  function withAlphaFill(hex, transparency) {
    return {
      color: stripHex(hex),
      transparency: Math.max(0, Math.min(100, Math.round(transparency || 0))),
    };
  }

  function fetchAsDataUrl(src) {
    return fetch(src)
      .then((response) => {
        if (!response.ok) {
          throw new Error("fetch failed");
        }
        return response.blob();
      })
      .then((blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      }))
      .catch(() => src);
  }

  async function resolveLogoSources() {
    const defaults = ns.ui.getSlideLogoSources();
    const [region, drane] = await Promise.all([
      fetchAsDataUrl(defaults.region),
      fetchAsDataUrl(defaults.drane),
    ]);
    return { region, drane };
  }

  function getDeckFontOption(settings) {
    const fonts = (ns.data && ns.data.fontOptions) || [];
    return fonts.find((item) => item.id === (settings && settings.font)) || fonts[0] || {
      pptBody: "Aptos",
      pptHeading: "Georgia",
    };
  }

  function getContentFontScale(settings) {
    const parsed = Number(settings && settings.contentFontScale);
    if (!Number.isFinite(parsed)) {
      return 1;
    }
    return Math.max(0.85, Math.min(1.4, (Math.round(parsed / 5) * 5) / 100));
  }

  function scaleContentFont(settings, size) {
    return Math.max(7, Number(size) * getContentFontScale(settings));
  }

  function getPalette(settings, slide) {
    const palettes = (ns.data && ns.data.colorPalettes) || [];
    const paletteId = (slide && slide.paletteOverride) || (settings && settings.palette);
    return palettes.find((item) => item.id === paletteId) || palettes[0] || {
      bgStart: "#FFFFFF",
      bgEnd: "#EEF5FD",
      accent: "#2C73DA",
      accentStrong: "#17478B",
      accentSoft: "rgba(44, 115, 218, 0.22)",
      surface: "rgba(255,255,255,0.72)",
      text: "#122033",
      textMuted: "#5D6C81",
      line: "rgba(18,32,51,0.12)",
    };
  }

  function getDecorativeAccent(slide) {
    const accents = (ns.data && ns.data.decorativeAccents) || [];
    return accents.find((item) => item.id === (slide && slide.decorativeAccentOverride)) || null;
  }

  function resolveThemeName(slide, settings) {
    const theme = (settings && settings.theme) || "mix";
    if (theme !== "random") {
      return theme;
    }

    const variants = ["circles", "waves", "mix"];
    const seedSource = String((slide && (slide.id || slide.number || slide.title)) || "slide");
    let hash = 0;
    for (let index = 0; index < seedSource.length; index += 1) {
      hash = ((hash * 31) + seedSource.charCodeAt(index)) >>> 0;
    }
    return variants[hash % variants.length];
  }

  function intensifyAccentColor(value) {
    const match = String(value || "").match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9.]+))?\s*\)$/i);
    if (!match) {
      return value;
    }
    const alpha = match[4] === undefined ? 1 : Number(match[4]);
    const nextAlpha = Math.min(0.92, Math.max(0.34, (Number.isFinite(alpha) ? alpha : 1) * 1.75));
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${nextAlpha.toFixed(2)})`;
  }

  function getDecorativeStyleSet(slide, palette, decorativeAccent) {
    const source = decorativeAccent || palette;
    if (!slide || !slide.decorativeAccentSolid) {
      return source;
    }
    return {
      accentSoft: intensifyAccentColor(source.accentSoft),
      accentSofter: intensifyAccentColor(source.accentSofter),
      accentWave: intensifyAccentColor(source.accentWave),
      accentWaveSoft: intensifyAccentColor(source.accentWaveSoft),
      accentDeepSoft: intensifyAccentColor(source.accentDeepSoft),
    };
  }

  function createSlidePaletteStyle(slide, settings) {
    const palette = getPalette(settings, slide);
    const decorativeAccent = getDecorativeAccent(slide);
    const accentStyleSet = decorativeAccent || palette;
    const decorativeStyleSet = getDecorativeStyleSet(slide, palette, decorativeAccent);
    return [
      `--slide-bg-start:${palette.bgStart}`,
      `--slide-bg-end:${palette.bgEnd}`,
      `--slide-accent:${palette.accent}`,
      `--slide-accent-strong:${palette.accentStrong}`,
      `--slide-accent-soft:${accentStyleSet.accentSoft}`,
      `--slide-accent-softer:${accentStyleSet.accentSofter}`,
      `--slide-accent-wave:${accentStyleSet.accentWave}`,
      `--slide-accent-wave-soft:${accentStyleSet.accentWaveSoft}`,
      `--slide-accent-deep-soft:${accentStyleSet.accentDeepSoft}`,
      `--slide-decor-soft:${decorativeStyleSet.accentSoft}`,
      `--slide-decor-softer:${decorativeStyleSet.accentSofter}`,
      `--slide-decor-wave:${decorativeStyleSet.accentWave}`,
      `--slide-decor-wave-soft:${decorativeStyleSet.accentWaveSoft}`,
      `--slide-decor-deep-soft:${decorativeStyleSet.accentDeepSoft}`,
      `--slide-surface:${palette.surface}`,
      `--slide-surface-strong:${palette.surfaceStrong}`,
      `--slide-text:${palette.text}`,
      `--slide-text-muted:${palette.textMuted}`,
      `--slide-text-soft:${palette.textSoft}`,
      `--slide-line:${palette.line}`,
      "--slide-frame-shadow:none",
    ].join(";");
  }

  function getPptThemeColors(settings, slide) {
    const palette = getPalette(settings, slide);
    const accent = getDecorativeAccent(slide);
    return {
      bg: stripHex(palette.bgEnd || palette.bgStart || "#EEF5FD"),
      bgSoft: stripHex(lightenHex(palette.bgEnd || palette.bgStart || "#EEF5FD", 0.14)),
      accent: stripHex(palette.accent),
      accentStrong: stripHex(palette.accentStrong || palette.accent),
      decor: stripHex(accent && accent.accentWave ? rgbaStringToHex(accent.accentWave, palette.accent) : palette.accent),
      surface: stripHex(rgbaStringToHex(palette.surface, "#FFFFFF")),
      text: stripHex(palette.text),
      textMuted: stripHex(palette.textMuted || palette.text),
      line: stripHex(rgbaStringToHex(palette.line, "#D8E2EF")),
    };
  }

  function rgbaStringToHex(value, fallback) {
    const source = String(value || "").trim();
    if (/^#[0-9a-fA-F]{6}$/.test(source)) {
      return source;
    }
    const rgbaMatch = source.match(/rgba?\(([^)]+)\)/i);
    if (!rgbaMatch) {
      return fallback || "#FFFFFF";
    }
    const parts = rgbaMatch[1].split(",").map((item) => Number(item.trim()));
    if (parts.length < 3) {
      return fallback || "#FFFFFF";
    }
    return `#${rgbToHex(parts[0], parts[1], parts[2])}`;
  }

  function getMediaItemById(items, id) {
    return (items || []).find((item) => item.id === id) || null;
  }

  function buildVideoLink(mediaItem, mediaLinks) {
    if (!mediaItem) {
      return "";
    }
    return mediaLinks[mediaItem.id] || mediaItem.externalUrl || mediaItem.embedUrl || "";
  }

  function getResolvedSlideMedia(slide, state, assets) {
    const ids = [slide.mediaId, slide.secondaryMediaId].filter(Boolean);
    const mediaItems = getAvailableMediaItems(state.mediaLibrary || []);
    return ids
      .map((id) => {
        const item = getMediaItemById(mediaItems, id);
        if (!item || item.kind !== "image") {
          return null;
        }
        return {
          id,
          kind: item.kind,
          name: item.name || "Media",
          data: (assets.previewMap && assets.previewMap[id]) || item.thumbnailUrl || item.externalUrl || "",
          link: buildVideoLink(item, assets.linkMap || {}),
        };
      })
      .filter(Boolean);
  }

  function getResolvedFreeMedia(slide, state, assets) {
    const ids = Array.isArray(slide && slide.freeMediaIds) ? slide.freeMediaIds.slice(0, 12) : [];
    const mediaItems = getAvailableMediaItems(state.mediaLibrary || []);
    return ids
      .map((id) => {
        const item = getMediaItemById(mediaItems, id);
        if (!item || item.kind !== "image") {
          return null;
        }
        return {
          id,
          kind: item.kind,
          name: item.name || "Media",
          data: (assets.previewMap && assets.previewMap[id]) || item.thumbnailUrl || item.externalUrl || "",
          link: item.externalUrl || "",
        };
      })
      .filter(Boolean);
  }

  function buildBulletItems(slide) {
    const bullets = Array.isArray(slide && slide.bullets)
      ? slide.bullets.filter((item) => item && item.trim())
      : [];
    const subBullets = slide && slide.subBullets && typeof slide.subBullets === "object"
      ? slide.subBullets
      : {};
    return bullets.map((text, index) => ({
      text,
      children: Array.isArray(subBullets[index]) ? subBullets[index].filter((item) => item && item.trim()) : [],
    }));
  }

  function splitBulletItems(items) {
    if (!Array.isArray(items) || !items.length) {
      return [items || []];
    }

    const estimateSingleColumnHeight = (columnItems) => columnItems.reduce((sum, item) => {
      const bulletItem = item && typeof item === "object" ? item : { text: String(item || ""), children: [] };
      const mainTextLength = String(bulletItem.text || "").replace(/\s+/g, " ").trim().length;
      const mainLines = Math.max(1, Math.ceil(mainTextLength / 52));
      const childrenHeight = (Array.isArray(bulletItem.children) ? bulletItem.children : []).reduce((childSum, child) => {
        const childLength = String(child || "").replace(/\s+/g, " ").trim().length;
        const childLines = Math.max(1, Math.ceil(childLength / 62));
        return childSum + (childLines * 0.84);
      }, 0);
      return sum + (mainLines * 1.08) + childrenHeight + 0.22;
    }, 0);

    if (items.length <= 3 && estimateSingleColumnHeight(items) <= 8.9) {
      return [items || []];
    }

    const weights = items.map(getBulletLayoutWeight);
    let bestSplitIndex = -1;
    let bestScore = Number.POSITIVE_INFINITY;
    let runningWeight = 0;

    for (let index = 0; index < items.length - 1; index += 1) {
      runningWeight += weights[index];
      const leftWeight = runningWeight;
      const rightWeight = weights.slice(index + 1).reduce((sum, value) => sum + value, 0);
      const score = Math.max(leftWeight, rightWeight) + (Math.abs(leftWeight - rightWeight) * 0.22);
      if (score < bestScore) {
        bestScore = score;
        bestSplitIndex = index + 1;
      }
    }

    if (bestSplitIndex <= 0) {
      return [items || []];
    }

    return [items.slice(0, bestSplitIndex), items.slice(bestSplitIndex)];
  }

  function getBulletLayoutWeight(item) {
    const bulletItem = item && typeof item === "object" ? item : { text: String(item || ""), children: [] };
    const mainTextLength = String(bulletItem.text || "").trim().length;
    const mainWeight = 1 + Math.min(0.45, mainTextLength / 280);
    const childrenWeight = (Array.isArray(bulletItem.children) ? bulletItem.children : []).reduce((sum, child) => {
      const childLength = String(child || "").trim().length;
      return sum + 0.78 + Math.min(0.3, childLength / 360);
    }, 0);
    return mainWeight + childrenWeight;
  }

  function estimateBulletColumnHeight(items) {
    return (Array.isArray(items) ? items : []).reduce((sum, item) => {
      const bulletItem = item && typeof item === "object" ? item : { text: String(item || ""), children: [] };
      const mainTextLength = String(bulletItem.text || "").replace(/\s+/g, " ").trim().length;
      const mainLines = Math.max(1, Math.ceil(mainTextLength / 52));
      const childrenHeight = (Array.isArray(bulletItem.children) ? bulletItem.children : []).reduce((childSum, child) => {
        const childLength = String(child || "").replace(/\s+/g, " ").trim().length;
        const childLines = Math.max(1, Math.ceil(childLength / 62));
        return childSum + (childLines * 0.84);
      }, 0);
      return sum + (mainLines * 1.08) + childrenHeight + 0.22;
    }, 0);
  }

  function shouldUseSecondBulletSideLayout(slide, items, hasMedia) {
    if (hasMedia || !Array.isArray(items) || items.length !== 2 || Boolean(slide && slide.bulletsNumbered)) {
      return false;
    }

    const secondChildren = Array.isArray(items[1] && items[1].children) ? items[1].children : [];
    if (secondChildren.length < 4) {
      return false;
    }

    const firstWeight = getBulletLayoutWeight(items[0]);
    const secondWeight = getBulletLayoutWeight(items[1]);
    return secondWeight >= firstWeight + 1;
  }

  function flattenLinkedText(value, options) {
    const opts = options || {};
    const linked = ns.utils.extractLinks(value || "");
    const text = linked.text
      .replace(/\s*\n+\s*/g, opts.keepLines ? "\n" : " ")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
    if (!linked.links.length) {
      return text;
    }
    const labels = linked.links.map((url) => ns.utils.formatUrlLabel(url)).join("  ");
    return text ? `${text} ${labels}` : labels;
  }

  function createLinkedRuns(value, baseOptions, linkColor) {
    const source = String(value || "");
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    const runs = [];
    let lastIndex = 0;
    let match;
    while ((match = urlRegex.exec(source)) !== null) {
      const before = source.slice(lastIndex, match.index);
      if (before) {
        runs.push({ text: before, options: Object.assign({}, baseOptions) });
      }
      const url = match[0];
      runs.push({
        text: ns.utils.formatUrlLabel(url),
        options: Object.assign({}, baseOptions, {
          color: stripHex(linkColor || baseOptions.color || "17478B"),
          underline: { color: stripHex(linkColor || baseOptions.color || "17478B") },
          hyperlink: { url },
        }),
      });
      lastIndex = match.index + url.length;
    }
    const tail = source.slice(lastIndex);
    if (tail) {
      runs.push({ text: tail, options: Object.assign({}, baseOptions) });
    }
    return runs.length ? runs : [{ text: "", options: Object.assign({}, baseOptions) }];
  }

  function parseRichTextParagraphs(html) {
    const source = String(html || "").trim();
    if (!source) {
      return [];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${source}</div>`, "text/html");
    const root = doc.body.firstElementChild || doc.body;
    const paragraphs = [];

    function walk(node, style, runs) {
      if (!node) {
        return;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const value = node.textContent || "";
        if (value) {
          runs.push({
            text: value,
            bold: Boolean(style.bold),
            italic: Boolean(style.italic),
            underline: Boolean(style.underline),
            fontScale: style.fontScale || 1,
            color: style.color || "",
          });
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const tag = node.tagName.toLowerCase();
      if (tag === "br") {
        runs.push({ text: "\n", breakLine: true, fontScale: style.fontScale || 1 });
        return;
      }

      const nextStyle = Object.assign({}, style);
      if (tag === "strong" || tag === "b") {
        nextStyle.bold = true;
      }
      if (tag === "em" || tag === "i") {
        nextStyle.italic = true;
      }
      if (tag === "u") {
        nextStyle.underline = true;
      }
      if (tag === "span") {
        const styleAttr = String(node.getAttribute("style") || "");
        const percentSizeMatch = styleAttr.match(/font-size\s*:\s*(90|100|110|120|130|140)%/i);
        if (percentSizeMatch) {
          nextStyle.fontScale = Number(percentSizeMatch[1]) / 100;
        }
        const pxSizeMatch = styleAttr.match(/font-size\s*:\s*(8|10|12|14|1[6-9]|[2-6][0-9]|7[0-2])px/i);
        if (pxSizeMatch) {
          nextStyle.fontScale = Number(pxSizeMatch[1]) / 16;
        }
        const colorMatch = styleAttr.match(/color\s*:\s*(#[0-9a-fA-F]{6})/i);
        if (colorMatch) {
          nextStyle.color = colorMatch[1].toLowerCase();
        }
      }

      Array.from(node.childNodes).forEach((child) => walk(child, nextStyle, runs));
    }

    Array.from(root.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        if (tag === "p" || tag === "div") {
          const runs = [];
          Array.from(node.childNodes).forEach((child) => walk(child, {}, runs));
          if (runs.some((run) => String(run.text || "").trim())) {
            paragraphs.push(runs);
          }
          return;
        }
        if (tag === "ul") {
          Array.from(node.children).forEach((child) => {
            if (!child || child.tagName.toLowerCase() !== "li") {
              return;
            }
            const runs = [{ text: "• ", fontScale: 1 }];
            Array.from(child.childNodes).forEach((grandChild) => walk(grandChild, {}, runs));
            if (runs.some((run) => String(run.text || "").trim())) {
              paragraphs.push(runs);
            }
          });
          return;
        }
      }

      const runs = [];
      walk(node, {}, runs);
      if (runs.some((run) => String(run.text || "").trim())) {
        paragraphs.push(runs);
      }
    });

    return paragraphs;
  }

  function estimateParagraphHeight(paragraphs, baseFontSize) {
    return paragraphs.reduce((sum, paragraph) => {
      const charCount = paragraph.reduce((count, run) => count + String(run.text || "").length, 0);
      const lineEstimate = Math.max(1, Math.ceil(charCount / 78));
      return sum + (lineEstimate * baseFontSize * 0.022) + 0.08;
    }, 0);
  }

  function addRichParagraphs(pptSlide, paragraphs, box, deckFont, palette, settings) {
    if (!paragraphs.length) {
      return box.y;
    }

    const totalChars = paragraphs.reduce((sum, paragraph) => sum + paragraph.reduce((count, run) => count + String(run.text || "").length, 0), 0);
    const baseFontSize = scaleContentFont(settings, totalChars > 900 ? 12.5 : totalChars > 520 ? 14 : 15.5);
    const estimatedHeight = estimateParagraphHeight(paragraphs, baseFontSize);
    const scale = estimatedHeight > box.h ? Math.max(0.78, box.h / estimatedHeight) : 1;
    let cursorY = box.y;

    paragraphs.forEach((paragraph) => {
      const charCount = paragraph.reduce((count, run) => count + String(run.text || "").length, 0);
      const lineEstimate = Math.max(1, Math.ceil(charCount / 78));
      const paraHeight = Math.max(0.26, (lineEstimate * baseFontSize * 0.022 * scale) + 0.04);
      const runs = paragraph.map((run) => ({
        text: String(run.text || "").replace(/\n/g, ""),
        options: {
          bold: Boolean(run.bold),
          italic: Boolean(run.italic),
          underline: Boolean(run.underline),
          breakLine: Boolean(run.breakLine),
          fontSize: Math.max(10, baseFontSize * (run.fontScale || 1) * scale),
          color: stripHex(run.color || palette.text),
          fontFace: deckFont.pptBody || "Aptos",
        },
      })).filter((run) => run.text || run.options.breakLine);

      if (runs.length) {
        pptSlide.addText(runs, {
          x: box.x,
          y: cursorY,
          w: box.w,
          h: paraHeight,
          margin: 0,
          fit: "shrink",
          breakLine: false,
          valign: "mid",
        });
      }
      cursorY += paraHeight + 0.04;
    });

    return cursorY;
  }

  function addLinkedTextBox(pptSlide, value, box, textOptions) {
    const text = String(value || "").replace(/\s*\n+\s*/g, " ").trim();
    if (!text) {
      return;
    }
    pptSlide.addText(createLinkedRuns(text, textOptions, textOptions.color), Object.assign({
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      margin: 0,
      fit: "shrink",
      valign: "mid",
    }, textOptions));
  }

  function addSlideBackground(pptSlide, palette) {
    pptSlide.background = { color: palette.bg };
    pptSlide.addShape(((window.PptxGenJS && window.PptxGenJS.ShapeType) || {}).rect || "rect", {
      x: 0,
      y: 0,
      w: SLIDE_W,
      h: SLIDE_H,
      line: { color: palette.bg, transparency: 100 },
      fill: { color: palette.bg },
    });
  }

  async function renderDecorativeBackgroundToImage(slide, settings) {
    const themeName = resolveThemeName(slide, settings);
    const paletteStyle = createSlidePaletteStyle(slide, settings);
    const cacheKey = `${themeName}::${paletteStyle}`;
    if (backgroundImageCache.has(cacheKey)) {
      return backgroundImageCache.get(cacheKey);
    }

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

    host.innerHTML = `
      <article class="deck-slide theme-${ns.utils.escapeHtml(themeName)}" style="${ns.utils.escapeHtml(paletteStyle)}">
        <div class="slide-wave" aria-hidden="true"></div>
      </article>
    `;

    const slideNode = host.firstElementChild;
    slideNode.style.width = "1280px";
    slideNode.style.height = "720px";
    slideNode.style.aspectRatio = "16 / 9";
    slideNode.style.boxShadow = "none";
    slideNode.style.borderRadius = "0";

    const canvas = await window.html2canvas(slideNode, {
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
      scale: 2,
      logging: false,
    });

    host.remove();
    const dataUrl = canvas.toDataURL("image/png");
    backgroundImageCache.set(cacheKey, dataUrl);
    return dataUrl;
  }

  async function addSlideChrome(pptSlide, slide, state, assets, deckFont, palette) {
    const contentFontScale = getContentFontScale(state.settings);
    addSlideBackground(pptSlide, palette);
    const decorativeBackground = await renderDecorativeBackgroundToImage(slide, state.settings);
    if (decorativeBackground) {
      pptSlide.addImage({
        data: decorativeBackground,
        x: 0,
        y: 0,
        w: SLIDE_W,
        h: SLIDE_H,
      });
    }

    if (assets.logos.region) {
      await addContainedImage(pptSlide, assets.logos.region, { x: 0.58, y: 0.25, w: 1.82, h: 0.52 });
    }
    if (assets.logos.drane) {
      await addContainedImage(pptSlide, assets.logos.drane, { x: 10.95, y: 0.24, w: 1.75, h: 0.52 });
    }

    pptSlide.addShape(((window.PptxGenJS && window.PptxGenJS.ShapeType) || {}).roundRect || "roundRect", {
      x: 11.38,
      y: 0.83,
      w: 1.28,
      h: 0.42,
      rectRadius: 0.12,
      line: { color: palette.line, transparency: 100 },
      fill: { color: palette.surface, transparency: 6 },
    });
    pptSlide.addText(slide.number || "", {
      x: 11.38,
      y: 0.89,
      w: 1.28,
      h: 0.26,
      align: "center",
      margin: 0,
      fontFace: deckFont.pptBody || "Aptos",
      fontSize: 11,
      bold: true,
      color: palette.accentStrong,
    });

    const titleY = 1.05;
    let bodyTop = titleY;

    if (slide.title) {
      pptSlide.addText(slide.title, {
        x: 0.66,
        y: titleY,
        w: 10.45,
        h: 0.62,
        margin: 0,
        fit: "shrink",
        fontFace: deckFont.pptHeading || deckFont.pptBody || "Georgia",
        fontSize: 24,
        bold: true,
        color: palette.text,
      });
      bodyTop += 0.58;
    }

    if (slide.subtitle) {
      pptSlide.addText(slide.subtitle, {
        x: 0.68,
        y: bodyTop,
        w: 10.2,
        h: 0.44,
        margin: 0,
        fit: "shrink",
        fontFace: deckFont.pptBody || "Aptos",
        fontSize: 12 * contentFontScale,
        color: palette.textMuted,
      });
      bodyTop += 0.44;
    }

    return {
      bodyTop: bodyTop + 0.12,
      bodyBottom: 6.45,
      footerY: 6.62,
    };
  }

  function addFooter(pptSlide, slide, state, deckFont, palette) {
    const note = String(slide.note || "").trim();
    const footer = String((state.settings && state.settings.footer) || "").trim();
    const contentFontScale = getContentFontScale(state.settings);

    if (note) {
      addLinkedTextBox(pptSlide, note, { x: 0.7, y: 6.67, w: footer ? 8.95 : 10.9, h: 0.32 }, {
        fontFace: deckFont.pptBody || "Aptos",
        fontSize: 9.5 * contentFontScale,
        color: palette.textMuted,
        margin: 0,
        fit: "shrink",
      });
    }

    if (footer) {
      pptSlide.addText(footer, {
        x: 10.65,
        y: 6.67,
        w: 1.95,
        h: 0.3,
        margin: 0,
        align: "right",
        fontFace: deckFont.pptBody || "Aptos",
        fontSize: 9.5 * contentFontScale,
        color: palette.textMuted,
      });
    }
  }

  async function addMediaFrame(pptSlide, media, box, palette, deckFont) {
    if (!media || !media.data) {
      return;
    }

    pptSlide.addShape(((window.PptxGenJS && window.PptxGenJS.ShapeType) || {}).roundRect || "roundRect", {
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      rectRadius: 0.12,
      line: { color: palette.line, transparency: 28, pt: 1 },
      fill: { color: "FFFFFF", transparency: 2 },
      shadow: {
        type: "outer",
        color: "8FA5C5",
        blur: 1,
        angle: 45,
        distance: 1,
        opacity: 0.12,
      },
    });

    const contentBox = {
      x: box.x + 0.08,
      y: box.y + 0.08,
      w: box.w - 0.16,
      h: box.h - 0.16,
    };
    await addContainedImage(pptSlide, media.data, contentBox, media.link);

    if (media.link && media.kind !== "image") {
      pptSlide.addText(ns.utils.formatUrlLabel(media.link), {
        x: box.x + 0.14,
        y: box.y + box.h - 0.28,
        w: box.w - 0.28,
        h: 0.16,
        margin: 0,
        fit: "shrink",
        fontFace: deckFont.pptBody || "Aptos",
        fontSize: 7,
        color: palette.accentStrong,
        align: "center",
        underline: { color: palette.accentStrong },
        hyperlink: { url: media.link },
      });
    }
  }

  function getBulletFontSize(lineCount, hasMedia) {
    if (lineCount >= 11) {
      return hasMedia ? 12.5 : 14;
    }
    if (lineCount >= 8) {
      return hasMedia ? 14 : 15.5;
    }
    return hasMedia ? 16 : 17.5;
  }

  function getSubBulletFontSize(baseSize) {
    return Math.max(10.5, baseSize - 2.2);
  }

  function countBulletLines(items) {
    return (items || []).reduce((sum, item) => sum + 1 + ((item.children || []).length), 0);
  }

  function addBulletColumn(pptSlide, items, box, slide, deckFont, palette, settings) {
    if (!items.length) {
      return;
    }

    const lineCount = countBulletLines(items);
    const baseSize = scaleContentFont(settings, getBulletFontSize(lineCount, box.hasMedia));
    const subSize = getSubBulletFontSize(baseSize);
    const lineHeight = Math.max(0.24, Math.min(0.42, box.h / Math.max(lineCount + 0.5, 1)));
    let cursorY = box.y;
    let bulletIndex = box.startAt || 1;

    items.forEach((item) => {
      const prefix = slide.bulletsNumbered ? `${String(bulletIndex).padStart(2, "0")}. ` : "• ";
      addLinkedTextBox(pptSlide, `${prefix}${item.text}`, { x: box.x, y: cursorY, w: box.w, h: lineHeight * 1.2 }, {
        fontFace: deckFont.pptBody || "Aptos",
        fontSize: baseSize,
        bold: false,
        color: palette.text,
        margin: 0,
        fit: "shrink",
      });
      cursorY += lineHeight;

      (item.children || []).forEach((child) => {
        addLinkedTextBox(pptSlide, `◦ ${child}`, {
          x: box.x + 0.22,
          y: cursorY,
          w: box.w - 0.22,
          h: lineHeight * 1.08,
        }, {
          fontFace: deckFont.pptBody || "Aptos",
          fontSize: subSize,
          color: palette.textMuted,
          margin: 0,
          fit: "shrink",
        });
        cursorY += lineHeight * 0.9;
      });

      cursorY += lineHeight * 0.18;
      bulletIndex += 1;
    });
  }

  async function addBulletSlide(pptSlide, slide, state, assets, deckFont, palette) {
    const chrome = await addSlideChrome(pptSlide, slide, state, assets, deckFont, palette);
    const mediaItems = getResolvedSlideMedia(slide, state, assets);
    const bulletItems = buildBulletItems(slide);
    const bulletColumns = splitBulletItems(bulletItems);
    const extraBulletItems = bulletColumns[1] || [];
    const totalSubBulletCount = bulletItems.reduce((sum, item) => {
      const bulletItem = item && typeof item === "object" ? item : { text: String(item || ""), children: [] };
      return sum + (Array.isArray(bulletItem.children) ? bulletItem.children.length : 0);
    }, 0);
    const contentHeight = chrome.bodyBottom - chrome.bodyTop;
    const hasMedia = mediaItems.length > 0;
    const useSecondBulletSideLayout = shouldUseSecondBulletSideLayout(slide, bulletItems, hasMedia);
    const totalBulletHeight = estimateBulletColumnHeight(bulletItems);
    const extraBulletColumnHeight = estimateBulletColumnHeight(extraBulletItems);
    const hasDenseBulletContent = bulletItems.length >= 4
      || totalSubBulletCount >= 3
      || totalBulletHeight >= 6.8;
    const canKeepMediaWithExtendedBullets = hasMedia && bulletItems.length > 3 && bulletItems.length <= 6;
    const useRoomyInlineMediaLayout = mediaItems.length === 1
      && !useSecondBulletSideLayout
      && !canKeepMediaWithExtendedBullets
      && bulletColumns.length === 1
      && totalBulletHeight <= 4.9
      && totalSubBulletCount <= 2
      && String(slide.title || "").trim().length <= 92
      && String(slide.subtitle || "").trim().length <= 72;
    const useCompactTopRightMediaLayout = mediaItems.length === 1
      && hasDenseBulletContent
      && !canKeepMediaWithExtendedBullets
      && !useSecondBulletSideLayout
      && totalBulletHeight <= 12.6
      && (!extraBulletItems.length || extraBulletColumnHeight <= 5.1);

    if (!bulletItems.length) {
      pptSlide.addText("Ajoutez un point cle pour structurer la slide.", {
        x: 0.82,
        y: chrome.bodyTop + 0.14,
        w: hasMedia ? 7.45 : 11.1,
        h: 0.42,
        margin: 0,
        fontFace: deckFont.pptBody || "Aptos",
        fontSize: scaleContentFont(state.settings, 16),
        color: palette.textMuted,
      });
    } else if (useSecondBulletSideLayout) {
      addBulletColumn(pptSlide, [bulletItems[0]], {
        x: 0.82,
        y: chrome.bodyTop,
        w: 4.75,
        h: contentHeight,
        startAt: 1,
        hasMedia: false,
      }, slide, deckFont, palette, state.settings);
      addBulletColumn(pptSlide, [bulletItems[1]], {
        x: 5.92,
        y: chrome.bodyTop - 0.02,
        w: 5.55,
        h: contentHeight + 0.02,
        startAt: 2,
        hasMedia: false,
      }, slide, deckFont, palette, state.settings);
    } else if (!hasMedia && bulletColumns.length > 1) {
      const leftCount = bulletColumns[0].length;
      addBulletColumn(pptSlide, bulletColumns[0], {
        x: 0.82,
        y: chrome.bodyTop,
        w: 5.15,
        h: contentHeight,
        startAt: 1,
        hasMedia: false,
      }, slide, deckFont, palette, state.settings);
      addBulletColumn(pptSlide, bulletColumns[1], {
        x: 6.25,
        y: chrome.bodyTop,
        w: 5.15,
        h: contentHeight,
        startAt: leftCount + 1,
        hasMedia: false,
      }, slide, deckFont, palette, state.settings);
    } else if (useCompactTopRightMediaLayout) {
      const floatingColumns = bulletColumns.length > 1 ? bulletColumns : [bulletItems];
      const leftCount = floatingColumns[0].length;
      addBulletColumn(pptSlide, floatingColumns[0], {
        x: 0.82,
        y: chrome.bodyTop,
        w: bulletColumns.length > 1 ? 5.15 : 8.35,
        h: contentHeight,
        startAt: 1,
        hasMedia: false,
      }, slide, deckFont, palette, state.settings);
      if (floatingColumns[1] && floatingColumns[1].length) {
        addBulletColumn(pptSlide, floatingColumns[1], {
          x: 6.25,
          y: chrome.bodyTop,
          w: 5.15,
          h: contentHeight,
          startAt: leftCount + 1,
          hasMedia: false,
        }, slide, deckFont, palette, state.settings);
      }
    } else {
      addBulletColumn(pptSlide, bulletItems, {
        x: 0.82,
        y: chrome.bodyTop,
        w: hasMedia ? (useRoomyInlineMediaLayout ? 6.5 : 7.45) : 11.15,
        h: contentHeight,
        startAt: 1,
        hasMedia,
      }, slide, deckFont, palette, state.settings);
    }

    if (hasMedia) {
      if (mediaItems.length === 1) {
        const balancedTopRightMedia = useCompactTopRightMediaLayout && totalBulletHeight <= 9.8;
        await addMediaFrame(pptSlide, mediaItems[0], {
          x: useCompactTopRightMediaLayout ? (balancedTopRightMedia ? 8.72 : 8.95) : (useRoomyInlineMediaLayout ? 7.72 : 8.65),
          y: useCompactTopRightMediaLayout ? (balancedTopRightMedia ? 2.16 : 1.72) : chrome.bodyTop + 0.04,
          w: useCompactTopRightMediaLayout ? (balancedTopRightMedia ? 3.7 : 3.35) : (useRoomyInlineMediaLayout ? 4.68 : 3.88),
          h: useCompactTopRightMediaLayout
            ? (balancedTopRightMedia ? Math.min(2.7, Math.max(2.2, contentHeight * 0.46)) : Math.min(2.3, Math.max(1.95, contentHeight * 0.4)))
            : (useRoomyInlineMediaLayout ? Math.min(contentHeight - 0.06, 2.55) : contentHeight - 0.06),
        }, palette, deckFont);
      } else {
        await addMediaFrame(pptSlide, mediaItems[0], {
          x: 8.65,
          y: chrome.bodyTop + 0.04,
          w: 3.88,
          h: (contentHeight - 0.16) / 2,
        }, palette, deckFont);
        await addMediaFrame(pptSlide, mediaItems[1], {
          x: 8.65,
          y: chrome.bodyTop + 0.12 + ((contentHeight - 0.16) / 2),
          w: 3.88,
          h: (contentHeight - 0.16) / 2,
        }, palette, deckFont);
      }
    }

    addFooter(pptSlide, slide, state, deckFont, palette);
  }

  function getTableRowsForPpt(slide, palette) {
    const table = Array.isArray(slide.table) ? slide.table : [];
    const tableHighlights = slide.tableHighlights || {};
    return table.map((row, rowIndex) => row.map((cell, colIndex) => {
      const cellColor = tableHighlights.cells ? tableHighlights.cells[`${rowIndex}-${colIndex}`] : "";
      const rowColor = tableHighlights.rows ? tableHighlights.rows[String(rowIndex)] : "";
      const columnColor = tableHighlights.columns ? tableHighlights.columns[String(colIndex)] : "";
      const fillColor = cellColor || rowColor || columnColor;
      const isHeader = rowIndex === 0 || (row.length > 2 && colIndex === 0);
      return {
        text: flattenLinkedText(cell || ""),
        options: {
          bold: isHeader,
          color: palette.text,
          valign: "mid",
          align: colIndex === 0 ? "left" : "center",
          fill: fillColor ? stripHex(lightenHex(fillColor, 0.75)) : stripHex(palette.surface),
          margin: { left: 0.06, right: 0.06, top: 0.05, bottom: 0.05 },
        },
      };
    }));
  }

  function getTableFontSize(rowCount, hasMedia) {
    if (rowCount >= 8) {
      return hasMedia ? 11.5 : 13;
    }
    if (rowCount >= 6) {
      return hasMedia ? 12.5 : 14.5;
    }
    return hasMedia ? 13.5 : 15.5;
  }

  async function addTableSlide(pptSlide, slide, state, assets, deckFont, palette) {
    const chrome = await addSlideChrome(pptSlide, slide, state, assets, deckFont, palette);
    const mediaItems = getResolvedSlideMedia(slide, state, assets);
    const hasMedia = mediaItems.length > 0;
    const table = Array.isArray(slide.table) ? slide.table : [];
    const rowCount = table.length || 2;
    const colCount = table[0] ? table[0].length : 2;
    const tableX = 0.78;
    const tableY = chrome.bodyTop + 0.04;
    const tableW = hasMedia ? 8.55 : 11.75;
    const tableH = chrome.bodyBottom - tableY;

    pptSlide.addTable(getTableRowsForPpt(slide, palette), {
      x: tableX,
      y: tableY,
      w: tableW,
      h: tableH,
      fontFace: deckFont.pptBody || "Aptos",
      fontSize: scaleContentFont(state.settings, getTableFontSize(rowCount, hasMedia)),
      color: palette.text,
      border: { type: "solid", pt: 1, color: palette.line },
      fill: stripHex(palette.surface),
      margin: 0.04,
      valign: "mid",
      autoFit: false,
      rowH: tableH / Math.max(rowCount, 1),
      colW: Array(colCount).fill(tableW / Math.max(colCount, 1)),
    });

    if (hasMedia) {
      if (mediaItems.length === 1) {
        await addMediaFrame(pptSlide, mediaItems[0], {
          x: 9.72,
          y: chrome.bodyTop + 0.1,
          w: 2.86,
          h: chrome.bodyBottom - chrome.bodyTop - 0.14,
        }, palette, deckFont);
      } else {
        await addMediaFrame(pptSlide, mediaItems[0], {
          x: 9.72,
          y: chrome.bodyTop + 0.1,
          w: 2.86,
          h: (chrome.bodyBottom - chrome.bodyTop - 0.22) / 2,
        }, palette, deckFont);
        await addMediaFrame(pptSlide, mediaItems[1], {
          x: 9.72,
          y: chrome.bodyTop + 0.16 + ((chrome.bodyBottom - chrome.bodyTop - 0.22) / 2),
          w: 2.86,
          h: (chrome.bodyBottom - chrome.bodyTop - 0.22) / 2,
        }, palette, deckFont);
      }
    }

    addFooter(pptSlide, slide, state, deckFont, palette);
  }

  async function addFreeLinksBlock(pptSlide, slide, startY, deckFont, palette, settings) {
    const freeLinks = Array.isArray(slide && slide.freeLinks) ? slide.freeLinks.filter((item) => item && item.url).slice(0, 12) : [];
    if (!freeLinks.length) {
      return startY;
    }

    let cursorX = 0.82;
    let cursorY = startY;
    const maxX = 11.82;
    for (const item of freeLinks) {
      const label = String(item.label || ns.utils.formatUrlLabel(item.url) || item.url).trim();
      const width = Math.min(3.4, Math.max(1.2, 0.52 + (label.length * 0.082)));
      if (cursorX + width > maxX) {
        cursorX = 0.82;
        cursorY += 0.38;
      }
      pptSlide.addShape(((window.PptxGenJS && window.PptxGenJS.ShapeType) || {}).roundRect || "roundRect", {
        x: cursorX,
        y: cursorY,
        w: width,
        h: 0.28,
        rectRadius: 0.14,
        line: { color: palette.line, transparency: 100 },
        fill: { color: lightenHex(palette.accent, 0.82) },
      });
      pptSlide.addText(label, {
        x: cursorX + 0.08,
        y: cursorY + 0.04,
        w: width - 0.16,
        h: 0.16,
        margin: 0,
        fit: "shrink",
        align: "center",
        fontFace: deckFont.pptBody || "Aptos",
        fontSize: scaleContentFont(settings, 9),
        bold: true,
        color: palette.accentStrong,
        hyperlink: { url: item.url },
      });
      cursorX += width + 0.12;
    }

    return cursorY + 0.42;
  }

  async function addFreeGallery(pptSlide, mediaItems, startY, maxHeight, palette, deckFont) {
    if (!mediaItems.length || maxHeight <= 0.32) {
      return;
    }

    const columns = Math.min(3, Math.max(1, mediaItems.length));
    const rows = Math.ceil(mediaItems.length / columns);
    const gap = 0.18;
    const itemW = (11.76 - (gap * (columns - 1))) / columns;
    const itemH = Math.max(0.9, Math.min((maxHeight - (gap * (rows - 1))) / rows, 1.7));

    for (let index = 0; index < mediaItems.length; index += 1) {
      const media = mediaItems[index];
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = 0.82 + (col * (itemW + gap));
      const y = startY + (row * (itemH + gap));
      await addMediaFrame(pptSlide, media, { x, y, w: itemW, h: itemH }, palette, deckFont);
    }
  }

  async function addFreeSlide(pptSlide, slide, state, assets, deckFont, palette) {
    const chrome = await addSlideChrome(pptSlide, slide, state, assets, deckFont, palette);
    const paragraphs = parseRichTextParagraphs(slide.freeBody || "");
    const mediaItems = getResolvedFreeMedia(slide, state, assets);
    const bodyMarkup = String(slide.freeBody || "");
    const textLength = ns.utils.richTextLength(bodyMarkup);
    const textBlockCount = (bodyMarkup.match(/<(?:p|li|ul|ol|br)\b/gi) || []).length;
    const paragraphCount = (bodyMarkup.match(/<(?:p|div)\b/gi) || []).length;
    const listItemCount = (bodyMarkup.match(/<li\b/gi) || []).length;
    const listTextLength = bodyMarkup
      .replace(/<\/li>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .split("\n")
      .map((item) => item.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, listItemCount)
      .reduce((sum, item) => sum + item.length, 0);
    const plainTextLength = bodyMarkup
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .length;
    const estimatedTextLines = Math.max(1, Math.ceil(plainTextLength / 72));
    const averageListItemLength = listItemCount ? (listTextLength / listItemCount) : 0;
    const estimatedTextHeight = listItemCount >= 5
      ? (Math.max(1, paragraphCount) * 1.18) + (listItemCount * 0.31) + (Math.max(0, estimatedTextLines - listItemCount) * 0.22)
      : (estimatedTextLines * 0.92) + (textBlockCount * 0.42);
    const hasExtremeSingleGalleryText = mediaItems.length === 1
      && (
        textLength > 3000
        || textBlockCount > 42
        || estimatedTextHeight > 24
      );
    const useSideGallery = mediaItems.length === 1
      && !hasExtremeSingleGalleryText;
    let cursorY = chrome.bodyTop;

    if (paragraphs.length) {
      cursorY = addRichParagraphs(pptSlide, paragraphs, {
        x: 0.82,
        y: chrome.bodyTop,
        w: useSideGallery ? 7.55 : 11.1,
        h: 3.1,
      }, deckFont, palette, state.settings);
    }

    cursorY = await addFreeLinksBlock(pptSlide, slide, cursorY + 0.06, deckFont, palette, state.settings);
    if (useSideGallery) {
      await addMediaFrame(pptSlide, mediaItems[0], {
        x: 8.45,
        y: chrome.bodyTop + 0.08,
        w: 3.72,
        h: Math.min(3.1, Math.max(2.2, chrome.bodyBottom - chrome.bodyTop - 0.42)),
      }, palette, deckFont);
    } else {
      await addFreeGallery(pptSlide, mediaItems, cursorY + 0.08, chrome.bodyBottom - (cursorY + 0.08), palette, deckFont);
    }
    addFooter(pptSlide, slide, state, deckFont, palette);
  }

  async function waitForRenderAssets(root) {
    const images = Array.from(root.querySelectorAll("img"));
    const videos = Array.from(root.querySelectorAll("video"));

    await Promise.all(images.map((img) => {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    }));

    await Promise.all(videos.map((video) => {
      if (video.readyState >= 2) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        video.addEventListener("loadeddata", resolve, { once: true });
        video.addEventListener("error", resolve, { once: true });
      });
    }));
  }

  async function renderSlideToImage(slide, state, assets) {
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
      logoSources: assets.logos,
      mediaItems: getAvailableMediaItems(state.mediaLibrary || []).filter((item) => item.kind === "image"),
      mediaUrls: assets.imagePreviewMap || {},
      mediaLinks: {},
      pdfMode: true,
    });

    const slideNode = host.firstElementChild;
    slideNode.style.width = "1280px";
    slideNode.style.height = "720px";
    slideNode.style.aspectRatio = "16 / 9";
    slideNode.style.boxShadow = "none";
    slideNode.style.borderRadius = "0";

    await waitForRenderAssets(host);

    const canvas = await window.html2canvas(slideNode, {
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
      scale: 2,
      logging: false,
    });

    host.remove();
    return canvas.toDataURL("image/png");
  }

  async function addFallbackImageSlide(pptSlide, slide, state, assets) {
    const imageData = await renderSlideToImage(slide, state, assets);
    pptSlide.addImage({
      data: imageData,
      x: 0,
      y: 0,
      w: SLIDE_W,
      h: SLIDE_H,
    });
  }

  async function exportPptxNative(state) {
    if (!window.PptxGenJS) {
      window.alert("La librairie PPTX n'est pas chargee. Verifie la connexion internet puis reessaie.");
      return;
    }

    if (!window.html2canvas) {
      window.alert("La librairie de rendu n'est pas chargee. Verifie la connexion internet puis reessaie.");
      return;
    }

    const pptx = new window.PptxGenJS();
    notifyPptxProgress({
      state: "running",
      percent: 2,
      label: "Préparation",
      detail: "Initialisation du fichier PPTX",
    });
    await waitForNextFrame();
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

    const availableMediaItems = getAvailableMediaItems(state.mediaLibrary || []);
    const [logos, mediaAssets] = await Promise.all([
      resolveLogoSources(),
      ns.services.media.resolvePdfMediaAssets(availableMediaItems),
    ]);
    notifyPptxProgress({
      state: "running",
      percent: 10,
      label: "Préparation",
      detail: "Chargement des logos et médias",
    });
    await waitForNextFrame();
    const assets = {
      logos,
      previewMap: mediaAssets.previewMap || {},
      linkMap: mediaAssets.linkMap || {},
      imagePreviewMap: availableMediaItems.reduce((result, item) => {
        if (item && item.kind === "image" && mediaAssets.previewMap && mediaAssets.previewMap[item.id]) {
          result[item.id] = mediaAssets.previewMap[item.id];
        }
        return result;
      }, {}),
    };

    const slides = state.slides || [];
    const totalSlides = Math.max(slides.length, 1);
    for (let index = 0; index < slides.length; index += 1) {
      const slide = slides[index];
      const pptSlide = pptx.addSlide();
      const palette = getPptThemeColors(state.settings, slide);
      const progressStart = 10 + Math.round((index / totalSlides) * 80);
      notifyPptxProgress({
        state: "running",
        percent: progressStart,
        label: `Slide ${index + 1}/${totalSlides}`,
        detail: slide.contentType === "table"
          ? "Construction du tableau éditable"
          : slide.contentType === "free"
            ? "Construction de la slide libre hybride"
            : slide.contentType === "canvas"
              ? "Rendu du canvas libre en image"
          : slide.contentType === "bullets" || !slide.contentType
            ? "Construction de la slide éditable"
            : "Rendu de la slide en image",
      });
      await waitForNextFrame();

      if (slide.contentType === "table") {
        await addTableSlide(pptSlide, slide, state, assets, deckFont, palette);
      } else if (slide.contentType === "free") {
        await addFreeSlide(pptSlide, slide, state, assets, deckFont, palette);
      } else if (slide.contentType === "bullets" || !slide.contentType) {
        await addBulletSlide(pptSlide, slide, state, assets, deckFont, palette);
      } else {
        await addFallbackImageSlide(pptSlide, slide, state, assets);
      }
      notifyPptxProgress({
        state: "running",
        percent: 10 + Math.round(((index + 1) / totalSlides) * 80),
        label: `Slide ${index + 1}/${totalSlides}`,
        detail: "Slide traitée",
      });
      await waitForNextFrame();
    }

    const fileName = `${ns.utils.slugify(state.settings.title || "presentation")}.pptx`;
    notifyPptxProgress({
      state: "running",
      percent: 94,
      label: "Finalisation",
      detail: "Génération du fichier PowerPoint",
    });
    await waitForNextFrame();
    await pptx.writeFile({ fileName });
    notifyPptxProgress({
      state: "completed",
      percent: 100,
      label: "PPTX exporté",
      detail: fileName,
    });
  }

  if (ns.services.exporter && ns.services.exporter.exportPptx) {
    ns.services.exporter.exportPptxLegacy = ns.services.exporter.exportPptx;
    ns.services.exporter.exportPptx = exportPptxNative;
  } else {
    ns.services.exporter = ns.services.exporter || {};
    ns.services.exporter.exportPptx = exportPptxNative;
  }
  ns.services.exporter.setPptxProgressListener = setPptxProgressListener;
})();
