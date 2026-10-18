"use strict";

(() => {
  const views = Array.from(document.querySelectorAll("[data-page]"));
  const viewControls = Array.from(document.querySelectorAll("[data-view]"));
  const sidebar = document.getElementById("sidebar");
  const menuButton = document.getElementById("mobile-menu-button");
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
    });

    document.addEventListener("click", (event) => {
      if (window.matchMedia("(max-width: 560px)").matches &&
          sidebar.classList.contains("is-open") &&
          !sidebar.contains(event.target) &&
          !menuButton.contains(event.target)) {
        closeMobileMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMobileMenu();
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
