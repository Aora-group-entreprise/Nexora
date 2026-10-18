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
      if (width < 720 || height < 720) advice.push("L'image est relativement petite ; vérifie sa netteté dans le format choisi.");
      if (target) {
        if (Math.abs(ratio - target.width / target.height) / (target.width / target.height) > .05) advice.push("Le ratio diffère du repère cible " + target.width + " × " + target.height + " px ; un recadrage peut être nécessaire.");
        if (width < target.width || height < target.height) advice.push("La résolution est inférieure au repère cible de " + target.width + " × " + target.height + " px.");
      }
      imageResult.innerHTML = "<h3>Résultat de l'analyse</h3>" + renderMetrics([
        {label:"Dimensions",value:width+" × "+height+" px"},{label:"Poids",value:formatBytes(file.size)},
        {label:"Format",value:file.type||"Non précisé"},{label:"Ratio",value:ratio.toFixed(2)+":1"}
      ]) + renderAdvice(advice);
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
      const width = video.videoWidth, height = video.videoHeight, target = getTarget(), advice = [];
      if (target && width && height) {
        const ratio = width / height, targetRatio = target.width / target.height;
        if (Math.abs(ratio - targetRatio) / targetRatio > .05) advice.push("Le ratio diffère du repère cible " + target.width + " × " + target.height + " px.");
        if (width < target.width || height < target.height) advice.push("La résolution est inférieure au repère cible.");
      }
      videoResult.innerHTML = "<h3>Résultat des métadonnées</h3>" + renderMetrics([
        {label:"Dimensions",value:width&&height?width+" × "+height+" px":"Indisponibles"},
        {label:"Durée",value:formatDuration(video.duration)},{label:"Poids",value:formatBytes(file.size)},{label:"Format déclaré",value:file.type||"Non précisé"}
      ]) + renderAdvice(advice);
      cleanup();
    };
    video.onerror = () => { cleanup(); if (requestId === videoAnalysisId) showError(videoResult, "Impossible de lire les métadonnées de ce format dans ce navigateur."); };
    video.src = url;
  }

  function analyzeText() {
    if (!textInput || !textResult) return;
    const value = textInput.value.trim();
    if (!value) { textResult.dataset.analyzed = "false"; showError(textResult, "Saisis un texte avant de lancer l'analyse."); return; }
    const words = getWords(value);
    const hashtags = value.match(HASHTAG_PATTERN) || [];
    const mentions = value.match(MENTION_PATTERN) || [];
    const sentences = value.split(/[.!?…]+/).map((s) => s.trim()).filter(Boolean);
    const stop = new Set(["avec","dans","pour","mais","donc","alors","cette","cela","vous","nous","votre","the","and","for","that","this","with","from","have","your"]);
    const counts = new Map();
    words.forEach((word) => { const key = word.toLocaleLowerCase(); if (key.length > 3 && !stop.has(key)) counts.set(key,(counts.get(key)||0)+1); });
    const repeated = Array.from(counts.entries()).filter((entry)=>entry[1]>=3).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const advice = [];
    if (value.length > 2200) advice.push("Le texte est long ("+value.length+" caractères) ; vérifie la limite de la plateforme choisie.");
    if (words.length < 5) advice.push("Le texte est très court ; ajoute du contexte si ton public en a besoin.");
    if (sentences.some((sentence) => getWords(sentence).length > 30)) advice.push("Au moins une phrase est longue ; essaie de la raccourcir.");
    if (repeated.length) advice.push("Mots répétés : "+repeated.map((entry)=>entry[0]+" ("+entry[1]+" fois)").join(", ")+".");
    if (hashtags.length > 10) advice.push("Le texte contient "+hashtags.length+" hashtags ; garde ceux qui sont pertinents.");
    if (value.length > 500 && sentences.length < 2) advice.push("Pense à séparer le texte en phrases ou paragraphes plus courts.");
    textResult.dataset.analyzed = "true";
    textResult.innerHTML = "<h3>Résultat de l'analyse</h3>" + renderMetrics([
      {label:"Caractères",value:String(value.length)},{label:"Mots",value:String(words.length)},
      {label:"Hashtags",value:String(hashtags.length)},{label:"Mentions",value:String(mentions.length)},
      {label:"Phrases détectées",value:String(sentences.length)},{label:"Mots moyens par phrase",value:sentences.length?(words.length/sentences.length).toFixed(1):"0"}
    ]) + renderAdvice(advice);
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
  if (bridgeText && bridgeCount) {
    const updateBridgeCount = () => {
      bridgeCount.textContent = bridgeText.value.length + " caractère" + (bridgeText.value.length === 1 ? "" : "s") + " · " + bridgeWords(bridgeText.value) + " mot" + (bridgeWords(bridgeText.value) === 1 ? "" : "s");
    };
    bridgeText.addEventListener("input", updateBridgeCount);
    updateBridgeCount();
  }

  if (bridgeRewriteButton && bridgeText && bridgeResult && bridgeTone && bridgeCopyButton) {
    bridgeRewriteButton.addEventListener("click", () => {
      const original = bridgeText.value.trim().replace(/[ \t]+/g, " ").replace(/\s*([,;:!?])\s*/g, "$1 ").replace(/\s+([.])/g, "$1").trim();
      if (!original) {
        bridgeResult.dataset.result = "";
        bridgeResult.innerHTML = '<p class="result-error">Écris ou colle un texte avant de continuer.</p>';
        bridgeCopyButton.disabled = true;
        return;
      }
      const tone = bridgeTone.value;
      const language = bridgeSourceLanguage ? bridgeSourceLanguage.value : "fr";
      let result = original;
      if (!/[.!?…]$/.test(result)) result += ".";
      if (tone === "clear") {
        result = result.charAt(0).toLocaleUpperCase() + result.slice(1);
      } else if (tone === "friendly") {
        const greeting = ({fr:"Salut !",en:"Hey!",mg:"Salama!"})[language];
        result = greeting + " " + result + " 🙂";
      } else if (tone === "professional") {
        const greeting = ({fr:"Bonjour,",en:"Hello,",mg:"Miarahaba,"})[language];
        const closing = ({fr:"Merci pour votre attention.",en:"Thank you for your attention.",mg:"Misaotra tamin'ny fiheverana."})[language];
        result = greeting + " " + result.charAt(0).toLocaleLowerCase() + result.slice(1) + " " + closing;
      } else if (tone === "engaging") {
        const prompt = ({fr:"Qu'en penses-tu ?",en:"What do you think?",mg:"Ahoana ny hevitrao?"})[language];
        result = "✨ " + result + " " + prompt;
      }
      bridgeResult.dataset.result = result;
      bridgeResult.innerHTML = "<h3>Proposition locale</h3><p>" + escapeHtml(result).replace(/\n/g, "<br>") + "</p><p class=\"field-help\">Suggestion fondée sur des règles de mise en forme ; le sens et l'adaptation culturelle doivent être vérifiés par toi.</p>";
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
      bridgePhraseResult.innerHTML = "<h3>Expression proposée</h3><p>" + escapeHtml(item[language]) + "</p><p class=\"field-help\">Phrase prédéfinie · " + escapeHtml(({fr:"Français",en:"English",mg:"Malagasy"})[language] || language) + "</p>";
    });
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
