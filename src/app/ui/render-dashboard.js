(function () {
  const ns = (window.StudioSlides = window.StudioSlides || {});
  ns.ui = ns.ui || {};

  function normalizeContentFontScale(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 100;
    }
    return Math.max(85, Math.min(140, Math.round(parsed / 5) * 5));
  }

  function renderDashboard(payload) {
    const state = payload.state;
    const refs = payload.refs;
    const selectedTableCell = payload.selectedTableCell || { row: 0, column: 0 };
    const selectedSlide = state.slides.find((slide) => slide.id === state.selectedSlideId) || state.slides[0];
    const bloomLevels = ns.data.bloomLevels || [];
    const colorPalettes = ns.data.colorPalettes || [];
    const decorativeAccents = ns.data.decorativeAccents || [];
    const fontOptions = ns.data.fontOptions || [];
    const principles = ns.data.cognitivePrinciples || [];
    const availableMediaItems = ns.data.augmentMediaItems ? ns.data.augmentMediaItems(state.mediaLibrary || []) : (state.mediaLibrary || []);
    const availableMediaUrls = ns.data.augmentMediaUrlMap ? ns.data.augmentMediaUrlMap(ns.services.media.getUrlMap()) : ns.services.media.getUrlMap();
    const density = ns.ui.computeDensity(selectedSlide);
    const visualData = selectedSlide.visualData || {};
    const canvasData = getCanvasData(selectedSlide);
    const selectedCanvasElement = getSelectedCanvasElement(canvasData, payload.selectedCanvasElementId);

    refs.deckTitle.value = state.settings.title;
    refs.deckSubtitle.value = state.settings.subtitle;
    refs.deckFooter.value = state.settings.footer;
    refs.deckTheme.value = state.settings.theme;
    refs.deckPalette.innerHTML = colorPalettes
      .map((palette) => `<option value="${ns.utils.escapeHtml(palette.id)}">${ns.utils.escapeHtml(palette.label)}</option>`)
      .join("");
    refs.deckPalette.value = state.settings.palette || "ocean";
    refs.deckFont.innerHTML = fontOptions
      .map((font) => `<option value="${ns.utils.escapeHtml(font.id)}">${ns.utils.escapeHtml(font.label)}</option>`)
      .join("");
    refs.deckFont.value = state.settings.font || "studio";
    refs.deckContentFontScale.value = String(normalizeContentFontScale(state.settings.contentFontScale));
    refs.deckContentFontScaleValue.textContent = `${refs.deckContentFontScale.value} %`;
    refs.deckTransition.value = state.settings.transition || "fade";
    refs.deckFrameShadow.checked = Boolean(state.settings.frameShadow);
    refs.slideCount.textContent = `${state.slides.length} slides`;
    refs.taxonomyCount.textContent = `${bloomLevels.length} niveaux`;
    refs.appShell.setAttribute("data-view", state.view || "engineering");
    refs.appShell.setAttribute("data-ui-theme", state.uiNightMode && (state.view || "engineering") === "presentation" ? "night" : "day");
    refs.toggleNightMode.classList.toggle("is-active", Boolean(state.uiNightMode));
    refs.toggleNightMode.setAttribute("aria-pressed", state.uiNightMode ? "true" : "false");
    refs.toggleNightMode.textContent = state.uiNightMode ? "Mode clair" : "Mode nuit";

    refs.tabs.forEach((tab) => {
      const isActive = tab.getAttribute("data-switch-view") === (state.view || "engineering");
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    refs.addSlide.setAttribute("aria-expanded", "false");
    refs.addSlideMenu.classList.remove("is-open");
    refs.addSlideMenu.hidden = true;

    refs.addSlideMenu.innerHTML = bloomLevels
      .map((level) => {
        return `
          <button
            class="add-slide-option"
            type="button"
            data-add-slide-bloom="${ns.utils.escapeHtml(level.id)}"
          >
            <span class="add-slide-option-number">${ns.utils.escapeHtml(level.number)}</span>
            <span class="add-slide-option-label">${ns.utils.escapeHtml(level.title)}</span>
          </button>
        `;
      })
      .join("");

    refs.slideBloomLevel.innerHTML = bloomLevels
      .map((level) => {
        const selected = level.id === selectedSlide.bloomLevel ? " selected" : "";
        return `<option value="${ns.utils.escapeHtml(level.id)}"${selected}>${ns.utils.escapeHtml(level.number)} - ${ns.utils.escapeHtml(level.title)}</option>`;
      })
      .join("");

    refs.slideLabel.value = selectedSlide.label;
    refs.slideNumber.value = selectedSlide.number;
    refs.slideObjective.value = selectedSlide.objective;
    refs.slideEvidence.value = selectedSlide.evidence;
    refs.slideTitle.value = selectedSlide.title;
    refs.slideSubtitle.value = selectedSlide.subtitle;
    refs.slideContentType.value = selectedSlide.contentType || "bullets";
    refs.slidePaletteOverride.innerHTML = [
      '<option value="">Palette du diaporama</option>',
      ...colorPalettes.map((palette) => `<option value="${ns.utils.escapeHtml(palette.id)}">${ns.utils.escapeHtml(palette.label)}</option>`),
    ].join("");
    refs.slidePaletteOverride.value = selectedSlide.paletteOverride || "";
    refs.slideDecorativeAccentOverride.innerHTML = [
      '<option value="">Habillage de la slide</option>',
      ...decorativeAccents.map((accent) => `<option value="${ns.utils.escapeHtml(accent.id)}">${ns.utils.escapeHtml(accent.label)}</option>`),
    ].join("");
    refs.slideDecorativeAccentOverride.value = selectedSlide.decorativeAccentOverride || "";
    refs.slideDecorativeAccentSolid.checked = Boolean(selectedSlide.decorativeAccentSolid);
    refs.slideBulletsNumbered.checked = Boolean(selectedSlide.bulletsNumbered);
    refs.slideBulletsProgressive.checked = Boolean(selectedSlide.bulletsProgressive);
    refs.slideBulletsSubProgressive.checked = Boolean(selectedSlide.bulletsSubProgressive);
    refs.slideBulletsSubProgressive.disabled = !Boolean(selectedSlide.bulletsProgressive);
    refs.slideTableProgressive.checked = Boolean(selectedSlide.tableProgressive);
    refs.slideTableProgressiveOrder.value = selectedSlide.tableProgressiveOrder === "column" ? "column" : "row";
    refs.slideBullet1.value = selectedSlide.bullets[0] || "";
    refs.slideBullet2.value = selectedSlide.bullets[1] || "";
    refs.slideBullet3.value = selectedSlide.bullets[2] || "";
    refs.subBulletLists.forEach((container, index) => {
      container.innerHTML = renderSubBulletEditor(selectedSlide, index);
    });
    refs.extraBulletsList.innerHTML = renderExtraBullets(selectedSlide);
    refs.tableEditorGrid.innerHTML = renderTableEditor(selectedSlide);
    const currentFillTarget = refs.tableFillTarget.value === "column"
      ? "column"
      : refs.tableFillTarget.value === "cell"
        ? "cell"
        : "row";
    const currentFillIndex = refs.tableFillIndex.value;
    refs.tableFillTarget.value = currentFillTarget;
    refs.tableFillIndex.innerHTML = renderTableFillIndexOptions(selectedSlide, currentFillTarget, selectedTableCell);
    if (refs.tableFillIndex.querySelector(`option[value="${ns.utils.escapeHtml(currentFillIndex)}"]`)) {
      refs.tableFillIndex.value = currentFillIndex;
    }
    refs.tableFillColor.value = getDefaultTableFillColor(selectedSlide, currentFillTarget, refs.tableFillIndex.value);
    refs.tableFillList.innerHTML = renderTableFillList(selectedSlide);
    const sanitizedFreeBody = ns.utils.sanitizeRichText(selectedSlide.freeBody || "", 3200);
    if (document.activeElement !== refs.slideFreeBody || refs.slideFreeBody.innerHTML !== sanitizedFreeBody) {
      refs.slideFreeBody.innerHTML = sanitizedFreeBody;
    }
    refs.freeLinksList.innerHTML = renderFreeLinks(selectedSlide);
    refs.visualPrimaryMedia.innerHTML = renderVisualMediaOptions(state.mediaLibrary, "Media principal");
    refs.visualSecondaryMedia.innerHTML = renderVisualMediaOptions(state.mediaLibrary, "Media secondaire");
    refs.visualPrimaryMedia.value = visualData.primaryMediaId || "";
    refs.visualSecondaryMedia.value = visualData.secondaryMediaId || "";
    refs.visualShowImages.checked = visualData.showImages !== false;
    refs.visualPrimaryMediaReveal.checked = Boolean(visualData.primaryMediaReveal);
    refs.visualSecondaryMediaReveal.checked = Boolean(visualData.secondaryMediaReveal);
    refs.visualShowBody.checked = visualData.showBody !== false;
    refs.visualShowCallout.checked = visualData.showCallout !== false;
    refs.visualBody.value = visualData.body || "";
    refs.visualCallout.value = visualData.callout || "";    if (refs.visualArrowDirection) {
      refs.visualArrowDirection.value = visualData.arrowDirection || "right";
    }
    if (refs.visualArrowColor) {
      refs.visualArrowColor.value = visualData.arrowColor || "#60b2e5";
    }
    refs.visualShowChart.checked = visualData.showChart !== false;
    refs.visualChartEditor.hidden = visualData.showChart === false;
    refs.visualChartReveal.checked = Boolean(visualData.chartReveal);
    refs.visualChartTitle.value = visualData.chartTitle || "";
    refs.visualChartBars.innerHTML = renderVisualChartEditor(visualData);
    refs.visualChartAddColumn.disabled = (visualData.chartBarCount || 3) >= 6;
    refs.visualChartRemoveColumn.disabled = (visualData.chartBarCount || 3) <= 1;
    refs.canvasElementsList.innerHTML = renderCanvasElementsList(canvasData, selectedCanvasElement && selectedCanvasElement.id, availableMediaItems);
    refs.canvasProgressive.checked = Boolean(canvasData.progressive);
    refs.canvasImageMedia.innerHTML = renderVisualMediaOptions(availableMediaItems, "Choisir un media");
    refs.canvasElementFields.hidden = !selectedCanvasElement;
    refs.canvasEmptySelection.hidden = Boolean(selectedCanvasElement);
    if (selectedCanvasElement) {
      refs.canvasElementX.value = formatCanvasMetric(selectedCanvasElement.x);
      refs.canvasElementY.value = formatCanvasMetric(selectedCanvasElement.y);
      refs.canvasElementX.max = formatCanvasMetric(Math.max(0, 100 - (Number(selectedCanvasElement.w) || 6)));
      refs.canvasElementY.min = "-14";
      refs.canvasElementY.max = formatCanvasMetric(Math.max(0, 100 - (Number(selectedCanvasElement.h) || 6)));
      refs.canvasElementW.value = formatCanvasMetric(selectedCanvasElement.w);
      refs.canvasElementH.value = formatCanvasMetric(selectedCanvasElement.h);
      refs.canvasTextContentWrap.hidden = selectedCanvasElement.type !== "text";
      refs.canvasTextToolbar.hidden = selectedCanvasElement.type !== "text";
      refs.canvasTextStyleGrid.hidden = selectedCanvasElement.type !== "text";
      refs.canvasImageMediaWrap.hidden = selectedCanvasElement.type !== "image";
      refs.canvasArrowControls.hidden = selectedCanvasElement.type !== "arrow";
      refs.canvasShapeControls.hidden = selectedCanvasElement.type !== "shape";
      if (selectedCanvasElement.type === "text") {
        const sanitizedCanvasText = ns.utils.sanitizeRichText(selectedCanvasElement.text || "", 2000);
        refs.canvasTextFont.innerHTML = [
          '<option value="">Typographie du document</option>',
          ...fontOptions.map((font) => `<option value="${ns.utils.escapeHtml(font.id)}">${ns.utils.escapeHtml(font.label)}</option>`),
        ].join("");
        refs.canvasTextFont.value = selectedCanvasElement.fontOptionId || "";
        refs.canvasTextContent.style.fontFamily = getCanvasFontOption(selectedCanvasElement.fontOptionId || (state.settings.font || "studio")).body;
        refs.canvasTextContent.style.fontSize = String(Math.round(Number(selectedCanvasElement.fontSize) || 28)) + "px";
        refs.canvasTextContent.style.lineHeight = "1.12";
        if (document.activeElement !== refs.canvasTextContent || refs.canvasTextContent.innerHTML !== sanitizedCanvasText) {
          refs.canvasTextContent.innerHTML = sanitizedCanvasText;
        }
      } else if (refs.canvasTextContent.innerHTML) {
        refs.canvasTextContent.innerHTML = "";
      }
      if (selectedCanvasElement.type !== "text") {
        refs.canvasTextContent.style.fontFamily = "";
        refs.canvasTextContent.style.fontSize = "";
        refs.canvasTextContent.style.lineHeight = "";
      }
      refs.canvasTextSize.value = selectedCanvasElement.type === "text" ? String(Math.round(Number(selectedCanvasElement.fontSize) || 28)) : "28";
      refs.canvasTextSizeValue.textContent = `${refs.canvasTextSize.value} px`;
      refs.canvasTextFrame.checked = selectedCanvasElement.type === "text" ? selectedCanvasElement.showFrame !== false : true;
      refs.canvasTextBold.classList.remove("is-active");
      refs.canvasTextBold.setAttribute("aria-pressed", "false");
      refs.canvasTextItalic.classList.remove("is-active");
      refs.canvasTextItalic.setAttribute("aria-pressed", "false");
      refs.canvasTextUnderline.classList.remove("is-active");
      refs.canvasTextUnderline.setAttribute("aria-pressed", "false");
      refs.canvasImageMedia.value = selectedCanvasElement.type === "image" ? (selectedCanvasElement.mediaId || "") : "";
      refs.canvasArrowDirection.value = selectedCanvasElement.type === "arrow" ? (selectedCanvasElement.direction || "right") : "right";
      refs.canvasArrowColor.value = selectedCanvasElement.type === "arrow" ? (selectedCanvasElement.color || "#0a66ff") : "#0a66ff";
      refs.canvasArrowRotation.value = selectedCanvasElement.type === "arrow" ? String(Math.round(Number(selectedCanvasElement.rotation) || 0)) : "0";
      refs.canvasArrowLength.value = selectedCanvasElement.type === "arrow" ? String(Math.round(Number(selectedCanvasElement.arrowLength) || 100)) : "100";
      refs.canvasArrowLengthValue.textContent = `${refs.canvasArrowLength.value} %`;
      refs.canvasShapeKind.value = selectedCanvasElement.type === "shape" ? (selectedCanvasElement.shapeKind || "circle") : "circle";
      refs.canvasShapeColor.value = selectedCanvasElement.type === "shape" ? (selectedCanvasElement.color || "#0a66ff") : "#0a66ff";
    } else {
      refs.canvasElementX.max = "94";
      refs.canvasElementY.min = "-14";
      refs.canvasElementY.max = "94";
      refs.canvasTextContentWrap.hidden = true;
      refs.canvasTextToolbar.hidden = true;
      refs.canvasTextStyleGrid.hidden = true;
      refs.canvasImageMediaWrap.hidden = true;
      refs.canvasArrowControls.hidden = true;
      refs.canvasShapeControls.hidden = true;
      refs.canvasTextContent.innerHTML = "";
      refs.canvasTextContent.style.fontFamily = "";
      refs.canvasTextContent.style.fontSize = "";
      refs.canvasTextContent.style.lineHeight = "";
      refs.canvasTextFont.innerHTML = [
        '<option value="">Typographie du document</option>',
        ...fontOptions.map((font) => `<option value="${ns.utils.escapeHtml(font.id)}">${ns.utils.escapeHtml(font.label)}</option>`),
      ].join("");
      refs.canvasTextFont.value = "";
      refs.canvasTextSize.value = "28";
      refs.canvasTextSizeValue.textContent = "28 px";
      refs.canvasTextFrame.checked = true;
      refs.canvasTextBold.classList.remove("is-active");
      refs.canvasTextBold.setAttribute("aria-pressed", "false");
      refs.canvasTextItalic.classList.remove("is-active");
      refs.canvasTextItalic.setAttribute("aria-pressed", "false");
      refs.canvasTextUnderline.classList.remove("is-active");
      refs.canvasTextUnderline.setAttribute("aria-pressed", "false");
      refs.canvasImageMedia.value = "";
      refs.canvasArrowDirection.value = "right";
      refs.canvasArrowColor.value = "#0a66ff";
      refs.canvasArrowRotation.value = "0";
      refs.canvasArrowLength.value = "100";
      refs.canvasArrowLengthValue.textContent = "100 %";
      refs.canvasShapeKind.value = "circle";
      refs.canvasShapeColor.value = "#0a66ff";
    }
    refs.slideNote.value = selectedSlide.note;
    refs.slidePresenterNotes.value = selectedSlide.presenterNotes || "";
    const isTableMode = (selectedSlide.contentType || "bullets") === "table";
    const isFreeMode = (selectedSlide.contentType || "bullets") === "free";
    const isVisualMode = (selectedSlide.contentType || "bullets") === "visual";
    const isCanvasMode = (selectedSlide.contentType || "bullets") === "canvas";
    refs.slideBulletsEditor.hidden = isTableMode || isFreeMode || isVisualMode || isCanvasMode;
    refs.slideTableEditor.hidden = !isTableMode;
    refs.slideFreeEditor.hidden = !isFreeMode;
    refs.slideVisualEditor.hidden = !isVisualMode;
    refs.slideCanvasEditor.hidden = false;
    refs.slideNoteEditor.hidden = false;
    refs.slidePresenterNotesEditor.hidden = false;
    refs.slideBulletsEditor.classList.toggle("is-collapsed", isTableMode || isFreeMode || isVisualMode || isCanvasMode);
    refs.slideTableEditor.classList.toggle("is-collapsed", !isTableMode);
    refs.slideFreeEditor.classList.toggle("is-collapsed", !isFreeMode);
    refs.slideVisualEditor.classList.toggle("is-collapsed", !isVisualMode);
    refs.slideCanvasEditor.classList.toggle("is-collapsed", false);
    refs.globalPanelBody.hidden = Boolean(state.uiGlobalPanelCollapsed);
    refs.toggleGlobalPanel.textContent = state.uiGlobalPanelCollapsed ? "Déplier" : "Replier";
    refs.toggleGlobalPanel.setAttribute("aria-expanded", state.uiGlobalPanelCollapsed ? "false" : "true");
    refs.clearSlideMedia.hidden = isFreeMode || isVisualMode || isCanvasMode;
    refs.slideMediaPanelBody.hidden = Boolean(state.uiMediaPanelCollapsed);
    refs.toggleMediaPanel.textContent = state.uiMediaPanelCollapsed ? "Déplier" : "Replier";
    refs.toggleMediaPanel.setAttribute("aria-expanded", state.uiMediaPanelCollapsed ? "false" : "true");
    const table = normalizeTable(selectedSlide.table);
    const isTwoColumnTable = Boolean(table[0] && table[0].length === 2);
    refs.slideTableProgressiveOrderWrap.hidden = !isTableMode || !selectedSlide.tableProgressive || !isTwoColumnTable;

    refs.titleMeta.textContent = `${selectedSlide.title.length}/72 caractères`;
    refs.subtitleMeta.textContent = `${selectedSlide.subtitle.length}/170 caractères`;
    refs.noteMeta.textContent = `${selectedSlide.note.length}/180 caractères`;
    refs.presenterNotesMeta.textContent = `${(selectedSlide.presenterNotes || "").length}/2000 caractères`;
    refs.freeBodyMeta.textContent = `${ns.utils.richTextLength(selectedSlide.freeBody || "")}/3200 caractères`;
    refs.visualBodyMeta.textContent = `${(visualData.body || "").length}/320 caractères`;
    refs.visualCalloutMeta.textContent = `${(visualData.callout || "").length}/180 caractères`;
    refs.objectiveMeta.textContent = `${selectedSlide.objective.length}/180 caractères`;
    refs.evidenceMeta.textContent = `${selectedSlide.evidence.length}/120 caractères`;

    refs.densityBadge.className = density.className;
    refs.densityBadge.textContent = density.label;
    refs.slideHint.textContent = isVisualMode
      ? "Mode visuel : medias, texte, fleche et mini graphe dans une composition editoriale."
      : isFreeMode
      ? "Mode libre : texte long, liens et plusieurs medias pour les annexes."
      : isCanvasMode
      ? "Mode canvas : place librement textes, medias, fleches et pictos directement sur la slide."
      : "Modele : un niveau Bloom, une idee forte, trois points maximum, avec un calque libre pour les pictos et repères visuels.";
    refs.slideMediaSelection.textContent = isVisualMode
      ? getVisualMediaSelectionText(selectedSlide, state.mediaLibrary)
      : isFreeMode
      ? `${(selectedSlide.freeMediaIds || []).length} média(x) dans l'annexe libre.`
      : isCanvasMode
      ? getCanvasMediaSelectionText(canvasData, availableMediaItems)
      : (selectedSlide.mediaId || selectedSlide.secondaryMediaId)
        ? getMediaSelectionText(selectedSlide, state.mediaLibrary)
        : "Aucun média affecté à cette slide.";
    refs.slideList.innerHTML = renderSlideList(state, selectedSlide.id);
    refs.taxonomyRoadmap.innerHTML = renderTaxonomyRoadmap(state, selectedSlide.bloomLevel);
    refs.principlesList.innerHTML = renderPrinciplesList(selectedSlide, principles);
    refs.stage.innerHTML = ns.ui.createSlideMarkup(selectedSlide, state.settings, {
      compact: false,
      mediaItems: availableMediaItems,
      mediaUrls: availableMediaUrls,
      canvasInteractive: true,
      selectedCanvasElementId: selectedCanvasElement ? selectedCanvasElement.id : "",
    });
    refs.presentationProgress.innerHTML = renderPresentationProgress(state, selectedSlide.id);
    refs.pedagogyBrief.innerHTML = renderPedagogyBrief(selectedSlide, principles);
    refs.mediaLibrary.innerHTML = renderMediaLibrary(state.mediaLibrary, selectedSlide);
    if (refs.pictoLibrary) {
      refs.pictoLibrary.innerHTML = renderPictoLibrary(selectedSlide, availableMediaUrls);
    }
    refs.thumbStrip.innerHTML = renderThumbStrip(state, selectedSlide.id);
    refs.thumbStrip.hidden = Boolean(state.uiThumbStripCollapsed);
    refs.toggleThumbStrip.textContent = state.uiThumbStripCollapsed ? "Déplier" : "Replier";
    refs.toggleThumbStrip.setAttribute("aria-expanded", state.uiThumbStripCollapsed ? "false" : "true");
  }

  function getMediaSelectionText(selectedSlide, mediaItems) {
    const selectedMedia = [selectedSlide.mediaId, selectedSlide.secondaryMediaId]
      .filter(Boolean)
      .map((mediaId) => (mediaItems || []).find((item) => item.id === mediaId))
      .filter(Boolean);
    if (!selectedMedia.length) {
      return "Aucun média affecté à cette slide.";
    }
    if (selectedMedia.length === 1) {
      const mediaItem = selectedMedia[0];
      const kindLabel = getMediaKindLabel(mediaItem);
      return `${kindLabel} sélectionnée : ${mediaItem.name}`;
    }
    return `${selectedMedia.length} médias sélectionnés : ${selectedMedia.map((item) => item.name).join(" / ")}`;
  }

  function getMediaKindLabel(item) {
    if (!item) {
      return "Media";
    }
    if (item.kind === "video") {
      return "Video";
    }
    if (item.kind === "embed") {
      const providerLabels = {
        youtube: "YouTube",
        "apps-education": "Apps Education",
        radiofrance: "Radio France",
      };
      const providerLabel = providerLabels[item.provider] || "";
      return providerLabel ? `Embed ${providerLabel}` : "Embed";
    }
    return "Image";
  }
  function renderSlideList(state, activeId) {
    return state.slides
      .map((slide, index) => {
        const activeClass = slide.id === activeId ? " is-active" : "";
        const bloomMeta = ns.ui.getBloomMeta(slide.bloomLevel);
        return `
          <article class="slide-item${activeClass}" data-list-slide="${ns.utils.escapeHtml(slide.id)}">
            <button class="slide-select" type="button" data-select-slide="${ns.utils.escapeHtml(slide.id)}">
              <span class="slide-order" data-list-drag-handle="true" draggable="true" title="Glisser pour réordonner">
                ${String(index + 1).padStart(2, "0")}
              </span>
              <span class="slide-meta">
                <span class="slide-title">${ns.utils.escapeHtml(slide.title || "Slide sans titre")}</span>
                <span class="slide-subline">${ns.utils.escapeHtml(bloomMeta.title)} - ${ns.utils.escapeHtml(slide.subtitle || "À compléter")}</span>
              </span>
            </button>
            <div class="slide-actions">
              <button class="icon-button" type="button" data-move-slide="${ns.utils.escapeHtml(slide.id)}" data-direction="-1" aria-label="Monter">
                ^
              </button>
              <button class="icon-button" type="button" data-move-slide="${ns.utils.escapeHtml(slide.id)}" data-direction="1" aria-label="Descendre">
                v
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderTaxonomyRoadmap(state, activeBloomLevel) {
    const bloomLevels = ns.data.bloomLevels || [];
    return bloomLevels
      .map((level) => {
        const count = state.slides.filter((slide) => slide.bloomLevel === level.id).length;
        const activeClass = level.id === activeBloomLevel ? " is-active" : "";
        const verbMarkup = level.verbs
          .map((verb) => `<span class="verb-chip">${ns.utils.escapeHtml(verb)}</span>`)
          .join("");

        return `
          <article class="taxonomy-card${activeClass}" data-set-bloom="${ns.utils.escapeHtml(level.id)}">
            <div class="taxonomy-topline">
              <span class="taxonomy-step">${ns.utils.escapeHtml(level.number)}</span>
              <span class="count-pill">${count} slide${count > 1 ? "s" : ""}</span>
            </div>
            <h3 class="taxonomy-title">${ns.utils.escapeHtml(level.title)}</h3>
            <p class="taxonomy-summary">${ns.utils.escapeHtml(level.summary)}</p>
            <div class="taxonomy-verbs">${verbMarkup}</div>
          </article>
        `;
      })
      .join("");
  }

  function renderPrinciplesList(selectedSlide, principles) {
    return principles
      .map((principle) => {
        const checked = selectedSlide.principleIds.includes(principle.id) ? " checked" : "";
        return `
          <label class="principle-card">
            <input type="checkbox" data-toggle-principle="${ns.utils.escapeHtml(principle.id)}"${checked} />
            <span>
              <span class="principle-title">${ns.utils.escapeHtml(principle.title)}</span>
              <span class="principle-summary">${ns.utils.escapeHtml(principle.summary)}</span>
              <span class="principle-detail">${ns.utils.escapeHtml(principle.detail)}</span>
            </span>
          </label>
        `;
      })
      .join("");
  }

  function renderPedagogyBrief(selectedSlide, principles) {
    const bloomMeta = ns.ui.getBloomMeta(selectedSlide.bloomLevel);
    const activePrinciples = principles.filter((principle) => selectedSlide.principleIds.includes(principle.id));
    const principleMarkup = activePrinciples.length
      ? activePrinciples
          .map((principle) => `<span class="principle-chip">${ns.utils.escapeHtml(principle.title)}</span>`)
          .join("")
      : '<span class="principle-chip">Aucun principe actif</span>';

    return `
      <div class="pedagogy-heading">
        <span class="slide-meta-chip">${ns.utils.escapeHtml(bloomMeta.title)}</span>
        ${principleMarkup}
      </div>
      <div class="pedagogy-grid">
        <div class="pedagogy-box">
          <h4>Objectif</h4>
          <p class="pedagogy-line">${ns.utils.escapeHtml(selectedSlide.objective || "À compléter")}</p>
        </div>
        <div class="pedagogy-box">
          <h4>Trace attendue</h4>
          <p class="pedagogy-line">${ns.utils.escapeHtml(selectedSlide.evidence || "À compléter")}</p>
        </div>
      </div>
    `;
  }

  function renderThumbStrip(state, activeId) {
    return state.slides
      .map((slide, index) => {
        const activeClass = slide.id === activeId ? " is-active" : "";
        return `
          <article
            class="thumb-card${activeClass}"
            data-select-slide="${ns.utils.escapeHtml(slide.id)}"
            data-thumb-slide="${ns.utils.escapeHtml(slide.id)}"
            data-thumb-index="${index}"
            draggable="true"
          >
            <div class="thumb-card-actions">
              <button
                class="icon-button icon-button-danger"
                type="button"
                data-delete-slide="${ns.utils.escapeHtml(slide.id)}"
                aria-label="Supprimer la slide ${ns.utils.escapeHtml(slide.number || String(index + 1).padStart(2, "0"))}"
              >
                x
              </button>
            </div>
            ${ns.ui.createSlideMarkup(slide, state.settings, {
              compact: true,
              mediaItems: ns.data.augmentMediaItems ? ns.data.augmentMediaItems(state.mediaLibrary || []) : (state.mediaLibrary || []),
              mediaUrls: ns.data.augmentMediaUrlMap ? ns.data.augmentMediaUrlMap(ns.services.media.getUrlMap()) : ns.services.media.getUrlMap(),
            })}
            <p class="thumb-caption">${ns.utils.escapeHtml(slide.number)} - ${ns.utils.escapeHtml(slide.label)}</p>
          </article>
        `;
      })
      .join("");
  }

  function getVisualMediaSelectionText(selectedSlide, mediaItems) {
    const visualData = selectedSlide.visualData || {};
    const selectedNames = [visualData.primaryMediaId, visualData.secondaryMediaId]
      .filter(Boolean)
      .map((mediaId) => (mediaItems || []).find((item) => item.id === mediaId))
      .filter(Boolean)
      .map((item) => item.name);

    if (!selectedNames.length) {
      return "Aucun media visuel selectionne. Importez puis assignez un media principal et secondaire.";
    }

    return `${selectedNames.length} média(x) dans la composition visuelle : ${selectedNames.join(" / ")}`;
  }

  function getCanvasData(slide) {
    const raw = slide && slide.canvasData && typeof slide.canvasData === "object" ? slide.canvasData : {};
    return {
      progressive: Boolean(raw.progressive),
      elements: Array.isArray(raw.elements) ? raw.elements : [],
    };
  }

  function getSelectedCanvasElement(canvasData, selectedId) {
    const elements = canvasData && Array.isArray(canvasData.elements) ? canvasData.elements : [];
    return elements.find((item) => item.id === selectedId) || null;
  }

  function getCanvasFontOption(fontOptionId) {
    const fontOptions = ns.data.fontOptions || [];
    return fontOptions.find((item) => item.id === fontOptionId) || fontOptions[0] || {
      id: "studio",
      label: "Studio",
      body: '"Aptos", "Segoe UI", "Trebuchet MS", sans-serif',
    };
  }

  function getCanvasMediaSelectionText(canvasData, mediaItems) {
    const mediaIds = Array.from(new Set(
      ((canvasData && canvasData.elements) || [])
        .filter((item) => item && item.type === "image" && item.mediaId)
        .map((item) => item.mediaId)
    ));
    const names = mediaIds
      .map((mediaId) => (mediaItems || []).find((item) => item.id === mediaId))
      .filter(Boolean)
      .map((item) => item.name);

    if (!names.length) {
      return "Aucun media pose sur le canvas. Cliquez un media pour l'ajouter, ou pour remplacer le media selectionne.";
    }

    return `${names.length} média(x) sur le canvas : ${names.join(" / ")}`;
  }

  function getCanvasElementLabel(element) {
    if (!element) {
      return "Élément";
    }
    if (element.type === "image") {
      return "Media";
    }
    if (element.type === "arrow") {
      return "Flèche";
    }
    if (element.type === "shape") {
      return element.shapeKind === "square" ? "Carré" : element.shapeKind === "bubble" ? "Bulle" : "Cercle";
    }
    return "Texte";
  }

  function getCanvasElementTextPreview(element) {
    if (!element || element.type !== "text") {
      return getCanvasElementLabel(element);
    }
    const raw = String(element.text || "").trim();
    if (!raw) {
      return "Zone de texte";
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${raw}</div>`, "text/html");
    const plainText = String((doc.body && doc.body.textContent) || "")
      .replace(/\s+/g, " ")
      .trim();
    return ns.utils.clampText(plainText || "Zone de texte", 56);
  }

  function getCanvasElementMediaPreview(element, mediaItems, mediaUrls) {
    if (!element || element.type !== "image") {
      return "";
    }
    const media = (mediaItems || []).find((item) => item.id === element.mediaId);
    const previewUrl = (mediaUrls && mediaUrls[element.mediaId]) || (media && (media.thumbnailUrl || media.externalUrl)) || "";
    if (!previewUrl) {
      return '<span class="canvas-element-chip-thumb canvas-element-chip-thumb-placeholder">Img</span>';
    }
    return `<img class="canvas-element-chip-thumb" src="${ns.utils.escapeHtml(previewUrl)}" alt="${ns.utils.escapeHtml((media && media.name) || "Image canvas")}" />`;
  }

  function formatCanvasMetric(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(1).replace(/\.0$/, "") : "0";
  }

  function renderCanvasRevealGroupOptions(value) {
    const activeValue = String(value || '').trim().toUpperCase();
    return ['<option value="">-</option>']
      .concat(Array.from({ length: 26 }, (_, index) => {
        const letter = String.fromCharCode(65 + index);
        return `<option value="${letter}"${activeValue === letter ? ' selected' : ''}>${letter}</option>`;
      }))
      .join('');
  }

  function renderCanvasElementsList(canvasData, activeId, mediaItems) {
    const elements = canvasData && Array.isArray(canvasData.elements) ? canvasData.elements : [];
    if (!elements.length) {
      return '<p class="extra-bullets-empty">Aucun élément sur le canvas.</p>';
    }
    const mediaUrls = ns.data.augmentMediaUrlMap ? ns.data.augmentMediaUrlMap(ns.services.media.getUrlMap()) : ns.services.media.getUrlMap();
    const layerOrder = elements.map((element) => element.id);

    const ordered = elements
      .slice()
      .sort((a, b) => (Number(a.revealOrder) || 0) - (Number(b.revealOrder) || 0));

    return ordered
      .map((element, index) => {
        const locked = Boolean(element.locked);
        const activeClass = element.id === activeId && !locked ? ' is-active' : '';
        const lockedClass = locked ? ' is-locked' : '';
        const layerIndex = layerOrder.indexOf(element.id);
        const canMoveDown = layerIndex > 0;
        const canMoveUp = layerIndex >= 0 && layerIndex < (layerOrder.length - 1);
        const previewMarkup = element.type === 'image'
          ? getCanvasElementMediaPreview(element, mediaItems, mediaUrls)
          : `<span class="canvas-element-chip-text-preview">${ns.utils.escapeHtml(getCanvasElementTextPreview(element))}</span>`;
        return `
          <div class="canvas-element-row${activeClass}" data-canvas-reveal-row="${ns.utils.escapeHtml(element.id)}">
            <button class="canvas-element-chip${activeClass}${lockedClass}" type="button" data-select-canvas-element="${ns.utils.escapeHtml(element.id)}"${locked ? ' disabled title="Objet verrouillé"' : ''}>
              <span class="canvas-element-chip-index">${index + 1}</span>
              <span class="canvas-element-chip-label">${previewMarkup}</span>
              <span class="canvas-element-chip-meta">Ordre ${index + 1}${element.revealGroup ? ' · Groupe ' + ns.utils.escapeHtml(element.revealGroup) : ''}${locked ? ' · Verrouillé' : ''}</span>
            </button>
            <div class="canvas-element-chip-actions">
              <label class="canvas-reveal-group-field" title="Révéler en même temps que les objets du même groupe">
                <span class="sr-only">Groupe de révélation</span>
                <select class="canvas-reveal-group-select" data-canvas-reveal-group-select="${ns.utils.escapeHtml(element.id)}">
                  ${renderCanvasRevealGroupOptions(element.revealGroup)}
                </select>
              </label>
              <button
                class="button button-ghost canvas-layer-action${locked ? ' is-active' : ''}"
                type="button"
                data-toggle-canvas-lock="${ns.utils.escapeHtml(element.id)}"
                aria-label="${locked ? 'Déverrouiller' : 'Verrouiller'} l'objet"
                title="${locked ? 'Déverrouiller' : 'Verrouiller'}"
              >${locked ? '🔒' : '🔓'}</button>
              <button
                class="button button-ghost canvas-layer-action"
                type="button"
                data-canvas-layer-move="${ns.utils.escapeHtml(element.id)}"
                data-canvas-layer-direction="down"
                aria-label="Placer en dessous"
                title="Placer en dessous"
                ${canMoveDown ? '' : 'disabled'}
              >↓</button>
              <button
                class="button button-ghost canvas-layer-action"
                type="button"
                data-canvas-layer-move="${ns.utils.escapeHtml(element.id)}"
                data-canvas-layer-direction="up"
                aria-label="Placer au-dessus"
                title="Placer au-dessus"
                ${canMoveUp ? '' : 'disabled'}
              >↑</button>
              <button
                class="button button-ghost canvas-order-handle"
                type="button"
                draggable="true"
                data-canvas-reveal-drag-handle="${ns.utils.escapeHtml(element.id)}"
                aria-label="Glisser pour changer l'ordre de révélation"
                title="Glisser pour changer l'ordre"
              >⋮⋮</button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function renderVisualMediaOptions(mediaItems, placeholder) {
    return [
      `<option value="">${ns.utils.escapeHtml(placeholder)}</option>`,
      ...(mediaItems || []).map((item) => {
        const kindLabel = getMediaKindLabel(item);
        return `<option value="${ns.utils.escapeHtml(item.id)}">${ns.utils.escapeHtml(kindLabel)} - ${ns.utils.escapeHtml(item.name)}</option>`;
      }),
    ].join("");
  }

  function renderPresentationProgress(state, activeId) {
    return state.slides
      .map((slide, index) => {
        const isActive = slide.id === activeId;
        const activeClass = isActive ? " is-active" : "";
        const slideNumber = slide.number || String(index + 1).padStart(2, "0");
        const slideTitle = slide.title || `Slide ${slideNumber}`;
        return `
          <button
            class="presentation-progress-step${activeClass}"
            type="button"
            data-select-slide="${ns.utils.escapeHtml(slide.id)}"
            aria-label="Aller à la slide ${ns.utils.escapeHtml(slideNumber)} : ${ns.utils.escapeHtml(slideTitle)}"
            ${isActive ? 'aria-current="step"' : ""}
            title="${ns.utils.escapeHtml(slideNumber)} - ${ns.utils.escapeHtml(slideTitle)}"
          >
            <span class="presentation-progress-dot"></span>
          </button>
        `;
      })
      .join("");
  }

  function renderMediaLibrary(mediaItems, selectedSlide) {
    if (!mediaItems || mediaItems.length === 0) {
      return '<p class="media-empty">Importez une image, une video ou un embed pour commencer.</p>';
    }

    const mediaUrls = ns.services.media.getUrlMap();
    const isFreeMode = (selectedSlide.contentType || "bullets") === "free";
    const isVisualMode = (selectedSlide.contentType || "bullets") === "visual";
    const isCanvasMode = (selectedSlide.contentType || "bullets") === "canvas";
    const freeMediaIds = Array.isArray(selectedSlide.freeMediaIds) ? selectedSlide.freeMediaIds : [];
    const visualMediaIds = selectedSlide.visualData
      ? [selectedSlide.visualData.primaryMediaId, selectedSlide.visualData.secondaryMediaId].filter(Boolean)
      : [];
    const canvasMediaIds = selectedSlide.canvasData && Array.isArray(selectedSlide.canvasData.elements)
      ? selectedSlide.canvasData.elements.filter((item) => item.type === "image" && item.mediaId).map((item) => item.mediaId)
      : [];

    return mediaItems
      .map((item) => {
        const bulletMediaIds = [selectedSlide.mediaId, selectedSlide.secondaryMediaId].filter(Boolean);
        const activeClass = isVisualMode
          ? (visualMediaIds.includes(item.id) ? " is-active" : "")
          : isCanvasMode
            ? (canvasMediaIds.includes(item.id) ? " is-active" : "")
          : isFreeMode
            ? (freeMediaIds.includes(item.id) ? " is-active" : "")
            : (bulletMediaIds.includes(item.id) ? " is-active" : "");
        const preview = item.kind === "video"
          ? `<video class="media-thumb-preview" src="${ns.utils.escapeHtml(mediaUrls[item.id] || "")}" muted preload="metadata"></video>`
          : `<img class="media-thumb-preview" src="${ns.utils.escapeHtml(mediaUrls[item.id] || "")}" alt="${ns.utils.escapeHtml(item.name)}" />`;
        const typeLabel = getMediaKindLabel(item);
        const actionAttr = isCanvasMode
          ? `data-add-canvas-media="${ns.utils.escapeHtml(item.id)}"`
          : isFreeMode
            ? `data-toggle-free-media="${ns.utils.escapeHtml(item.id)}"`
            : `data-assign-media="${ns.utils.escapeHtml(item.id)}"`;

        return `
          <article class="media-card${activeClass}">
            <button class="media-card-select" type="button" ${actionAttr}>
              <span class="media-thumb">${preview}</span>
              <span class="media-meta">
                <span class="media-title">${ns.utils.escapeHtml(item.name)}</span>
                <span class="media-subline">${ns.utils.escapeHtml(typeLabel)}</span>
              </span>
            </button>
            <button
              class="icon-button icon-button-danger"
              type="button"
              data-delete-media="${ns.utils.escapeHtml(item.id)}"
              aria-label="Supprimer le media ${ns.utils.escapeHtml(item.name)}"
            >
              x
            </button>
          </article>
        `;
      })
      .join("");
  }

  function renderFreeLinks(selectedSlide) {
    const freeLinks = Array.isArray(selectedSlide.freeLinks) ? selectedSlide.freeLinks : [];
    if (freeLinks.length === 0) {
      return '<p class="extra-bullets-empty">Aucun lien ajouté.</p>';
    }

    return freeLinks
      .map((item, index) => `
        <div class="free-link-row bullet-editor-row" data-free-link-row="${index}">
          <button
            class="bullet-drag-handle"
            type="button"
            draggable="true"
            data-free-link-drag-handle="${index}"
            aria-label="Glisser le lien ${index + 1}"
            title="Glisser pour réordonner"
          >
            ::
          </button>
          <div class="free-link-meta">
            <input
              type="text"
              maxlength="80"
              value="${ns.utils.escapeHtml(item.label || "")}"
              data-free-link-label="${index}"
              placeholder="Libellé du lien"
            />
            <input
              type="url"
              maxlength="500"
              value="${ns.utils.escapeHtml(item.url || "")}"
              data-free-link-url="${index}"
              placeholder="https://..."
            />
          </div>
          <button class="icon-button icon-button-danger" type="button" data-remove-free-link="${index}" aria-label="Supprimer le lien ${index + 1}">
            x
          </button>
        </div>
      `)
      .join("");
  }

  function renderPictoLibrary(selectedSlide, mediaUrls) {
    const pictoItems = ns.data.getPictoMediaItems ? ns.data.getPictoMediaItems() : [];
    if (!pictoItems.length) {
      return '<p class="media-empty">Aucun picto intégré.</p>';
    }

    const canvasMediaIds = selectedSlide.canvasData && Array.isArray(selectedSlide.canvasData.elements)
      ? selectedSlide.canvasData.elements.filter((item) => item.type === "image" && item.mediaId).map((item) => item.mediaId)
      : [];

    return pictoItems
      .map((item) => {
        const activeClass = canvasMediaIds.includes(item.id) ? " is-active" : "";
        const previewUrl = mediaUrls && mediaUrls[item.id] ? mediaUrls[item.id] : item.thumbnailUrl || item.externalUrl || "";
        return `
          <article class="picto-card${activeClass}">
            <button class="picto-card-button" type="button" data-add-picto="${ns.utils.escapeHtml(item.id)}" title="Ajouter ${ns.utils.escapeHtml(item.name)}">
              <span class="picto-thumb"><img src="${ns.utils.escapeHtml(previewUrl)}" alt="${ns.utils.escapeHtml(item.name)}" /></span>
              <span class="picto-card-label">${ns.utils.escapeHtml(item.name)}</span>
            </button>
          </article>
        `;
      })
      .join("");
  }

  function renderSubBulletEditor(selectedSlide, bulletIndex) {
    const subBullets = selectedSlide.subBullets && Array.isArray(selectedSlide.subBullets[bulletIndex])
      ? selectedSlide.subBullets[bulletIndex]
      : [];

    return `
      <div class="sub-bullets-panel">
        <div class="sub-bullets-header">
          <span>Sous-points</span>
          <button class="button button-ghost" type="button" data-add-sub-bullet="${bulletIndex}">Ajouter</button>
        </div>
        <div class="sub-bullets-list">
          ${subBullets.length
            ? subBullets.map((item, subIndex) => `
              <div class="sub-bullet-row">
                <input
                  type="text"
                  maxlength="320"
                  value="${ns.utils.escapeHtml(item || "")}"
                  data-sub-bullet-parent="${bulletIndex}"
                  data-sub-bullet-index="${subIndex}"
                  placeholder="Sous-point ${subIndex + 1}"
                />
                <button class="icon-button icon-button-danger" type="button" data-remove-sub-bullet="${bulletIndex}-${subIndex}" aria-label="Supprimer le sous-point ${subIndex + 1}">
                  x
                </button>
              </div>
            `).join("")
            : '<p class="extra-bullets-empty">Aucun sous-point.</p>'}
        </div>
      </div>
    `;
  }

  function renderExtraBullets(selectedSlide) {
    const extraBullets = (selectedSlide.bullets || []).slice(3);
    if (extraBullets.length === 0) {
      return '<p class="extra-bullets-empty">Aucun point supplémentaire.</p>';
    }

    return extraBullets
      .map((bullet, index) => {
        const actualIndex = index + 3;
        return `
          <div class="extra-bullet-row bullet-editor-row" data-bullet-row="${actualIndex}">
            <button
              class="bullet-drag-handle"
              type="button"
              draggable="true"
              data-bullet-drag-handle="${actualIndex}"
              aria-label="Glisser le point ${actualIndex + 1}"
              title="Glisser pour réordonner"
            >
              ::
            </button>
            <input
              type="text"
              maxlength="220"
              value="${ns.utils.escapeHtml(bullet || "")}"
              data-extra-bullet-index="${actualIndex}"
              placeholder="Point ${actualIndex + 1}"
            />
            <button
              class="icon-button icon-button-danger"
              type="button"
              data-remove-bullet="${actualIndex}"
              aria-label="Supprimer le point ${actualIndex + 1}"
            >
              x
            </button>
            <div class="extra-bullet-subpoints">
              ${renderSubBulletEditor(selectedSlide, actualIndex)}
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderTableEditor(selectedSlide) {
    const table = normalizeTable(selectedSlide.table);
    const highlights = selectedSlide.tableHighlights || {};
    const rows = table
      .map((row, rowIndex) => {
        return row.map((cell, columnIndex) => {
          const headerClass = rowIndex === 0 || columnIndex === 0 ? " is-header" : "";
          const fillStyle = getTableCellFillStyle(highlights, rowIndex, columnIndex);
          return `
            <input
              class="table-editor-cell${headerClass}"
              type="text"
              maxlength="120"
              value="${ns.utils.escapeHtml(cell || "")}"
              data-table-cell="${rowIndex}-${columnIndex}"
              placeholder="Cellule"
              style="${fillStyle}"
            />
          `;
        }).join("");
      })
      .join("");

    return `
      <div
        class="table-editor-matrix"
        style="grid-template-columns: repeat(${table[0].length}, minmax(0, 1fr));"
      >
        ${rows}
      </div>
    `;
  }

  function renderVisualChartEditor(visualData) {
    const chartBarCount = Math.max(1, Math.min(6, Number(visualData.chartBarCount) || 3));
    const chartBars = Array.isArray(visualData.chartBars) ? visualData.chartBars.slice(0, chartBarCount) : [];
    return chartBars.map((bar, index) => `
      <div class="visual-chart-bar-row bullet-editor-row" data-visual-chart-row="${index}">
        <button
          class="bullet-drag-handle"
          type="button"
          draggable="true"
          data-visual-chart-drag-handle="${index}"
          aria-label="Glisser l'indicateur ${index + 1}"
          title="Glisser pour réordonner"
        >
          ::
        </button>
        <input
          type="text"
          maxlength="18"
          value="${ns.utils.escapeHtml((bar && bar.label) || "")}"
          data-visual-chart-field="label"
          data-visual-chart-index="${index}"
          placeholder="Libellé ${index + 1}"
        />
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value="${ns.utils.escapeHtml(String((bar && bar.value) ?? 0))}"
          data-visual-chart-field="value"
          data-visual-chart-index="${index}"
          placeholder="0-100"
        />
        <input
          type="color"
          value="${ns.utils.escapeHtml((bar && bar.color) || "#60b2e5")}"
          data-visual-chart-field="color"
          data-visual-chart-index="${index}"
          aria-label="Couleur de l'indicateur ${index + 1}"
        />
        <button
          class="icon-button icon-button-danger"
          type="button"
          data-remove-visual-chart-bar="${index}"
          aria-label="Supprimer l'indicateur ${index + 1}"
        >
          x
        </button>
      </div>
    `).join("");
  }

  function normalizeTable(tableInput) {
    const rows = Array.isArray(tableInput) ? tableInput.slice(0, 8).map((row) => Array.isArray(row) ? row.slice(0, 6) : []) : [];
    const rowCount = Math.max(2, rows.length);
    const colCount = Math.max(2, rows.reduce((max, row) => Math.max(max, row.length), 0));
    while (rows.length < rowCount) {
      rows.push([]);
    }
    rows.forEach((row) => {
      while (row.length < colCount) {
        row.push("");
      }
    });
    return rows;
  }

  function renderTableFillIndexOptions(selectedSlide, target, selectedTableCell) {
    const table = normalizeTable(selectedSlide.table);
    const safeCell = selectedTableCell || { row: 0, column: 0 };
    const count = target === "column"
      ? (table[0] ? table[0].length : 0)
      : target === "cell"
        ? 1
      : table.length;

    return Array.from({ length: count }, (unused, index) => {
      if (target === "cell") {
        const rowIndex = Math.max(0, Math.min(table.length - 1, Number(safeCell.row) || 0));
        const columnIndex = Math.max(0, Math.min((table[0] ? table[0].length : 1) - 1, Number(safeCell.column) || 0));
        const value = `${rowIndex}-${columnIndex}`;
        return `<option value="${value}">Cellule ${rowIndex + 1}, ${columnIndex + 1}</option>`;
      }
      const label = target === "column" ? `Colonne ${index + 1}` : `Ligne ${index + 1}`;
      return `<option value="${index}">${ns.utils.escapeHtml(label)}</option>`;
    }).join("");
  }

  function getDefaultTableFillColor(selectedSlide, target, indexValue) {
    const key = target === "column" ? "columns" : target === "cell" ? "cells" : "rows";
    const index = target === "cell" ? String(indexValue || "") : Number(indexValue);
    const tableHighlights = selectedSlide.tableHighlights || {};
    const existing = tableHighlights[key] && tableHighlights[key][String(index)];
    return existing || "#dcecff";
  }

  function renderTableFillList(selectedSlide) {
    const tableHighlights = selectedSlide.tableHighlights || {};
    const entries = [
      ...Object.keys(tableHighlights.rows || {}).map((key) => ({
        target: "row",
        index: Number(key),
        color: tableHighlights.rows[key],
      })),
      ...Object.keys(tableHighlights.columns || {}).map((key) => ({
        target: "column",
        index: Number(key),
        color: tableHighlights.columns[key],
      })),
      ...Object.keys(tableHighlights.cells || {}).map((key) => ({
        target: "cell",
        index: key,
        color: tableHighlights.cells[key],
      })),
    ].sort((a, b) => {
      const targetOrder = { row: 0, column: 1, cell: 2 };
      if (a.target !== b.target) {
        return (targetOrder[a.target] || 99) - (targetOrder[b.target] || 99);
      }
      return String(a.index).localeCompare(String(b.index), undefined, { numeric: true });
    });

    if (!entries.length) {
      return '<p class="table-fill-empty">Aucun remplissage actif.</p>';
    }

    const getEntryLabel = (entry) => {
      if (entry.target === "column") {
        return `Colonne ${entry.index + 1}`;
      }
      if (entry.target === "row") {
        return `Ligne ${entry.index + 1}`;
      }
      const match = String(entry.index).match(/^(\d+)-(\d+)$/);
      if (!match) {
        return "Cellule";
      }
      return `Cellule ${Number(match[1]) + 1}, ${Number(match[2]) + 1}`;
    };

    return entries.map((entry) => `
      <div class="table-fill-item">
        <span class="table-fill-swatch" style="background:${ns.utils.escapeHtml(entry.color)};"></span>
        <span class="table-fill-label">${ns.utils.escapeHtml(getEntryLabel(entry))}</span>
        <button
          class="icon-button icon-button-danger"
          type="button"
          data-remove-table-fill="${entry.target}:${entry.index}"
          aria-label="Retirer la couleur de ${ns.utils.escapeHtml(getEntryLabel(entry))}"
        >
          x
        </button>
      </div>
    `).join("");
  }

  function getTableCellFillStyle(tableHighlights, rowIndex, columnIndex) {
    const cellColor = tableHighlights && tableHighlights.cells ? tableHighlights.cells[`${rowIndex}-${columnIndex}`] : "";
    const rowColor = tableHighlights && tableHighlights.rows ? tableHighlights.rows[String(rowIndex)] : "";
    const columnColor = tableHighlights && tableHighlights.columns ? tableHighlights.columns[String(columnIndex)] : "";
    const color = cellColor || rowColor || columnColor;
    return color ? `background:${ns.utils.escapeHtml(color)};` : "";
  }

  ns.ui.renderDashboard = renderDashboard;
})();
