(function () {
  const ns = (window.StudioSlides = window.StudioSlides || {});
  ns.stateFactory = ns.stateFactory || {};

  const principleDefaultsByBloom = {
    identify: ["signaling", "activation"],
    understand: ["segmentation", "worked-examples"],
    apply: ["worked-examples", "feedback"],
    analyze: ["signaling", "retrieval-practice"],
    evaluate: ["feedback", "retrieval-practice"],
    create: ["segmentation", "spacing"],
  };

  function createDefaultVisualData() {
    return {
      primaryMediaId: "",
      secondaryMediaId: "",
      showImages: true,
      primaryMediaReveal: false,
      secondaryMediaReveal: false,
      showBody: true,
      showCallout: true,
      body: "Présentez ici le message visuel principal en 2 ou 3 lignes utiles.",
      callout: "Mettez en évidence une relation, une progression ou un point d'attention.",
      arrowDirection: "right",
      arrowColor: "#60b2e5",
      showChart: true,
      chartReveal: false,
      chartTitle: "Indicateurs clés",
      chartBarCount: 3,
      chartBars: [
        { label: "Usage", value: 72, color: "#60b2e5" },
        { label: "Impact", value: 54, color: "#294c60" },
        { label: "Suivi", value: 38, color: "#fcba04" },
        { label: "Adoption", value: 46, color: "#083d77" },
        { label: "Portee", value: 61, color: "#ff6978" },
        { label: "Qualite", value: 49, color: "#71a2b6" },
      ],
    };
  }

  function createDefaultCanvasData() {
    return {
      progressive: false,
      elements: [],
    };
  }

  function createSlideFromBloom(level, index) {
    return {
      id: `slide-${index + 1}`,
      label: `Étape ${index + 1}`,
      number: String(index + 1).padStart(2, "0"),
      contentType: "bullets",
      bulletsNumbered: false,
      bulletsProgressive: false,
      bulletsSubProgressive: false,
      tableProgressive: false,
      tableProgressiveOrder: "row",
      paletteOverride: "",
      decorativeAccentOverride: "clay",
      decorativeAccentSolid: true,
      tableHighlights: { rows: {}, columns: {}, cells: {} },
      table: [
        ["", ""],
        ["", ""],
      ],
      freeBody: "",
      freeLinks: [],
      freeMediaIds: [],
      visualData: createDefaultVisualData(),
      canvasData: createDefaultCanvasData(),
      subBullets: {},
      mediaId: "",
      secondaryMediaId: "",
      bloomLevel: level.id,
      objective: `Amener le groupe à ${level.verbs[0]} et formaliser une preuve exploitable.`,
      evidence: "Trace à définir",
      principleIds: principleDefaultsByBloom[level.id] || [],
      title: level.defaultTitle,
      subtitle: level.defaultSubtitle,
      bullets: level.defaultBullets.slice(0, 3),
      note: level.defaultNote,
      presenterNotes: "",
    };
  }

  function createBloomDeckSlides() {
    const bloomLevels = (ns.data && ns.data.bloomLevels) || [];
    return bloomLevels.map((level, index) => createSlideFromBloom(level, index));
  }

  function createBlankSlide(index, bloomLevelId) {
    const bloomLevels = (ns.data && ns.data.bloomLevels) || [];
    const fallbackLevel = bloomLevels.find((level) => level.id === bloomLevelId) || bloomLevels[0];

    return {
      id: `slide-${Date.now()}-${index}`,
      label: "Nouvelle slide",
      number: String(index).padStart(2, "0"),
      contentType: "bullets",
      bulletsNumbered: false,
      bulletsProgressive: false,
      bulletsSubProgressive: false,
      tableProgressive: false,
      tableProgressiveOrder: "row",
      paletteOverride: "",
      decorativeAccentOverride: "clay",
      decorativeAccentSolid: true,
      tableHighlights: { rows: {}, columns: {}, cells: {} },
      table: [
        ["", ""],
        ["", ""],
      ],
      freeBody: "",
      freeLinks: [],
      freeMediaIds: [],
      visualData: createDefaultVisualData(),
      canvasData: createDefaultCanvasData(),
      subBullets: {},
      mediaId: "",
      secondaryMediaId: "",
      bloomLevel: fallbackLevel ? fallbackLevel.id : "identify",
      objective: "Formuler l'objectif d'apprentissage visé par cette slide.",
      evidence: "Trace ou preuve attendue",
      principleIds: fallbackLevel ? (principleDefaultsByBloom[fallbackLevel.id] || []).slice(0, 2) : [],
      title: "Titre court à présenter",
      subtitle: "Gardez un message principal net, lisible et directement exploitable.",
      bullets: ["Premier point", "Deuxieme point", "Troisieme point"],
      note: "Une note breve suffit pour fermer la slide.",
      presenterNotes: "",
    };
  }

  function createDefaultState() {
    const slides = createBloomDeckSlides();
    return {
      view: "engineering",
      uiNightMode: false,
      uiGlobalPanelCollapsed: false,
      uiMediaPanelCollapsed: false,
      uiThumbStripCollapsed: false,
      settings: {
        title: "Ingénierie de formation",
        subtitle: "Deck structuré selon Bloom et principes cognitifs.",
        footer: "Équipe projet",
        theme: "mix",
        palette: "ocean",
        font: "studio",
        contentFontScale: 100,
        transition: "fade",
        frameShadow: false,
      },
      mediaLibrary: [],
      selectedSlideId: slides[0] ? slides[0].id : null,
      slides,
    };
  }

  ns.stateFactory.createSlideFromBloom = createSlideFromBloom;
  ns.stateFactory.createBloomDeckSlides = createBloomDeckSlides;
  ns.stateFactory.createBlankSlide = createBlankSlide;
  ns.stateFactory.createDefaultVisualData = createDefaultVisualData;
  ns.stateFactory.createDefaultCanvasData = createDefaultCanvasData;
  ns.stateFactory.createDefaultState = createDefaultState;
})();
