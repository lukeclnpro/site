window.PortfolioI18n = window.PortfolioI18n || {};

const translations = {
  fr: {
    navProjects: "Projets",
    navGithub: "GitHub",
    heroEyebrow: "Portfolio • GitHub • projets",
    heroTitle: "Projets sélectionnés",
    heroLead:
      "Une sélection de projets publiés sur GitHub, avec un accès direct au code source et aux détails du projet.",
    heroPrimary: "Voir les projets",
    heroSecondary: "GitHub principal",
    profileTitle: "Profil",
    profileProjects: "projets",
    profilePublic: "public",
    profilePortfolio: "portfolio",
    sectionProjects: "Projects",
    sectionTitle: "Projets sélectionnés",
    footerGithub: "GitHub personnel",
    projectBadgeFeatured: "À l'honneur",
    projectBadgeProject: "Projet",
    projectReadmeFallback: "Le README n’est pas encore disponible depuis GitHub.",
    repoButton: "Voir le dépôt",
    repoFallback: "Dépôt",
    backHome: "Accueil",
    backToProjects: "← Retour aux projets",
    projectPageTitle: "Projet",
    projectNotFound: "Projet introuvable",
    projectNotFoundText: "Le projet demandé est introuvable.",
    viewRepository: "Voir le dépôt",
    backToPortfolio: "Retour au portfolio",
    noReadme: "Aucun README disponible pour le moment.",
    projectSummaryFallback: "Résumé du projet indisponible.",
    langLabel: "FR",
    langLabelEn: "EN",
    langActive: "fr",
    langInactive: "en"
  },
  en: {
    navProjects: "Projects",
    navGithub: "GitHub",
    heroEyebrow: "Portfolio • GitHub • projects",
    heroTitle: "Selected work",
    heroLead:
      "A selection of projects published on GitHub, with direct access to each project’s source code and details.",
    heroPrimary: "View projects",
    heroSecondary: "Main GitHub",
    profileTitle: "Profile",
    profileProjects: "projects",
    profilePublic: "public",
    profilePortfolio: "portfolio",
    sectionProjects: "Projects",
    sectionTitle: "Selected work",
    footerGithub: "Personal GitHub",
    projectBadgeFeatured: "Featured",
    projectBadgeProject: "Project",
    projectReadmeFallback: "README is not available yet from GitHub.",
    repoButton: "View repository",
    repoFallback: "Repository",
    backHome: "Home",
    backToProjects: "← Back to projects",
    projectPageTitle: "Project",
    projectNotFound: "Project not found",
    projectNotFoundText: "The requested project could not be found.",
    viewRepository: "View repository",
    backToPortfolio: "Back to portfolio",
    noReadme: "No README available at the moment.",
    projectSummaryFallback: "Project summary unavailable.",
    langLabel: "FR",
    langLabelEn: "EN",
    langActive: "en",
    langInactive: "fr"
  }
};

function getPreferredLanguage() {
  let saved = null;

  try {
    saved = localStorage.getItem("portfolio-language");
  } catch (error) {
    saved = null;
  }

  if (saved === "fr" || saved === "en") return saved;
  const browserLang = navigator.language || navigator.languages?.[0] || "fr";
  return browserLang.toLowerCase().startsWith("en") ? "en" : "fr";
}

function setLanguage(lang) {
  const normalized = lang === "en" ? "en" : "fr";

  try {
    localStorage.setItem("portfolio-language", normalized);
  } catch (error) {
  }

  document.documentElement.setAttribute("lang", normalized);
  document.body.dataset.lang = normalized;
  applyTranslations(normalized);
  return normalized;
}

function applyTranslations(lang = getPreferredLanguage()) {
  const current = translations[lang] || translations.fr;
  const nodes = document.querySelectorAll("[data-i18n]");

  nodes.forEach((node) => {
    const key = node.dataset.i18n;
    if (current[key] !== undefined) {
      node.textContent = current[key];
    }
  });

  const switchButtons = document.querySelectorAll("[data-lang-switch]");
  switchButtons.forEach((button) => {
    const isActive = button.dataset.langSwitch === lang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  return current;
}

function initLanguageToggle() {
  const initialLang = getPreferredLanguage();
  setLanguage(initialLang);

  const switches = document.querySelectorAll("[data-lang-switch]");
  switches.forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.langSwitch);
    });
  });
}

window.PortfolioI18n.translations = translations;
window.PortfolioI18n.getPreferredLanguage = getPreferredLanguage;
window.PortfolioI18n.setLanguage = setLanguage;
window.PortfolioI18n.applyTranslations = applyTranslations;
window.PortfolioI18n.initLanguageToggle = initLanguageToggle;
