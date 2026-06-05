(function () {
  const ns = (window.StudioSlides = window.StudioSlides || {});
  ns.data = ns.data || {};

  ns.data.cognitivePrinciples = [
    {
      id: "signaling",
      title: "Signalement",
      summary: "Mettre en évidence ce qui doit être lu, retenu ou comparé.",
      detail: "Utiliser une hiérarchie visuelle stable, des marqueurs clairs et peu de concurrents sur l'écran.",
    },
    {
      id: "segmentation",
      title: "Segmentation",
      summary: "Découper l'information en blocs courts et exploitables.",
      detail: "Une slide = une idée directrice, puis trois points maximum pour maintenir la charge cognitive sous contrôle.",
    },
    {
      id: "activation",
      title: "Activation des acquis",
      summary: "Partir de ce que le public sait déjà ou croit savoir.",
      detail: "Questions d'entrée, prétests, reformulation ou recueil de représentations initiales.",
    },
    {
      id: "worked-examples",
      title: "Exemples résolus",
      summary: "Montrer un exemple abouti avant de demander une production autonome.",
      detail: "Utile lorsque la tâche est nouvelle ou complexe et que les erreurs de départ coutent cher.",
    },
    {
      id: "retrieval-practice",
      title: "Récupération active",
      summary: "Faire rappeler sans support plutôt que relire passivement.",
      detail: "Quiz courts, reformulations, rappels oraux ou traces mémorielles produites par les apprenants.",
    },
    {
      id: "spacing",
      title: "Espacement",
      summary: "Revenir plusieurs fois sur une notion au lieu de tout masser.",
      detail: "Des retours courts à distance soutiennent mieux la rétention qu'une exposition unique plus longue.",
    },
    {
      id: "feedback",
      title: "Feedback rapide",
      summary: "Donner un retour exploitable pendant que l'action est encore récente.",
      detail: "Le feedback doit aider à corriger, clarifier ou prioriser sans noyer le participant.",
    },
  ];
})();
