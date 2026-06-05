(function () {
  const ns = (window.StudioSlides = window.StudioSlides || {});
  ns.data = ns.data || {};

  const pictoDefinitions = [
    { slug: "ampoule", file: "ampoule.png", label: "Ampoule" },
    { slug: "boussole", file: "boussole.png", label: "Boussole" },
    { slug: "bulle", file: "bulle.png", label: "Bulle" },
    { slug: "camera", file: "camera.png", label: "Camera" },
    { slug: "cerveau", file: "cerveau.png", label: "Cerveau" },
    { slug: "check", file: "check.png", label: "Validation" },
    { slug: "crayon", file: "crayon.png", label: "Crayon" },
    { slug: "diplomee", file: "diplomee.png", label: "Diplome" },
    { slug: "engrenage", file: "engrenage.png", label: "Engrenage" },
    { slug: "enseigner", file: "enseigner.png", label: "Enseigner" },
    { slug: "exclamation", file: "exclamation.png", label: "Exclamation" },
    { slug: "fleche", file: "fleche.png", label: "Fleche" },
    { slug: "gps", file: "gps.png", label: "GPS" },
    { slug: "info", file: "info.png", label: "Information" },
    { slug: "interdit", file: "interdit.png", label: "Interdit" },
    { slug: "interogation", file: "interogation.png", label: "Question" },
    { slug: "livre", file: "livre.png", label: "Livre" },
    { slug: "pause", file: "pause.png", label: "Pause" },
    { slug: "play", file: "play.png", label: "Lecture" },
    { slug: "robot", file: "robot.png", label: "Robot" },
    { slug: "sensunique", file: "sensunique.png", label: "Sens unique" },
    { slug: "stop", file: "stop.png", label: "Stop" },
    { slug: "securite", file: "sécurite.png", label: "Securite" },
    { slug: "tablette", file: "tablette.png", label: "Tablette" },
    { slug: "tourne", file: "tourne.png", label: "Rotation" },
    { slug: "warning", file: "warning.png", label: "Alerte" },
    { slug: "wifi", file: "wifi.png", label: "Wifi" },
    { slug: "wrong", file: "wrong.png", label: "Erreur" },
  ];

  function getPictoAssetUrl(fileName) {
    return encodeURI(`assets/images/picto/${fileName}`);
  }

  function getPictoMimeType(fileName) {
    const lowerName = String(fileName || "").toLowerCase();
    if (lowerName.endsWith(".svg")) {
      return "image/svg+xml";
    }
    if (lowerName.endsWith(".webp")) {
      return "image/webp";
    }
    if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
      return "image/jpeg";
    }
    return "image/png";
  }

  function createPictoItem(definition) {
    const url = getPictoAssetUrl(definition.file);
    return {
      id: `picto:${definition.slug}`,
      kind: "image",
      name: definition.label,
      mimeType: getPictoMimeType(definition.file),
      externalUrl: url,
      thumbnailUrl: url,
      isBuiltinPicto: true,
    };
  }

  function getPictoMediaItems() {
    return pictoDefinitions.map(createPictoItem);
  }

  function getPictoMediaUrlMap() {
    return getPictoMediaItems().reduce((result, item) => {
      result[item.id] = item.thumbnailUrl || item.externalUrl || "";
      return result;
    }, {});
  }

  function augmentMediaItems(items) {
    const baseItems = Array.isArray(items) ? items.slice() : [];
    const existingIds = new Set(baseItems.map((item) => item && item.id).filter(Boolean));
    getPictoMediaItems().forEach((item) => {
      if (!existingIds.has(item.id)) {
        baseItems.push(item);
      }
    });
    return baseItems;
  }

  function augmentMediaUrlMap(urlMap) {
    return Object.assign({}, getPictoMediaUrlMap(), urlMap || {});
  }

  ns.data.pictoAssets = pictoDefinitions.map((definition) => ({
    id: `picto:${definition.slug}`,
    slug: definition.slug,
    file: definition.file,
    label: definition.label,
    url: getPictoAssetUrl(definition.file),
  }));
  ns.data.getPictoMediaItems = getPictoMediaItems;
  ns.data.getPictoMediaUrlMap = getPictoMediaUrlMap;
  ns.data.augmentMediaItems = augmentMediaItems;
  ns.data.augmentMediaUrlMap = augmentMediaUrlMap;
})();
