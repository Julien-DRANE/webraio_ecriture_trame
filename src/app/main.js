(function () {
  const ns = (window.StudioSlides = window.StudioSlides || {});
  const STORAGE_KEY = "studio-ingenierie-formation-v2";
  const SLIDE_CLIPBOARD_KEY = ns.services.storage.slideClipboardKey || "studio-ingenierie-slide-clipboard-v1";

  const refs = {
    appShell: document.querySelector(".app-shell"),
    tabs: Array.from(document.querySelectorAll("[data-switch-view]")),
    generateBloomDeck: document.querySelector("#generate-bloom-deck"),
    addSlide: document.querySelector("#add-slide"),
    addSlideMenu: document.querySelector("#add-slide-menu"),
    undoAction: document.querySelector("#undo-action"),
    duplicateSlide: document.querySelector("#duplicate-slide"),
    copySlide: document.querySelector("#copy-slide"),
    pasteSlide: document.querySelector("#paste-slide"),
    deleteSlide: document.querySelector("#delete-slide"),
    deleteSlideInline: document.querySelector("#delete-slide-inline"),
    openPresentation: document.querySelector("#open-presentation"),
    openPresentationActive: document.querySelector("#open-presentation-active"),
    openPresenter: document.querySelector("#open-presenter"),
    openPresenterActive: document.querySelector("#open-presenter-active"),
    exportPdf: document.querySelector("#export-pdf"),
    exportPptx: document.querySelector("#export-pptx"),
    exportHtml: document.querySelector("#export-html"),
    exportJson: document.querySelector("#export-json"),
    exportTxt: document.querySelector("#export-txt"),
    importJson: document.querySelector("#import-json"),
    importJsonInput: document.querySelector("#import-json-input"),
    toggleNightMode: document.querySelector("#toggle-night-mode"),
    deckTitle: document.querySelector("#deck-title"),
    deckSubtitle: document.querySelector("#deck-subtitle"),
    deckFooter: document.querySelector("#deck-footer"),
    deckTheme: document.querySelector("#deck-theme"),
    deckPalette: document.querySelector("#deck-palette"),
    deckFont: document.querySelector("#deck-font"),
    deckContentFontScale: document.querySelector("#deck-content-font-scale"),
    deckContentFontScaleValue: document.querySelector("#deck-content-font-scale-value"),
    deckTransition: document.querySelector("#deck-transition"),
    deckFrameShadow: document.querySelector("#deck-frame-shadow"),
    taxonomyCount: document.querySelector("#taxonomy-count"),
    taxonomyRoadmap: document.querySelector("#taxonomy-roadmap"),
    slideCount: document.querySelector("#slide-count"),
    slideList: document.querySelector("#slide-list"),
    principlesList: document.querySelector("#principles-list"),
    previewPanel: document.querySelector("#preview-panel"),
    stageWrap: document.querySelector("#preview-panel .stage-wrap"),
    stage: document.querySelector("#stage"),
    chartLightbox: document.querySelector("#chart-lightbox"),
    chartLightboxContent: document.querySelector("#chart-lightbox-content"),
    chartLightboxClose: document.querySelector("#chart-lightbox-close"),
    tableLightbox: document.querySelector("#table-lightbox"),
    tableLightboxContent: document.querySelector("#table-lightbox-content"),
    tableLightboxClose: document.querySelector("#table-lightbox-close"),
    presentationProgress: document.querySelector("#presentation-progress"),
    slideHint: document.querySelector("#slide-hint"),
    toggleCanvasPreviewFullscreen: document.querySelector("#toggle-canvas-preview-fullscreen"),
    densityBadge: document.querySelector("#density-badge"),
    thumbStrip: document.querySelector("#thumb-strip"),
    globalPanelBody: document.querySelector("#global-panel-body"),
    pedagogyBrief: document.querySelector("#pedagogy-brief"),
    mediaUpload: document.querySelector("#media-upload"),
    mediaUploadTrigger: document.querySelector("#media-upload-trigger"),
    toggleGlobalPanel: document.querySelector("#toggle-global-panel"),
    toggleMediaPanel: document.querySelector("#toggle-media-panel"),
    toggleThumbStrip: document.querySelector("#toggle-thumb-strip"),
    slideMediaPanelBody: document.querySelector("#slide-media-panel-body"),
    clearSlideMedia: document.querySelector("#clear-slide-media"),
    mediaLinkInput: document.querySelector("#media-link-input"),
    mediaLinkAdd: document.querySelector("#media-link-add"),
    mediaLinkFeedback: document.querySelector("#media-link-feedback"),
    mediaLibrary: document.querySelector("#media-library"),
    pictoLibrary: document.querySelector("#picto-library"),
    pictoPlacement: document.querySelector("#picto-placement"),
    pictoSize: document.querySelector("#picto-size"),
    slideMediaSelection: document.querySelector("#slide-media-selection"),
    slideBloomLevel: document.querySelector("#slide-bloom-level"),
    slideLabel: document.querySelector("#slide-label"),
    slideNumber: document.querySelector("#slide-number"),
    slideObjective: document.querySelector("#slide-objective"),
    slideEvidence: document.querySelector("#slide-evidence"),
    slideTitle: document.querySelector("#slide-title"),
    slideSubtitle: document.querySelector("#slide-subtitle"),
    slideContentType: document.querySelector("#slide-content-type"),
    slidePaletteOverride: document.querySelector("#slide-palette-override"),
    slideDecorativeAccentOverride: document.querySelector("#slide-decorative-accent-override"),
    slideDecorativeAccentSolid: document.querySelector("#slide-decorative-accent-solid"),
    slideBulletsEditor: document.querySelector("#slide-bullets-editor"),
    slideTableEditor: document.querySelector("#slide-table-editor"),
    slideFreeEditor: document.querySelector("#slide-free-editor"),
    slideCanvasEditor: document.querySelector("#slide-canvas-editor"),
    slideVisualEditor: document.querySelector("#slide-visual-editor"),
    slideNoteEditor: document.querySelector("#slide-note-editor"),
    slideBulletsNumbered: document.querySelector("#slide-bullets-numbered"),
    slideBulletsProgressive: document.querySelector("#slide-bullets-progressive"),
    slideBulletsSubProgressive: document.querySelector("#slide-bullets-sub-progressive"),
    slideTableProgressive: document.querySelector("#slide-table-progressive"),
    slideTableProgressiveOrderWrap: document.querySelector("#slide-table-progressive-order-wrap"),
    slideTableProgressiveOrder: document.querySelector("#slide-table-progressive-order"),
    slideBullet1: document.querySelector("#slide-bullet-1"),
    slideBullet2: document.querySelector("#slide-bullet-2"),
    slideBullet3: document.querySelector("#slide-bullet-3"),
    subBulletLists: [
      document.querySelector("#sub-bullets-0"),
      document.querySelector("#sub-bullets-1"),
      document.querySelector("#sub-bullets-2"),
    ],
    addBullet: document.querySelector("#add-bullet"),
    extraBulletsList: document.querySelector("#extra-bullets-list"),
    addTableRow: document.querySelector("#add-table-row"),
    removeTableRow: document.querySelector("#remove-table-row"),
    addTableColumn: document.querySelector("#add-table-column"),
    removeTableColumn: document.querySelector("#remove-table-column"),
    tableFillTarget: document.querySelector("#table-fill-target"),
    tableFillIndex: document.querySelector("#table-fill-index"),
    tableFillColor: document.querySelector("#table-fill-color"),
    addTableFill: document.querySelector("#add-table-fill"),
    tableFillList: document.querySelector("#table-fill-list"),
    tableEditorGrid: document.querySelector("#table-editor-grid"),
    slideFreeBody: document.querySelector("#slide-free-body"),
    freeTextBullets: document.querySelector("#free-text-bullets"),
    freeTextColor: document.querySelector("#free-text-color"),
    freeTextSize: document.querySelector("#free-text-size"),
    freeBodyMeta: document.querySelector("#free-body-meta"),
    freeLinkLabel: document.querySelector("#free-link-label"),
    freeLinkUrl: document.querySelector("#free-link-url"),
    addFreeLink: document.querySelector("#add-free-link"),
    freeLinksList: document.querySelector("#free-links-list"),
    canvasAddText: document.querySelector("#canvas-add-text"),
    canvasAddArrow: document.querySelector("#canvas-add-arrow"),
    canvasAddCircle: document.querySelector("#canvas-add-circle"),
    canvasAddSquare: document.querySelector("#canvas-add-square"),
    canvasAddBubble: document.querySelector("#canvas-add-bubble"),
    canvasProgressive: document.querySelector("#canvas-progressive"),
    canvasElementsList: document.querySelector("#canvas-elements-list"),
    canvasElementFields: document.querySelector("#canvas-element-fields"),
    canvasEmptySelection: document.querySelector("#canvas-empty-selection"),
    canvasElementX: document.querySelector("#canvas-element-x"),
    canvasElementY: document.querySelector("#canvas-element-y"),
    canvasElementW: document.querySelector("#canvas-element-w"),
    canvasElementH: document.querySelector("#canvas-element-h"),
    canvasTextContentWrap: document.querySelector("#canvas-text-content-wrap"),
    canvasTextContent: document.querySelector("#canvas-text-content"),
    canvasTextToolbar: document.querySelector("#canvas-text-toolbar"),
    canvasTextBold: document.querySelector("#canvas-text-bold"),
    canvasTextItalic: document.querySelector("#canvas-text-italic"),
    canvasTextUnderline: document.querySelector("#canvas-text-underline"),
    canvasTextBullets: document.querySelector("#canvas-text-bullets"),
    canvasTextColorPalette: document.querySelector("#canvas-text-color-palette"),
    canvasTextStyleGrid: document.querySelector("#canvas-text-style-grid"),
    canvasTextFont: document.querySelector("#canvas-text-font"),
    canvasTextSize: document.querySelector("#canvas-text-size"),
    canvasTextSizeValue: document.querySelector("#canvas-text-size-value"),
    canvasTextFrame: document.querySelector("#canvas-text-frame"),
    canvasImageMediaWrap: document.querySelector("#canvas-image-media-wrap"),
    canvasImageMedia: document.querySelector("#canvas-image-media"),
    canvasArrowControls: document.querySelector("#canvas-arrow-controls"),
    canvasArrowDirection: document.querySelector("#canvas-arrow-direction"),
    canvasArrowColor: document.querySelector("#canvas-arrow-color"),
    canvasArrowRotation: document.querySelector("#canvas-arrow-rotation"),
    canvasArrowLength: document.querySelector("#canvas-arrow-length"),
    canvasArrowLengthValue: document.querySelector("#canvas-arrow-length-value"),
    canvasShapeControls: document.querySelector("#canvas-shape-controls"),
    canvasShapeKind: document.querySelector("#canvas-shape-kind"),
    canvasShapeColor: document.querySelector("#canvas-shape-color"),
    canvasDuplicateElement: document.querySelector("#canvas-duplicate-element"),
    canvasDeleteElement: document.querySelector("#canvas-delete-element"),
    visualPrimaryMedia: document.querySelector("#visual-primary-media"),
    visualSecondaryMedia: document.querySelector("#visual-secondary-media"),
    visualShowImages: document.querySelector("#visual-show-images"),
    visualPrimaryMediaReveal: document.querySelector("#visual-primary-media-reveal"),
    visualSecondaryMediaReveal: document.querySelector("#visual-secondary-media-reveal"),
    visualShowBody: document.querySelector("#visual-show-body"),
    visualBody: document.querySelector("#visual-body"),
    visualBodyMeta: document.querySelector("#visual-body-meta"),
    visualCallout: document.querySelector("#visual-callout"),
    visualCalloutMeta: document.querySelector("#visual-callout-meta"),
    visualShowCallout: document.querySelector("#visual-show-callout"),
    visualArrowDirection: document.querySelector("#visual-arrow-direction"),
    visualArrowColor: document.querySelector("#visual-arrow-color"),
    visualShowChart: document.querySelector("#visual-show-chart"),
    visualChartEditor: document.querySelector("#visual-chart-editor"),
    visualChartReveal: document.querySelector("#visual-chart-reveal"),
    visualChartTitle: document.querySelector("#visual-chart-title"),
    visualChartBars: document.querySelector("#visual-chart-bars"),
    visualChartAddColumn: document.querySelector("#visual-chart-add-column"),
    visualChartRemoveColumn: document.querySelector("#visual-chart-remove-column"),
    slidePresenterNotesEditor: document.querySelector("#slide-presenter-notes-editor"),
    slideNote: document.querySelector("#slide-note"),
    slidePresenterNotes: document.querySelector("#slide-presenter-notes"),
    titleMeta: document.querySelector("#title-meta"),
    subtitleMeta: document.querySelector("#subtitle-meta"),
    noteMeta: document.querySelector("#note-meta"),
    presenterNotesMeta: document.querySelector("#presenter-notes-meta"),
    objectiveMeta: document.querySelector("#objective-meta"),
    evidenceMeta: document.querySelector("#evidence-meta"),
  };

  let state = ns.services.storage.loadState(STORAGE_KEY);
  let hasSlideClipboard = Boolean(ns.services.storage.loadSlideClipboard());
  const undoStack = [];
  const UNDO_LIMIT = 80;
  let scheduledSaveTimer = 0;
  let draggedSlideId = null;
  let draggedListSlideId = null;
  let draggedBulletIndex = null;
  let draggedFreeLinkIndex = null;
  let draggedVisualChartIndex = null;
  let draggedCanvasRevealElementId = null;
  let isAddSlideMenuOpen = false;
  let pendingBulletFocus = null;
  let pendingSubBulletFocus = null;
  let pendingTableFocus = null;
  let selectedTableCell = { row: 0, column: 0 };
  let pendingVisualFieldFocus = null;
  let pendingVisualChartFocus = null;
  let pendingPreviewPanelFocus = false;
  let freeEditorRange = null;
  let suppressFreeEditorBlur = false;
  let canvasTextEditorRange = null;
  let canvasTextSelectionBookmark = null;
  let suppressCanvasTextEditorBlur = false;
  let selectedCanvasElementId = null;
  let activeCanvasInteraction = null;
  let suppressCanvasClickUntil = 0;
  let isPptxExportRunning = false;
  let isPdfExportRunning = false;
  let isCanvasPreviewFullscreen = false;
  let activeUndoEditKey = "";
  const defaultPptxButtonLabel = refs.exportPptx ? refs.exportPptx.textContent : "Exporter PPTX";
  const defaultPdfButtonLabel = refs.exportPdf ? refs.exportPdf.textContent : "Exporter PDF";
  const urlSearchParams = new URLSearchParams(window.location.search);
  const isPresenterMode = urlSearchParams.get("presenter") === "1";
  const isPresentationMode = new URLSearchParams(window.location.search).get("present") === "1";

  if (isPresenterMode) {
    ns.services.presenter.renderPresenterDocument(state);
    return;
  }

  if (isPresentationMode) {
    ns.services.exporter.renderPresentationDocument(state);
    return;
  }

  function persistStateNow() {
    if (scheduledSaveTimer) {
      window.clearTimeout(scheduledSaveTimer);
      scheduledSaveTimer = 0;
    }
    ns.services.storage.saveState(STORAGE_KEY, state);
  }

  function scheduleStateSave() {
    if (scheduledSaveTimer) {
      window.clearTimeout(scheduledSaveTimer);
    }
    scheduledSaveTimer = window.setTimeout(() => {
      scheduledSaveTimer = 0;
      ns.services.storage.saveState(STORAGE_KEY, state);
    }, 180);
  }

  function clearUndoEditSession() {
    activeUndoEditKey = "";
  }

  function getEditableUndoTargetKey() {
    const activeElement = document.activeElement;
    if (!activeElement) {
      return "";
    }

    if (activeElement.matches("input:not([type='checkbox']):not([type='radio']):not([type='file']):not([type='color']), textarea")) {
      const id = activeElement.id || activeElement.name || activeElement.getAttribute("data-undo-key") || "";
      return id ? `${activeElement.tagName.toLowerCase()}:${id}` : "";
    }

    if (activeElement.isContentEditable) {
      const id = activeElement.id || activeElement.getAttribute("data-undo-key") || "";
      return id ? `contenteditable:${id}` : "";
    }

    return "";
  }

  function pushUndoSnapshot(options) {
    const opts = options || {};
    const editKey = opts.editKey === undefined ? getEditableUndoTargetKey() : opts.editKey;
    if (editKey && activeUndoEditKey === editKey) {
      return;
    }

    const snapshot = ns.utils.clone(state);
    const serialized = JSON.stringify(snapshot);
    if (undoStack.length && undoStack[undoStack.length - 1].serialized === serialized) {
      activeUndoEditKey = editKey || "";
      return;
    }

    undoStack.push({ serialized, state: snapshot });
    if (undoStack.length > UNDO_LIMIT) {
      undoStack.shift();
    }
    activeUndoEditKey = editKey || "";
  }

  function syncUndoButton() {
    if (!refs.undoAction) {
      return;
    }
    refs.undoAction.disabled = undoStack.length === 0;
    refs.undoAction.title = undoStack.length
      ? "Annuler la dernière action"
      : "Aucune action à annuler";
  }

  function undoLastAction() {
    if (!undoStack.length) {
      return;
    }
    const previous = undoStack.pop();
    clearUndoEditSession();
    state = ns.services.storage.sanitizeState(ns.utils.clone(previous.state));
    selectedCanvasElementId = null;
    activeCanvasInteraction = null;
    pendingBulletFocus = null;
    pendingSubBulletFocus = null;
    pendingTableFocus = null;
    pendingVisualFieldFocus = null;
    pendingVisualChartFocus = null;
    pendingPreviewPanelFocus = false;
    freeEditorRange = null;
    canvasTextEditorRange = null;
    clearCanvasTextSelectionBookmark();
    render();
  }

  function getStageRenderOptions(selectedSlide) {
    const slide = selectedSlide || getSelectedSlide();
    return {
      compact: false,
      mediaItems: ns.data.augmentMediaItems ? ns.data.augmentMediaItems(state.mediaLibrary || []) : (state.mediaLibrary || []),
      mediaUrls: ns.data.augmentMediaUrlMap ? ns.data.augmentMediaUrlMap(ns.services.media.getUrlMap()) : ns.services.media.getUrlMap(),
      canvasInteractive: true,
      selectedCanvasElementId: selectedCanvasElementId || "",
    };
  }

  function collectPreservedStageMediaNodes() {
    if (!refs.stage) {
      return new Map();
    }

    return Array.from(refs.stage.querySelectorAll("[data-preserve-media-instance]"))
      .reduce((result, node) => {
        const key = node.getAttribute("data-preserve-media-instance");
        if (key) {
          result.set(key, node);
        }
        return result;
      }, new Map());
  }

  function restorePreservedStageMediaNodes(previousNodes) {
    if (!previousNodes || previousNodes.size === 0 || !refs.stage) {
      return;
    }

    refs.stage.querySelectorAll("[data-preserve-media-instance]").forEach((nextNode) => {
      const key = nextNode.getAttribute("data-preserve-media-instance");
      const previousNode = key ? previousNodes.get(key) : null;
      if (!previousNode || previousNode.nodeName !== nextNode.nodeName) {
        return;
      }

      if (previousNode.getAttribute("data-media-id") !== nextNode.getAttribute("data-media-id")) {
        return;
      }

      if (previousNode.getAttribute("data-media-kind") !== nextNode.getAttribute("data-media-kind")) {
        return;
      }

      const parent = nextNode.parentNode;
      if (!parent) {
        return;
      }

      parent.replaceChild(previousNode, nextNode);
    });
  }

  function renderStage(selectedSlide, options) {
    const slide = selectedSlide || getSelectedSlide();
    const opts = options || {};
    const previousMediaNodes = opts.preserveInteractiveMedia ? collectPreservedStageMediaNodes() : null;
    refs.stage.innerHTML = ns.ui.createSlideMarkup(slide, state.settings, getStageRenderOptions(slide));
    if (previousMediaNodes) {
      restorePreservedStageMediaNodes(previousMediaNodes);
    }
  }

  function getSelectedSlide() {
    return state.slides.find((slide) => slide.id === state.selectedSlideId) || state.slides[0];
  }

  function getDefaultCanvasData() {
    return ns.utils.clone(
      (ns.stateFactory && ns.stateFactory.createDefaultCanvasData)
        ? ns.stateFactory.createDefaultCanvasData()
        : { elements: [] }
    );
  }

  function getSelectedCanvasData() {
    return Object.assign(getDefaultCanvasData(), ns.utils.clone((getSelectedSlide() && getSelectedSlide().canvasData) || {}));
  }

  function getCanvasSelectedElement(elements) {
    const items = Array.isArray(elements) ? elements : [];
    return items.find((item) => item.id === selectedCanvasElementId) || null;
  }

  function syncSelectedCanvasElement() {
    const selectedSlide = getSelectedSlide();
    if (!selectedSlide) {
      selectedCanvasElementId = null;
      return;
    }
    const canvasData = getSelectedCanvasData();
    const selectedElement = getCanvasSelectedElement(canvasData.elements);
    if (selectedCanvasElementId && !selectedElement) {
      selectedCanvasElementId = null;
    }
  }

  function updatePptxExportButton(progress) {
    if (!refs.exportPptx) {
      return;
    }

    const detail = progress || {};
    const percent = Math.max(0, Math.min(100, Number(detail.percent) || 0));
    const stateName = detail.state || "idle";
    const label = detail.label || defaultPptxButtonLabel;
    const buttonText = stateName === "running"
      ? `${label} ${percent}%`
      : label;

    refs.exportPptx.textContent = buttonText;
    refs.exportPptx.style.setProperty("--pptx-progress", `${percent}%`);
    refs.exportPptx.classList.toggle("is-exporting", stateName === "running");
    refs.exportPptx.classList.toggle("is-complete", stateName === "completed");
    refs.exportPptx.disabled = stateName === "running";
    refs.exportPptx.setAttribute("aria-busy", stateName === "running" ? "true" : "false");
    refs.exportPptx.title = detail.detail || defaultPptxButtonLabel;

    if (stateName === "completed") {
      window.setTimeout(() => {
        if (isPptxExportRunning) {
          return;
        }
        refs.exportPptx.textContent = defaultPptxButtonLabel;
        refs.exportPptx.style.setProperty("--pptx-progress", "0%");
        refs.exportPptx.classList.remove("is-complete");
        refs.exportPptx.title = defaultPptxButtonLabel;
      }, 1800);
    }

    if (stateName === "idle" || stateName === "error") {
      refs.exportPptx.textContent = defaultPptxButtonLabel;
      refs.exportPptx.style.setProperty("--pptx-progress", "0%");
      refs.exportPptx.classList.remove("is-exporting", "is-complete");
      refs.exportPptx.disabled = false;
      refs.exportPptx.setAttribute("aria-busy", "false");
      refs.exportPptx.title = defaultPptxButtonLabel;
    }
  }

  function updatePdfExportButton(progress) {
    if (!refs.exportPdf) {
      return;
    }

    const detail = progress || {};
    const percent = Math.max(0, Math.min(100, Number(detail.percent) || 0));
    const stateName = detail.state || "idle";
    const label = detail.label || defaultPdfButtonLabel;
    const buttonText = stateName === "running"
      ? `${label} ${percent}%`
      : label;

    refs.exportPdf.textContent = buttonText;
    refs.exportPdf.classList.toggle("is-exporting", stateName === "running");
    refs.exportPdf.classList.toggle("is-complete", stateName === "completed");
    refs.exportPdf.disabled = stateName === "running";
    refs.exportPdf.setAttribute("aria-busy", stateName === "running" ? "true" : "false");
    refs.exportPdf.title = detail.detail || defaultPdfButtonLabel;

    if (stateName === "running") {
      isPdfExportRunning = true;
      return;
    }

    isPdfExportRunning = false;

    if (stateName === "completed") {
      refs.exportPdf.disabled = false;
      refs.exportPdf.setAttribute("aria-busy", "false");
      window.setTimeout(() => {
        if (isPdfExportRunning) {
          return;
        }
        refs.exportPdf.textContent = defaultPdfButtonLabel;
        refs.exportPdf.classList.remove("is-complete");
        refs.exportPdf.title = defaultPdfButtonLabel;
      }, 1800);
    }

    if (stateName === "idle" || stateName === "error") {
      refs.exportPdf.textContent = defaultPdfButtonLabel;
      refs.exportPdf.classList.remove("is-exporting", "is-complete");
      refs.exportPdf.disabled = false;
      refs.exportPdf.setAttribute("aria-busy", "false");
      refs.exportPdf.title = defaultPdfButtonLabel;
    }
  }

  if (ns.services.exporter && typeof ns.services.exporter.setPptxProgressListener === "function") {
    ns.services.exporter.setPptxProgressListener(updatePptxExportButton);
  }
  if (ns.services.exporter && typeof ns.services.exporter.setPdfProgressListener === "function") {
    ns.services.exporter.setPdfProgressListener(updatePdfExportButton);
  }
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin || !event.data || typeof event.data !== "object") {
      return;
    }
    if (event.data.type === "studio-pdf-export-progress") {
      updatePdfExportButton(event.data.detail || {});
      return;
    }
    if (event.data.type === "studio-pdf-export-finished") {
      updatePdfExportButton({
        state: "completed",
        percent: 100,
        label: "Exporter PDF",
        detail: "Export PDF terminé",
      });
      return;
    }
    if (event.data.type === "studio-pdf-export-error") {
      updatePdfExportButton({
        state: "error",
        percent: 0,
        label: "Exporter PDF",
        detail: event.data.detail || "Échec de l'export PDF",
      });
    }
  });

  function render() {
    syncSelectedCanvasElement();
    getSafeSelectedTableCell(getSelectedSlide());
    ns.ui.renderDashboard({ state, refs, selectedCanvasElementId, selectedTableCell });
    syncUndoButton();
    syncSlideClipboardControls();
    syncCanvasPreviewFullscreenUi();
    syncCanvasPreviewFullscreenScale();
    updateCanvasTextToolbarState();
    scheduleStateSave();
    if (pendingBulletFocus) {
      const input = refs.extraBulletsList.querySelector(`[data-extra-bullet-index="${pendingBulletFocus.index}"]`);
      if (input) {
        input.focus();
        const caret = Math.min(pendingBulletFocus.caret, input.value.length);
        input.setSelectionRange(caret, caret);
      }
      pendingBulletFocus = null;
    }
    if (pendingTableFocus) {
      const input = refs.tableEditorGrid.querySelector(`[data-table-cell="${pendingTableFocus.row}-${pendingTableFocus.column}"]`);
      if (input) {
        input.focus();
        const caret = Math.min(pendingTableFocus.caret, input.value.length);
        input.setSelectionRange(caret, caret);
      }
      pendingTableFocus = null;
    }
    if (pendingSubBulletFocus) {
      const input = document.querySelector(
        `[data-sub-bullet-parent="${pendingSubBulletFocus.parentIndex}"][data-sub-bullet-index="${pendingSubBulletFocus.subIndex}"]`
      );
      if (input) {
        input.focus();
        const caret = Math.min(pendingSubBulletFocus.caret, input.value.length);
        input.setSelectionRange(caret, caret);
      }
      pendingSubBulletFocus = null;
    }
    if (pendingVisualFieldFocus) {
      const input = refs[pendingVisualFieldFocus.refKey];
      if (input) {
        input.focus();
        if (typeof input.setSelectionRange === "function") {
          const caret = Math.min(pendingVisualFieldFocus.caret, input.value.length);
          input.setSelectionRange(caret, caret);
        }
      }
      pendingVisualFieldFocus = null;
    }
    if (pendingVisualChartFocus) {
      const input = refs.visualChartBars.querySelector(
        `[data-visual-chart-field="${pendingVisualChartFocus.field}"][data-visual-chart-index="${pendingVisualChartFocus.index}"]`
      );
      if (input) {
        input.focus();
        if (typeof input.setSelectionRange === "function") {
          const caret = Math.min(pendingVisualChartFocus.caret, input.value.length);
          input.setSelectionRange(caret, caret);
        }
      }
      pendingVisualChartFocus = null;
    }
    if (pendingPreviewPanelFocus) {
      refs.previewPanel.focus();
      pendingPreviewPanelFocus = false;
    }
  }

  async function hydrateMediaLibrary() {
    state.mediaLibrary = await ns.services.media.hydrateMediaLibrary(state.mediaLibrary);
    render();
  }

  async function importJsonProject(file) {
    pushUndoSnapshot({ editKey: "" });
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    const nextState = ns.services.storage.sanitizeState(parsed);
    const importedMedia = await ns.services.media.importMediaDataMap(parsed.mediaDataMap || {}, nextState.mediaLibrary || []);
    nextState.mediaLibrary = importedMedia;
    state = nextState;
    closeAddSlideMenu();
    render();
  }

  function syncLiveEditorMeta() {
    const selectedSlide = getSelectedSlide();
    const visualData = selectedSlide.visualData || {};
    const density = ns.ui.computeDensity(selectedSlide);

    refs.titleMeta.textContent = `${selectedSlide.title.length}/72 caractères`;
    refs.subtitleMeta.textContent = `${selectedSlide.subtitle.length}/170 caractères`;
    refs.noteMeta.textContent = `${selectedSlide.note.length}/180 caractères`;
    refs.presenterNotesMeta.textContent = `${(selectedSlide.presenterNotes || "").length}/2000 caractères`;
    refs.objectiveMeta.textContent = `${selectedSlide.objective.length}/180 caractères`;
    refs.evidenceMeta.textContent = `${selectedSlide.evidence.length}/120 caractères`;
    refs.freeBodyMeta.textContent = `${ns.utils.richTextLength(selectedSlide.freeBody || "")}/3200 caractères`;
    refs.visualBodyMeta.textContent = `${(visualData.body || "").length}/320 caractères`;
    refs.visualCalloutMeta.textContent = `${(visualData.callout || "").length}/180 caractères`;
    refs.densityBadge.className = density.className;
    refs.densityBadge.textContent = density.label;
  }

  function updateSettings(key, value, limit, rerender = true) {
    pushUndoSnapshot();
    state.settings[key] = ns.utils.clampText(value, limit);
    if (rerender === false) {
      refreshStageOnly();
      return;
    }
    render();
  }

  function normalizeContentFontScale(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 100;
    }
    return Math.max(85, Math.min(140, Math.round(parsed / 5) * 5));
  }

  function refreshStageOnly() {
    const selectedSlide = getSelectedSlide();
    syncSelectedCanvasElement();
    renderStage(selectedSlide, { preserveInteractiveMedia: true });
    syncLiveEditorMeta();
    scheduleStateSave();
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
        label: ns.utils.clampText(bar && bar.label, 18) || "Point",
        value: clampVisualBarValue(bar && bar.value),
        color: normalizeVisualArrowColor(bar && bar.color),
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
    const linked = ns.utils.extractLinks(text || "");
    if (linked.text) {
      linked.text
        .split(/\r?\n/)
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
        link.textContent = ns.utils.formatUrlLabel(url);
        linksWrap.appendChild(link);
      });
      container.appendChild(linksWrap);
    }
  }

  function createChartLightboxMarkup(chartCard, chartClone) {
    const chartBars = getChartLightboxBars(chartCard);
    const legendMarkup = chartBars.length ? `
      <section class="chart-lightbox-panel">
        <p class="chart-lightbox-kicker">Legende</p>
        <ul class="chart-lightbox-legend">
          ${chartBars.map((bar) => `
            <li class="chart-lightbox-legend-item">
              <span class="chart-lightbox-swatch" style="background:${ns.utils.escapeHtml(bar.color)};"></span>
              <span class="chart-lightbox-legend-label">${ns.utils.escapeHtml(bar.label)}</span>
              <strong class="chart-lightbox-legend-value">${Math.round(bar.value)}%</strong>
            </li>
          `).join("")}
        </ul>
      </section>
    ` : "";
    const wrapper = document.createElement("div");
    wrapper.className = "chart-lightbox-layout";
    wrapper.innerHTML = `
      <div class="chart-lightbox-main"></div>
      <aside class="chart-lightbox-side"${legendMarkup ? "" : " hidden"}>
        ${legendMarkup}
      </aside>
    `;
    wrapper.querySelector(".chart-lightbox-main").appendChild(chartClone);
    const side = wrapper.querySelector(".chart-lightbox-side");
    const bodyText = chartCard.getAttribute("data-chart-body") || "";
    const calloutText = chartCard.getAttribute("data-chart-callout") || "";
    if (bodyText.trim() || calloutText.trim()) {
      const panel = document.createElement("section");
      panel.className = "chart-lightbox-panel";
      panel.innerHTML = `<p class="chart-lightbox-kicker">Texte des indicateurs</p>`;
      if (bodyText.trim()) {
        const copy = document.createElement("div");
        copy.className = "chart-lightbox-copy";
        appendChartLightboxText(copy, bodyText);
        panel.appendChild(copy);
      }
      if (calloutText.trim()) {
        const note = document.createElement("div");
        note.className = "chart-lightbox-note";
        appendChartLightboxText(note, calloutText);
        panel.appendChild(note);
      }
      side.appendChild(panel);
    }
    side.hidden = side.childElementCount === 0;
    return wrapper;
  }

  function openChartLightbox(chartCard) {
    if (!chartCard || !refs.chartLightbox || !refs.chartLightboxContent) {
      return;
    }
    const chartClone = chartCard.cloneNode(true);
    decorateChartCloneForLightbox(chartClone);
    chartClone.classList.remove("slide-reveal-item", "presentation-reveal-hidden", "presentation-reveal-visible");
    chartClone.querySelectorAll(".slide-reveal-item, .presentation-reveal-hidden, .presentation-reveal-visible").forEach((node) => {
      node.classList.remove("slide-reveal-item", "presentation-reveal-hidden", "presentation-reveal-visible");
    });
    refs.chartLightboxContent.innerHTML = "";
    refs.chartLightboxContent.appendChild(createChartLightboxMarkup(chartCard, chartClone));
    refs.chartLightbox.classList.add("is-open");
    refs.chartLightbox.setAttribute("aria-hidden", "false");
  }

  function closeChartLightbox() {
    if (!refs.chartLightbox || !refs.chartLightboxContent) {
      return;
    }
    refs.chartLightbox.classList.remove("is-open");
    refs.chartLightbox.setAttribute("aria-hidden", "true");
    refs.chartLightboxContent.innerHTML = "";
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
    if (!tableNode || !refs.tableLightbox || !refs.tableLightboxContent) {
      return;
    }
    const tableClone = tableNode.cloneNode(true);
    applySlidePaletteVarsToNode(tableNode, tableClone);
    tableClone.querySelectorAll(".slide-reveal-item, .presentation-reveal-hidden, .presentation-reveal-visible").forEach((node) => {
      node.classList.remove("slide-reveal-item", "presentation-reveal-hidden", "presentation-reveal-visible");
    });
    refs.tableLightboxContent.innerHTML = "";
    refs.tableLightboxContent.appendChild(createTableLightboxMarkup(tableClone));
    refs.tableLightbox.classList.add("is-open");
    refs.tableLightbox.setAttribute("aria-hidden", "false");
  }

  function closeTableLightbox() {
    if (!refs.tableLightbox || !refs.tableLightboxContent) {
      return;
    }
    refs.tableLightbox.classList.remove("is-open");
    refs.tableLightbox.setAttribute("aria-hidden", "true");
    refs.tableLightboxContent.innerHTML = "";
  }

  function setView(view) {
    if (view !== "engineering" && view !== "presentation") {
      return;
    }
    closeAddSlideMenu();
    state.view = view;
    render();
  }

  function isPreviewPanelTarget(target) {
    if (!target || !(target instanceof HTMLElement)) {
      return false;
    }

    return refs.previewPanel.contains(target);
  }

  function toggleNightMode() {
    pushUndoSnapshot({ editKey: "" });
    state.uiNightMode = !state.uiNightMode;
    render();
  }

  function toggleGlobalPanel() {
    pushUndoSnapshot({ editKey: "" });
    state.uiGlobalPanelCollapsed = !state.uiGlobalPanelCollapsed;
    render();
  }

  function toggleMediaPanel() {
    pushUndoSnapshot({ editKey: "" });
    state.uiMediaPanelCollapsed = !state.uiMediaPanelCollapsed;
    render();
  }

  function syncCanvasPreviewFullscreenScale() {
    if (!isCanvasPreviewFullscreen || !refs.previewPanel || !refs.stageWrap) {
      if (refs.previewPanel) {
        refs.previewPanel.style.removeProperty("--canvas-editor-scale");
      }
      return;
    }
    const wrapRect = refs.stageWrap.getBoundingClientRect();
    const scale = Math.min(wrapRect.width / 1280, wrapRect.height / 720);
    refs.previewPanel.style.setProperty("--canvas-editor-scale", String(Math.max(scale, 0.1)));
  }

  function setCanvasPreviewFullscreen(nextValue) {
    const active = Boolean(nextValue);
    isCanvasPreviewFullscreen = active;
    refs.previewPanel.classList.toggle("is-canvas-editor-fullscreen", active);
    refs.appShell.classList.toggle("is-canvas-preview-fullscreen", active);
    document.body.classList.toggle("is-canvas-preview-fullscreen", active);
    if (refs.toggleCanvasPreviewFullscreen) {
      refs.toggleCanvasPreviewFullscreen.textContent = active ? "Quitter le plein écran" : "Éditer en plein écran";
      refs.toggleCanvasPreviewFullscreen.setAttribute("aria-pressed", active ? "true" : "false");
    }
    if (active) {
      refs.previewPanel.focus();
      window.requestAnimationFrame(syncCanvasPreviewFullscreenScale);
      return;
    }
    syncCanvasPreviewFullscreenScale();
  }

  function toggleCanvasPreviewFullscreen() {
    const slide = getSelectedSlide();
    if (!slide) {
      return;
    }
    setCanvasPreviewFullscreen(!isCanvasPreviewFullscreen);
  }

  function syncCanvasPreviewFullscreenUi() {
    if (!refs.toggleCanvasPreviewFullscreen) {
      return;
    }
    refs.toggleCanvasPreviewFullscreen.hidden = false;
    refs.toggleCanvasPreviewFullscreen.disabled = false;
    refs.toggleCanvasPreviewFullscreen.textContent = isCanvasPreviewFullscreen ? "Quitter le plein écran" : "Éditer en plein écran";
    refs.toggleCanvasPreviewFullscreen.setAttribute("aria-pressed", isCanvasPreviewFullscreen ? "true" : "false");
  }

  function toggleThumbStrip() {
    state.uiThumbStripCollapsed = !state.uiThumbStripCollapsed;
    render();
  }

  function updateSelectedSlide(patch, rerender = true) {
    pushUndoSnapshot();
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      return Object.assign({}, slide, patch);
    });
    if (rerender === false) {
      refreshStageOnly();
      return;
    }
    render();
  }

  function updateSelectedTableCell(rowIndex, columnIndex, value, rerender = true) {
    pushUndoSnapshot();
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const table = normalizeTable(slide.table);
      table[rowIndex][columnIndex] = value;
      return Object.assign({}, slide, { table });
    });
    if (rerender === false) {
      refreshStageOnly();
      return;
    }
    render();
  }

  function resizeSelectedTable(nextRows, nextCols) {
    pushUndoSnapshot({ editKey: "" });
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const table = normalizeTable(slide.table, nextRows, nextCols);
      const tableHighlights = sanitizeTableHighlightsForSize(slide.tableHighlights, table.length, table[0] ? table[0].length : 0);
      return Object.assign({}, slide, { table, tableHighlights });
    });
    getSafeSelectedTableCell(getSelectedSlide());
    render();
  }

  function getDefaultVisualData() {
    return ns.utils.clone(ns.stateFactory.createDefaultVisualData());
  }

  function getSelectedVisualData() {
    return Object.assign(getDefaultVisualData(), ns.utils.clone((getSelectedSlide() && getSelectedSlide().visualData) || {}));
  }

  function normalizeVisualArrowColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value.toLowerCase() : "#60b2e5";
  }

  function clampVisualBarValue(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : 0;
  }

  function updateSelectedVisualData(patch, rerender = true) {
    const current = getSelectedVisualData();
    updateSelectedSlide({
      visualData: Object.assign({}, current, patch),
    }, rerender);
  }

  function updateSelectedVisualChartBar(index, patch, rerender = true) {
    const current = getSelectedVisualData();
    const nextBars = current.chartBars.map((bar, barIndex) => barIndex === index ? Object.assign({}, bar, patch) : bar);
    updateSelectedVisualData({ chartBars: nextBars }, rerender);
  }

  function getDefaultVisualChartBar(index) {
    const defaults = getDefaultVisualData().chartBars || [];
    return ns.utils.clone(defaults[index] || defaults[defaults.length - 1] || {
      label: `Point ${index + 1}`,
      value: 50,
      color: "#60b2e5",
    });
  }

  function normalizeVisualChartBars(bars) {
    const normalized = Array.isArray(bars) ? bars.slice(0, 6).map((bar, index) => ({
      label: ns.utils.clampText(bar && bar.label, 18) || "",
      value: clampVisualBarValue(bar && bar.value),
      color: normalizeVisualArrowColor(bar && bar.color),
    })) : [];

    while (normalized.length < 6) {
      normalized.push(getDefaultVisualChartBar(normalized.length));
    }

    return normalized;
  }

  function getVisibleVisualChartBars() {
    const current = getSelectedVisualData();
    const count = Math.max(1, Math.min(6, Number(current.chartBarCount) || 3));
    return {
      count,
      bars: normalizeVisualChartBars(current.chartBars),
    };
  }

  function addSelectedVisualChartBar() {
    const current = getSelectedVisualData();
    const count = Math.max(1, Math.min(6, Number(current.chartBarCount) || 3));
    if (count >= 6) {
      return;
    }
    const nextBars = normalizeVisualChartBars(current.chartBars);
    nextBars.splice(count, 0, getDefaultVisualChartBar(count));
    nextBars.length = 6;
    pendingVisualChartFocus = { index: count, field: "label", caret: 0 };
    updateSelectedVisualData({
      chartBarCount: count + 1,
      chartBars: nextBars,
    });
  }

  function removeSelectedVisualChartBar(index) {
    const current = getSelectedVisualData();
    const count = Math.max(1, Math.min(6, Number(current.chartBarCount) || 3));
    if (count <= 1 || index < 0 || index >= count) {
      return;
    }
    const nextBars = normalizeVisualChartBars(current.chartBars);
    nextBars.splice(index, 1);
    nextBars.push(getDefaultVisualChartBar(nextBars.length));
    nextBars.length = 6;
    updateSelectedVisualData({
      chartBarCount: count - 1,
      chartBars: nextBars,
    });
  }

  function moveSelectedVisualChartBar(fromIndex, toIndex) {
    const current = getSelectedVisualData();
    const count = Math.max(1, Math.min(6, Number(current.chartBarCount) || 3));
    if (
      fromIndex === toIndex ||
      fromIndex < 0 || fromIndex >= count ||
      toIndex < 0 || toIndex >= count
    ) {
      return;
    }
    const nextBars = normalizeVisualChartBars(current.chartBars);
    const visible = nextBars.slice(0, count);
    const hidden = nextBars.slice(count);
    const [moved] = visible.splice(fromIndex, 1);
    visible.splice(toIndex, 0, moved);
    updateSelectedVisualData({
      chartBars: visible.concat(hidden).slice(0, 6),
    });
  }

  function assignVisualMedia(mediaId) {
    const current = getSelectedVisualData();
    if (!mediaId || mediaId === current.primaryMediaId || mediaId === current.secondaryMediaId) {
      return;
    }

    if (!current.primaryMediaId) {
      updateSelectedVisualData({ primaryMediaId: mediaId });
      return;
    }

    if (!current.secondaryMediaId) {
      updateSelectedVisualData({ secondaryMediaId: mediaId });
      return;
    }

    updateSelectedVisualData({ secondaryMediaId: mediaId });
  }

  function clampCanvasMetric(value, fallback, min, max) {
    const parsed = Number(value);
    const safeValue = Number.isFinite(parsed) ? parsed : fallback;
    const lowerBound = Number.isFinite(min) ? min : 0;
    const upperBound = Number.isFinite(max) ? max : 100;
    const clamped = Math.max(lowerBound, Math.min(upperBound, safeValue));
    return Math.round(clamped * 10) / 10;
  }

  function normalizeCanvasColor(value, fallback) {
    return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value.toLowerCase() : (fallback || "#1d1917");
  }

  function getCanvasFontOptionIds() {
    return ((ns.data && ns.data.fontOptions) || []).map((item) => item.id);
  }

  function getCanvasFontOption(fontOptionId) {
    const fontOptions = (ns.data && ns.data.fontOptions) || [];
    return fontOptions.find((item) => item.id === fontOptionId) || fontOptions[0] || {
      id: "studio",
      label: "Studio",
      body: '"Aptos", "Segoe UI", "Trebuchet MS", sans-serif',
      heading: '"Iowan Old Style", "Georgia", serif',
    };
  }

  function normalizeCanvasFontOptionId(value) {
    const fontId = typeof value === "string" ? value.trim() : "";
    if (!fontId) {
      return "";
    }
    return getCanvasFontOptionIds().includes(fontId) ? fontId : "";
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

  function normalizeCanvasRevealGroup(value) {
    const normalized = String(value || '').trim().toUpperCase();
    return /^[A-Z]$/.test(normalized) ? normalized : '';
  }

  function normalizeCanvasElement(element, index) {
    const input = element && typeof element === "object" ? element : {};
    const type = input.type === "image" || input.type === "arrow" || input.type === "shape" ? input.type : "text";
    const normalized = {
      id: typeof input.id === "string" && input.id ? input.id : ns.utils.createId("canvas"),
      type,
      x: clampCanvasMetric(input.x, 10 + ((index % 3) * 8), 0, 94),
      y: clampCanvasMetric(input.y, 12 + ((index % 4) * 6), -14, 94),
      w: clampCanvasMetric(input.w, type === "arrow" ? 18 : type === "image" ? 28 : type === "shape" ? 22 : 34, 6, 100),
      h: clampCanvasMetric(input.h, type === "arrow" ? 10 : type === "image" ? 30 : type === "shape" ? 22 : 18, 6, 100),
      revealOrder: Math.max(1, Math.min(24, Math.round(Number(input.revealOrder) || (index + 1)))),
      revealGroup: normalizeCanvasRevealGroup(input.revealGroup),
      locked: Boolean(input.locked),
    };

    normalized.w = Math.min(normalized.w, Math.max(6, 100 - normalized.x));
    normalized.h = Math.min(normalized.h, Math.max(6, 100 - Math.max(0, normalized.y)));

    if (type === "image") {
      normalized.mediaId = ns.utils.clampText(input.mediaId, 80);
      return normalized;
    }

    if (type === "arrow") {
      normalized.direction = input.direction === "up" || input.direction === "down" || input.direction === "left" ? input.direction : "right";
      normalized.color = normalizeCanvasColor(input.color, "#0a66ff");
      normalized.rotation = normalizeCanvasRotation(input.rotation, 0);
      normalized.arrowLength = normalizeCanvasArrowLength(input.arrowLength, 100);
      return normalized;
    }

    if (type === "shape") {
      normalized.shapeKind = normalizeCanvasShapeKind(input.shapeKind);
      normalized.color = normalizeCanvasColor(input.color, "#0a66ff");
      return normalized;
    }

    const fallbackText = ns.utils.plainTextToRichHtml("Zone de texte", 2000);
    normalized.text = typeof input.text === "string" ? ns.utils.sanitizeRichText(input.text, 2000) : fallbackText;
    normalized.fontSize = clampCanvasMetric(input.fontSize, 28, 16, 72);
    normalized.fontOptionId = normalizeCanvasFontOptionId(input.fontOptionId);
    normalized.color = normalizeCanvasColor(input.color, "#1d1917");
    normalized.showFrame = input.showFrame !== false;
    normalized.bold = Boolean(input.bold);
    normalized.italic = Boolean(input.italic);
    normalized.underline = Boolean(input.underline);
    return normalized;
  }

  function normalizeCanvasElements(elements) {
    return Array.isArray(elements) ? elements.slice(0, 24).map(normalizeCanvasElement).filter(Boolean) : [];
  }

  function updateSelectedCanvasData(patch, rerender = true) {
    const current = getSelectedCanvasData();
    updateSelectedSlide({
      canvasData: Object.assign({}, current, patch),
    }, rerender);
  }

  function updateCanvasElements(transform, rerender = true) {
    const current = getSelectedCanvasData();
    const nextElements = normalizeCanvasElements(typeof transform === "function" ? transform(current.elements.slice()) : current.elements);
    updateSelectedCanvasData({ elements: nextElements }, rerender);
  }

  function createCanvasElement(type, patch) {
    const base = {
      text: {
        id: ns.utils.createId("canvas"),
        type: "text",
        x: 8,
        y: 18,
        w: 36,
        h: 18,
        revealOrder: 1,
        revealGroup: "",
        text: ns.utils.plainTextToRichHtml("Nouvelle zone de texte", 2000),
        fontSize: 28,
        fontOptionId: "",
        color: "#1d1917",
        showFrame: true,
        bold: false,
        italic: false,
        underline: false,
        locked: false,
      },
      image: {
        id: ns.utils.createId("canvas"),
        type: "image",
        x: 54,
        y: 20,
        w: 24,
        h: 30,
        revealOrder: 1,
        revealGroup: "",
        mediaId: "",
        locked: false,
      },
      arrow: {
        id: ns.utils.createId("canvas"),
        type: "arrow",
        x: 42,
        y: 38,
        w: 18,
        h: 10,
        revealOrder: 1,
        revealGroup: "",
        direction: "right",
        color: "#0a66ff",
        rotation: 0,
        arrowLength: 100,
        locked: false,
      },
      shape: {
        id: ns.utils.createId("canvas"),
        type: "shape",
        x: 40,
        y: 26,
        w: 20,
        h: 20,
        revealOrder: 1,
        revealGroup: "",
        shapeKind: "circle",
        color: "#0a66ff",
        locked: false,
      },
    };

    return normalizeCanvasElement(Object.assign({}, base[type] || base.text, patch), 0);
  }

  function addCanvasElement(type, patch) {
    const current = getSelectedCanvasData();
    const nextRevealOrder = (Array.isArray(current.elements) ? current.elements : [])
      .reduce((max, element) => Math.max(max, Math.round(Number(element.revealOrder) || 0)), 0) + 1;
    const nextElement = createCanvasElement(type, Object.assign({
      revealOrder: nextRevealOrder,
    }, patch));
    selectedCanvasElementId = nextElement.id;
    updateCanvasElements((elements) => elements.concat(nextElement));
  }

  function updateCanvasElementById(elementId, patch, rerender = true) {
    if (!elementId) {
      return;
    }
    updateCanvasElements((elements) => elements.map((element) => {
      if (element.id !== elementId) {
        return element;
      }
      return Object.assign({}, element, patch);
    }), rerender);
  }

  function removeCanvasElementById(elementId) {
    if (!elementId) {
      return;
    }
    updateCanvasElements((elements) => elements.filter((element) => element.id !== elementId));
    if (selectedCanvasElementId === elementId) {
      selectedCanvasElementId = null;
    }
  }

  function removeSelectedCanvasElement() {
    removeCanvasElementById(selectedCanvasElementId);
  }

  function duplicateSelectedCanvasElement() {
    const current = getSelectedCanvasData();
    const source = getCanvasSelectedElement(current.elements);
    if (!source || current.elements.length >= 24) {
      return;
    }
    const nextRevealOrder = (Array.isArray(current.elements) ? current.elements : [])
      .reduce((max, element) => Math.max(max, Math.round(Number(element.revealOrder) || 0)), 0) + 1;
    const duplicated = normalizeCanvasElement(Object.assign({}, source, {
      id: ns.utils.createId("canvas"),
      x: clampCanvasMetric((Number(source.x) || 0) + 2.5, Number(source.x) || 0, 0, 94),
      y: clampCanvasMetric((Number(source.y) || 0) + 2.5, Number(source.y) || 0, -14, 94),
      revealOrder: nextRevealOrder,
      locked: false,
    }), current.elements.length);
    selectedCanvasElementId = duplicated.id;
    updateCanvasElements((elements) => elements.concat(duplicated));
  }

  function toggleCanvasElementLock(elementId) {
    const current = getSelectedCanvasData();
    const target = (current.elements || []).find((element) => element.id === elementId);
    if (!target) {
      return;
    }
    const nextLocked = !Boolean(target.locked);
    if (nextLocked && selectedCanvasElementId === elementId) {
      selectedCanvasElementId = null;
    }
    updateCanvasElementById(elementId, { locked: nextLocked });
  }

  function moveCanvasLayer(elementId, direction) {
    const current = getSelectedCanvasData();
    const elements = Array.isArray(current.elements) ? current.elements.slice() : [];
    const sourceIndex = elements.findIndex((element) => element.id === elementId);
    if (sourceIndex === -1) {
      return;
    }
    const targetIndex = direction === "up"
      ? Math.min(elements.length - 1, sourceIndex + 1)
      : Math.max(0, sourceIndex - 1);
    if (targetIndex === sourceIndex) {
      return;
    }
    updateCanvasElements((items) => {
      const nextItems = items.slice();
      const fromIndex = nextItems.findIndex((element) => element.id === elementId);
      if (fromIndex === -1) {
        return nextItems;
      }
      const toIndex = direction === "up"
        ? Math.min(nextItems.length - 1, fromIndex + 1)
        : Math.max(0, fromIndex - 1);
      const moved = nextItems.splice(fromIndex, 1)[0];
      nextItems.splice(toIndex, 0, moved);
      return nextItems;
    });
  }

  function addCanvasMediaElement(mediaId) {
    if (!mediaId) {
      return;
    }
    const selectedElement = getCanvasSelectedElement(getSelectedCanvasData().elements);
    if (selectedElement && selectedElement.type === "image") {
      updateCanvasElementById(selectedElement.id, { mediaId });
      return;
    }
    addCanvasElement("image", { mediaId });
  }

  function getPictoPlacementRect(placement, sizePreset) {
    const sizeMap = {
      sm: { w: 8.5, h: 14 },
      md: { w: 11, h: 18 },
      lg: { w: 14, h: 22 },
    };
    const size = sizeMap[sizePreset] || sizeMap.md;
    const placements = {
      "title-right": { x: 76, y: 7 },
      "top-right": { x: 83, y: 5 },
      "top-left": { x: 4, y: 5 },
      "middle-right": { x: 84, y: 34 },
      "bullet-side": { x: 73, y: 28 },
      "bottom-right": { x: 84, y: 68 },
      "bottom-left": { x: 6, y: 68 },
      center: { x: 44.5, y: 38 },
    };
    const base = placements[placement] || placements["title-right"];
    return {
      x: base.x,
      y: base.y,
      w: size.w,
      h: size.h,
    };
  }

  function addPictoElement(mediaId) {
    if (!mediaId) {
      return;
    }
    const placement = refs.pictoPlacement ? refs.pictoPlacement.value : "title-right";
    const sizePreset = refs.pictoSize ? refs.pictoSize.value : "md";
    const selectedElement = getCanvasSelectedElement(getSelectedCanvasData().elements);
    if (selectedElement && selectedElement.type === "image") {
      updateCanvasElementById(selectedElement.id, { mediaId });
      return;
    }
    addCanvasElement("image", Object.assign({ mediaId }, getPictoPlacementRect(placement, sizePreset), { locked: false }));
  }

  function updateSelectedCanvasElement(patch, rerender = true) {
    if (!selectedCanvasElementId) {
      return;
    }
    updateCanvasElementById(selectedCanvasElementId, patch, rerender);
  }

  function getCanvasRevealOrderItems(elements) {
    return (Array.isArray(elements) ? elements : [])
      .slice()
      .sort((a, b) => {
        const orderDelta = (Number(a.revealOrder) || 0) - (Number(b.revealOrder) || 0);
        if (orderDelta !== 0) {
          return orderDelta;
        }
        return String(a.id || "").localeCompare(String(b.id || ""));
      });
  }

  function moveCanvasRevealOrder(elementId, direction) {
    if (!elementId || (direction !== "up" && direction !== "down")) {
      return;
    }
    const ordered = getCanvasRevealOrderItems(getSelectedCanvasData().elements);
    const currentIndex = ordered.findIndex((item) => item.id === elementId);
    if (currentIndex < 0) {
      return;
    }
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= ordered.length) {
      return;
    }
    const currentOrder = ordered[currentIndex].revealOrder;
    const targetOrder = ordered[targetIndex].revealOrder;
    updateCanvasElements((elements) => elements.map((element) => {
      if (element.id === elementId) {
        return Object.assign({}, element, { revealOrder: targetOrder });
      }
      if (element.id === ordered[targetIndex].id) {
        return Object.assign({}, element, { revealOrder: currentOrder });
      }
      return element;
    }));
  }

  function moveCanvasRevealToIndex(elementId, targetIndex) {
    if (!elementId || !Number.isInteger(targetIndex)) {
      return;
    }
    const ordered = getCanvasRevealOrderItems(getSelectedCanvasData().elements);
    const currentIndex = ordered.findIndex((item) => item.id === elementId);
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length || currentIndex === targetIndex) {
      return;
    }
    const reordered = ordered.slice();
    const [movedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);
    const revealOrderMap = new Map(reordered.map((item, index) => [item.id, index + 1]));
    updateCanvasElements((elements) => elements.map((element) => {
      if (!revealOrderMap.has(element.id)) {
        return element;
      }
      return Object.assign({}, element, { revealOrder: revealOrderMap.get(element.id) });
    }));
  }

  function saveCanvasTextEditorSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!refs.canvasTextContent.contains(range.commonAncestorContainer)) {
      return;
    }
    const startRange = document.createRange();
    startRange.selectNodeContents(refs.canvasTextContent);
    startRange.setEnd(range.startContainer, range.startOffset);
    const endRange = document.createRange();
    endRange.selectNodeContents(refs.canvasTextContent);
    endRange.setEnd(range.endContainer, range.endOffset);
    canvasTextEditorRange = {
      start: startRange.toString().length,
      end: endRange.toString().length,
    };
  }

  function clearCanvasTextSelectionBookmark() {
    if (!canvasTextSelectionBookmark) {
      return;
    }
    ["startId", "endId"].forEach((key) => {
      const markerId = canvasTextSelectionBookmark[key];
      if (!markerId) {
        return;
      }
      const marker = refs.canvasTextContent.querySelector(`[data-canvas-selection-marker-id="${markerId}"]`);
      if (marker && marker.parentNode) {
        marker.parentNode.removeChild(marker);
      }
    });
    canvasTextSelectionBookmark = null;
  }

  function createCanvasTextSelectionBookmark() {
    clearCanvasTextSelectionBookmark();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return false;
    }
    const range = selection.getRangeAt(0);
    if (!refs.canvasTextContent.contains(range.commonAncestorContainer)) {
      return false;
    }

    const startId = ns.utils.createId("canvas-sel-start");
    const endId = ns.utils.createId("canvas-sel-end");
    const startMarker = document.createElement("span");
    const endMarker = document.createElement("span");
    startMarker.setAttribute("data-canvas-selection-marker-id", startId);
    endMarker.setAttribute("data-canvas-selection-marker-id", endId);
    startMarker.setAttribute("aria-hidden", "true");
    endMarker.setAttribute("aria-hidden", "true");
    startMarker.style.display = "inline-block";
    endMarker.style.display = "inline-block";
    startMarker.style.width = "0";
    endMarker.style.width = "0";
    startMarker.style.overflow = "hidden";
    endMarker.style.overflow = "hidden";
    startMarker.style.lineHeight = "0";
    endMarker.style.lineHeight = "0";

    const endRange = range.cloneRange();
    endRange.collapse(false);
    endRange.insertNode(endMarker);

    const startRange = range.cloneRange();
    startRange.collapse(true);
    startRange.insertNode(startMarker);

    canvasTextSelectionBookmark = { startId, endId };
    return true;
  }

  function restoreCanvasTextSelectionBookmark() {
    if (!canvasTextSelectionBookmark) {
      return null;
    }

    const startMarker = refs.canvasTextContent.querySelector(
      `[data-canvas-selection-marker-id="${canvasTextSelectionBookmark.startId}"]`
    );
    const endMarker = refs.canvasTextContent.querySelector(
      `[data-canvas-selection-marker-id="${canvasTextSelectionBookmark.endId}"]`
    );
    if (!startMarker || !endMarker) {
      clearCanvasTextSelectionBookmark();
      return null;
    }

    const range = document.createRange();
    range.setStartAfter(startMarker);
    range.setEndBefore(endMarker);
    startMarker.remove();
    endMarker.remove();
    canvasTextSelectionBookmark = null;

    const selection = window.getSelection();
    if (!selection) {
      return null;
    }
    selection.removeAllRanges();
    selection.addRange(range);
    return { selection, range };
  }

  function restoreCanvasTextEditorSelection() {
    const selection = window.getSelection();
    const saved = canvasTextEditorRange;
    if (!selection || !saved) {
      return false;
    }
    const textWalker = document.createTreeWalker(refs.canvasTextContent, NodeFilter.SHOW_TEXT);
    let currentNode = textWalker.nextNode();
    let charIndex = 0;
    let startNode = null;
    let endNode = null;
    let startOffset = 0;
    let endOffset = 0;

    while (currentNode) {
      const nextCharIndex = charIndex + currentNode.textContent.length;
      if (!startNode && saved.start <= nextCharIndex) {
        startNode = currentNode;
        startOffset = Math.max(0, saved.start - charIndex);
      }
      if (!endNode && saved.end <= nextCharIndex) {
        endNode = currentNode;
        endOffset = Math.max(0, saved.end - charIndex);
        break;
      }
      charIndex = nextCharIndex;
      currentNode = textWalker.nextNode();
    }

    if (!startNode || !endNode) {
      return false;
    }

    const range = document.createRange();
    range.setStart(startNode, Math.min(startOffset, startNode.textContent.length));
    range.setEnd(endNode, Math.min(endOffset, endNode.textContent.length));
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }

  function markCanvasTextEditorToolbarInteraction() {
    suppressCanvasTextEditorBlur = true;
    window.setTimeout(() => {
      suppressCanvasTextEditorBlur = false;
    }, 0);
  }

  function getCanvasTextEditorFormatAncestorForNode(node, tagName) {
    let current = node && node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
    while (current && current !== refs.canvasTextContent) {
      if (current.nodeType === Node.ELEMENT_NODE && current.tagName.toLowerCase() === tagName) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function findCanvasTextEditorFormatAncestor(range, tagName) {
    if (!range) {
      return null;
    }

    const commonAncestor = getCanvasTextEditorFormatAncestorForNode(range.commonAncestorContainer, tagName);
    if (commonAncestor) {
      return commonAncestor;
    }

    const startAncestor = getCanvasTextEditorFormatAncestorForNode(range.startContainer, tagName);
    const endAncestor = getCanvasTextEditorFormatAncestorForNode(range.endContainer, tagName);
    if (startAncestor && endAncestor && startAncestor === endAncestor) {
      return startAncestor;
    }

    return null;
  }

  function unwrapCanvasTextEditorFormat(element) {
    if (!element || !element.parentNode) {
      return;
    }

    const parent = element.parentNode;
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  }

  function updateCanvasTextToolbarState() {
    let activeBold = false;
    let activeItalic = false;
    let activeUnderline = false;
    let activeBullets = false;
    const selectedElement = getCanvasSelectedElement(getSelectedCanvasData().elements);
    const activeColor = selectedElement && selectedElement.type === "text"
      ? normalizeCanvasColor(selectedElement.color, "#1d1917")
      : "#1d1917";

    const selection = window.getSelection();
    if (document.activeElement === refs.canvasTextContent && selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (refs.canvasTextContent.contains(range.commonAncestorContainer)) {
        activeBold = Boolean(findCanvasTextEditorFormatAncestor(range, "strong"));
        activeItalic = Boolean(findCanvasTextEditorFormatAncestor(range, "em"));
        activeUnderline = Boolean(findCanvasTextEditorFormatAncestor(range, "u"));
        activeBullets = Boolean(findCanvasTextEditorFormatAncestor(range, "ul") || findCanvasTextEditorFormatAncestor(range, "li"));
      }
    }

    refs.canvasTextBold.classList.toggle("is-active", activeBold);
    refs.canvasTextBold.setAttribute("aria-pressed", activeBold ? "true" : "false");
    refs.canvasTextItalic.classList.toggle("is-active", activeItalic);
    refs.canvasTextItalic.setAttribute("aria-pressed", activeItalic ? "true" : "false");
    refs.canvasTextUnderline.classList.toggle("is-active", activeUnderline);
    refs.canvasTextUnderline.setAttribute("aria-pressed", activeUnderline ? "true" : "false");
    refs.canvasTextBullets.classList.toggle("is-active", activeBullets);
    refs.canvasTextBullets.setAttribute("aria-pressed", activeBullets ? "true" : "false");
    document.querySelectorAll("[data-canvas-text-color-value]").forEach((button) => {
      button.classList.toggle(
        "is-active",
        normalizeCanvasColor(button.getAttribute("data-canvas-text-color-value"), "#1d1917") === activeColor
      );
    });
  }

  function normalizeCanvasTextEditorMarkup(assignToEditor) {
    const selectedElement = getCanvasSelectedElement(getSelectedCanvasData().elements);
    if (!selectedElement || selectedElement.type !== "text") {
      return;
    }
    const sanitized = ns.utils.sanitizeRichText(refs.canvasTextContent.innerHTML, 2000);
    if (assignToEditor) {
      refs.canvasTextContent.innerHTML = sanitized;
    }
    updateSelectedCanvasElement({
      text: sanitized,
    }, false);
    updateCanvasTextToolbarState();
  }

  function applyCanvasTextEditorFontFamily(fontOptionId) {
    const normalizedFontOptionId = normalizeCanvasFontOptionId(fontOptionId);
    const font = getCanvasFontOption(normalizedFontOptionId || state.settings.font || "studio");
    refs.canvasTextContent.style.fontFamily = font.body || "";
  }

  function selectionCoversCanvasText(range) {
    if (!range) {
      return false;
    }
    const selectedText = String(range.toString() || "").replace(/\s+/g, " ").trim();
    const fullText = String(refs.canvasTextContent.textContent || "").replace(/\s+/g, " ").trim();
    return Boolean(selectedText) && selectedText === fullText;
  }

  function clearCanvasTextEditorFontSizeStyles() {
    refs.canvasTextContent.querySelectorAll("span[style]").forEach((span) => {
      const nextStyle = String(span.getAttribute("style") || "")
        .replace(/(^|;)\s*font-size\s*:[^;]+;?/gi, "$1")
        .replace(/;{2,}/g, ";")
        .trim()
        .replace(/^;+|;+$/g, "");
      if (nextStyle) {
        span.setAttribute("style", nextStyle);
      } else {
        span.removeAttribute("style");
      }
    });
  }

  function syncCanvasTextEditorBaseFontSize(size) {
    const normalizedSize = Math.round(clampCanvasMetric(size, 28, 16, 72));
    clearCanvasTextEditorFontSizeStyles();
    refs.canvasTextContent.style.fontSize = normalizedSize + "px";
    refs.canvasTextSizeValue.textContent = normalizedSize + " px";
    updateSelectedCanvasElement({
      fontSize: normalizedSize,
      text: ns.utils.sanitizeRichText(refs.canvasTextContent.innerHTML, 2000),
    }, false);
  }

  function applyCanvasTextEditorFontSize(size) {
    const normalizedSize = Math.round(clampCanvasMetric(size, 28, 16, 72));
    const selectionData = getCanvasTextEditorSelection();
    if (!selectionData || selectionData.selection.isCollapsed || selectionCoversCanvasText(selectionData.range)) {
      syncCanvasTextEditorBaseFontSize(normalizedSize);
      return;
    }

    const selection = selectionData.selection;
    const range = selectionData.range;
    const wrapper = document.createElement("span");
    wrapper.setAttribute("style", "font-size:" + normalizedSize + "px;");
    try {
      const content = range.extractContents();
      wrapper.appendChild(content);
      range.insertNode(wrapper);
      range.selectNodeContents(wrapper);
      selection.removeAllRanges();
      selection.addRange(range);
      refs.canvasTextSizeValue.textContent = normalizedSize + " px";
      saveCanvasTextEditorSelection();
      normalizeCanvasTextEditorMarkup(false);
    } catch (error) {
      return;
    }
  }


  function getCanvasTextEditorSelection() {
    const selectedElement = getCanvasSelectedElement(getSelectedCanvasData().elements);
    if (!selectedElement || selectedElement.type !== "text") {
      return null;
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const liveRange = selection.getRangeAt(0);
      if (refs.canvasTextContent.contains(liveRange.commonAncestorContainer)) {
        return { selection, range: liveRange };
      }
    }

    const bookmarkedSelection = restoreCanvasTextSelectionBookmark();
    if (bookmarkedSelection) {
      return bookmarkedSelection;
    }

    if (document.activeElement !== refs.canvasTextContent) {
      refs.canvasTextContent.focus({ preventScroll: true });
    }

    if (!restoreCanvasTextEditorSelection()) {
      return null;
    }

    const restoredSelection = window.getSelection();
    if (!restoredSelection || restoredSelection.rangeCount === 0) {
      return null;
    }

    const range = restoredSelection.getRangeAt(0);
    if (!refs.canvasTextContent.contains(range.commonAncestorContainer)) {
      return null;
    }

    return { selection: restoredSelection, range };
  }

  function applyCanvasTextEditorTextColor(color) {
    const normalizedColor = normalizeCanvasColor(color, "#1d1917");
    const selectionData = getCanvasTextEditorSelection();
    if (!selectionData) {
      return;
    }

    const selection = selectionData.selection;
    const range = selectionData.range;
    if (selection.isCollapsed) {
      return;
    }

    try {
      document.execCommand("styleWithCSS", false, true);
      document.execCommand("foreColor", false, normalizedColor);
      saveCanvasTextEditorSelection();
      normalizeCanvasTextEditorMarkup(false);
    } catch (error) {
      return;
    }
  }

  function applyCanvasTextEditorInlineTag(tagName) {
    const selectionData = getCanvasTextEditorSelection();
    if (!selectionData || selectionData.selection.isCollapsed) {
      return;
    }

    const command = tagName === "strong" ? "bold" : tagName === "em" ? "italic" : tagName === "u" ? "underline" : "";
    if (!command) {
      return;
    }

    try {
      document.execCommand(command, false);
      saveCanvasTextEditorSelection();
      normalizeCanvasTextEditorMarkup(false);
    } catch (error) {
      return;
    }
  }

  function applyCanvasTextEditorBullets() {
    const selectionData = getCanvasTextEditorSelection();
    if (!selectionData) {
      return;
    }

    try {
      document.execCommand("insertUnorderedList", false);
      saveCanvasTextEditorSelection();
      normalizeCanvasTextEditorMarkup(false);
    } catch (error) {
      return;
    }
  }

  function insertCanvasTextEditorLineBreak() {
    if (!restoreCanvasTextEditorSelection()) {
      refs.canvasTextContent.focus();
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!refs.canvasTextContent.contains(range.commonAncestorContainer)) {
      return;
    }

    const br = document.createElement("br");
    const spacer = document.createTextNode("");
    range.deleteContents();
    range.insertNode(br);
    range.setStartAfter(br);
    range.insertNode(spacer);
    range.setStartAfter(spacer);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    saveCanvasTextEditorSelection();
    normalizeCanvasTextEditorMarkup(false);
  }

  function updateStageCanvasSelection(elementId) {
    selectedCanvasElementId = elementId || null;
    canvasTextEditorRange = null;
    clearCanvasTextSelectionBookmark();
    refs.stage.querySelectorAll("[data-canvas-element-id]").forEach((node) => {
      node.classList.toggle("is-selected", node.getAttribute("data-canvas-element-id") === selectedCanvasElementId);
    });
    updateCanvasTextToolbarState();
  }

  function getCanvasSurfaceRect() {
    const surface = refs.stage.querySelector("[data-canvas-surface]");
    if (!surface) {
      return null;
    }
    return {
      surface,
      rect: surface.getBoundingClientRect(),
    };
  }

  function beginCanvasInteraction(event, elementId, mode) {
    if (event.button !== 0) {
      return;
    }
    const slide = getSelectedSlide();
    if (!slide) {
      return;
    }
    const canvasData = getSelectedCanvasData();
    const element = canvasData.elements.find((item) => item.id === elementId);
    const surfaceData = getCanvasSurfaceRect();
    const elementNode = refs.stage.querySelector(`[data-canvas-element-id="${elementId}"]`);
    if (!element || element.locked || !surfaceData || !elementNode) {
      return;
    }

    event.preventDefault();
    pushUndoSnapshot({ editKey: "" });
    updateStageCanvasSelection(elementId);
    const elementRect = elementNode.getBoundingClientRect();
    const elementCenterX = elementRect.left + (elementRect.width / 2);
    const elementCenterY = elementRect.top + (elementRect.height / 2);
    const arrowContent = elementNode.querySelector(".canvas-element-arrow-content");
    activeCanvasInteraction = {
      pointerId: event.pointerId,
      mode,
      elementId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startRect: {
        x: Number(element.x) || 0,
        y: Number(element.y) || 0,
        w: Number(element.w) || 10,
        h: Number(element.h) || 10,
      },
      startRotation: normalizeCanvasRotation(element.rotation, 0),
      baseRotation: arrowContent ? Number(arrowContent.getAttribute("data-canvas-base-rotation")) || 0 : 0,
      centerX: elementCenterX,
      centerY: elementCenterY,
      startPointerAngle: Math.atan2(event.clientY - elementCenterY, event.clientX - elementCenterX),
      surfaceRect: surfaceData.rect,
      moved: false,
      livePatch: null,
    };
    if (typeof surfaceData.surface.setPointerCapture === "function") {
      try {
        surfaceData.surface.setPointerCapture(event.pointerId);
      } catch (error) {
        activeCanvasInteraction = null;
      }
    }
  }

  function updateCanvasInteractionPreview() {
    if (!activeCanvasInteraction || !activeCanvasInteraction.livePatch) {
      return;
    }
    const node = refs.stage.querySelector(`[data-canvas-element-id="${activeCanvasInteraction.elementId}"]`);
    if (!node) {
      return;
    }
    const patch = activeCanvasInteraction.livePatch;
    if (patch.x !== undefined) {
      node.style.left = `${patch.x}%`;
    }
    if (patch.y !== undefined) {
      node.style.top = `${patch.y}%`;
    }
    if (patch.w !== undefined) {
      node.style.width = `${patch.w}%`;
    }
    if (patch.h !== undefined) {
      node.style.height = `${patch.h}%`;
    }
    if (patch.rotation !== undefined) {
      const arrowContent = node.querySelector(".canvas-element-arrow-content");
      if (arrowContent) {
        const baseRotation = Number(arrowContent.getAttribute("data-canvas-base-rotation")) || 0;
        arrowContent.style.transform = `rotate(${baseRotation + patch.rotation}deg)`;
      }
    }
  }

  function handleCanvasPointerMove(event) {
    if (!activeCanvasInteraction || event.pointerId !== activeCanvasInteraction.pointerId) {
      return;
    }
    const interaction = activeCanvasInteraction;
    const dxPercent = ((event.clientX - interaction.startClientX) / Math.max(1, interaction.surfaceRect.width)) * 100;
    const dyPercent = ((event.clientY - interaction.startClientY) / Math.max(1, interaction.surfaceRect.height)) * 100;
    let patch;

    if (interaction.mode === "resize") {
      patch = {
        w: clampCanvasMetric(interaction.startRect.w + dxPercent, interaction.startRect.w, 6, 100 - interaction.startRect.x),
        h: clampCanvasMetric(interaction.startRect.h + dyPercent, interaction.startRect.h, 6, 100 - interaction.startRect.y),
      };
    } else if (interaction.mode === "rotate") {
      const currentAngle = Math.atan2(event.clientY - interaction.centerY, event.clientX - interaction.centerX);
      const deltaDegrees = (currentAngle - interaction.startPointerAngle) * (180 / Math.PI);
      patch = {
        rotation: normalizeCanvasRotation(interaction.startRotation + deltaDegrees, interaction.startRotation),
      };
    } else {
      patch = {
        x: clampCanvasMetric(interaction.startRect.x + dxPercent, interaction.startRect.x, 0, 100 - interaction.startRect.w),
        y: clampCanvasMetric(interaction.startRect.y + dyPercent, interaction.startRect.y, -14, 100 - interaction.startRect.h),
      };
    }

    interaction.livePatch = patch;
    interaction.moved = true;
    updateCanvasInteractionPreview();
  }

  function endCanvasInteraction(event) {
    if (!activeCanvasInteraction || (event && event.pointerId !== activeCanvasInteraction.pointerId)) {
      return;
    }
    const interaction = activeCanvasInteraction;
    activeCanvasInteraction = null;
    if (interaction.moved && interaction.livePatch) {
      suppressCanvasClickUntil = Date.now() + 120;
      updateCanvasElementById(interaction.elementId, interaction.livePatch);
      return;
    }
    render();
  }

  function normalizeTable(tableInput, minRows, minCols) {
    const rowTarget = Math.max(2, Math.min(8, minRows || (Array.isArray(tableInput) ? tableInput.length : 2)));
    const colTarget = Math.max(2, Math.min(6, minCols || getTableColumnCount(tableInput) || 2));
    const table = Array.isArray(tableInput) ? tableInput.slice(0, rowTarget).map((row) => Array.isArray(row) ? row.slice(0, colTarget) : []) : [];
    while (table.length < rowTarget) {
      table.push([]);
    }
    table.forEach((row) => {
      while (row.length < colTarget) {
        row.push("");
      }
    });
    return table;
  }

  function getTableColumnCount(tableInput) {
    if (!Array.isArray(tableInput)) {
      return 0;
    }
    return tableInput.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
  }

  function sanitizeTableHighlightsForSize(tableHighlights, rowCount, colCount) {
    const sanitizeMap = (input, max) => {
      const result = {};
      if (!input || typeof input !== "object") {
        return result;
      }
      Object.keys(input).forEach((key) => {
        const index = Number(key);
        if (!Number.isInteger(index) || index < 0 || index >= max) {
          return;
        }
        result[String(index)] = input[key];
      });
      return result;
    };

    const sanitizeCellMap = (input, maxRow, maxCol) => {
      const result = {};
      if (!input || typeof input !== "object") {
        return result;
      }
      Object.keys(input).forEach((key) => {
        const match = String(key).match(/^(\d+)-(\d+)$/);
        if (!match) {
          return;
        }
        const rowIndex = Number(match[1]);
        const columnIndex = Number(match[2]);
        if (!Number.isInteger(rowIndex) || !Number.isInteger(columnIndex) || rowIndex < 0 || columnIndex < 0 || rowIndex >= maxRow || columnIndex >= maxCol) {
          return;
        }
        result[`${rowIndex}-${columnIndex}`] = input[key];
      });
      return result;
    };

    return {
      rows: sanitizeMap(tableHighlights && tableHighlights.rows, rowCount),
      columns: sanitizeMap(tableHighlights && tableHighlights.columns, colCount),
      cells: sanitizeCellMap(tableHighlights && tableHighlights.cells, rowCount, colCount),
    };
  }

  function serializeTableCellKey(rowIndex, columnIndex) {
    return `${rowIndex}-${columnIndex}`;
  }

  function parseTableCellKey(value) {
    const match = String(value || "").match(/^(\d+)-(\d+)$/);
    if (!match) {
      return null;
    }
    return {
      row: Number(match[1]),
      column: Number(match[2]),
    };
  }

  function getSafeSelectedTableCell(slide) {
    const table = normalizeTable(slide && slide.table);
    const maxRow = Math.max(0, table.length - 1);
    const maxColumn = Math.max(0, (table[0] ? table[0].length : 1) - 1);
    const row = Math.max(0, Math.min(maxRow, Number(selectedTableCell && selectedTableCell.row) || 0));
    const column = Math.max(0, Math.min(maxColumn, Number(selectedTableCell && selectedTableCell.column) || 0));
    selectedTableCell = { row, column };
    return selectedTableCell;
  }

  function isEditableTarget(target) {
    const node = target instanceof Element ? target : null;
    if (!node) {
      return false;
    }
    const tagName = (node.tagName || "").toLowerCase();
    if (/^(input|textarea|select)$/i.test(tagName)) {
      return true;
    }
    return Boolean(node.closest('[contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]'));
  }

  function syncTableFillControls() {
    const slide = getSelectedSlide();
    if (!slide) {
      return;
    }
    const target = refs.tableFillTarget.value === "column"
      ? "column"
      : refs.tableFillTarget.value === "cell"
        ? "cell"
        : "row";
    const table = normalizeTable(slide.table);
    const safeCell = getSafeSelectedTableCell(slide);
    const count = target === "column"
      ? (table[0] ? table[0].length : 0)
      : target === "cell"
        ? 1
        : table.length;
    refs.tableFillIndex.innerHTML = Array.from({ length: count }, (unused, index) => {
      if (target === "cell") {
        const value = serializeTableCellKey(safeCell.row, safeCell.column);
        return `<option value="${value}">Cellule ${safeCell.row + 1}, ${safeCell.column + 1}</option>`;
      }
      const label = target === "column" ? `Colonne ${index + 1}` : `Ligne ${index + 1}`;
      return `<option value="${index}">${label}</option>`;
    }).join("");
    refs.tableFillColor.value = getSelectedTableFillColor();
  }

  function normalizeHexColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value.toLowerCase() : "#dcecff";
  }

  function normalizeFreeEditorTextColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value.toLowerCase() : "#1d1917";
  }

  function getSelectedTableFillColor() {
    const slide = getSelectedSlide();
    const target = refs.tableFillTarget.value === "column"
      ? "columns"
      : refs.tableFillTarget.value === "cell"
        ? "cells"
        : "rows";
    const index = target === "cells" ? refs.tableFillIndex.value : Number(refs.tableFillIndex.value);
    const tableHighlights = slide.tableHighlights || {};
    return normalizeHexColor(tableHighlights[target] && tableHighlights[target][String(index)]);
  }

  function setSelectedTableFill(target, index, color) {
    const isCellTarget = target === "cell";
    if ((target !== "row" && target !== "column" && target !== "cell") || (!isCellTarget && (!Number.isInteger(index) || index < 0)) || (isCellTarget && !parseTableCellKey(index)) || !/^#[0-9a-fA-F]{6}$/.test(color || "")) {
      return;
    }
    pushUndoSnapshot({ editKey: "" });
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const key = target === "row" ? "rows" : target === "column" ? "columns" : "cells";
      const tableHighlights = {
        rows: Object.assign({}, slide.tableHighlights && slide.tableHighlights.rows),
        columns: Object.assign({}, slide.tableHighlights && slide.tableHighlights.columns),
        cells: Object.assign({}, slide.tableHighlights && slide.tableHighlights.cells),
      };
      tableHighlights[key][String(index)] = color.toLowerCase();
      return Object.assign({}, slide, { tableHighlights });
    });
    render();
  }

  function removeSelectedTableFill(target, index) {
    const isCellTarget = target === "cell";
    if ((target !== "row" && target !== "column" && target !== "cell") || (!isCellTarget && (!Number.isInteger(index) || index < 0)) || (isCellTarget && !parseTableCellKey(index))) {
      return;
    }
    pushUndoSnapshot({ editKey: "" });
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const key = target === "row" ? "rows" : target === "column" ? "columns" : "cells";
      const tableHighlights = {
        rows: Object.assign({}, slide.tableHighlights && slide.tableHighlights.rows),
        columns: Object.assign({}, slide.tableHighlights && slide.tableHighlights.columns),
        cells: Object.assign({}, slide.tableHighlights && slide.tableHighlights.cells),
      };
      delete tableHighlights[key][String(index)];
      return Object.assign({}, slide, { tableHighlights });
    });
    render();
  }

  function assignMediaToSelectedSlide(mediaId) {
    const selectedSlide = getSelectedSlide();
    if (!mediaId) {
      updateSelectedSlide({ mediaId: "", secondaryMediaId: "" });
      return;
    }
    if (mediaId === selectedSlide.mediaId) {
      updateSelectedSlide({
        mediaId: selectedSlide.secondaryMediaId || "",
        secondaryMediaId: "",
      });
      return;
    }
    if (mediaId === selectedSlide.secondaryMediaId) {
      updateSelectedSlide({ secondaryMediaId: "" });
      return;
    }
    if (!selectedSlide.mediaId) {
      updateSelectedSlide({ mediaId });
      return;
    }
    if (!selectedSlide.secondaryMediaId) {
      updateSelectedSlide({ secondaryMediaId: mediaId });
      return;
    }
    updateSelectedSlide({ secondaryMediaId: mediaId });
  }

  function updateSelectedBullet(index, value, rerender) {
    pushUndoSnapshot();
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const bullets = Array.isArray(slide.bullets) ? slide.bullets.slice() : [];
      while (bullets.length <= index) {
        bullets.push("");
      }
      bullets[index] = value;
      return Object.assign({}, slide, { bullets });
    });
    if (rerender === false) {
      refreshStageOnly();
      return;
    }
    render();
  }

  function addSelectedBullet() {
    pushUndoSnapshot({ editKey: "" });
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const bullets = Array.isArray(slide.bullets) ? slide.bullets.slice() : ["", "", ""];
      bullets.push("");
      return Object.assign({}, slide, { bullets });
    });
    render();
  }

  function updateSelectedSubBullet(parentIndex, subIndex, value, rerender = true) {
    pushUndoSnapshot();
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const subBullets = Object.assign({}, slide.subBullets || {});
      const items = Array.isArray(subBullets[parentIndex]) ? subBullets[parentIndex].slice() : [];
      while (items.length <= subIndex) {
        items.push("");
      }
      items[subIndex] = value;
      subBullets[parentIndex] = items;
      return Object.assign({}, slide, { subBullets });
    });
    if (rerender === false) {
      refreshStageOnly();
      return;
    }
    render();
  }

  function addSelectedSubBullet(parentIndex) {
    pushUndoSnapshot({ editKey: "" });
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const subBullets = Object.assign({}, slide.subBullets || {});
      const items = Array.isArray(subBullets[parentIndex]) ? subBullets[parentIndex].slice(0, 6) : [];
      items.push("");
      subBullets[parentIndex] = items.slice(0, 6);
      return Object.assign({}, slide, { subBullets });
    });
    render();
  }

  function removeSelectedSubBullet(parentIndex, subIndex) {
    pushUndoSnapshot({ editKey: "" });
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const subBullets = Object.assign({}, slide.subBullets || {});
      const items = Array.isArray(subBullets[parentIndex]) ? subBullets[parentIndex].slice() : [];
      if (subIndex < 0 || subIndex >= items.length) {
        return slide;
      }
      items.splice(subIndex, 1);
      if (items.length) {
        subBullets[parentIndex] = items;
      } else {
        delete subBullets[parentIndex];
      }
      return Object.assign({}, slide, { subBullets });
    });
    render();
  }

  function removeSelectedBullet(index) {
    pushUndoSnapshot({ editKey: "" });
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const bullets = Array.isArray(slide.bullets) ? slide.bullets.slice() : [];
      if (index < 3 || index >= bullets.length) {
        return slide;
      }
      bullets.splice(index, 1);
      while (bullets.length < 3) {
        bullets.push("");
      }
      const subBullets = Object.assign({}, slide.subBullets || {});
      delete subBullets[index];
      Object.keys(subBullets)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach((key) => {
          if (key > index) {
            subBullets[key - 1] = subBullets[key];
            delete subBullets[key];
          }
        });
      return Object.assign({}, slide, { bullets, subBullets });
    });
    render();
  }

  function updateSelectedFreeBody(value) {
    pushUndoSnapshot();
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      return Object.assign({}, slide, { freeBody: ns.utils.sanitizeRichText(value, 3200) });
    });
    scheduleStateSave();
  }

  function updateFreeBodyPreview() {
    const selectedSlide = getSelectedSlide();
    syncSelectedCanvasElement();
    renderStage(selectedSlide, { preserveInteractiveMedia: true });
    refs.freeBodyMeta.textContent = `${ns.utils.richTextLength(selectedSlide.freeBody || "")}/3200 caractères`;
  }

  function saveFreeEditorSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!refs.slideFreeBody.contains(range.commonAncestorContainer)) {
      return;
    }
    freeEditorRange = range.cloneRange();
  }

  function restoreFreeEditorSelection() {
    const selection = window.getSelection();
    if (!selection || !freeEditorRange) {
      return false;
    }
    if (!refs.slideFreeBody.contains(freeEditorRange.startContainer) || !refs.slideFreeBody.contains(freeEditorRange.endContainer)) {
      return false;
    }
    selection.removeAllRanges();
    try {
      selection.addRange(freeEditorRange);
      return true;
    } catch (error) {
      return false;
    }
  }

  function normalizeFreeEditorMarkup(assignToEditor) {
    const sanitized = ns.utils.sanitizeRichText(refs.slideFreeBody.innerHTML, 3200);
    if (assignToEditor) {
      refs.slideFreeBody.innerHTML = sanitized;
    }
    updateSelectedFreeBody(sanitized);
    updateFreeBodyPreview();
  }

  function markFreeEditorToolbarInteraction() {
    suppressFreeEditorBlur = true;
    window.setTimeout(() => {
      suppressFreeEditorBlur = false;
    }, 0);
  }

  function getFreeEditorSelectedTextNodes(range) {
    if (!range || range.collapsed) {
      return [];
    }

    const walker = document.createTreeWalker(refs.slideFreeBody, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node || !String(node.nodeValue || "").length) {
          return NodeFilter.FILTER_REJECT;
        }
        return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });

    const nodes = [];
    let current = walker.nextNode();
    while (current) {
      nodes.push(current);
      current = walker.nextNode();
    }
    return nodes;
  }

  function wrapSelectedTextNode(node, range, attributes) {
    if (!node || node.nodeType !== Node.TEXT_NODE) {
      return null;
    }

    const textLength = String(node.nodeValue || "").length;
    if (!textLength) {
      return null;
    }

    let target = node;
    let startOffset = node === range.startContainer && range.startOffset < textLength ? range.startOffset : 0;
    let endOffset = node === range.endContainer && range.endOffset <= textLength ? range.endOffset : textLength;

    if (node === range.startContainer && node === range.endContainer) {
      startOffset = Math.max(0, Math.min(startOffset, textLength));
      endOffset = Math.max(startOffset, Math.min(endOffset, textLength));
    }

    if (startOffset > 0) {
      target = target.splitText(startOffset);
      endOffset -= startOffset;
    }

    if (endOffset < String(target.nodeValue || "").length) {
      target.splitText(endOffset);
    }

    if (!String(target.nodeValue || "").trim()) {
      return null;
    }

    const wrapper = document.createElement("span");
    Object.entries(attributes || {}).forEach(([name, value]) => {
      if (value) {
        wrapper.setAttribute(name, value);
      }
    });
    target.parentNode.insertBefore(wrapper, target);
    wrapper.appendChild(target);
    return wrapper;
  }

  function applyFreeEditorInlineStyle(styleText) {
    if (!restoreFreeEditorSelection()) {
      refs.slideFreeBody.focus();
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!refs.slideFreeBody.contains(range.commonAncestorContainer)) {
      return;
    }

    const selectedNodes = getFreeEditorSelectedTextNodes(range);
    if (!selectedNodes.length) {
      return;
    }

    const wrappers = selectedNodes
      .map((node) => wrapSelectedTextNode(node, range, { style: styleText }))
      .filter(Boolean);

    if (!wrappers.length) {
      return;
    }

    const updatedRange = document.createRange();
    updatedRange.setStartBefore(wrappers[0]);
    updatedRange.setEndAfter(wrappers[wrappers.length - 1]);
    selection.removeAllRanges();
    selection.addRange(updatedRange);
    saveFreeEditorSelection();
    normalizeFreeEditorMarkup(false);
  }

  function applyFreeEditorFontSize(size) {
    const normalizedSize = Math.round(Math.min(72, Math.max(8, Number(size) || 8)));
    applyFreeEditorInlineStyle(`font-size:${normalizedSize}px;`);
  }

  function applyFreeEditorBullets() {
    if (!restoreFreeEditorSelection()) {
      refs.slideFreeBody.focus();
      return;
    }

    try {
      document.execCommand("insertUnorderedList", false);
      saveFreeEditorSelection();
      normalizeFreeEditorMarkup(false);
    } catch (error) {
      return;
    }
  }

  function applyFreeEditorTextColor(color) {
    const normalizedColor = normalizeFreeEditorTextColor(color);
    applyFreeEditorInlineStyle(`color:${normalizedColor};`);
  }

  function applyFreeEditorInlineTag(tagName) {
    if (!restoreFreeEditorSelection()) {
      refs.slideFreeBody.focus();
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!refs.slideFreeBody.contains(range.commonAncestorContainer)) {
      return;
    }

    const formatAncestor = findFreeEditorFormatAncestor(range, tagName);
    if (formatAncestor) {
      unwrapFreeEditorFormat(formatAncestor);
      saveFreeEditorSelection();
      normalizeFreeEditorMarkup(false);
      return;
    }

    const wrapper = document.createElement(tagName);
    try {
      const content = range.extractContents();
      wrapper.appendChild(content);
      range.insertNode(wrapper);
      range.selectNodeContents(wrapper);
      selection.removeAllRanges();
      selection.addRange(range);
      saveFreeEditorSelection();
      normalizeFreeEditorMarkup(false);
    } catch (error) {
      return;
    }
  }

  function getFreeEditorFormatAncestorForNode(node, tagName) {
    let current = node && node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
    while (current && current !== refs.slideFreeBody) {
      if (current.nodeType === Node.ELEMENT_NODE && current.tagName.toLowerCase() === tagName) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function findFreeEditorFormatAncestor(range, tagName) {
    if (!range) {
      return null;
    }

    const commonAncestor = getFreeEditorFormatAncestorForNode(range.commonAncestorContainer, tagName);
    if (commonAncestor) {
      return commonAncestor;
    }

    const startAncestor = getFreeEditorFormatAncestorForNode(range.startContainer, tagName);
    const endAncestor = getFreeEditorFormatAncestorForNode(range.endContainer, tagName);
    if (startAncestor && endAncestor && startAncestor === endAncestor) {
      return startAncestor;
    }

    return null;
  }

  function unwrapFreeEditorFormat(element) {
    if (!element || !element.parentNode) {
      return;
    }

    const parent = element.parentNode;
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  }

  function getFreeEditorLayoutAncestorForNode(node, layoutName) {
    let current = node && node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
    while (current && current !== refs.slideFreeBody) {
      if (current.nodeType === Node.ELEMENT_NODE && current.getAttribute("data-rich-layout") === layoutName) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function findFreeEditorLayoutAncestor(range, layoutName) {
    if (!range) {
      return null;
    }

    const commonAncestor = getFreeEditorLayoutAncestorForNode(range.commonAncestorContainer, layoutName);
    if (commonAncestor) {
      return commonAncestor;
    }

    const startAncestor = getFreeEditorLayoutAncestorForNode(range.startContainer, layoutName);
    const endAncestor = getFreeEditorLayoutAncestorForNode(range.endContainer, layoutName);
    if (startAncestor && endAncestor && startAncestor === endAncestor) {
      return startAncestor;
    }

    return null;
  }

  function applyFreeEditorTwoColumns() {
    if (!restoreFreeEditorSelection()) {
      refs.slideFreeBody.focus();
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!refs.slideFreeBody.contains(range.commonAncestorContainer)) {
      return;
    }

    const existingLayout = findFreeEditorLayoutAncestor(range, "two-columns");
    if (existingLayout) {
      unwrapFreeEditorFormat(existingLayout);
      saveFreeEditorSelection();
      normalizeFreeEditorMarkup(false);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-rich-layout", "two-columns");

    try {
      const content = range.extractContents();
      if (!content.textContent || !content.textContent.trim()) {
        return;
      }
      wrapper.appendChild(content);
      range.insertNode(wrapper);
      range.selectNodeContents(wrapper);
      selection.removeAllRanges();
      selection.addRange(range);
      saveFreeEditorSelection();
      normalizeFreeEditorMarkup(false);
    } catch (error) {
      return;
    }
  }

  function isFreeEditorSelectionInsideList() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }
    const range = selection.getRangeAt(0);
    if (!refs.slideFreeBody.contains(range.commonAncestorContainer)) {
      return false;
    }
    return Boolean(findFreeEditorFormatAncestor(range, "ul") || findFreeEditorFormatAncestor(range, "li"));
  }

  function insertFreeEditorLineBreak() {
    if (!restoreFreeEditorSelection()) {
      refs.slideFreeBody.focus();
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!refs.slideFreeBody.contains(range.commonAncestorContainer)) {
      return;
    }

    const br = document.createElement("br");
    const spacer = document.createTextNode("");
    range.deleteContents();
    range.insertNode(br);
    range.setStartAfter(br);
    range.insertNode(spacer);
    range.setStartAfter(spacer);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    saveFreeEditorSelection();
    normalizeFreeEditorMarkup(false);
  }

  function addSelectedFreeLink(label, url) {
    const trimmedUrl = ns.utils.clampText(url, 500).trim();
    if (!trimmedUrl) {
      return;
    }

    pushUndoSnapshot({ editKey: "" });
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const freeLinks = Array.isArray(slide.freeLinks) ? slide.freeLinks.slice(0, 12) : [];
      freeLinks.push({
        label: ns.utils.clampText(label, 80),
        url: trimmedUrl,
      });
      return Object.assign({}, slide, { freeLinks: freeLinks.slice(0, 12) });
    });
    render();
  }

  function removeSelectedFreeLink(index) {
    pushUndoSnapshot({ editKey: "" });
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const freeLinks = Array.isArray(slide.freeLinks) ? slide.freeLinks.slice() : [];
      if (index < 0 || index >= freeLinks.length) {
        return slide;
      }
      freeLinks.splice(index, 1);
      return Object.assign({}, slide, { freeLinks });
    });
    render();
  }

  function toggleSelectedFreeMedia(mediaId) {
    pushUndoSnapshot({ editKey: "" });
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const freeMediaIds = Array.isArray(slide.freeMediaIds) ? slide.freeMediaIds.slice() : [];
      const index = freeMediaIds.indexOf(mediaId);
      if (index >= 0) {
        freeMediaIds.splice(index, 1);
      } else {
        freeMediaIds.push(mediaId);
      }
      return Object.assign({}, slide, { freeMediaIds: ns.utils.uniqueStrings(freeMediaIds).slice(0, 12) });
    });
    render();
  }

  function moveSelectedBullet(fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
      return;
    }

    pushUndoSnapshot({ editKey: "" });
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const bullets = Array.isArray(slide.bullets) ? slide.bullets.slice() : ["", "", ""];
      const origins = bullets.map((unused, index) => index);
      while (bullets.length < 3) {
        bullets.push("");
        origins.push(origins.length);
      }
      if (fromIndex >= bullets.length || toIndex >= bullets.length) {
        return slide;
      }

      const moved = bullets.splice(fromIndex, 1)[0];
      const movedOrigin = origins.splice(fromIndex, 1)[0];
      bullets.splice(toIndex, 0, moved);
      origins.splice(toIndex, 0, movedOrigin);
      const sourceSubBullets = Object.assign({}, slide.subBullets || {});
      const reorderedSubBullets = {};
      origins.forEach((originIndex, index) => {
        const items = sourceSubBullets[originIndex];
        if (Array.isArray(items) && items.length) {
          reorderedSubBullets[index] = items.slice();
        }
      });
      return Object.assign({}, slide, { bullets, subBullets: reorderedSubBullets });
    });
    render();
  }

  function updateSelectedFreeLink(index, patch) {
    pushUndoSnapshot();
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const freeLinks = Array.isArray(slide.freeLinks) ? slide.freeLinks.slice() : [];
      if (index < 0 || index >= freeLinks.length) {
        return slide;
      }
      freeLinks[index] = Object.assign({}, freeLinks[index], patch);
      return Object.assign({}, slide, { freeLinks });
    });
    refreshStageOnly();
  }

  function moveSelectedFreeLink(fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
      return;
    }

    pushUndoSnapshot({ editKey: "" });
    state.slides = state.slides.map((slide) => {
      if (slide.id !== state.selectedSlideId) {
        return slide;
      }
      const freeLinks = Array.isArray(slide.freeLinks) ? slide.freeLinks.slice() : [];
      if (fromIndex >= freeLinks.length || toIndex >= freeLinks.length) {
        return slide;
      }

      const moved = freeLinks.splice(fromIndex, 1)[0];
      freeLinks.splice(toIndex, 0, moved);
      return Object.assign({}, slide, { freeLinks });
    });
    render();
  }

  function reindexSlides() {
    state.slides = state.slides.map((slide, index) => {
      return Object.assign({}, slide, {
        number: String(index + 1).padStart(2, "0"),
      });
    });
  }

  function createBlankSlide(bloomLevelId) {
    pushUndoSnapshot({ editKey: "" });
    const selected = getSelectedSlide();
    const slide = ns.stateFactory.createBlankSlide(
      state.slides.length + 1,
      bloomLevelId || (selected && selected.bloomLevel)
    );
    slide.id = ns.utils.createId("slide");
    state.slides.push(slide);
    state.selectedSlideId = slide.id;
    reindexSlides();
    closeAddSlideMenu();
    render();
  }

  function openAddSlideMenu() {
    isAddSlideMenuOpen = true;
    refs.addSlide.setAttribute("aria-expanded", "true");
    refs.addSlideMenu.hidden = false;
    refs.addSlideMenu.classList.add("is-open");
  }

  function closeAddSlideMenu() {
    isAddSlideMenuOpen = false;
    refs.addSlide.setAttribute("aria-expanded", "false");
    refs.addSlideMenu.classList.remove("is-open");
    refs.addSlideMenu.hidden = true;
  }

  function toggleAddSlideMenu() {
    if (isAddSlideMenuOpen) {
      closeAddSlideMenu();
      return;
    }
    openAddSlideMenu();
  }

  function duplicateCurrentSlide() {
    closeAddSlideMenu();
    const selected = getSelectedSlide();
    if (!selected) {
      return;
    }

    pushUndoSnapshot({ editKey: "" });
    const duplicate = ns.utils.clone(selected);
    duplicate.id = ns.utils.createId("slide");
    duplicate.label = ns.utils.clampText(`${selected.label} copie`, 24);

    const index = state.slides.findIndex((slide) => slide.id === selected.id);
    state.slides.splice(index + 1, 0, duplicate);
    state.selectedSlideId = duplicate.id;
    reindexSlides();
    render();
  }

  function collectSlideMediaIds(slide) {
    if (!slide || typeof slide !== "object") {
      return [];
    }

    const canvasElements = slide.canvasData && Array.isArray(slide.canvasData.elements)
      ? slide.canvasData.elements
      : [];

    return ns.utils.uniqueStrings([
      slide.mediaId,
      slide.secondaryMediaId,
      ...(Array.isArray(slide.freeMediaIds) ? slide.freeMediaIds : []),
      slide.visualData && slide.visualData.primaryMediaId,
      slide.visualData && slide.visualData.secondaryMediaId,
      ...canvasElements
        .filter((element) => element && element.type === "image")
        .map((element) => element.mediaId),
    ].filter(Boolean));
  }

  function syncSlideClipboardControls() {
    hasSlideClipboard = Boolean(ns.services.storage.loadSlideClipboard());
    if (refs.pasteSlide) {
      refs.pasteSlide.disabled = !hasSlideClipboard;
      refs.pasteSlide.title = hasSlideClipboard
        ? "Insérer la slide copiée après la slide active"
        : "Copie d'abord une slide dans une autre présentation ouverte";
    }
  }

  function copyCurrentSlide() {
    closeAddSlideMenu();
    const selected = getSelectedSlide();
    if (!selected) {
      return;
    }

    const mediaIds = collectSlideMediaIds(selected);
    const mediaItems = state.mediaLibrary
      .filter((item) => mediaIds.includes(item.id))
      .map((item) => ns.services.media.sanitizeMediaItem(item))
      .filter(Boolean);

    ns.services.storage.saveSlideClipboard({
      copiedAt: new Date().toISOString(),
      slide: ns.utils.clone(selected),
      mediaItems,
    });
    hasSlideClipboard = true;
    syncSlideClipboardControls();
  }

  async function pasteCopiedSlide() {
    closeAddSlideMenu();
    const clipboard = ns.services.storage.loadSlideClipboard();
    if (!clipboard || !clipboard.slide) {
      hasSlideClipboard = false;
      syncSlideClipboardControls();
      return;
    }

    pushUndoSnapshot({ editKey: "" });
    const slideToInsert = ns.utils.clone(clipboard.slide);
    slideToInsert.id = ns.utils.createId("slide");
    slideToInsert.label = ns.utils.clampText(`${slideToInsert.label || "Slide"} copie`, 24);

    const existingMediaIds = new Set(state.mediaLibrary.map((item) => item.id));
    const importedMediaItems = (clipboard.mediaItems || [])
      .filter((item) => item && item.id && !existingMediaIds.has(item.id))
      .map((item) => ns.services.media.sanitizeMediaItem(item))
      .filter(Boolean);

    if (importedMediaItems.length) {
      state.mediaLibrary = await ns.services.media.hydrateMediaLibrary(state.mediaLibrary.concat(importedMediaItems));
    }

    const selectedIndex = state.slides.findIndex((slide) => slide.id === state.selectedSlideId);
    const insertIndex = selectedIndex >= 0 ? selectedIndex + 1 : state.slides.length;
    state.slides.splice(insertIndex, 0, slideToInsert);
    state.selectedSlideId = slideToInsert.id;
    reindexSlides();
    render();
  }

  function deleteCurrentSlide() {
    closeAddSlideMenu();
    deleteSlideById(state.selectedSlideId);
  }

  function deleteSlideById(id) {
    closeAddSlideMenu();
    if (state.slides.length === 1) {
      return;
    }

    const index = state.slides.findIndex((slide) => slide.id === id);
    if (index < 0) {
      return;
    }

    pushUndoSnapshot({ editKey: "" });
    state.slides.splice(index, 1);
    reindexSlides();
    state.selectedSlideId = state.slides[Math.max(0, index - 1)].id;
    render();
  }

  function moveSlide(id, direction) {
    closeAddSlideMenu();
    const currentIndex = state.slides.findIndex((slide) => slide.id === id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= state.slides.length) {
      return;
    }

    pushUndoSnapshot({ editKey: "" });
    const moved = state.slides.splice(currentIndex, 1)[0];
    state.slides.splice(targetIndex, 0, moved);
    reindexSlides();
    render();
  }

  function moveSlideToIndex(id, targetIndex) {
    closeAddSlideMenu();
    const currentIndex = state.slides.findIndex((slide) => slide.id === id);
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= state.slides.length || currentIndex === targetIndex) {
      return;
    }

    pushUndoSnapshot({ editKey: "" });
    const moved = state.slides.splice(currentIndex, 1)[0];
    state.slides.splice(targetIndex, 0, moved);
    state.selectedSlideId = moved.id;
    reindexSlides();
    render();
  }

  function clearThumbDropState() {
    refs.thumbStrip.querySelectorAll(".thumb-card.is-drop-target").forEach((card) => {
      card.classList.remove("is-drop-target");
    });
  }

  function clearListDropState() {
    refs.slideList.querySelectorAll(".slide-item.is-drop-target").forEach((card) => {
      card.classList.remove("is-drop-target");
    });
  }

  function clearBulletDropState() {
    refs.slideBulletsEditor.querySelectorAll(".bullet-editor-row.is-drop-target, .bullet-editor-row.is-dragging").forEach((row) => {
      row.classList.remove("is-drop-target", "is-dragging");
    });
  }

  function clearCanvasRevealDropState() {
    refs.canvasElementsList.querySelectorAll(".canvas-element-row.is-drop-target, .canvas-element-row.is-dragging").forEach((row) => {
      row.classList.remove("is-drop-target", "is-dragging");
    });
  }

  function selectSlide(id, options) {
    const opts = options || {};
    closeAddSlideMenu();
    if (!state.slides.some((slide) => slide.id === id)) {
      return;
    }
    state.selectedSlideId = id;
    if (opts.focusPreviewPanel) {
      pendingPreviewPanelFocus = true;
    }
    render();
  }

  function applyBloomLevel(levelId) {
    closeAddSlideMenu();
    updateSelectedSlide({ bloomLevel: levelId });
  }

  function togglePrinciple(principleId) {
    closeAddSlideMenu();
    const selected = getSelectedSlide();
    const nextPrinciples = selected.principleIds.includes(principleId)
      ? selected.principleIds.filter((id) => id !== principleId)
      : selected.principleIds.concat(principleId);
    updateSelectedSlide({ principleIds: ns.utils.uniqueStrings(nextPrinciples) });
  }

  function regenerateBloomDeck() {
    closeAddSlideMenu();
    pushUndoSnapshot({ editKey: "" });
    const slides = ns.stateFactory.createBloomDeckSlides().map((slide) => {
      slide.id = ns.utils.createId("slide");
      return slide;
    });
    state.slides = slides;
    state.selectedSlideId = slides[0] ? slides[0].id : null;
    reindexSlides();
    render();
  }

  refs.deckTitle.addEventListener("input", (event) => updateSettings("title", event.target.value, 60, false));
  refs.deckSubtitle.addEventListener("input", (event) => updateSettings("subtitle", event.target.value, 90, false));
  refs.deckFooter.addEventListener("input", (event) => updateSettings("footer", event.target.value, 50, false));
  refs.deckPalette.addEventListener("change", (event) => updateSettings("palette", event.target.value, 24));
  refs.deckFont.addEventListener("change", (event) => updateSettings("font", event.target.value, 24));
  refs.deckContentFontScale.addEventListener("input", (event) => {
    pushUndoSnapshot();
    state.settings.contentFontScale = normalizeContentFontScale(event.target.value);
    render();
  });
  refs.deckTransition.addEventListener("change", (event) => updateSettings("transition", event.target.value, 12));
  refs.deckTheme.addEventListener("change", (event) => updateSettings("theme", event.target.value, 12));
  refs.deckFrameShadow.addEventListener("change", (event) => {
    pushUndoSnapshot({ editKey: "" });
    state.settings.frameShadow = Boolean(event.target.checked);
    render();
  });

  refs.slideBloomLevel.addEventListener("change", (event) => updateSelectedSlide({ bloomLevel: event.target.value }));
  refs.slideLabel.addEventListener("input", (event) => updateSelectedSlide({ label: ns.utils.clampText(event.target.value, 24) }, false));
  refs.slideNumber.addEventListener("input", (event) => updateSelectedSlide({ number: ns.utils.clampText(event.target.value, 8) }, false));
  refs.slideObjective.addEventListener("input", (event) => updateSelectedSlide({ objective: ns.utils.clampText(event.target.value, 180) }, false));
  refs.slideEvidence.addEventListener("input", (event) => updateSelectedSlide({ evidence: ns.utils.clampText(event.target.value, 120) }, false));
  refs.slideTitle.addEventListener("input", (event) => updateSelectedSlide({ title: ns.utils.clampText(event.target.value, 72) }, false));
  refs.slideSubtitle.addEventListener("input", (event) => updateSelectedSlide({ subtitle: ns.utils.clampText(event.target.value, 170) }, false));
  refs.slideContentType.addEventListener("change", (event) => updateSelectedSlide({
    contentType: event.target.value === "table"
      ? "table"
      : event.target.value === "free"
        ? "free"
        : event.target.value === "visual"
          ? "visual"
          : event.target.value === "canvas"
            ? "canvas"
            : "bullets",
  }));
  refs.slidePaletteOverride.addEventListener("change", (event) => updateSelectedSlide({
    paletteOverride: event.target.value,
  }));
  refs.slideDecorativeAccentOverride.addEventListener("change", (event) => updateSelectedSlide({
    decorativeAccentOverride: event.target.value,
  }));
  refs.slideDecorativeAccentSolid.addEventListener("change", (event) => updateSelectedSlide({
    decorativeAccentSolid: Boolean(event.target.checked),
  }));
  refs.slideBulletsNumbered.addEventListener("change", (event) => updateSelectedSlide({
    bulletsNumbered: Boolean(event.target.checked),
  }));
  refs.slideBulletsProgressive.addEventListener("change", (event) => updateSelectedSlide({
    bulletsProgressive: Boolean(event.target.checked),
  }));
  refs.slideBulletsSubProgressive.addEventListener("change", (event) => updateSelectedSlide({
    bulletsSubProgressive: Boolean(event.target.checked),
  }));
  refs.slideTableProgressive.addEventListener("change", (event) => updateSelectedSlide({
    tableProgressive: Boolean(event.target.checked),
  }));
  refs.slideTableProgressiveOrder.addEventListener("change", (event) => updateSelectedSlide({
    tableProgressiveOrder: event.target.value === "column" ? "column" : "row",
  }));
  refs.slideBullet1.addEventListener("input", (event) => updateSelectedBullet(0, ns.utils.clampText(event.target.value, 220), false));
  refs.slideBullet2.addEventListener("input", (event) => updateSelectedBullet(1, ns.utils.clampText(event.target.value, 220), false));
  refs.slideBullet3.addEventListener("input", (event) => updateSelectedBullet(2, ns.utils.clampText(event.target.value, 220), false));
  refs.addBullet.addEventListener("click", addSelectedBullet);
  refs.slideFreeBody.addEventListener("input", () => {
    saveFreeEditorSelection();
    if (ns.utils.richTextLength(refs.slideFreeBody.innerHTML) > 3200) {
      normalizeFreeEditorMarkup(true);
      return;
    }
    normalizeFreeEditorMarkup(false);
  });
  refs.slideFreeBody.addEventListener("mousedown", () => {
    freeEditorRange = null;
  });
  refs.slideFreeBody.addEventListener("keyup", saveFreeEditorSelection);
  refs.slideFreeBody.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      if (isFreeEditorSelectionInsideList()) {
        return;
      }
      event.preventDefault();
      insertFreeEditorLineBreak();
    }
  });
  refs.slideFreeBody.addEventListener("mouseup", saveFreeEditorSelection);
  refs.slideFreeBody.addEventListener("click", () => {
    setTimeout(saveFreeEditorSelection, 0);
  });
  refs.slideFreeBody.addEventListener("blur", () => {
    if (suppressFreeEditorBlur) {
      return;
    }
    normalizeFreeEditorMarkup(true);
  });
  refs.slideFreeBody.addEventListener("paste", (event) => {
    event.preventDefault();
    const pastedText = event.clipboardData ? event.clipboardData.getData("text/plain") : "";
    if (!pastedText) {
      return;
    }
    restoreFreeEditorSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!refs.slideFreeBody.contains(range.commonAncestorContainer)) {
      return;
    }
    range.deleteContents();
    const textNode = document.createTextNode(pastedText);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    saveFreeEditorSelection();
    normalizeFreeEditorMarkup(true);
  });
  refs.addFreeLink.addEventListener("click", () => {
    addSelectedFreeLink(refs.freeLinkLabel.value, refs.freeLinkUrl.value);
    refs.freeLinkLabel.value = "";
    refs.freeLinkUrl.value = "";
  });
  refs.canvasAddText.addEventListener("click", () => addCanvasElement("text"));
  refs.canvasAddArrow.addEventListener("click", () => addCanvasElement("arrow"));
  refs.canvasAddCircle.addEventListener("click", () => addCanvasElement("shape", { shapeKind: "circle" }));
  refs.canvasAddSquare.addEventListener("click", () => addCanvasElement("shape", { shapeKind: "square" }));
  refs.canvasAddBubble.addEventListener("click", () => addCanvasElement("shape", { shapeKind: "bubble" }));
  refs.canvasProgressive.addEventListener("change", (event) => updateSelectedCanvasData({
    progressive: Boolean(event.target.checked),
  }));
  refs.canvasElementsList.addEventListener("change", (event) => {
    const groupSelect = event.target.closest("[data-canvas-reveal-group-select]");
    if (!groupSelect) {
      return;
    }
    updateCanvasElementById(
      groupSelect.getAttribute("data-canvas-reveal-group-select"),
      { revealGroup: normalizeCanvasRevealGroup(groupSelect.value) }
    );
  });
  refs.canvasDuplicateElement.addEventListener("click", duplicateSelectedCanvasElement);
  refs.canvasDeleteElement.addEventListener("click", removeSelectedCanvasElement);
  refs.canvasElementX.addEventListener("input", (event) => {
    const selectedElement = getCanvasSelectedElement(getSelectedCanvasData().elements);
    const maxX = selectedElement ? (100 - (Number(selectedElement.w) || 6)) : 94;
    updateSelectedCanvasElement({
      x: clampCanvasMetric(event.target.value, 0, 0, maxX),
    }, false);
  });
  refs.canvasElementY.addEventListener("input", (event) => {
    const selectedElement = getCanvasSelectedElement(getSelectedCanvasData().elements);
    const maxY = selectedElement ? (100 - (Number(selectedElement.h) || 6)) : 94;
    updateSelectedCanvasElement({
      y: clampCanvasMetric(event.target.value, 0, -14, maxY),
    }, false);
  });
  refs.canvasElementW.addEventListener("input", (event) => {
    const selectedElement = getCanvasSelectedElement(getSelectedCanvasData().elements);
    const maxWidth = selectedElement ? (100 - (Number(selectedElement.x) || 0)) : 100;
    updateSelectedCanvasElement({
      w: clampCanvasMetric(event.target.value, selectedElement ? selectedElement.w : 24, 6, maxWidth),
    }, false);
  });
  refs.canvasElementH.addEventListener("input", (event) => {
    const selectedElement = getCanvasSelectedElement(getSelectedCanvasData().elements);
    const maxHeight = selectedElement ? (100 - (Number(selectedElement.y) || 0)) : 100;
    updateSelectedCanvasElement({
      h: clampCanvasMetric(event.target.value, selectedElement ? selectedElement.h : 18, 6, maxHeight),
    }, false);
  });
  refs.canvasTextContent.addEventListener("input", () => {
    saveCanvasTextEditorSelection();
    if (ns.utils.richTextLength(refs.canvasTextContent.innerHTML) > 2000) {
      normalizeCanvasTextEditorMarkup(true);
      return;
    }
    normalizeCanvasTextEditorMarkup(false);
  });
  refs.canvasTextContent.addEventListener("mousedown", () => {
    canvasTextEditorRange = null;
  });
  refs.canvasTextContent.addEventListener("keyup", () => {
    saveCanvasTextEditorSelection();
    updateCanvasTextToolbarState();
  });
  refs.canvasTextContent.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      insertCanvasTextEditorLineBreak();
    }
  });
  refs.canvasTextContent.addEventListener("mouseup", () => {
    saveCanvasTextEditorSelection();
    updateCanvasTextToolbarState();
  });
  refs.canvasTextContent.addEventListener("click", () => {
    setTimeout(() => {
      saveCanvasTextEditorSelection();
      updateCanvasTextToolbarState();
    }, 0);
  });
  refs.canvasTextContent.addEventListener("blur", () => {
    if (suppressCanvasTextEditorBlur) {
      return;
    }
    normalizeCanvasTextEditorMarkup(true);
  });
  refs.canvasTextContent.addEventListener("paste", (event) => {
    event.preventDefault();
    const pastedText = event.clipboardData ? event.clipboardData.getData("text/plain") : "";
    if (!pastedText) {
      return;
    }
    restoreCanvasTextEditorSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!refs.canvasTextContent.contains(range.commonAncestorContainer)) {
      return;
    }
    range.deleteContents();
    const textNode = document.createTextNode(pastedText);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    saveCanvasTextEditorSelection();
    normalizeCanvasTextEditorMarkup(true);
  });
  refs.canvasTextBold.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    markCanvasTextEditorToolbarInteraction();
    saveCanvasTextEditorSelection();
    applyCanvasTextEditorInlineTag("strong");
  });
  refs.canvasTextBold.addEventListener("click", (event) => {
    event.preventDefault();
  });
  refs.canvasTextItalic.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    markCanvasTextEditorToolbarInteraction();
    saveCanvasTextEditorSelection();
    applyCanvasTextEditorInlineTag("em");
  });
  refs.canvasTextItalic.addEventListener("click", (event) => {
    event.preventDefault();
  });
  refs.canvasTextUnderline.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    markCanvasTextEditorToolbarInteraction();
    saveCanvasTextEditorSelection();
    applyCanvasTextEditorInlineTag("u");
  });
  refs.canvasTextUnderline.addEventListener("click", (event) => {
    event.preventDefault();
  });
  refs.canvasTextBullets.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    markCanvasTextEditorToolbarInteraction();
    saveCanvasTextEditorSelection();
    applyCanvasTextEditorBullets();
  });
  refs.canvasTextBullets.addEventListener("click", (event) => {
    event.preventDefault();
  });
  refs.canvasTextSize.addEventListener("input", (event) => {
    const nextValue = String(Math.round(clampCanvasMetric(event.target.value, 28, 16, 72)));
    refs.canvasTextSizeValue.textContent = `${nextValue} px`;
    applyCanvasTextEditorFontSize(nextValue);
  });
  refs.canvasTextFont.addEventListener("change", (event) => {
    const nextFontOptionId = normalizeCanvasFontOptionId(event.target.value);
    applyCanvasTextEditorFontFamily(nextFontOptionId);
    updateSelectedCanvasElement({
      fontOptionId: nextFontOptionId,
    }, false);
  });
  refs.canvasTextSize.addEventListener("mousedown", () => {
    markCanvasTextEditorToolbarInteraction();
    saveCanvasTextEditorSelection();
    createCanvasTextSelectionBookmark();
  });
  refs.canvasTextFrame.addEventListener("change", (event) => updateSelectedCanvasElement({
    showFrame: Boolean(event.target.checked),
  }, false));
  if (refs.canvasTextColorPalette) {
    refs.canvasTextColorPalette.addEventListener("mousedown", (event) => {
      const swatch = event.target.closest("[data-canvas-text-color-value]");
      if (!swatch) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      markCanvasTextEditorToolbarInteraction();
      saveCanvasTextEditorSelection();
      createCanvasTextSelectionBookmark();
      applyCanvasTextEditorTextColor(swatch.getAttribute("data-canvas-text-color-value"));
    });
    refs.canvasTextColorPalette.addEventListener("click", (event) => {
      if (event.target.closest("[data-canvas-text-color-value]")) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
  }
  refs.canvasImageMedia.addEventListener("change", (event) => updateSelectedCanvasElement({
    mediaId: event.target.value,
  }));
  refs.canvasArrowDirection.addEventListener("change", (event) => updateSelectedCanvasElement({
    direction: event.target.value === "up" || event.target.value === "down" || event.target.value === "left" ? event.target.value : "right",
  }));
  refs.canvasArrowColor.addEventListener("input", (event) => updateSelectedCanvasElement({
    color: normalizeCanvasColor(event.target.value, "#0a66ff"),
  }, false));
  refs.canvasArrowRotation.addEventListener("input", (event) => updateSelectedCanvasElement({
    rotation: normalizeCanvasRotation(event.target.value, 0),
  }, false));
  refs.canvasArrowLength.addEventListener("input", (event) => {
    const nextValue = String(normalizeCanvasArrowLength(event.target.value, 100));
    refs.canvasArrowLengthValue.textContent = `${nextValue} %`;
    updateSelectedCanvasElement({
      arrowLength: Number(nextValue),
    }, false);
  });
  refs.canvasShapeKind.addEventListener("change", (event) => updateSelectedCanvasElement({
    shapeKind: normalizeCanvasShapeKind(event.target.value),
  }, false));
  refs.canvasShapeColor.addEventListener("input", (event) => updateSelectedCanvasElement({
    color: normalizeCanvasColor(event.target.value, "#0a66ff"),
  }, false));
  refs.freeLinksList.addEventListener("input", (event) => {
    const labelInput = event.target.closest("[data-free-link-label]");
    if (labelInput) {
      updateSelectedFreeLink(
        Number(labelInput.getAttribute("data-free-link-label")),
        { label: ns.utils.clampText(labelInput.value, 80) }
      );
      return;
    }
    const urlInput = event.target.closest("[data-free-link-url]");
    if (urlInput) {
      updateSelectedFreeLink(
        Number(urlInput.getAttribute("data-free-link-url")),
        { url: ns.utils.clampText(urlInput.value, 500) }
      );
    }
  });
  refs.visualPrimaryMedia.addEventListener("change", (event) => updateSelectedVisualData({
    primaryMediaId: event.target.value,
  }));
  refs.visualSecondaryMedia.addEventListener("change", (event) => updateSelectedVisualData({
    secondaryMediaId: event.target.value,
  }));
  refs.visualShowImages.addEventListener("change", (event) => updateSelectedVisualData({
    showImages: Boolean(event.target.checked),
  }));
  refs.visualPrimaryMediaReveal.addEventListener("change", (event) => updateSelectedVisualData({
    primaryMediaReveal: Boolean(event.target.checked),
  }));
  refs.visualSecondaryMediaReveal.addEventListener("change", (event) => updateSelectedVisualData({
    secondaryMediaReveal: Boolean(event.target.checked),
  }));
  refs.visualShowBody.addEventListener("change", (event) => updateSelectedVisualData({
    showBody: Boolean(event.target.checked),
  }, false));
  refs.visualShowCallout.addEventListener("change", (event) => updateSelectedVisualData({
    showCallout: Boolean(event.target.checked),
  }, false));
  refs.visualBody.addEventListener("input", (event) => {
    pendingVisualFieldFocus = {
      refKey: "visualBody",
      caret: event.target.selectionStart || 0,
    };
    updateSelectedVisualData({
      body: ns.utils.clampText(event.target.value, 320),
    }, false);
  });
  refs.visualCallout.addEventListener("input", (event) => {
    pendingVisualFieldFocus = {
      refKey: "visualCallout",
      caret: event.target.selectionStart || 0,
    };
    updateSelectedVisualData({
      callout: ns.utils.clampText(event.target.value, 180),
    }, false);
  });  if (refs.visualArrowDirection) {
    refs.visualArrowDirection.addEventListener("change", (event) => updateSelectedVisualData({
      arrowDirection: event.target.value === "up" || event.target.value === "down" || event.target.value === "left" ? event.target.value : "right",
    }));
  }
  if (refs.visualArrowColor) {
    refs.visualArrowColor.addEventListener("change", (event) => updateSelectedVisualData({
      arrowColor: normalizeVisualArrowColor(event.target.value),
    }));
  }
  refs.visualShowChart.addEventListener("change", (event) => updateSelectedVisualData({
    showChart: Boolean(event.target.checked),
  }));
  refs.visualChartReveal.addEventListener("change", (event) => updateSelectedVisualData({
    chartReveal: Boolean(event.target.checked),
  }));
  refs.visualChartTitle.addEventListener("input", (event) => {
    pendingVisualFieldFocus = {
      refKey: "visualChartTitle",
      caret: event.target.selectionStart || 0,
    };
    updateSelectedVisualData({
      chartTitle: ns.utils.clampText(event.target.value, 48),
    }, false);
  });
  refs.visualChartBars.addEventListener("input", (event) => {
    const input = event.target.closest("[data-visual-chart-field]");
    if (!input) {
      return;
    }
    const index = Number(input.getAttribute("data-visual-chart-index"));
    const field = input.getAttribute("data-visual-chart-field");
    pendingVisualChartFocus = {
      index,
      field,
      caret: typeof input.selectionStart === "number" ? input.selectionStart : 0,
    };
    if (field === "label") {
      updateSelectedVisualChartBar(index, {
        label: ns.utils.clampText(input.value, 18),
      }, false);
      return;
    }
    if (field === "value") {
      updateSelectedVisualChartBar(index, {
        value: clampVisualBarValue(input.value),
      }, false);
    }
  });
  refs.visualChartBars.addEventListener("change", (event) => {
    const input = event.target.closest('[data-visual-chart-field="color"]');
    if (!input) {
      return;
    }
    const index = Number(input.getAttribute("data-visual-chart-index"));
    updateSelectedVisualChartBar(index, {
      color: normalizeVisualArrowColor(input.value),
    });
  });
  refs.visualChartBars.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-visual-chart-bar]");
    if (!removeButton) {
      return;
    }
    removeSelectedVisualChartBar(Number(removeButton.getAttribute("data-remove-visual-chart-bar")));
  });
  refs.visualChartAddColumn.addEventListener("click", addSelectedVisualChartBar);
  refs.visualChartRemoveColumn.addEventListener("click", () => {
    const { count } = getVisibleVisualChartBars();
    removeSelectedVisualChartBar(count - 1);
  });
  refs.slideNote.addEventListener("input", (event) => updateSelectedSlide({ note: ns.utils.clampText(event.target.value, 180) }, false));
  refs.slidePresenterNotes.addEventListener("input", (event) => updateSelectedSlide({ presenterNotes: ns.utils.clampText(event.target.value, 2000) }, false));
  refs.extraBulletsList.addEventListener("input", (event) => {
    const input = event.target.closest("[data-extra-bullet-index]");
    if (!input) {
      return;
    }
    pendingBulletFocus = {
      index: Number(input.getAttribute("data-extra-bullet-index")),
      caret: input.selectionStart || 0,
    };
    updateSelectedBullet(Number(input.getAttribute("data-extra-bullet-index")), ns.utils.clampText(input.value, 220), false);
  });
  refs.slideBulletsEditor.addEventListener("input", (event) => {
    const input = event.target.closest("[data-sub-bullet-index]");
    if (!input) {
      return;
    }
    pendingSubBulletFocus = null;
    updateSelectedSubBullet(
      Number(input.getAttribute("data-sub-bullet-parent")),
      Number(input.getAttribute("data-sub-bullet-index")),
      ns.utils.clampText(input.value, 320),
      false
    );
  });
  refs.tableEditorGrid.addEventListener("input", (event) => {
    const input = event.target.closest("[data-table-cell]");
    if (!input) {
      return;
    }
    const [rowIndex, columnIndex] = input.getAttribute("data-table-cell").split("-").map(Number);
    selectedTableCell = { row: rowIndex, column: columnIndex };
    pendingTableFocus = { row: rowIndex, column: columnIndex, caret: input.selectionStart || 0 };
    updateSelectedTableCell(rowIndex, columnIndex, ns.utils.clampText(input.value, 120), false);
  });
  refs.tableEditorGrid.addEventListener("focusin", (event) => {
    const input = event.target.closest("[data-table-cell]");
    if (!input) {
      return;
    }
    const [rowIndex, columnIndex] = input.getAttribute("data-table-cell").split("-").map(Number);
    selectedTableCell = { row: rowIndex, column: columnIndex };
    if (refs.tableFillTarget.value === "cell") {
      syncTableFillControls();
    }
  });
  refs.tableFillTarget.addEventListener("change", () => syncTableFillControls());
  refs.tableFillIndex.addEventListener("change", () => {
    refs.tableFillColor.value = getSelectedTableFillColor();
  });
  refs.tableFillColor.addEventListener("change", () => {
    refs.tableFillColor.value = normalizeHexColor(refs.tableFillColor.value);
  });
  refs.addTableRow.addEventListener("click", () => {
    const slide = getSelectedSlide();
    resizeSelectedTable((slide.table || []).length + 1, getTableColumnCount(slide.table));
  });
  refs.removeTableRow.addEventListener("click", () => {
    const slide = getSelectedSlide();
    resizeSelectedTable(Math.max(2, (slide.table || []).length - 1), getTableColumnCount(slide.table));
  });
  refs.addTableColumn.addEventListener("click", () => {
    const slide = getSelectedSlide();
    resizeSelectedTable((slide.table || []).length, getTableColumnCount(slide.table) + 1);
  });
  refs.removeTableColumn.addEventListener("click", () => {
    const slide = getSelectedSlide();
    resizeSelectedTable((slide.table || []).length, Math.max(2, getTableColumnCount(slide.table) - 1));
  });
  refs.addTableFill.addEventListener("click", () => {
    const target = refs.tableFillTarget.value;
    const index = target === "cell" ? refs.tableFillIndex.value : Number(refs.tableFillIndex.value);
    setSelectedTableFill(target, index, normalizeHexColor(refs.tableFillColor.value));
  });
  refs.mediaUploadTrigger.addEventListener("click", () => refs.mediaUpload.click());
  refs.importJson.addEventListener("click", () => refs.importJsonInput.click());
  refs.toggleNightMode.addEventListener("click", toggleNightMode);
  refs.toggleGlobalPanel.addEventListener("click", toggleGlobalPanel);
  refs.toggleMediaPanel.addEventListener("click", toggleMediaPanel);
  refs.toggleThumbStrip.addEventListener("click", toggleThumbStrip);
  if (refs.toggleCanvasPreviewFullscreen) {
    refs.toggleCanvasPreviewFullscreen.addEventListener("click", toggleCanvasPreviewFullscreen);
  }
  refs.importJsonInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    try {
      await importJsonProject(file);
    } finally {
      event.target.value = "";
    }
  });
  refs.mediaUpload.addEventListener("change", async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const importedItems = await ns.services.media.importFiles(files);
    pushUndoSnapshot({ editKey: "" });
    state.mediaLibrary = state.mediaLibrary.concat(importedItems);
    render();
    event.target.value = "";
  });
  refs.clearSlideMedia.addEventListener("click", () => assignMediaToSelectedSlide(""));
  refs.mediaLinkAdd.addEventListener("click", () => {
    const rawValue = refs.mediaLinkInput.value;
    refs.mediaLinkFeedback.textContent = "";

    const mediaItem = ns.services.media.isDirectMediaUrl(rawValue)
      ? ns.services.media.createExternalMedia(rawValue)
      : ns.services.media.isEmbeddableMediaUrl(rawValue)
        ? ns.services.media.createEmbedMedia(rawValue)
        : null;

    if (!mediaItem) {
      refs.mediaLinkFeedback.textContent = "Utilise un lien http/https, un code iframe, un data URL image/video, ou un lien d'embed reconnu.";
      return;
    }

    ns.services.media.primeMediaUrl(mediaItem);
    pushUndoSnapshot({ editKey: "" });
    state.mediaLibrary = state.mediaLibrary.concat(mediaItem);
    refs.mediaLinkInput.value = "";
    refs.mediaLinkFeedback.textContent = mediaItem.kind === "embed"
      ? "Embed ajoute."
      : "Média ajouté depuis le lien.";
    render();
    assignMediaToSelectedSlide(mediaItem.id);
  });

  refs.generateBloomDeck.addEventListener("click", regenerateBloomDeck);
  refs.addSlide.addEventListener("click", toggleAddSlideMenu);
  refs.undoAction.addEventListener("click", undoLastAction);
  refs.duplicateSlide.addEventListener("click", duplicateCurrentSlide);
  refs.copySlide.addEventListener("click", copyCurrentSlide);
  refs.pasteSlide.addEventListener("click", pasteCopiedSlide);
  refs.deleteSlide.addEventListener("click", deleteCurrentSlide);
  refs.deleteSlideInline.addEventListener("click", deleteCurrentSlide);
  refs.exportJson.addEventListener("click", () => ns.services.exporter.exportJson(state));
  refs.exportTxt.addEventListener("click", () => ns.services.exporter.exportTxt(state));
  refs.exportPdf.addEventListener("click", async () => {
    if (isPdfExportRunning) {
      return;
    }
    isPdfExportRunning = true;
    try {
      await ns.services.exporter.exportPdf(state);
    } catch (error) {
      isPdfExportRunning = false;
      window.alert("L'export PDF a rencontré un problème. Réessaie avec moins de médias lourds si besoin.");
    }
  });
  refs.exportPptx.addEventListener("click", async () => {
    if (isPptxExportRunning) {
      return;
    }
    isPptxExportRunning = true;
    updatePptxExportButton({
      state: "running",
      percent: 1,
      label: "Préparation",
      detail: "Lancement de l'export PowerPoint",
    });
    try {
      await ns.services.exporter.exportPptx(state);
    } catch (error) {
      console.error(error);
      window.alert("L'export PPTX a rencontre un probleme. Consulte la console pour plus de details.");
      updatePptxExportButton({ state: "error" });
    } finally {
      isPptxExportRunning = false;
      if (refs.exportPptx.classList.contains("is-exporting")) {
        updatePptxExportButton({ state: "idle" });
      }
    }
  });
  refs.exportHtml.addEventListener("click", () => ns.services.exporter.exportHtml(state, false));
  refs.openPresentation.addEventListener("click", () => {
    persistStateNow();
    const presentationUrl = new URL(window.location.href);
    presentationUrl.searchParams.set("present", "1");
    presentationUrl.searchParams.delete("presenter");
    window.open(presentationUrl.toString(), "_blank", "noopener");
  });
  refs.openPresentationActive.addEventListener("click", () => {
    persistStateNow();
    const presentationUrl = new URL(window.location.href);
    presentationUrl.searchParams.set("present", "1");
    presentationUrl.searchParams.delete("presenter");
    presentationUrl.searchParams.set("start", state.selectedSlideId || "");
    window.open(presentationUrl.toString(), "_blank", "noopener");
  });
  refs.openPresenter.addEventListener("click", () => {
    persistStateNow();
    const presenterUrl = new URL(window.location.href);
    presenterUrl.searchParams.set("presenter", "1");
    presenterUrl.searchParams.delete("present");
    presenterUrl.searchParams.delete("start");
    window.open(presenterUrl.toString(), "_blank", "noopener");
  });
  refs.openPresenterActive.addEventListener("click", () => {
    persistStateNow();
    const presenterUrl = new URL(window.location.href);
    presenterUrl.searchParams.set("presenter", "1");
    presenterUrl.searchParams.delete("present");
    presenterUrl.searchParams.set("start", state.selectedSlideId || "");
    window.open(presenterUrl.toString(), "_blank", "noopener");
  });

  window.addEventListener("beforeunload", persistStateNow);
  document.addEventListener("focusout", (event) => {
    if (event.target && (event.target.matches("input, textarea, select") || event.target.isContentEditable)) {
      clearUndoEditSession();
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key === SLIDE_CLIPBOARD_KEY) {
      syncSlideClipboardControls();
    }
  });
  window.addEventListener("resize", syncCanvasPreviewFullscreenScale);
  refs.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setView(tab.getAttribute("data-switch-view")));
  });

  document.querySelectorAll("[data-free-command]").forEach((button) => {
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      markFreeEditorToolbarInteraction();
      saveFreeEditorSelection();
    });
    button.addEventListener("click", () => {
      refs.slideFreeBody.focus();
      const command = button.getAttribute("data-free-command");
      if (command === "bold") {
        applyFreeEditorInlineTag("strong");
        return;
      }
      if (command === "italic") {
        applyFreeEditorInlineTag("em");
        return;
      }
      if (command === "underline") {
        applyFreeEditorInlineTag("u");
        return;
      }
      if (command === "two-columns") {
        applyFreeEditorTwoColumns();
      }
    });
  });

  if (refs.freeTextColor) {
    refs.freeTextColor.addEventListener("mousedown", () => {
      markFreeEditorToolbarInteraction();
      saveFreeEditorSelection();
    });
    refs.freeTextColor.addEventListener("input", (event) => {
      refs.slideFreeBody.focus();
      applyFreeEditorTextColor(event.target.value);
    });
    refs.freeTextColor.addEventListener("change", (event) => {
      refs.slideFreeBody.focus();
      applyFreeEditorTextColor(event.target.value);
    });
  }

  if (refs.freeTextSize) {
    refs.freeTextSize.addEventListener("mousedown", () => {
      markFreeEditorToolbarInteraction();
      saveFreeEditorSelection();
    });
    refs.freeTextSize.addEventListener("change", (event) => {
      refs.slideFreeBody.focus();
      applyFreeEditorFontSize(event.target.value);
    });
  }

  if (refs.freeTextBullets) {
    refs.freeTextBullets.addEventListener("mousedown", (event) => {
      event.preventDefault();
      markFreeEditorToolbarInteraction();
      saveFreeEditorSelection();
    });
    refs.freeTextBullets.addEventListener("click", () => {
      refs.slideFreeBody.focus();
      applyFreeEditorBullets();
    });
  }

  document.addEventListener("selectionchange", () => {
    if (document.activeElement === refs.slideFreeBody) {
      saveFreeEditorSelection();
    }
    if (document.activeElement === refs.canvasTextContent) {
      saveCanvasTextEditorSelection();
      updateCanvasTextToolbarState();
    }
  });

  document.addEventListener("click", (event) => {
    const slideTrigger = event.target.closest("[data-select-slide]");
    const moveTrigger = event.target.closest("[data-move-slide]");
    const deleteTrigger = event.target.closest("[data-delete-slide]");
    const mediaAssignTrigger = event.target.closest("[data-assign-media]");
    const mediaDeleteTrigger = event.target.closest("[data-delete-media]");
    const removeBulletTrigger = event.target.closest("[data-remove-bullet]");
    const addSubBulletTrigger = event.target.closest("[data-add-sub-bullet]");
    const removeSubBulletTrigger = event.target.closest("[data-remove-sub-bullet]");
    const removeFreeLinkTrigger = event.target.closest("[data-remove-free-link]");
    const removeTableFillTrigger = event.target.closest("[data-remove-table-fill]");
    const toggleFreeMediaTrigger = event.target.closest("[data-toggle-free-media]");
    const addCanvasMediaTrigger = event.target.closest("[data-add-canvas-media]");
    const addPictoTrigger = event.target.closest("[data-add-picto]");
    const toggleCanvasLockTrigger = event.target.closest("[data-toggle-canvas-lock]");
    const moveCanvasLayerTrigger = event.target.closest("[data-canvas-layer-move]");
    const selectCanvasElementTrigger = event.target.closest("[data-select-canvas-element]");
    const addSlideTrigger = event.target.closest("[data-add-slide-bloom]");
    const bloomTrigger = event.target.closest("[data-set-bloom]");

    if (!event.target.closest(".add-slide-group") && isAddSlideMenuOpen) {
      closeAddSlideMenu();
    }

    if (toggleCanvasLockTrigger) {
      toggleCanvasElementLock(toggleCanvasLockTrigger.getAttribute("data-toggle-canvas-lock"));
      return;
    }

    if (moveCanvasLayerTrigger) {
      moveCanvasLayer(
        moveCanvasLayerTrigger.getAttribute("data-canvas-layer-move"),
        moveCanvasLayerTrigger.getAttribute("data-canvas-layer-direction") === "down" ? "down" : "up"
      );
      return;
    }

    if (selectCanvasElementTrigger) {
      selectedCanvasElementId = selectCanvasElementTrigger.getAttribute("data-select-canvas-element");
      render();
      return;
    }

    if (addSlideTrigger) {
      createBlankSlide(addSlideTrigger.getAttribute("data-add-slide-bloom"));
      return;
    }

    if (addCanvasMediaTrigger) {
      addCanvasMediaElement(addCanvasMediaTrigger.getAttribute("data-add-canvas-media"));
      return;
    }

    if (addPictoTrigger) {
      addPictoElement(addPictoTrigger.getAttribute("data-add-picto"));
      return;
    }

    if (mediaAssignTrigger) {
      if ((getSelectedSlide().contentType || "bullets") === "visual") {
        assignVisualMedia(mediaAssignTrigger.getAttribute("data-assign-media"));
        return;
      }
      assignMediaToSelectedSlide(mediaAssignTrigger.getAttribute("data-assign-media"));
      return;
    }

    if (toggleFreeMediaTrigger) {
      toggleSelectedFreeMedia(toggleFreeMediaTrigger.getAttribute("data-toggle-free-media"));
      return;
    }

    if (mediaDeleteTrigger) {
      const mediaId = mediaDeleteTrigger.getAttribute("data-delete-media");
      pushUndoSnapshot({ editKey: "" });
      state.mediaLibrary = state.mediaLibrary.filter((item) => item.id !== mediaId);
      state.slides = state.slides.map((slide) => {
        const nextVisualData = slide.visualData
          ? Object.assign({}, slide.visualData, {
              primaryMediaId: slide.visualData.primaryMediaId === mediaId ? "" : slide.visualData.primaryMediaId,
              secondaryMediaId: slide.visualData.secondaryMediaId === mediaId ? "" : slide.visualData.secondaryMediaId,
            })
          : slide.visualData;
        return Object.assign({}, slide, {
          mediaId: slide.mediaId === mediaId ? "" : slide.mediaId,
          secondaryMediaId: slide.secondaryMediaId === mediaId ? "" : slide.secondaryMediaId,
          visualData: nextVisualData,
          canvasData: slide.canvasData
            ? Object.assign({}, slide.canvasData, {
                elements: (Array.isArray(slide.canvasData.elements) ? slide.canvasData.elements : []).map((element) => {
                  if (element.type !== "image") {
                    return element;
                  }
                  return Object.assign({}, element, {
                    mediaId: element.mediaId === mediaId ? "" : element.mediaId,
                  });
                }),
              })
            : slide.canvasData,
        });
      });
      ns.services.media.deleteMedia(mediaId).then(() => render());
      render();
      return;
    }

    if (removeBulletTrigger) {
      removeSelectedBullet(Number(removeBulletTrigger.getAttribute("data-remove-bullet")));
      return;
    }

    if (addSubBulletTrigger) {
      addSelectedSubBullet(Number(addSubBulletTrigger.getAttribute("data-add-sub-bullet")));
      return;
    }

    if (removeSubBulletTrigger) {
      const [parentIndex, subIndex] = removeSubBulletTrigger.getAttribute("data-remove-sub-bullet").split("-").map(Number);
      removeSelectedSubBullet(parentIndex, subIndex);
      return;
    }

    if (removeFreeLinkTrigger) {
      removeSelectedFreeLink(Number(removeFreeLinkTrigger.getAttribute("data-remove-free-link")));
      return;
    }

    if (removeTableFillTrigger) {
      const [target, index] = removeTableFillTrigger.getAttribute("data-remove-table-fill").split(":");
      removeSelectedTableFill(target, target === "cell" ? index : Number(index));
      return;
    }

    if (deleteTrigger) {
      event.stopPropagation();
      deleteSlideById(deleteTrigger.getAttribute("data-delete-slide"));
      return;
    }

    if (slideTrigger) {
      selectSlide(slideTrigger.getAttribute("data-select-slide"), {
        focusPreviewPanel: refs.slideList.contains(slideTrigger),
      });
    }

    if (moveTrigger) {
      moveSlide(
        moveTrigger.getAttribute("data-move-slide"),
        Number(moveTrigger.getAttribute("data-direction"))
      );
    }

    if (bloomTrigger) {
      applyBloomLevel(bloomTrigger.getAttribute("data-set-bloom"));
    }
  });

  refs.principlesList.addEventListener("change", (event) => {
    const target = event.target;
    if (target && target.matches("[data-toggle-principle]")) {
      togglePrinciple(target.getAttribute("data-toggle-principle"));
    }
  });

  refs.thumbStrip.addEventListener("dragstart", (event) => {
    const card = event.target.closest("[data-thumb-slide]");
    if (!card) {
      return;
    }

    draggedSlideId = card.getAttribute("data-thumb-slide");
    card.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedSlideId);
    }
  });

  refs.thumbStrip.addEventListener("dragover", (event) => {
    const card = event.target.closest("[data-thumb-slide]");
    if (!card || !draggedSlideId) {
      return;
    }

    event.preventDefault();
    clearThumbDropState();
    if (card.getAttribute("data-thumb-slide") !== draggedSlideId) {
      card.classList.add("is-drop-target");
    }
  });

  refs.thumbStrip.addEventListener("drop", (event) => {
    const card = event.target.closest("[data-thumb-slide]");
    if (!card || !draggedSlideId) {
      return;
    }

    event.preventDefault();
    const targetId = card.getAttribute("data-thumb-slide");
    const targetIndex = state.slides.findIndex((slide) => slide.id === targetId);
    clearThumbDropState();
    moveSlideToIndex(draggedSlideId, targetIndex);
    draggedSlideId = null;
  });

  refs.thumbStrip.addEventListener("dragend", (event) => {
    const card = event.target.closest("[data-thumb-slide]");
    if (card) {
      card.classList.remove("is-dragging");
    }
    clearThumbDropState();
    draggedSlideId = null;
  });

  refs.slideList.addEventListener("dragstart", (event) => {
    const handle = event.target.closest("[data-list-drag-handle]");
    if (!handle) {
      event.preventDefault();
      return;
    }

    const card = handle.closest("[data-list-slide]");
    if (!card) {
      return;
    }

    draggedListSlideId = card.getAttribute("data-list-slide");
    card.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedListSlideId);
    }
  });

  refs.slideList.addEventListener("dragover", (event) => {
    const card = event.target.closest("[data-list-slide]");
    if (!card || !draggedListSlideId) {
      return;
    }

    event.preventDefault();
    clearListDropState();
    if (card.getAttribute("data-list-slide") !== draggedListSlideId) {
      card.classList.add("is-drop-target");
    }
  });

  refs.slideList.addEventListener("drop", (event) => {
    const card = event.target.closest("[data-list-slide]");
    if (!card || !draggedListSlideId) {
      return;
    }

    event.preventDefault();
    const targetId = card.getAttribute("data-list-slide");
    const targetIndex = state.slides.findIndex((slide) => slide.id === targetId);
    clearListDropState();
    moveSlideToIndex(draggedListSlideId, targetIndex);
    draggedListSlideId = null;
  });

  refs.slideList.addEventListener("dragend", (event) => {
    const card = event.target.closest("[data-list-slide]");
    if (card) {
      card.classList.remove("is-dragging");
    }
    clearListDropState();
    draggedListSlideId = null;
  });

  refs.slideBulletsEditor.addEventListener("dragstart", (event) => {
    const handle = event.target.closest("[data-bullet-drag-handle]");
    if (!handle) {
      return;
    }

    draggedBulletIndex = Number(handle.getAttribute("data-bullet-drag-handle"));
    const row = handle.closest("[data-bullet-row]");
    if (row) {
      row.classList.add("is-dragging");
    }
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(draggedBulletIndex));
    }
  });

  refs.slideBulletsEditor.addEventListener("dragover", (event) => {
    const row = event.target.closest("[data-bullet-row]");
    if (!row || draggedBulletIndex === null) {
      return;
    }

    event.preventDefault();
    clearBulletDropState();
    const targetIndex = Number(row.getAttribute("data-bullet-row"));
    if (targetIndex !== draggedBulletIndex) {
      row.classList.add("is-drop-target");
    }
  });

  refs.slideBulletsEditor.addEventListener("drop", (event) => {
    const row = event.target.closest("[data-bullet-row]");
    if (!row || draggedBulletIndex === null) {
      return;
    }

    event.preventDefault();
    const targetIndex = Number(row.getAttribute("data-bullet-row"));
    clearBulletDropState();
    moveSelectedBullet(draggedBulletIndex, targetIndex);
    draggedBulletIndex = null;
  });

  refs.slideBulletsEditor.addEventListener("dragend", () => {
    clearBulletDropState();
    draggedBulletIndex = null;
  });

  refs.canvasElementsList.addEventListener("dragstart", (event) => {
    const handle = event.target.closest("[data-canvas-reveal-drag-handle]");
    if (!handle) {
      return;
    }

    draggedCanvasRevealElementId = handle.getAttribute("data-canvas-reveal-drag-handle");
    const row = handle.closest("[data-canvas-reveal-row]");
    if (row) {
      row.classList.add("is-dragging");
    }
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedCanvasRevealElementId);
    }
  });

  refs.canvasElementsList.addEventListener("dragover", (event) => {
    const row = event.target.closest("[data-canvas-reveal-row]");
    if (!row || !draggedCanvasRevealElementId) {
      return;
    }

    event.preventDefault();
    clearCanvasRevealDropState();
    if (row.getAttribute("data-canvas-reveal-row") !== draggedCanvasRevealElementId) {
      row.classList.add("is-drop-target");
    }
  });

  refs.canvasElementsList.addEventListener("drop", (event) => {
    const row = event.target.closest("[data-canvas-reveal-row]");
    if (!row || !draggedCanvasRevealElementId) {
      return;
    }

    event.preventDefault();
    const targetId = row.getAttribute("data-canvas-reveal-row");
    const ordered = getCanvasRevealOrderItems(getSelectedCanvasData().elements);
    const targetIndex = ordered.findIndex((item) => item.id === targetId);
    clearCanvasRevealDropState();
    moveCanvasRevealToIndex(draggedCanvasRevealElementId, targetIndex);
    draggedCanvasRevealElementId = null;
  });

  refs.canvasElementsList.addEventListener("dragend", () => {
    clearCanvasRevealDropState();
    draggedCanvasRevealElementId = null;
  });

  refs.freeLinksList.addEventListener("dragstart", (event) => {
    const handle = event.target.closest("[data-free-link-drag-handle]");
    if (!handle) {
      return;
    }
    draggedFreeLinkIndex = Number(handle.getAttribute("data-free-link-drag-handle"));
    const row = handle.closest("[data-free-link-row]");
    if (row) {
      row.classList.add("is-dragging");
    }
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(draggedFreeLinkIndex));
    }
  });

  refs.freeLinksList.addEventListener("dragover", (event) => {
    const row = event.target.closest("[data-free-link-row]");
    if (!row || draggedFreeLinkIndex === null) {
      return;
    }
    event.preventDefault();
    refs.freeLinksList.querySelectorAll(".bullet-editor-row.is-drop-target").forEach((item) => {
      if (item !== row) {
        item.classList.remove("is-drop-target");
      }
    });
    row.classList.add("is-drop-target");
  });

  refs.freeLinksList.addEventListener("drop", (event) => {
    const row = event.target.closest("[data-free-link-row]");
    if (!row || draggedFreeLinkIndex === null) {
      return;
    }

    event.preventDefault();
    const targetIndex = Number(row.getAttribute("data-free-link-row"));
    refs.freeLinksList.querySelectorAll(".bullet-editor-row.is-drop-target, .bullet-editor-row.is-dragging").forEach((item) => {
      item.classList.remove("is-drop-target", "is-dragging");
    });
    moveSelectedFreeLink(draggedFreeLinkIndex, targetIndex);
    draggedFreeLinkIndex = null;
  });

  refs.freeLinksList.addEventListener("dragend", () => {
    refs.freeLinksList.querySelectorAll(".bullet-editor-row.is-drop-target, .bullet-editor-row.is-dragging").forEach((item) => {
      item.classList.remove("is-drop-target", "is-dragging");
    });
    draggedFreeLinkIndex = null;
  });

  refs.visualChartBars.addEventListener("dragstart", (event) => {
    const handle = event.target.closest("[data-visual-chart-drag-handle]");
    if (!handle) {
      return;
    }
    draggedVisualChartIndex = Number(handle.getAttribute("data-visual-chart-drag-handle"));
    const row = handle.closest("[data-visual-chart-row]");
    if (row) {
      row.classList.add("is-dragging");
    }
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(draggedVisualChartIndex));
    }
  });

  refs.visualChartBars.addEventListener("dragover", (event) => {
    const row = event.target.closest("[data-visual-chart-row]");
    if (!row || draggedVisualChartIndex === null) {
      return;
    }
    event.preventDefault();
    refs.visualChartBars.querySelectorAll(".visual-chart-bar-row.is-drop-target").forEach((item) => {
      if (item !== row) {
        item.classList.remove("is-drop-target");
      }
    });
    if (Number(row.getAttribute("data-visual-chart-row")) !== draggedVisualChartIndex) {
      row.classList.add("is-drop-target");
    }
  });

  refs.visualChartBars.addEventListener("drop", (event) => {
    const row = event.target.closest("[data-visual-chart-row]");
    if (!row || draggedVisualChartIndex === null) {
      return;
    }
    event.preventDefault();
    const targetIndex = Number(row.getAttribute("data-visual-chart-row"));
    refs.visualChartBars.querySelectorAll(".visual-chart-bar-row.is-drop-target, .visual-chart-bar-row.is-dragging").forEach((item) => {
      item.classList.remove("is-drop-target", "is-dragging");
    });
    moveSelectedVisualChartBar(draggedVisualChartIndex, targetIndex);
    draggedVisualChartIndex = null;
  });

  refs.visualChartBars.addEventListener("dragend", () => {
    refs.visualChartBars.querySelectorAll(".visual-chart-bar-row.is-drop-target, .visual-chart-bar-row.is-dragging").forEach((item) => {
      item.classList.remove("is-drop-target", "is-dragging");
    });
    draggedVisualChartIndex = null;
  });

  refs.stage.addEventListener("pointerdown", (event) => {
    const rotateHandle = event.target.closest("[data-canvas-rotate-handle]");
    const resizeHandle = event.target.closest("[data-canvas-resize-handle]");
    const canvasElement = event.target.closest("[data-canvas-element-id]");
    if (!canvasElement || canvasElement.getAttribute("data-canvas-locked") === "true") {
      return;
    }
    beginCanvasInteraction(
      event,
      canvasElement.getAttribute("data-canvas-element-id"),
      rotateHandle ? "rotate" : resizeHandle ? "resize" : "drag"
    );
  });

  refs.stage.addEventListener("click", (event) => {
    if (Date.now() < suppressCanvasClickUntil) {
      return;
    }
    const canvasElement = event.target.closest("[data-canvas-element-id]");
    const canvasSurface = event.target.closest("[data-canvas-surface]");
    if (canvasElement) {
      if (canvasElement.getAttribute("data-canvas-locked") === "true") {
        return;
      }
      selectedCanvasElementId = canvasElement.getAttribute("data-canvas-element-id");
      render();
      return;
    }
    if (canvasSurface && selectedCanvasElementId) {
      selectedCanvasElementId = null;
      render();
      return;
    }
    const tableCard = event.target.closest(".slide-table[data-table-lightbox='true']");
    if (tableCard) {
      openTableLightbox(tableCard);
      return;
    }
    const chartCard = event.target.closest(".slide-visual-chart-card");
    if (chartCard) {
      openChartLightbox(chartCard);
      return;
    }
    if (selectedCanvasElementId) {
      selectedCanvasElementId = null;
      render();
    }
  });

  document.addEventListener("pointermove", handleCanvasPointerMove);
  document.addEventListener("pointerup", endCanvasInteraction);
  document.addEventListener("pointercancel", endCanvasInteraction);

  refs.chartLightbox.addEventListener("click", (event) => {
    if (
      event.target === refs.chartLightbox ||
      event.target === refs.chartLightboxClose
    ) {
      closeChartLightbox();
    }
  });

  refs.tableLightbox.addEventListener("click", (event) => {
    if (
      event.target === refs.tableLightbox ||
      event.target === refs.tableLightboxClose
    ) {
      closeTableLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undoLastAction();
      return;
    }

    if (event.key === "Escape" && refs.chartLightbox.classList.contains("is-open")) {
      closeChartLightbox();
      return;
    }

    if (event.key === "Escape" && refs.tableLightbox.classList.contains("is-open")) {
      closeTableLightbox();
      return;
    }

    if (event.key === "Escape" && isCanvasPreviewFullscreen) {
      setCanvasPreviewFullscreen(false);
      return;
    }

    if ((event.key === "ArrowUp" || event.key === "ArrowDown") && isPreviewPanelTarget(event.target)) {
      event.preventDefault();
      const currentIndex = state.slides.findIndex((slide) => slide.id === state.selectedSlideId);
      if (currentIndex < 0) {
        return;
      }
      const nextIndex = event.key === "ArrowUp"
        ? Math.max(0, currentIndex - 1)
        : Math.min(state.slides.length - 1, currentIndex + 1);
      const nextSlide = state.slides[nextIndex];
      if (!nextSlide) {
        return;
      }
      selectSlide(nextSlide.id, { focusPreviewPanel: true });
      return;
    }

    if (
      ((event.key === "Delete") || (event.key === "Backspace")) &&
      selectedCanvasElementId &&
      !isEditableTarget(event.target)
    ) {
      event.preventDefault();
      removeSelectedCanvasElement();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
      event.preventDefault();
      duplicateCurrentSlide();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
      event.preventDefault();
      toggleAddSlideMenu();
    }

    if (event.key === "Escape" && isAddSlideMenuOpen) {
      closeAddSlideMenu();
    }
  });

  render();
  hydrateMediaLibrary();
})();
