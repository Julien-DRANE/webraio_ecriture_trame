(function () {
  const ns = (window.StudioSlides = window.StudioSlides || {});
  ns.data = ns.data || {};

  ns.data.bloomLevels = [
    {
      id: "identify",
      number: "01",
      title: "Identifier, reconnaitre",
      summary: "Reconnaitre, lister, décrire, identifier",
      verbs: ["reconnaitre", "lister", "décrire", "identifier"],
      defaultTitle: "Identifier les besoins, le contexte et les prérequis.",
      defaultSubtitle: "Faire émerger les éléments de base avant toute conception détaillée.",
      defaultBullets: [
        "Lister les attentes réelles du public",
        "Nommer les contraintes de départ",
        "Identifier les connaissances déjà présentes",
      ],
      defaultNote: "Une bonne ingénierie commence par une lecture juste de la situation.",
    },
    {
      id: "understand",
      number: "02",
      title: "Comprendre",
      summary: "Interpréter, résumer, classer, expliquer",
      verbs: ["interpréter", "résumer", "classer", "expliquer"],
      defaultTitle: "Comprendre les enjeux et reformuler le besoin de formation.",
      defaultSubtitle: "Transformer les données recueillies en une intention pédagogique partagée.",
      defaultBullets: [
        "Expliquer le problème à traiter",
        "Classer les enjeux prioritaires",
        "Résumer le cap dans une phrase claire",
      ],
      defaultNote: "La reformulation commune aligne les acteurs et limite les malentendus.",
    },
    {
      id: "apply",
      number: "03",
      title: "Appliquer",
      summary: "Exécuter, utiliser, mettre en oeuvre",
      verbs: ["exécuter", "utiliser", "mettre en oeuvre"],
      defaultTitle: "Appliquer le scénario retenu dans une situation d'usage cible.",
      defaultSubtitle: "Passer du cadre théorique à une mise en oeuvre visible et testable.",
      defaultBullets: [
        "Choisir un format d'activité concret",
        "Faire produire une première trace",
        "Mettre les participants en action rapidement",
      ],
      defaultNote: "Une compétence se stabilise mieux lorsqu'elle est pratiquée.",
    },
    {
      id: "analyze",
      number: "04",
      title: "Analyser",
      summary: "Différencier, organiser, déconstruire, comparer",
      verbs: ["différencier", "organiser", "déconstruire", "comparer"],
      defaultTitle: "Analyser les écarts, les obstacles et les leviers de progression.",
      defaultSubtitle: "Décomposer la situation pour ajuster les contenus et les modalités.",
      defaultBullets: [
        "Comparer les pratiques observées et visées",
        "Déconstruire les points de blocage",
        "Organiser les priorités d'ajustement",
      ],
      defaultNote: "L'analyse évite de traiter tous les problèmes au même niveau.",
    },
    {
      id: "evaluate",
      number: "05",
      title: "Évaluer",
      summary: "Juger, critiquer, vérifier, argumenter",
      verbs: ["juger", "critiquer", "vérifier", "argumenter"],
      defaultTitle: "Évaluer la pertinence du dispositif et argumenter les choix.",
      defaultSubtitle: "Mesurer la valeur pédagogique à partir d'indices de transfert observables.",
      defaultBullets: [
        "Vérifier la progression réelle",
        "Argumenter les arbitrages retenus",
        "Juger l'efficacité au regard des objectifs",
      ],
      defaultNote: "L'évaluation devient utile lorsqu'elle éclaire une décision.",
    },
    {
      id: "create",
      number: "06",
      title: "Créer",
      summary: "Produire une oeuvre originale, assembler, concevoir",
      verbs: ["produire", "assembler", "concevoir"],
      defaultTitle: "Créer un parcours original, cohérent et directement mobilisable.",
      defaultSubtitle: "Assembler les briques en un dispositif complet, lisible et duplicable.",
      defaultBullets: [
        "Concevoir une progression complète",
        "Assembler formats, supports et traces",
        "Produire un livrable final réutilisable",
      ],
      defaultNote: "La création finalise un système, pas seulement un support.",
    },
  ];
})();
