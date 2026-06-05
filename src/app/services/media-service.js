(function () {
  const ns = (window.StudioSlides = window.StudioSlides || {});
  ns.services = ns.services || {};

  const DB_NAME = "studio-ingenierie-media";
  const DB_VERSION = 1;
  const STORE_NAME = "media";
  const urlCache = new Map();
  const warnedCrossOriginImageUrls = new Set();

  function createEmbedPlaceholderDataUrl(label, layout) {
    const text = encodeURIComponent(label || (layout === "audio" ? "Audio" : "Video"));
    if (layout === "audio") {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 360"><rect width="1280" height="360" rx="28" fill="%23dbe9fb"/><rect x="36" y="36" width="1208" height="288" rx="24" fill="%23ffffff"/><circle cx="170" cy="180" r="76" fill="%232c73da"/><polygon points="145,138 145,222 216,180" fill="%23ffffff"/><rect x="300" y="116" width="730" height="26" rx="13" fill="%232c73da" fill-opacity="0.14"/><rect x="300" y="168" width="608" height="18" rx="9" fill="%232c73da" fill-opacity="0.18"/><rect x="300" y="208" width="486" height="18" rx="9" fill="%232c73da" fill-opacity="0.12"/><text x="300" y="270" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="700" fill="%23122033">${text}</text></svg>`;
    }
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><rect width="1280" height="720" rx="36" fill="%23dbe9fb"/><rect x="80" y="80" width="1120" height="560" rx="28" fill="%23ffffff"/><circle cx="640" cy="360" r="96" fill="%232c73da"/><polygon points="610,305 610,415 705,360" fill="%23ffffff"/><text x="640" y="560" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="700" fill="%23122033">${text}</text></svg>`;
  }

  function createImagePlaceholderDataUrl(label) {
    const text = encodeURIComponent(label || "Image externe");
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><rect width="1280" height="720" rx="36" fill="%23dbe9fb"/><rect x="80" y="80" width="1120" height="560" rx="28" fill="%23ffffff"/><rect x="210" y="180" width="860" height="340" rx="24" fill="%23e8f1fd" stroke="%232c73da" stroke-opacity="0.2" stroke-width="8"/><circle cx="390" cy="270" r="44" fill="%232c73da" fill-opacity="0.26"/><path d="M250 470l180-170 130 120 170-170 200 220H250z" fill="%232c73da" fill-opacity="0.32"/><text x="640" y="590" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="700" fill="%23122033">${text}</text></svg>`;
  }

  function isDataUrl(value) {
    return /^data:/i.test(String(value || "").trim());
  }

  function isCrossOriginHttpUrl(value) {
    const source = String(value || "").trim();
    if (!source) {
      return false;
    }
    let parsed;
    try {
      parsed = new URL(source, window.location.href);
    } catch (error) {
      return false;
    }
    if (!/^https?:$/i.test(parsed.protocol)) {
      return false;
    }
    return parsed.origin !== window.location.origin;
  }

  function extractIframeAttributes(rawValue) {
    const source = String(rawValue || "").trim();
    const iframeTagMatch = source.match(/<iframe\b[\s\S]*?>/i);
    if (!iframeTagMatch) {
      return null;
    }

    const attributes = {};
    const attributeRegex = /([a-zA-Z][\w:-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let match = attributeRegex.exec(iframeTagMatch[0]);
    while (match) {
      attributes[String(match[1] || "").toLowerCase()] = match[3] || match[4] || "";
      match = attributeRegex.exec(iframeTagMatch[0]);
    }
    return attributes;
  }

  function parseEmbedInput(value) {
    const rawValue = String(value || "").trim();
    if (!rawValue) {
      return {
        rawValue: "",
        normalizedUrl: "",
        parsedUrl: null,
        iframeAttributes: null,
      };
    }

    const iframeAttributes = extractIframeAttributes(rawValue);
    const normalizedUrl = String((iframeAttributes && iframeAttributes.src) || rawValue).trim();
    let parsedUrl = null;

    try {
      parsedUrl = new URL(normalizedUrl);
    } catch (error) {
      parsedUrl = null;
    }

    return {
      rawValue,
      normalizedUrl,
      parsedUrl,
      iframeAttributes,
    };
  }

  function parseIframePixelDimension(value) {
    const source = String(value || "").trim();
    if (!source || source.includes("%")) {
      return 0;
    }

    const parsed = Number(source.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 0;
    }

    return Math.round(parsed);
  }

  function cleanEmbedUrl(urlInput) {
    const url = new URL(urlInput.toString());
    url.hash = "";
    return url.toString();
  }

  function getEmbedTitle(input, fallback) {
    const iframeTitle = input && input.iframeAttributes ? String(input.iframeAttributes.title || "").trim() : "";
    return iframeTitle || fallback || "";
  }

  function formatRadioFranceStationName(stationId) {
    const labels = {
      franceinter: "France Inter",
      franceinfo: "franceinfo",
      franceculture: "France Culture",
      francemusique: "France Musique",
      mouv: "Mouv'",
      fip: "FIP",
    };
    return labels[String(stationId || "").toLowerCase()] || String(stationId || "Radio France").replace(/-/g, " ");
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(mode, run) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const result = run(store, tx);

      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  function detectKind(file) {
    if ((file.type || "").startsWith("image/")) {
      return "image";
    }

    if ((file.type || "").startsWith("video/")) {
      return "video";
    }

    const lowerName = String(file.name || "").toLowerCase();
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(lowerName)) {
      return "image";
    }
    if (/\.(mp4|mov|mkv|webm|avi)$/i.test(lowerName)) {
      return "video";
    }

    return "file";
  }

  function sanitizeMediaItem(item) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const utils = ns.utils;
    const kind = ["image", "video", "embed"].includes(item.kind) ? item.kind : "image";

    return {
      id: typeof item.id === "string" && item.id ? item.id : utils.createId("media"),
      name: utils.clampText(item.name, 120) || "Media",
      mimeType: utils.clampText(item.mimeType, 120),
      kind,
      size: Number.isFinite(item.size) ? item.size : 0,
      externalUrl: utils.clampText(item.externalUrl, 2000),
      embedUrl: utils.clampText(item.embedUrl, 2000),
      provider: utils.clampText(item.provider, 60),
      thumbnailUrl: utils.clampText(item.thumbnailUrl, 2000),
      embedLayout: item.embedLayout === "audio" ? "audio" : "video",
      embedHeight: Number.isFinite(Number(item.embedHeight)) ? Math.max(0, Math.min(720, Math.round(Number(item.embedHeight)))) : 0,
    };
  }

  function inferKindFromUrl(url) {
    const value = String(url || "").toLowerCase();
    if (/^data:image\//i.test(value)) {
      return "image";
    }
    if (/^data:video\//i.test(value)) {
      return "video";
    }
    if (/\.(mp4|mov|mkv|webm|avi)(\?|#|$)/i.test(value)) {
      return "video";
    }
    if (/\.(png|jpg|jpeg|gif|webp|svg)(\?|#|$)/i.test(value)) {
      return "image";
    }
    return "";
  }

  function normalizeMediaInput(value) {
    return parseEmbedInput(value).normalizedUrl || "";
  }

  function isDirectMediaUrl(url) {
    const value = normalizeMediaInput(url);
    if (/^data:(image|video)\//i.test(value)) {
      return true;
    }

    try {
      const parsed = new URL(value);
      if (!/^https?:$/i.test(parsed.protocol)) {
        return false;
      }
      if (extractEmbedMeta(url)) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  function extractYouTubeId(url) {
    try {
      const parsed = new URL(normalizeMediaInput(url));
      if (parsed.hostname.includes("youtu.be")) {
        return parsed.pathname.replace(/^\/+/, "").split("/")[0] || "";
      }
      if (parsed.hostname.includes("youtube.com")) {
        if (parsed.searchParams.get("v")) {
          return parsed.searchParams.get("v");
        }
        const parts = parsed.pathname.split("/").filter(Boolean);
        const embedIndex = parts.findIndex((part) => part === "embed" || part === "shorts");
        if (embedIndex >= 0 && parts[embedIndex + 1]) {
          return parts[embedIndex + 1];
        }
      }
    } catch (error) {
      return "";
    }
    return "";
  }

  function extractYouTubeEmbed(input) {
    const youtubeId = extractYouTubeId(input.normalizedUrl);
    if (youtubeId) {
      return {
        provider: "youtube",
        id: youtubeId,
        embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        name: getEmbedTitle(input, `YouTube ${youtubeId}`),
        embedLayout: "video",
        embedHeight: 0,
      };
    }
    return null;
  }

  function extractAppsEducationEmbed(input) {
    const parsed = input.parsedUrl;
    if (!parsed) {
      return null;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname.endsWith(".apps.education.fr")) {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return null;
    }

    if (parts[0] === "w" && parts[1]) {
      return {
        provider: "apps-education",
        id: parts[1],
        embedUrl: cleanEmbedUrl(parsed),
        thumbnailUrl: "",
        name: getEmbedTitle(input, `Vidéo ${parts[1]}`),
        embedLayout: "video",
        embedHeight: 0,
      };
    }

    if (parts[0] === "video" && parts[1]) {
      const videoId = parts[1].split("-")[0];
      if (!videoId) {
        return null;
      }
      return {
        provider: "apps-education",
        id: videoId,
        embedUrl: cleanEmbedUrl(parsed),
        thumbnailUrl: "",
        name: getEmbedTitle(input, parts[1].replace(/-/g, " ")),
        embedLayout: "video",
        embedHeight: 0,
      };
    }

    if (parts[0] === "videos" && (parts[1] === "watch" || parts[1] === "embed") && parts[2]) {
      return {
        provider: "apps-education",
        id: parts[2],
        embedUrl: cleanEmbedUrl(parsed),
        thumbnailUrl: "",
        name: getEmbedTitle(input, `Vidéo ${parts[2]}`),
        embedLayout: "video",
        embedHeight: 0,
      };
    }

    return null;
  }

  function extractRadioFranceEmbed(input) {
    const parsed = input.parsedUrl;
    if (!parsed || parsed.hostname.toLowerCase() !== "embed.radiofrance.fr") {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 3) {
      return null;
    }

    const stationId = parts[0];
    const contentType = parts[1];
    const contentId = parts[2];
    const stationName = formatRadioFranceStationName(stationId);
    const embedHeight = parseIframePixelDimension(input.iframeAttributes && input.iframeAttributes.height) || 144;
    const fallbackName = contentType === "diffusion"
      ? `Radio France - ${stationName}`
      : `Radio France - ${stationName} - ${contentType}`;

    return {
      provider: "radiofrance",
      id: `${stationId}-${contentType}-${contentId}`,
      embedUrl: cleanEmbedUrl(parsed),
      thumbnailUrl: createEmbedPlaceholderDataUrl(stationName, "audio"),
      name: getEmbedTitle(input, fallbackName),
      embedLayout: "audio",
      embedHeight,
    };
  }

  const EMBED_PROVIDERS = [
    extractYouTubeEmbed,
    extractAppsEducationEmbed,
    extractRadioFranceEmbed,
  ];

  function extractEmbedMeta(url) {
    const input = parseEmbedInput(url);
    if (!input.parsedUrl || !/^https?:$/i.test(input.parsedUrl.protocol)) {
      return null;
    }

    for (const provider of EMBED_PROVIDERS) {
      const meta = provider(input);
      if (meta) {
        return meta;
      }
    }

    return null;
  }

  function isEmbeddableMediaUrl(url) {
    return Boolean(extractEmbedMeta(url));
  }

  function createExternalMedia(url) {
    const cleanUrl = normalizeMediaInput(url);
    if (!cleanUrl) {
      return null;
    }

    try {
      if (/^data:(image|video)\//i.test(cleanUrl)) {
        const kind = inferKindFromUrl(cleanUrl) || "image";
        const extension = kind === "video" ? "mp4" : "png";
        return sanitizeMediaItem({
          id: ns.utils.createId("media"),
          name: `media-base64.${extension}`,
          mimeType: "",
          kind,
          size: 0,
          externalUrl: cleanUrl,
        });
      }

      const parsed = new URL(cleanUrl);
      const kind = inferKindFromUrl(cleanUrl) || "image";
      const name = parsed.pathname.split("/").pop() || "media";
      return sanitizeMediaItem({
        id: ns.utils.createId("media"),
        name,
        mimeType: "",
        kind,
        size: 0,
        externalUrl: cleanUrl,
      });
    } catch (error) {
      return null;
    }
  }

  function createEmbedMedia(url) {
    const cleanUrl = normalizeMediaInput(url);
    const embedMeta = extractEmbedMeta(url);
    if (!embedMeta) {
      return null;
    }

    return sanitizeMediaItem({
      id: ns.utils.createId("media"),
      name: embedMeta.name,
      mimeType: "",
      kind: "embed",
      size: 0,
      externalUrl: cleanUrl,
      embedUrl: embedMeta.embedUrl,
      provider: embedMeta.provider,
      thumbnailUrl: embedMeta.thumbnailUrl || createEmbedPlaceholderDataUrl(embedMeta.name, embedMeta.embedLayout),
      embedLayout: embedMeta.embedLayout || "video",
      embedHeight: embedMeta.embedHeight || 0,
    });
  }

  async function importFiles(fileList) {
    const files = Array.from(fileList || []).filter((file) => {
      return detectKind(file) === "image" || detectKind(file) === "video";
    });

    const items = files.map((file) => {
      return {
        id: ns.utils.createId("media"),
        name: file.name,
        mimeType: file.type || "",
        kind: detectKind(file),
        size: file.size || 0,
        blob: file,
      };
    });

    await withStore("readwrite", (store) => {
      items.forEach((item) => store.put(item));
    });

    items.forEach((item) => {
      const existingUrl = urlCache.get(item.id);
      if (existingUrl) {
        URL.revokeObjectURL(existingUrl);
      }
      urlCache.set(item.id, URL.createObjectURL(item.blob));
    });

    return items.map((item) => sanitizeMediaItem(item)).filter(Boolean);
  }

  async function getBlobRecord(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function ensureObjectUrl(id) {
    if (!id) {
      return null;
    }

    if (urlCache.has(id)) {
      return urlCache.get(id);
    }

    const record = await getBlobRecord(id);
    if (record && record.externalUrl) {
      const resolvedUrl = record.thumbnailUrl || record.externalUrl;
      urlCache.set(id, resolvedUrl);
      return resolvedUrl;
    }
    if (!record || !record.blob) {
      return null;
    }

    const url = URL.createObjectURL(record.blob);
    urlCache.set(id, url);
    return url;
  }

  async function hydrateMediaLibrary(items) {
    const sanitizedItems = (items || []).map(sanitizeMediaItem).filter(Boolean);
    const existingItems = [];

    for (const item of sanitizedItems) {
      if (item.externalUrl) {
        existingItems.push(item);
        urlCache.set(item.id, item.thumbnailUrl || item.externalUrl);
        continue;
      }
      const record = await getBlobRecord(item.id);
      if (!record || !record.blob) {
        continue;
      }
      existingItems.push(item);
      await ensureObjectUrl(item.id);
    }

    return existingItems;
  }

  async function deleteMedia(id) {
    const existingUrl = urlCache.get(id);
    if (existingUrl) {
      URL.revokeObjectURL(existingUrl);
      urlCache.delete(id);
    }

    await withStore("readwrite", (store) => {
      store.delete(id);
    });
  }

  async function blobToDataUrl(blob) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function urlToDataUrl(url) {
    const source = String(url || "").trim();
    if (!source) {
      return "";
    }
    if (isDataUrl(source)) {
      return source;
    }
    if (isCrossOriginHttpUrl(source)) {
      if (!warnedCrossOriginImageUrls.has(source)) {
        warnedCrossOriginImageUrls.add(source);
        console.warn("[media-export] Image externe ignoree en export (CORS):", source);
      }
      return "";
    }
    try {
      const response = await fetch(source, { mode: "cors" });
      if (!response.ok) {
        return "";
      }
      const blob = await response.blob();
      return await blobToDataUrl(blob);
    } catch (error) {
      return "";
    }
  }

  async function createVideoPosterDataUrl(videoSrc) {
    return await new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
      let settled = false;
      let timeoutId = 0;

      const cleanup = () => {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        video.pause();
        video.removeAttribute("src");
        video.load();
      };

      const fallback = () => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve("");
      };

      video.addEventListener("loadeddata", () => {
        if (settled) {
          return;
        }
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/png");
          settled = true;
          cleanup();
          resolve(dataUrl);
        } catch (error) {
          fallback();
        }
      }, { once: true });

      video.addEventListener("error", fallback, { once: true });
      timeoutId = window.setTimeout(fallback, 4500);
      video.src = videoSrc;
    });
  }

  const createVideoPlaceholderDataUrl = createEmbedPlaceholderDataUrl;

  async function resolvePdfMediaAssets(items) {
    const previewMap = {};
    const linkMap = {};
    const exportUrls = await resolveExportMediaUrls((items || []).filter((item) => item.kind !== "video"));

    for (const item of items || []) {
      if (item.kind === "image") {
        const rawPreview = exportUrls[item.id] || item.thumbnailUrl || item.externalUrl || "";
        if (isDataUrl(rawPreview)) {
          previewMap[item.id] = rawPreview;
        } else if (item.externalUrl) {
          const converted = await urlToDataUrl(rawPreview);
          previewMap[item.id] = converted || createImagePlaceholderDataUrl(item.name || "Image externe");
          linkMap[item.id] = item.externalUrl;
        } else {
          previewMap[item.id] = rawPreview || createImagePlaceholderDataUrl(item.name || "Image");
        }
        continue;
      }

      if (item.kind === "embed") {
        previewMap[item.id] = item.thumbnailUrl || createVideoPlaceholderDataUrl(item.name, item.embedLayout);
        linkMap[item.id] = item.externalUrl || item.embedUrl || "";
        continue;
      }

      if (item.kind === "video") {
        previewMap[item.id] = createVideoPlaceholderDataUrl("Média vidéo");
        linkMap[item.id] = item.externalUrl || "";
      }
    }

    return { previewMap, linkMap };
  }

  async function resolveExportMediaUrls(items) {
    const result = {};

    for (const item of items || []) {
      if (item.externalUrl) {
        result[item.id] = item.embedUrl || item.externalUrl;
        continue;
      }
      const record = await getBlobRecord(item.id);
      if (!record || !record.blob) {
        continue;
      }
      result[item.id] = await blobToDataUrl(record.blob);
    }

    return result;
  }

  async function importMediaDataMap(mediaDataMap, mediaItems) {
    const entries = Object.entries(mediaDataMap || {});
    const importedItems = [];

    for (const item of mediaItems || []) {
      const dataUrl = mediaDataMap && mediaDataMap[item.id];
      if (item.externalUrl) {
        urlCache.set(item.id, item.thumbnailUrl || item.externalUrl);
        importedItems.push(sanitizeMediaItem(item));
        continue;
      }
      if (!dataUrl || typeof dataUrl !== "string") {
        continue;
      }

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const record = {
        id: item.id,
        name: item.name,
        mimeType: item.mimeType || blob.type || "",
        kind: item.kind,
        size: blob.size || item.size || 0,
        blob,
      };

      await withStore("readwrite", (store) => {
        store.put(record);
      });

      const existingUrl = urlCache.get(item.id);
      if (existingUrl) {
        URL.revokeObjectURL(existingUrl);
      }
      urlCache.set(item.id, URL.createObjectURL(blob));
      importedItems.push(sanitizeMediaItem(record));
    }

    return importedItems;
  }

  function getUrlMap() {
    return Object.fromEntries(urlCache.entries());
  }

  function primeMediaUrl(item) {
    if (!item || !item.id) {
      return;
    }

    if (item.externalUrl) {
      urlCache.set(item.id, item.thumbnailUrl || item.externalUrl);
    }
  }

  ns.services.media = {
    sanitizeMediaItem,
    normalizeMediaInput,
    createExternalMedia,
    createEmbedMedia,
    isDirectMediaUrl,
    isEmbeddableMediaUrl,
    importFiles,
    hydrateMediaLibrary,
    deleteMedia,
    ensureObjectUrl,
    resolveExportMediaUrls,
    resolvePdfMediaAssets,
    importMediaDataMap,
    primeMediaUrl,
    getUrlMap,
  };
})();
