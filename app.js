"use strict";

(() => {
  const views = Array.from(document.querySelectorAll("[data-page]"));
  const viewControls = Array.from(document.querySelectorAll("[data-view]"));
  const sidebar = document.getElementById("sidebar");
  const menuButton = document.getElementById("mobile-menu-button");
  const menuOverlay = document.getElementById("sidebar-overlay");
  const breadcrumb = document.getElementById("breadcrumb-current");
  const year = document.getElementById("current-year");

  const pageTitles = {
    overview: "Vue d'ensemble",
    content: "Content Intelligence",
    cultural: "Cultural Bridge",
    identity: "Digital Identity"
  };

  function closeMobileMenu() {
    if (!sidebar || !menuButton) return;
    sidebar.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Ouvrir le menu");
    if (menuOverlay) menuOverlay.hidden = true;
  }

  function showView(viewName, options = {}) {
    if (!Object.prototype.hasOwnProperty.call(pageTitles, viewName)) return;
    const target = document.querySelector('[data-page="' + viewName + '"]');
    if (!target) return;

    views.forEach((view) => {
      const isCurrent = view.dataset.page === viewName;
      view.hidden = !isCurrent;
      view.classList.toggle("is-visible", isCurrent);
    });

    viewControls.forEach((control) => {
      const isCurrent = control.dataset.view === viewName;
      if (control.classList.contains("nav-item")) {
        control.classList.toggle("is-active", isCurrent);
        if (isCurrent) {
          control.setAttribute("aria-current", "page");
        } else {
          control.removeAttribute("aria-current");
        }
      }
    });

    if (breadcrumb) breadcrumb.textContent = pageTitles[viewName];
    closeMobileMenu();

    if (options.updateHash !== false && window.location.hash !== "#" + viewName) {
      window.history.pushState(null, "", "#" + viewName);
    }
    if (options.focus !== false) {
      const heading = target.querySelector("h1");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
      target.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }

  viewControls.forEach((control) => {
    control.addEventListener("click", (event) => {
      const viewName = control.dataset.view;
      if (!viewName) return;
      event.preventDefault();
      showView(viewName);
    });
  });

  if (menuButton && sidebar) {
    menuButton.addEventListener("click", () => {
      const isOpen = sidebar.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
      if (menuOverlay) menuOverlay.hidden = !isOpen;
    });

    if (menuOverlay) {
      menuOverlay.addEventListener("click", closeMobileMenu);
    }

    document.addEventListener("click", (event) => {
      if (window.matchMedia("(max-width: 760px)").matches &&
          sidebar.classList.contains("is-open") &&
          !sidebar.contains(event.target) &&
          !menuButton.contains(event.target)) {
        closeMobileMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && sidebar.classList.contains("is-open")) {
        closeMobileMenu();
        menuButton.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (!window.matchMedia("(max-width: 760px)").matches) closeMobileMenu();
    });
  }


  // Local-first Content Intelligence: files are never uploaded.
  const platformSelect = document.getElementById("content-platform");
  const imageInput = document.getElementById("image-file");
  const videoInput = document.getElementById("video-file");
  const imageResult = document.getElementById("image-result");
  const videoResult = document.getElementById("video-result");
  const textInput = document.getElementById("content-text");
  const textCount = document.getElementById("text-count");
  const textResult = document.getElementById("text-result");
  const analyzeTextButton = document.getElementById("analyze-text-button");
  const MAX_FILE_BYTES = 20 * 1024 * 1024;
  let imageAnalysisId = 0;
  let videoAnalysisId = 0;
  // Dynamic Unicode patterns prevent parse errors on older browsers.
  const WORD_PATTERN = (() => {
    try { return new RegExp("[\\p{L}\\p{N}]+(?:['’][\\p{L}]+)*", "gu"); }
    catch (_) { return /[A-Za-z0-9À-ÖØ-öø-ÿ]+(?:['’][A-Za-zÀ-ÖØ-öø-ÿ]+)*/g; }
  })();
  const HASHTAG_PATTERN = (() => {
    try { return new RegExp("#[\\p{L}\\p{N}_]+", "gu"); }
    catch (_) { return /#[A-Za-z0-9À-ÖØ-öø-ÿ_]+/g; }
  })();
  const MENTION_PATTERN = (() => {
    try { return new RegExp("@[\\p{L}\\p{N}_.]+", "gu"); }
    catch (_) { return /@[A-Za-z0-9À-ÖØ-öø-ÿ_.]+/g; }
  })();
  const getWords = (text) => text.match(WORD_PATTERN) || [];
  const formatBytes = (bytes) => bytes < 1024 ? bytes + " o" : bytes < 1048576 ? (bytes / 1024).toFixed(1) + " Ko" : (bytes / 1048576).toFixed(2) + " Mo";
  const formatDuration = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "Indisponible";
    const total = Math.floor(seconds), hours = Math.floor(total / 3600), minutes = Math.floor((total % 3600) / 60), secs = total % 60;
    return hours ? hours + " h " + minutes + " min " + secs + " s" : minutes + " min " + secs + " s";
  };
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const getTarget = () => ({
    "instagram-post": {label:"Instagram — publication carrée",width:1080,height:1080},
    "instagram-reel": {label:"Instagram — Reel vertical",width:1080,height:1920},
    tiktok: {label:"TikTok — vidéo verticale",width:1080,height:1920},
    youtube: {label:"YouTube — vidéo classique",width:1920,height:1080},
    "youtube-thumb": {label:"YouTube — miniature",width:1280,height:720}
  }[platformSelect ? platformSelect.value : "general"] || null);
  const renderMetrics = (metrics) => '<div class="result-metrics">' + metrics.map((m) => '<div class="result-metric"><strong>' + escapeHtml(m.value) + '</strong><span>' + escapeHtml(m.label) + '</span></div>').join("") + "</div>";
  const renderAdvice = (items) => items.length ? "<h3>Points à vérifier</h3><ul>" + items.map((item) => "<li>" + escapeHtml(item) + "</li>").join("") + "</ul>" : "<p>Les vérifications de base ne signalent rien de particulier pour ce format.</p>";
  const showError = (element, message) => { if (element) element.innerHTML = '<p class="result-error">' + escapeHtml(message) + "</p>"; };

  function analyzeImage(file) {
    const requestId = ++imageAnalysisId;
    if (!imageResult) return;
    if (!file) { imageResult.textContent = "Choisis une image pour afficher ses informations."; return; }
    if (!file.type.startsWith("image/")) { showError(imageResult, "Ce fichier n'est pas reconnu comme une image."); return; }
    if (file.size > MAX_FILE_BYTES) { showError(imageResult, "Le fichier dépasse la limite de 20 Mo. Choisis une image plus légère."); return; }
    imageResult.textContent = "Analyse de l'image…";
    const url = URL.createObjectURL(file), image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      if (requestId !== imageAnalysisId) return;
      const width = image.naturalWidth, height = image.naturalHeight, ratio = width / height, target = getTarget(), advice = [];
      if (!width || !height) { showError(imageResult, "Les dimensions de cette image sont indisponibles."); return; }
      if (width > 30000 || height > 30000) { showError(imageResult, "Cette image a des dimensions très élevées et risque de ralentir cet appareil."); return; }
      const pixels = width * height;
      if (width < 720 || height < 720) advice.push("La résolution est relativement petite. Vérifie le rendu en plein écran et évite d'agrandir fortement l'image, car elle pourrait devenir floue.");
      if (pixels > 40000000) advice.push("L'image contient plus de 40 mégapixels. Elle peut être lourde à manipuler sur un téléphone ancien ; conserve une copie optimisée pour le web.");
      if (file.size > 8 * 1024 * 1024) advice.push("Le fichier dépasse 8 Mo. Si le chargement est lent, exporte une version compressée en gardant une netteté suffisante.");
      if (target) {
        if (Math.abs(ratio - target.width / target.height) / (target.width / target.height) > .05) advice.push("Le ratio diffère du repère cible " + target.width + " × " + target.height + " px. Recadre en gardant le sujet principal dans une zone sûre, loin des bords.");
        if (width < target.width || height < target.height) advice.push("La résolution est inférieure au repère cible de " + target.width + " × " + target.height + " px. Si possible, exporte une version plus grande pour limiter le flou.");
      }
      if (ratio > 2.2 || ratio < .45) advice.push("Le format est très panoramique ou très étroit. Vérifie que le sujet reste visible dans l'aperçu mobile et que le recadrage ne coupe rien d'important.");
      advice.push("Vérification visuelle à faire : le sujet doit être immédiatement identifiable, le contraste suffisant et tout texte intégré à l'image lisible sur un petit écran.");
      advice.push("Si l'image transmet une information importante, ajoute aussi une description accessible dans la publication. Cette analyse mesure les propriétés du fichier ; elle ne comprend pas la scène représentée.");
      imageResult.innerHTML = "<h3>Analyse technique de l'image</h3>" + renderMetrics([
        {label:"Dimensions",value:width+" × "+height+" px"},{label:"Poids",value:formatBytes(file.size)},
        {label:"Format",value:file.type||"Non précisé"},{label:"Ratio",value:ratio.toFixed(2)+":1"},
        {label:"Pixels",value:pixels.toLocaleString("fr-FR")}
      ]) + "<h3>Conseils pour améliorer le visuel</h3>" + renderAdvice(advice) + "<p class=\"field-help\">Nexora ne juge pas automatiquement le sujet, la composition, les couleurs ou la qualité artistique de l'image. Contrôle ces éléments à l'œil avant de publier.</p>";
    };
    image.onerror = () => { URL.revokeObjectURL(url); if (requestId === imageAnalysisId) showError(imageResult, "Le navigateur n'a pas pu lire cette image. Essaie un autre format."); };
    image.src = url;
  }

  function analyzeVideo(file) {
    const requestId = ++videoAnalysisId;
    if (!videoResult) return;
    if (!file) { videoResult.textContent = "Choisis une vidéo pour lire ses métadonnées."; return; }
    if (!file.type.startsWith("video/")) { showError(videoResult, "Ce fichier n'est pas reconnu comme une vidéo."); return; }
    if (file.size > MAX_FILE_BYTES) { showError(videoResult, "Le fichier dépasse la limite de 20 Mo pour préserver les ressources des téléphones."); return; }
    videoResult.textContent = "Lecture des métadonnées vidéo…";
    const url = URL.createObjectURL(file), video = document.createElement("video");
    video.preload = "metadata";
    const cleanup = () => { URL.revokeObjectURL(url); video.removeAttribute("src"); video.load(); };
    video.onloadedmetadata = () => {
      if (requestId !== videoAnalysisId) { cleanup(); return; }
      const width = video.videoWidth, height = video.videoHeight, duration = video.duration, target = getTarget(), advice = [];
      if (target && width && height) {
        const ratio = width / height, targetRatio = target.width / target.height;
        if (Math.abs(ratio - targetRatio) / targetRatio > .05) advice.push("Le ratio diffère du repère cible " + target.width + " × " + target.height + " px. Vérifie le recadrage pour ne pas couper le sujet.");
        if (width < target.width || height < target.height) advice.push("La résolution est inférieure au repère cible. Si possible, exporte une version plus nette adaptée au format choisi.");
      }
      if (duration > 60) advice.push("La vidéo dure plus d'une minute. Vérifie que l'idée principale arrive tôt et que chaque séquence apporte quelque chose ; la durée idéale dépend de la plateforme et du sujet.");
      if (duration > 0 && duration < 5) advice.push("La vidéo est très courte. Vérifie que le contexte et le message restent compréhensibles, même sans explication supplémentaire.");
      if (file.size > 8 * 1024 * 1024) advice.push("Le fichier dépasse 8 Mo. Une exportation plus légère peut accélérer l'envoi, à condition de préserver une qualité acceptable.");
      advice.push("Contrôle le début de la vidéo : le sujet ou le bénéfice doit être clair rapidement, sans promettre plus que ce que le contenu montre.");
      advice.push("Vérifie manuellement le son, les sous-titres, la lisibilité du texte à l'écran et le rythme des coupes. Ces éléments ne peuvent pas être évalués à partir des seules métadonnées.");
      videoResult.innerHTML = "<h3>Analyse technique de la vidéo</h3>" + renderMetrics([
        {label:"Dimensions",value:width&&height?width+" × "+height+" px":"Indisponibles"},
        {label:"Durée",value:formatDuration(duration)},{label:"Poids",value:formatBytes(file.size)},{label:"Format déclaré",value:file.type||"Non précisé"}
      ]) + "<h3>Conseils pour améliorer la vidéo</h3>" + renderAdvice(advice) + "<p class=\"field-help\">Nexora lit les métadonnées prises en charge par le navigateur ; il ne regarde ni n'écoute le contenu de la vidéo.</p>";
      cleanup();
    };
    video.onerror = () => { cleanup(); if (requestId === videoAnalysisId) showError(videoResult, "Impossible de lire les métadonnées de ce format dans ce navigateur."); };
    video.src = url;
  }

  function analyzeText() {
    if (!textInput || !textResult) return;
    const value = textInput.value.trim();
    if (!value) {
      textResult.dataset.analyzed = "false";
      showError(textResult, "Saisis un texte avant de lancer l'analyse.");
      return;
    }

    const words = getWords(value);
    const hashtags = value.match(HASHTAG_PATTERN) || [];
    const mentions = value.match(MENTION_PATTERN) || [];
    const sentences = value.split(/[.!?…]+/).map((sentence) => sentence.trim()).filter(Boolean);
    const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const lowerWords = words.map((word) => word.toLocaleLowerCase());
    const stop = new Set([
      "avec","dans","pour","mais","donc","alors","cette","cela","vous","nous","votre","plus","tout","tous","comme","sur","une","des","les","est","qui","que","aux","par",
      "the","and","for","that","this","with","from","have","your","you","are","was","will","our","not","but","can","all","get","just","more","what","when",
      "ny","amin","izao","izany","ary","dia","tsy","aho","ianao","isika","izy","izy ireo","ho","ao","amin'ny","efa","koa","mba","raha","fa","ny"
    ]);
    const counts = new Map();
    lowerWords.forEach((word) => {
      if (word.length > 3 && !stop.has(word)) counts.set(word, (counts.get(word) || 0) + 1);
    });
    const repeated = Array.from(counts.entries())
      .filter((entry) => entry[1] >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const uniqueWords = new Set(lowerWords);
    const averageSentenceLength = sentences.length ? words.length / sentences.length : words.length;
    const firstLine = lines[0] || value;
    const firstLineWords = getWords(firstLine);
    const questionCount = (value.match(/\?/g) || []).length;
    const exclamationCount = (value.match(/!/g) || []).length;
    const emojiCount = (value.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;
    const hasCallToAction = /\b(comment|commente|partage|enregistre|sauvegarde|abonne|abonne-toi|suis-moi|clique|découvre|dis-moi|donne|réponds|follow|share|save|subscribe|comment below|tell me|check out|let me know|zarao|araho|lazao|valio|soraty)\b/i.test(value);
    const hasOpeningHook = /^(pourquoi|comment|voici|découvre|imagine|et si|tu savais|saviez-vous|le secret|3 |5 |7 |why|how|here('s| is)|discover|imagine|did you know|the secret|3 |5 |7 |fantatrao ve|ahoana|jereo|indro)\b/i.test(firstLine);
    const platform = platformSelect ? platformSelect.value : "general";
    const advice = [];

    if (value.length > 2200) advice.push("Le texte dépasse 2 200 caractères. Vérifie la limite actuelle de la plateforme et le format choisi avant de publier.");
    if (words.length < 5) advice.push("Le texte est très court. Si ton public ne connaît pas encore le sujet, ajoute une information qui lui donne du contexte.");
    if (averageSentenceLength > 24) advice.push("Les phrases sont longues en moyenne (" + averageSentenceLength.toFixed(1) + " mots). Essaie de couper une idée en deux pour faciliter la lecture sur téléphone.");
    if (sentences.some((sentence) => getWords(sentence).length > 32)) advice.push("Au moins une phrase dépasse 32 mots. Raccourcis-la ou sépare-la en deux phrases.");
    if (repeated.length) advice.push("Certains mots reviennent souvent : " + repeated.map((entry) => entry[0] + " (" + entry[1] + " fois)").join(", ") + ". Vérifie si cette répétition est voulue.");
    if (hashtags.length > 10) advice.push("Tu utilises " + hashtags.length + " hashtags. Garde surtout ceux qui décrivent précisément le contenu ; plus de hashtags ne garantit pas plus de portée.");
    if (hashtags.length > 0) {
      const uniqueHashtags = new Set(hashtags.map((tag) => tag.toLocaleLowerCase()));
      if (uniqueHashtags.size < hashtags.length) advice.push("Au moins un hashtag est répété. Supprime les doublons pour garder une liste plus nette.");
      if (hashtags.some((tag) => tag.length > 30)) advice.push("Un hashtag est très long. Vérifie qu'il est facile à lire et qu'il correspond à une recherche réelle.");
    }
    if (mentions.length > 5) advice.push("Le texte contient " + mentions.length + " mentions. Vérifie que chaque compte cité est utile et que tu ne mentionnes pas des personnes inutilement.");
    if (value.length > 500 && sentences.length < 2) advice.push("Le texte est long mais contient peu de séparations de phrases. Ajoute de la ponctuation ou des paragraphes pour le rendre plus facile à parcourir.");
    if (lines.length === 1 && value.length > 240) advice.push("Sur mobile, un seul grand bloc peut être difficile à parcourir. Essaie de regrouper les idées en petits paragraphes.");
    if (firstLineWords.length > 0 && firstLineWords.length > 18) advice.push("La première ligne est assez longue (" + firstLineWords.length + " mots). Raccourcis-la pour faire ressortir plus vite l'idée principale.");
    if (!hasOpeningHook && words.length >= 12) advice.push("La première ligne présente peut-être le sujet sans accroche claire. Essaie une question, un bénéfice concret ou une idée surprenante, sans exagérer la promesse.");
    if (words.length >= 15 && !hasCallToAction && !/[?？]$/.test(value)) advice.push("Aucun appel à l'action évident n'a été détecté. Si c'est utile pour ton objectif, invite le public à répondre, enregistrer ou partager — sans forcer.");
    if (questionCount > 3) advice.push("Il y a " + questionCount + " questions. Garde celles qui aident vraiment le lecteur à réfléchir ou à répondre.");
    if (exclamationCount > 5) advice.push("Le texte contient beaucoup de points d'exclamation. Réduis-les si tu veux un ton plus posé.");
    if (emojiCount > 8) advice.push("Le texte contient beaucoup d'émojis (" + emojiCount + "). Vérifie qu'ils renforcent le message sans le rendre difficile à lire.");

    const platformAdvice = {
      "instagram-post": "Instagram : fais apparaître l'idée principale dès les premières lignes ; vérifie l'aperçu mobile et la pertinence des hashtags.",
      "instagram-reel": "Instagram Reels : la légende accompagne la vidéo ; vérifie aussi que le message essentiel est compréhensible sans dépendre uniquement de la légende.",
      tiktok: "TikTok : garde une légende concise et cohérente avec ce que l'on voit ou entend dans la vidéo. Les tendances ne garantissent pas les résultats.",
      youtube: "YouTube : place le sujet et les mots importants naturellement au début de la description ; évite les répétitions artificielles de mots-clés.",
      "youtube-thumb": "YouTube miniature : l'analyse du texte ne vérifie pas la miniature elle-même. Pour le titre associé, privilégie une promesse précise et fidèle à la vidéo.",
      general: "Conseil général : vérifie que le texte est compréhensible sans contexte, que les faits sont exacts et que le ton convient à ton public."
    };
    advice.push(platformAdvice[platform] || platformAdvice.general);

    if (advice.length === 1) advice.unshift("Aucun problème de structure évident n'a été repéré par les règles de base. Cela ne garantit ni la qualité éditoriale ni les performances du post.");

    const improvementSteps = [];
    if (words.length < 12) improvementSteps.push("Ajoute une phrase qui explique pourquoi ce sujet est utile ou intéressant pour ton public.");
    if (!hasOpeningHook && words.length >= 8) improvementSteps.push("Exemple d'accroche à adapter : « Voici ce que j'aurais aimé savoir avant de commencer… » Remplace cette formule par une promesse précise liée à ton vrai contenu.");
    if (firstLineWords.length > 18) improvementSteps.push("Réécris la première ligne en une idée principale, puis garde les détails dans la suite du texte.");
    if (averageSentenceLength > 18) improvementSteps.push("Essaie ce format : une idée par phrase, puis un saut de ligne quand tu passes à une nouvelle idée.");
    if (!hasCallToAction && words.length >= 8) improvementSteps.push("Si tu souhaites susciter des réponses, termine par une question précise, par exemple : « Quelle partie aimerais-tu que je développe ensuite ? »");
    if (hashtags.length === 0 && words.length >= 8) improvementSteps.push("Si la plateforme et le sujet s'y prêtent, ajoute quelques hashtags précis liés au thème ; évite les tags populaires mais sans rapport.");
    if (hashtags.length > 0) improvementSteps.push("Choisis les hashtags selon le sujet, le public visé et les termes qu'il pourrait rechercher, plutôt que d'ajouter des hashtags génériques.");
    if (lines.length === 1 && value.length > 180) improvementSteps.push("Aère la légende en 2 à 4 petits paragraphes pour faciliter la lecture sur téléphone.");
    if (value.length >= 12) improvementSteps.push("Avant de publier, vérifie : une idée principale claire, une information concrète ou un exemple, un ton adapté au public et une dernière relecture.");
    const improvementHtml = improvementSteps.length
      ? "<h3>Comment améliorer ce contenu</h3><ul>" + improvementSteps.map((item) => "<li>" + escapeHtml(item) + "</li>").join("") + "</ul>"
      : "<h3>Comment améliorer ce contenu</h3><p>Développe un peu le contexte, précise ce que le public doit retenir et relis le texte à voix haute pour repérer les formulations peu naturelles.</p>";

    textResult.dataset.analyzed = "true";
    textResult.innerHTML = "<h3>Analyse du texte</h3>" + renderMetrics([
      {label:"Caractères",value:String(value.length)},
      {label:"Mots",value:String(words.length)},
      {label:"Mots uniques",value:String(uniqueWords.size)},
      {label:"Hashtags",value:String(hashtags.length)},
      {label:"Mentions",value:String(mentions.length)},
      {label:"Phrases détectées",value:String(sentences.length)},
      {label:"Mots moyens / phrase",value:sentences.length ? averageSentenceLength.toFixed(1) : "0"},
      {label:"Émojis détectés",value:String(emojiCount)}
    ]) + "<h3>Conseils adaptés</h3><ul>" + advice.map((item) => "<li>" + escapeHtml(item) + "</li>").join("") + "</ul>" + improvementHtml + "<p class=\"field-help\">Analyse locale fondée sur des règles et des mots-clés : elle peut manquer le contexte, l'ironie ou la langue exacte. Les exemples sont des pistes à adapter, pas des corrections garanties. Elle ne prédit pas la viralité et n'envoie pas ton texte à un serveur.</p>";
  }
  if (imageInput) imageInput.addEventListener("change", () => analyzeImage(imageInput.files && imageInput.files[0]));
  if (videoInput) videoInput.addEventListener("change", () => analyzeVideo(videoInput.files && videoInput.files[0]));
  if (textInput && textCount) {
    const updateCount = () => {
      const value = textInput.value, words = value.trim() ? getWords(value.trim()).length : 0;
      textCount.textContent = value.length+" caractère"+(value.length===1?"":"s")+" · "+words+" mot"+(words===1?"":"s");
    };
    textInput.addEventListener("input", updateCount); updateCount();
  }
  if (analyzeTextButton) analyzeTextButton.addEventListener("click", analyzeText);
  if (platformSelect) platformSelect.addEventListener("change", () => {
    if (imageInput && imageInput.files && imageInput.files[0]) analyzeImage(imageInput.files[0]);
    if (videoInput && videoInput.files && videoInput.files[0]) analyzeVideo(videoInput.files[0]);
    if (textResult && textResult.dataset.analyzed === "true") analyzeText();
  });


  // Cultural Bridge: transparent local templates, not a general-purpose translator.
  const bridgeText = document.getElementById("bridge-text");
  const bridgeCount = document.getElementById("bridge-count");
  const bridgeTone = document.getElementById("bridge-tone");
  const bridgeSourceLanguage = document.getElementById("bridge-source-language");
  const bridgeResult = document.getElementById("bridge-result");
  const bridgeRewriteButton = document.getElementById("bridge-rewrite-button");
  const bridgeCopyButton = document.getElementById("bridge-copy-button");
  const bridgePhrase = document.getElementById("bridge-phrase");
  const bridgeLanguage = document.getElementById("bridge-language");
  const bridgePhraseButton = document.getElementById("bridge-phrase-button");
  const bridgePhraseResult = document.getElementById("bridge-phrase-result");

  const phrasebook = {
    hello: { fr: "Bonjour !", en: "Hello!", mg: "Manao ahoana!" },
    thanks: { fr: "Merci beaucoup.", en: "Thank you very much.", mg: "Misaotra indrindra." },
    welcome: { fr: "Bienvenue !", en: "Welcome!", mg: "Tongasoa!" },
    follow: { fr: "Suis-moi pour plus de contenu.", en: "Follow me for more content.", mg: "Araho aho raha mila votoaty fanampiny ianao." },
    newpost: { fr: "Une nouvelle publication est disponible.", en: "A new post is available.", mg: "Misy lahatsoratra vaovao azo jerena." },
    comment: { fr: "Dis-moi ce que tu en penses en commentaire.", en: "Tell me what you think in the comments.", mg: "Lazao ao amin'ny fanehoan-kevitra ny hevitrao." },
    share: { fr: "Partage ce message avec tes amis.", en: "Share this post with your friends.", mg: "Zarao amin'ny namanao ity hafatra ity." },
    support: { fr: "Merci pour ton soutien.", en: "Thank you for your support.", mg: "Misaotra anao amin'ny fanohananao." },
    comingsoon: { fr: "Bientôt disponible.", en: "Coming soon.", mg: "Ho avy tsy ho ela." },
    contact: { fr: "Contacte-moi pour en savoir plus.", en: "Contact me to learn more.", mg: "Mifandraisa amiko raha mila fanazavana fanampiny." }
  };

  const bridgeWords = (value) => value.trim() ? getWords(value.trim()).length : 0;
  const bridgeLanguageNames = { fr: "français", en: "anglais", mg: "malagasy" };
  const bridgeExamples = {
    fr: { cta: "« Quelle partie aimerais-tu que je développe ensuite ? »", context: "« Voici le problème, puis la solution que j'ai testée… »" },
    en: { cta: "“Which part would you like me to explain next?”", context: "“Here is the problem, followed by the solution I tested…”" },
    mg: { cta: "“Inona no tianao hazavaiko bebe kokoa amin’ny manaraka?”", context: "“Ity ny olana, ary ity ny vahaolana nosedraiko…”" }
  };

  if (bridgeText && bridgeCount) {
    const updateBridgeCount = () => {
      const words = bridgeWords(bridgeText.value);
      bridgeCount.textContent = bridgeText.value.length + " caractère" + (bridgeText.value.length === 1 ? "" : "s") + " · " + words + " mot" + (words === 1 ? "" : "s");
    };
    bridgeText.addEventListener("input", updateBridgeCount);
    updateBridgeCount();
  }

  function normalizeBridgeText(value) {
    return value.normalize ? value.normalize("NFC") : value;
  }

  function buildBridgeAdvice(original, tone, language) {
    const advice = [];
    const trimmed = original.trim();
    const words = getWords(trimmed);
    const paragraphs = trimmed.split(/\n\s*\n/).filter((part) => part.trim());
    const firstLine = (trimmed.split(/\r?\n/)[0] || trimmed).trim();
    const firstLineWords = getWords(firstLine);
    const hasAction = /\b(comment|commente|partage|enregistre|sauvegarde|abonne|abonne-toi|suis-moi|clique|découvre|dis-moi|réponds|follow|share|save|subscribe|tell me|let me know|contact|zarao|araho|lazao|valio|soraty)\b/i.test(trimmed);
    const hasQuestion = /[?？]/.test(trimmed);
    const examples = bridgeExamples[language] || bridgeExamples.fr;

    if (words.length < 8) {
      advice.push("Le message est très court. Si le public ne connaît pas le sujet, ajoute le contexte ou le bénéfice principal en une phrase.");
    }
    if (firstLineWords.length > 14 || firstLine.length > 100) {
      advice.push("Rends la première ligne plus directe : annonce le sujet ou le bénéfice avant les détails.");
    }
    if (words.length > 70 && paragraphs.length < 2) {
      advice.push("Le texte est assez long et forme un seul bloc. Sépare-le en petits paragraphes pour faciliter la lecture sur téléphone.");
    }
    if (trimmed.split(/[.!?…]+/).some((sentence) => getWords(sentence).length > 28)) {
      advice.push("Une ou plusieurs phrases sont longues. Coupe-les en phrases plus courtes, avec une seule idée principale par phrase.");
    }
    if (!hasAction && !hasQuestion) {
      advice.push("Si tu souhaites une réaction, termine par une invitation simple et précise. Exemple : " + examples.cta);
    }
    if (/(!!{2,}|\?{2,}|\.{4,})/.test(trimmed)) {
      advice.push("Réduis les suites de ponctuation répétée pour donner un ton plus naturel et plus facile à lire.");
    }
    if (/\b(incroyable|secret|garanti|miracle|100%|viral|guaranteed|miracle|viral)\b/i.test(trimmed)) {
      advice.push("Vérifie que les promesses fortes sont exactes et démontrées par le contenu ; préfère une formulation précise plutôt qu'une promesse exagérée.");
    }
    if (tone === "professional" && /[😀-🙏✨🔥💯]/u.test(trimmed)) {
      advice.push("Pour un ton professionnel, vérifie si les émojis servent vraiment le message ; retire ceux qui détournent l'attention.");
    }
    if (!advice.length) {
      advice.push("Le texte est déjà assez concis selon ces contrôles simples. Vérifie encore qu'il est exact, adapté à ton public et fidèle à ton intention.");
    }
    advice.push("Pour rendre le message plus concret, précise si possible un exemple, une preuve ou une étape réellement montrée. Exemple de structure : " + examples.context);
    return advice;
  }

  if (bridgeRewriteButton && bridgeText && bridgeResult && bridgeTone && bridgeCopyButton) {
    bridgeRewriteButton.addEventListener("click", () => {
      const language = bridgeSourceLanguage ? bridgeSourceLanguage.value : "fr";
      const raw = normalizeBridgeText(bridgeText.value).replace(/\r\n?/g, "\n");
      const original = raw.split("\n").map((line) => line.replace(/[\t ]+/g, " ").replace(/[ \t]+([,;:!?])/g, "$1").replace(/([,;:!?])(?=[^\s,;:!?])/g, "$1 ")).join("\n").replace(/\n{3,}/g, "\n\n").trim();
      if (!original) {
        bridgeResult.dataset.result = "";
        bridgeResult.dataset.advice = "";
        bridgeResult.innerHTML = '<p class="result-error">Écris ou colle un texte avant de continuer.</p>';
        bridgeCopyButton.disabled = true;
        return;
      }

      const tone = bridgeTone.value;
      let result = original;
      // Normalize sentence starts without rewriting the user's vocabulary or claims.
      result = result.replace(/(^|[.!?…]\s+)([a-zà-öø-ÿ])/g, (match, prefix, letter) => prefix + letter.toLocaleUpperCase(language));
      result = result.replace(/([.!?…]){2,}/g, (punctuation) => punctuation.includes("?") ? "?" : punctuation.includes("!") ? "!" : "…");
      if (!/[.!?…]$/.test(result)) result += ".";

      if (tone === "friendly") {
        const greeting = ({ fr: "Salut !", en: "Hey!", mg: "Salama!" })[language] || "Salut !";
        result = greeting + " " + result;
      } else if (tone === "professional") {
        const greeting = ({ fr: "Bonjour,", en: "Hello,", mg: "Miarahaba," })[language] || "Bonjour,";
        const closing = ({ fr: "Merci pour votre attention.", en: "Thank you for your time.", mg: "Misaotra tamin'ny fotoananao." })[language] || "Merci pour votre attention.";
        result = greeting + " " + result.charAt(0).toLocaleLowerCase(language) + result.slice(1) + " " + closing;
      } else if (tone === "engaging") {
        const prompt = ({ fr: "Qu'en penses-tu ?", en: "What do you think?", mg: "Ahoana ny hevitrao?" })[language] || "Qu'en penses-tu ?";
        result = result + " " + prompt;
      }

      const advice = buildBridgeAdvice(original, tone, language);
      bridgeResult.dataset.result = result;
      bridgeResult.dataset.advice = JSON.stringify(advice);
      bridgeResult.innerHTML =
        "<h3>Proposition locale</h3><p class=\"bridge-rewrite-output\">" + escapeHtml(result).replace(/\n/g, "<br>") + "</p>" +
        "<h3>Conseils pour améliorer ce message</h3><ul>" + advice.map((item) => "<li>" + escapeHtml(item) + "</li>").join("") + "</ul>" +
        '<p class="field-help">Nexora corrige ici surtout la présentation et applique des modèles de ton. Il ne comprend pas entièrement le contexte, ne vérifie pas les faits et ne traduit pas le texte libre. Relis le résultat avant de le publier.</p>';
      bridgeCopyButton.disabled = false;
    });

    bridgeCopyButton.addEventListener("click", async () => {
      const result = bridgeResult.dataset.result || "";
      if (!result) return;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(result);
        } else {
          const temporary = document.createElement("textarea");
          temporary.value = result;
          temporary.setAttribute("readonly", "");
          temporary.style.position = "absolute";
          temporary.style.left = "-9999px";
          document.body.appendChild(temporary);
          temporary.select();
          const copied = document.execCommand("copy");
          temporary.remove();
          if (!copied) throw new Error("copy unavailable");
        }
        bridgeCopyButton.textContent = "Copié !";
        window.setTimeout(() => { bridgeCopyButton.textContent = "Copier le résultat"; }, 1600);
      } catch (_) {
        bridgeResult.insertAdjacentHTML("beforeend", '<p class="result-error">La copie automatique a échoué. Sélectionne le texte et copie-le manuellement.</p>');
      }
    });
  }

  if (bridgePhraseButton && bridgePhrase && bridgeLanguage && bridgePhraseResult) {
    bridgePhraseButton.addEventListener("click", () => {
      const item = phrasebook[bridgePhrase.value];
      const language = bridgeLanguage.value;
      if (!item || !item[language]) {
        bridgePhraseResult.innerHTML = '<p class="result-error">Cette expression n’est pas disponible dans cette langue.</p>';
        return;
      }
      bridgePhraseResult.innerHTML = "<h3>Expression proposée</h3><p>" + escapeHtml(item[language]) + "</p><p class=\"field-help\">Phrase prédéfinie · " + escapeHtml(({ fr: "Français", en: "English", mg: "Malagasy" })[language] || language) + "</p>";
    });
  }


  // Digital Identity: local-first creator profile, validated social links and portable JSON backup.
  const identityForm = document.getElementById("identity-form");
  const identityName = document.getElementById("identity-name");
  const identityHandle = document.getElementById("identity-handle");
  const identityTagline = document.getElementById("identity-tagline");
  const identityBio = document.getElementById("identity-bio");
  const identityBioCount = document.getElementById("identity-bio-count");
  const identityLinkCount = document.getElementById("identity-link-count");
  const identityLinks = document.getElementById("identity-links");
  const identityPreview = document.getElementById("identity-preview");
  const identityFeedback = document.getElementById("identity-feedback");
  const identityAddLink = document.getElementById("identity-add-link");
  const identityExport = document.getElementById("identity-export");
  const identityImport = document.getElementById("identity-import");
  const identityImportFile = document.getElementById("identity-import-file");
  const identityCopy = document.getElementById("identity-copy");
  const identityReset = document.getElementById("identity-reset");
  const identityStorageKey = "nexora.digitalIdentity.v1";
  const identityClearChildren = (element) => { while (element && element.firstChild) element.removeChild(element.firstChild); };
  const identityPlatforms = [
    ["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"],
    ["facebook", "Facebook"], ["x", "X"], ["twitch", "Twitch"],
    ["linkedin", "LinkedIn"], ["website", "Site web"], ["other", "Autre"]
  ];
  let identityLinkSequence = 0;

  const identitySetFeedback = (message, isError) => {
    if (!identityFeedback) return;
    identityFeedback.textContent = message;
    identityFeedback.style.color = isError ? "#a62b40" : "";
  };
  const identityCurrentData = () => ({
    version: 1,
    name: identityName ? identityName.value.trim() : "",
    handle: identityHandle ? identityHandle.value.trim().replace(/^@+/, "") : "",
    tagline: identityTagline ? identityTagline.value.trim() : "",
    bio: identityBio ? identityBio.value.trim() : "",
    links: identityLinks ? Array.from(identityLinks.querySelectorAll(".identity-link-row")).map((row) => ({
      platform: row.querySelector(".identity-platform").value,
      url: row.querySelector(".identity-url").value.trim()
    })) : []
  });
  const identityValidUrl = (value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" && Boolean(parsed.hostname) && !parsed.username && !parsed.password;
    } catch (_) { return false; }
  };
  const identityPlatformLabel = (key) => {
    const found = identityPlatforms.find((item) => item[0] === key);
    return found ? found[1] : "Autre";
  };
  const identityCreateLinkRow = (platform, url) => {
    if (!identityLinks) return;
    const row = document.createElement("div");
    row.className = "identity-link-row";
    const platformWrap = document.createElement("div");
    const platformLabel = document.createElement("label");
    platformLabel.className = "field-label";
    platformLabel.textContent = "Plateforme";
    const platformId = "identity-platform-" + (++identityLinkSequence);
    platformLabel.htmlFor = platformId;
    const platformSelect = document.createElement("select");
    platformSelect.className = "field-control identity-platform";
    platformSelect.id = platformId;
    identityPlatforms.forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      platformSelect.appendChild(option);
    });
    platformSelect.value = identityPlatforms.some((item) => item[0] === platform) ? platform : "other";
    platformWrap.appendChild(platformLabel);
    platformWrap.appendChild(platformSelect);

    const urlWrap = document.createElement("div");
    const urlLabel = document.createElement("label");
    urlLabel.className = "field-label";
    urlLabel.textContent = "URL HTTPS";
    const urlId = "identity-url-" + identityLinkSequence;
    urlLabel.htmlFor = urlId;
    const urlInput = document.createElement("input");
    urlInput.className = "field-control identity-url";
    urlInput.id = urlId;
    urlInput.type = "url";
    urlInput.inputMode = "url";
    urlInput.autocomplete = "url";
    urlInput.placeholder = "https://…";
    urlInput.maxLength = 2048;
    urlInput.value = typeof url === "string" ? url : "";
    urlInput.setAttribute("aria-label", "Adresse HTTPS du lien " + identityPlatformLabel(platformSelect.value));
    urlWrap.appendChild(urlLabel);
    urlWrap.appendChild(urlInput);

    const remove = document.createElement("button");
    remove.className = "identity-link-remove";
    remove.type = "button";
    remove.textContent = "Supprimer";
    remove.setAttribute("aria-label", "Supprimer ce lien social");
    remove.addEventListener("click", () => { row.remove(); identityUpdatePreview(); });
    platformSelect.addEventListener("change", () => {
      urlInput.setAttribute("aria-label", "Adresse HTTPS du lien " + identityPlatformLabel(platformSelect.value));
      identityUpdatePreview();
    });
    urlInput.addEventListener("input", identityUpdatePreview);
    row.appendChild(platformWrap);
    row.appendChild(urlWrap);
    row.appendChild(remove);
    identityLinks.appendChild(row);
  };
  const identityUpdatePreview = () => {
    if (!identityLinks || !identityName || !identityPreview) return;
    const data = identityCurrentData();
    const validLinks = data.links.filter((item) => identityValidUrl(item.url));
    if (identityBioCount) identityBioCount.textContent = data.bio.length + " / 500 caractères";
    if (identityLinkCount) identityLinkCount.textContent = data.links.length + " lien" + (data.links.length === 1 ? "" : "s");
    const setText = (id, value, fallback) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value || fallback;
    };
    setText("identity-preview-name", data.name, "Ton nom de créateur");
    setText("identity-preview-handle", data.handle ? "@" + data.handle : "", "Ton pseudo n’est pas renseigné.");
    setText("identity-preview-tagline", data.tagline, "Ta phrase courte apparaîtra ici.");
    setText("identity-preview-bio", data.bio, "Ta présentation apparaîtra ici.");
    setText("identity-preview-avatar", (data.name || "N").trim().charAt(0).toLocaleUpperCase(), "N");
    const linksContainer = document.getElementById("identity-preview-links");
    if (!linksContainer) return;
    identityClearChildren(linksContainer);
    if (!validLinks.length) {
      const empty = document.createElement("p");
      empty.className = "identity-empty";
      empty.textContent = data.links.length ? "Aucun lien HTTPS valide pour le moment." : "Tes liens valides apparaîtront ici.";
      linksContainer.appendChild(empty);
      return;
    }
    validLinks.forEach((item) => {
      const link = document.createElement("a");
      link.className = "identity-preview-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = identityPlatformLabel(item.platform) + " ↗";
      linksContainer.appendChild(link);
    });
  };
  const identityValidate = (data) => {
    if (!data.name) return "Ajoute un nom affiché avant d'enregistrer.";
    if (data.name.length > 60) return "Le nom affiché ne doit pas dépasser 60 caractères.";
    if (data.handle && !/^[A-Za-z0-9._-]{1,30}$/.test(data.handle)) return "Le nom d'utilisateur contient des caractères non autorisés.";
    if (data.tagline.length > 100) return "La phrase courte ne doit pas dépasser 100 caractères.";
    if (data.bio.length > 500) return "La présentation ne doit pas dépasser 500 caractères.";
    if (data.links.length > 20) return "Tu peux ajouter au maximum 20 liens.";
    for (let i = 0; i < data.links.length; i += 1) {
      if (!identityPlatforms.some((item) => item[0] === data.links[i].platform)) return "Une plateforme sélectionnée n'est pas reconnue.";
      if (data.links[i].url.length > 2048 || !identityValidUrl(data.links[i].url)) return "Le lien " + (i + 1) + " doit être une adresse HTTPS valide de 2048 caractères maximum.";
    }
    return "";
  };
  const identityFillForm = (data) => {
    identityName.value = data.name || "";
    identityHandle.value = data.handle || "";
    identityTagline.value = data.tagline || "";
    identityBio.value = data.bio || "";
    identityClearChildren(identityLinks);
    (Array.isArray(data.links) ? data.links : []).slice(0, 20).forEach((item) => identityCreateLinkRow(item.platform, item.url));
    identityUpdatePreview();
  };
  const identityDownloadJson = (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nexora-digital-identity.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const identityCopyText = async (value) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "absolute";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    if (!copied) throw new Error("Copy not available");
  };

  if (identityForm && identityName && identityHandle && identityTagline && identityBio && identityLinks) {
    [identityName, identityHandle, identityTagline, identityBio].forEach((field) => field.addEventListener("input", identityUpdatePreview));
    identityHandle.addEventListener("input", () => {
      identityHandle.value = identityHandle.value.replace(/^@+/, "");
    });
    if (identityAddLink) identityAddLink.addEventListener("click", () => {
      if (identityLinks.querySelectorAll(".identity-link-row").length >= 20) {
        identitySetFeedback("La fiche peut contenir au maximum 20 liens.", true);
        return;
      }
      identityCreateLinkRow("instagram", "");
      identityUpdatePreview();
    });
    identityForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = identityCurrentData();
      const validationError = identityValidate(data);
      if (validationError) { identitySetFeedback(validationError, true); return; }
      try {
        localStorage.setItem(identityStorageKey, JSON.stringify(data));
        identitySetFeedback("Fiche enregistrée dans le stockage local de cet appareil.", false);
      } catch (_) {
        identitySetFeedback("Impossible d'enregistrer : le stockage local est indisponible ou plein. Essaie d'exporter la fiche en JSON.", true);
      }
    });
    if (identityExport) identityExport.addEventListener("click", () => {
      const data = identityCurrentData();
      const validationError = identityValidate(data);
      if (validationError) { identitySetFeedback(validationError, true); return; }
      identityDownloadJson(data);
      identitySetFeedback("Export JSON préparé. Conserve ce fichier dans un endroit sûr.", false);
    });
    if (identityCopy) identityCopy.addEventListener("click", async () => {
      const data = identityCurrentData();
      const validationError = identityValidate(data);
      if (validationError) { identitySetFeedback(validationError, true); return; }
      const lines = [data.name, data.handle ? "@" + data.handle : "", data.tagline, data.bio, ...data.links.map((item) => identityPlatformLabel(item.platform) + ": " + item.url)].filter(Boolean);
      try {
        await identityCopyText(lines.join("\n"));
        identitySetFeedback("Résumé copié. Tu peux le coller où tu veux.", false);
      } catch (_) {
        identitySetFeedback("La copie automatique a échoué. Réessaie ou exporte la fiche en JSON.", true);
      }
    });
    if (identityImport && identityImportFile) {
      identityImport.addEventListener("click", () => identityImportFile.click());
      identityImportFile.addEventListener("change", async () => {
        const file = identityImportFile.files && identityImportFile.files[0];
        identityImportFile.value = "";
        if (!file) return;
        if (file.size > 1024 * 1024) { identitySetFeedback("Le fichier JSON dépasse la limite de 1 Mo.", true); return; }
        try {
          const rawJson = typeof file.text === "function" ? await file.text() : await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = () => reject(new Error("File read failed")); reader.readAsText(file); });
          const imported = JSON.parse(rawJson);
          if (!imported || typeof imported !== "object" || Array.isArray(imported) ||
              typeof imported.name !== "string" || typeof imported.handle !== "string" ||
              typeof imported.tagline !== "string" || typeof imported.bio !== "string" ||
              !Array.isArray(imported.links) || imported.links.length > 20 ||
              imported.name.length > 60 || imported.handle.length > 30 ||
              imported.tagline.length > 100 || imported.bio.length > 500 ||
              imported.links.some((item) => !item || typeof item.platform !== "string" || typeof item.url !== "string" || item.url.length > 2048)) {
            throw new Error("Invalid profile structure");
          }
          const data = { version: 1, name: imported.name, handle: imported.handle, tagline: imported.tagline, bio: imported.bio, links: imported.links };
          const validationError = identityValidate(data);
          if (validationError) { identitySetFeedback("Import refusé : " + validationError, true); return; }
          identityFillForm(data);
          identitySetFeedback("Fiche importée dans l'éditeur. Enregistre-la pour la conserver sur cet appareil.", false);
        } catch (_) {
          identitySetFeedback("Import impossible : fichier JSON invalide ou format non pris en charge.", true);
        }
      });
    }
    if (identityReset) identityReset.addEventListener("click", () => {
      if (!window.confirm("Effacer la fiche enregistrée sur cet appareil et vider l'éditeur ? Pense à exporter une sauvegarde si tu souhaites la garder.")) return;
      try {
        localStorage.removeItem(identityStorageKey);
      } catch (_) {
        identitySetFeedback("Impossible d'effacer la fiche enregistrée : le stockage local est indisponible.", true);
        return;
      }
      identityFillForm({ name: "", handle: "", tagline: "", bio: "", links: [] });
      identitySetFeedback("La fiche locale a été effacée.", false);
    });
    try {
      const saved = localStorage.getItem(identityStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === "string" && typeof parsed.handle === "string" &&
            typeof parsed.tagline === "string" && typeof parsed.bio === "string" && Array.isArray(parsed.links)) {
          identityFillForm({
            name: parsed.name.slice(0, 60), handle: parsed.handle.slice(0, 30),
            tagline: parsed.tagline.slice(0, 100), bio: parsed.bio.slice(0, 500),
            links: parsed.links.filter((item) => item && typeof item.platform === "string" && typeof item.url === "string").slice(0, 20)
          });
          identitySetFeedback("Fiche locale chargée.", false);
        }
      }
    } catch (_) {
      identitySetFeedback("Le navigateur n'a pas pu lire la fiche enregistrée. Tu peux importer une sauvegarde JSON.", true);
    }
    identityUpdatePreview();
  }

  window.addEventListener("popstate", () => {
    const requestedView = window.location.hash.slice(1);
    showView(pageTitles[requestedView] ? requestedView : "overview", {
      updateHash: false,
      focus: false
    });
  });

  if (year) year.textContent = String(new Date().getFullYear());

  const initialView = window.location.hash.slice(1);
  showView(pageTitles[initialView] ? initialView : "overview", {
    updateHash: false,
    focus: false
  });
})();
