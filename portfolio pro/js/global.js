(function () {
  "use strict";

  // ===========================================================================
  // CONFIGURATION
  // Réglages globaux du portfolio. Les projets eux-mêmes vivent dans
  // js/projects/*.js (un fichier par projet), chargés avant ce script.
  // ===========================================================================

  const config = {
    githubOwner: "LukeClnpro",
    // true : en plus des projets listés dans js/projects/*.js, le site va
    // chercher automatiquement les autres dépôts publics de githubOwner.
    discoverRepositories: true,
    // Noms de dépôts (en minuscules) à ne jamais afficher automatiquement,
    // même si discoverRepositories est activé.
    excludedRepositories: ["site"]
  };

  const projects = Array.isArray(window.PortfolioProjects) ? window.PortfolioProjects : [];

  // ===========================================================================
  // I18N (FR / EN)
  // ===========================================================================

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

  function applyTranslations(lang) {
    const current = translations[lang] || translations.fr;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.dataset.i18n;
      if (current[key] !== undefined) {
        node.textContent = current[key];
      }
    });

    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      const isActive = button.dataset.langSwitch === lang;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    return current;
  }

  function setLanguage(lang) {
    const normalized = lang === "en" ? "en" : "fr";
    try {
      localStorage.setItem("portfolio-language", normalized);
    } catch (error) {
      // Stockage indisponible (navigation privée, etc.) — on continue quand même.
    }
    document.documentElement.setAttribute("lang", normalized);
    document.body.dataset.lang = normalized;
    applyTranslations(normalized);
    return normalized;
  }

  function initLanguageToggle() {
    setLanguage(getPreferredLanguage());
    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.langSwitch));
    });
  }

  // ===========================================================================
  // API GITHUB (avec cache de session)
  // Les requêtes non authentifiées vers l'API GitHub sont limitées à 60/heure
  // par visiteur. Ce site est statique (pas de serveur), donc impossible d'y
  // attacher un token sans l'exposer à tout le monde. Un cache de 30 minutes
  // évite de répéter les mêmes appels en changeant de page ou en rechargeant.
  // ===========================================================================

  const CACHE_TTL_MS = 30 * 60 * 1000;
  const CACHE_PREFIX = "gh-cache:";

  function readCache(key) {
    try {
      const raw = sessionStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const { value, expires } = JSON.parse(raw);
      if (!expires || Date.now() > expires) {
        sessionStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return value;
    } catch (error) {
      return null;
    }
  }

  function writeCache(key, value) {
    try {
      sessionStorage.setItem(
        CACHE_PREFIX + key,
        JSON.stringify({ value, expires: Date.now() + CACHE_TTL_MS })
      );
    } catch (error) {
      // Stockage indisponible ou plein — on continue sans cache.
    }
  }

  function isRateLimited(response) {
    return response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0";
  }

  async function fetchGitHubRepositories(owner) {
    if (!owner) return [];

    const cacheKey = `repos:${owner.toLowerCase()}`;
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(owner)}/repos?per_page=100&sort=updated`,
      { headers: { Accept: "application/vnd.github+json" } }
    );

    if (!response.ok) {
      const reason = isRateLimited(response) ? "rate limit exceeded" : response.status;
      throw new Error(`GitHub repositories unavailable: ${reason}`);
    }

    const repositories = await response.json();
    const list = Array.isArray(repositories) ? repositories : [];
    writeCache(cacheKey, list);
    return list;
  }

  async function fetchGitHubRepositoryInfo(repoName) {
    if (!repoName || !repoName.includes("/")) {
      throw new Error("Repository GitHub invalide");
    }

    const cacheKey = `repo:${repoName.toLowerCase()}`;
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(`https://api.github.com/repos/${repoName}`, {
      headers: { Accept: "application/vnd.github+json" }
    });

    if (!response.ok) {
      const reason = isRateLimited(response) ? "rate limit exceeded" : response.status;
      throw new Error(`GitHub repository unavailable: ${reason}`);
    }

    const data = await response.json();
    const info = {
      full_name: data.full_name || repoName,
      description: data.description || "",
      html_url: data.html_url || `https://github.com/${repoName}`,
      default_branch: data.default_branch || "main",
      topics: Array.isArray(data.topics) ? data.topics : [],
      stargazers_count: typeof data.stargazers_count === "number" ? data.stargazers_count : 0
    };

    writeCache(cacheKey, info);
    return info;
  }

  function summarizeReadme(markdown, fallbackText) {
    if (!markdown || !markdown.trim()) return fallbackText;

    const cleanText = markdown
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[#>*_`~\n]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return fallbackText;
    if (cleanText.length > 180) return `${cleanText.slice(0, 177).trim()}...`;
    return cleanText;
  }

  async function fetchGitHubReadmeSummary(repoName, fallbackText = "") {
    if (!repoName || !repoName.includes("/")) return fallbackText;

    const cacheKey = `readme-summary:${repoName.toLowerCase()}`;
    const cached = readCache(cacheKey);
    if (cached !== null) return cached;

    try {
      const readmeResponse = await fetch(`https://api.github.com/repos/${repoName}/readme`, {
        headers: { Accept: "application/vnd.github.v3.raw" }
      });
      if (!readmeResponse.ok) return fallbackText;

      const readmeText = await readmeResponse.text();
      const summary = summarizeReadme(readmeText, fallbackText);
      writeCache(cacheKey, summary);
      return summary;
    } catch (error) {
      return fallbackText;
    }
  }

  async function fetchGitHubReadmeContent(repoName) {
    if (!repoName || !repoName.includes("/")) return "";

    const cacheKey = `readme-full:${repoName.toLowerCase()}`;
    const cached = readCache(cacheKey);
    if (cached !== null) return cached;

    try {
      const response = await fetch(`https://api.github.com/repos/${repoName}/readme`, {
        headers: { Accept: "application/vnd.github.v3.raw" }
      });
      if (!response.ok) return "";

      const text = await response.text();
      writeCache(cacheKey, text);
      return text;
    } catch (error) {
      return "";
    }
  }

  // ===========================================================================
  // AIDES COMMUNES
  // ===========================================================================

  function slugify(value) {
    return (
      String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "project"
    );
  }

  function normalizeProject(project) {
    if (!project || typeof project !== "object") return null;

    const repoName = typeof project.repo === "string" ? project.repo.trim() : "";
    const name =
      typeof project.name === "string" && project.name.trim()
        ? project.name.trim()
        : repoName.split("/")[1] || "Projet";

    return {
      id: project.id || slugify(name),
      name,
      repo: repoName,
      url: project.url || (repoName ? `https://github.com/${repoName}` : "#"),
      description: project.description || "",
      tags: Array.isArray(project.tags) ? project.tags : [],
      featured: Boolean(project.featured),
      readme: project.readme || "",
      source: project.source || "local"
    };
  }

  function projectFromRepository(repository) {
    return normalizeProject({
      id: slugify(repository.name),
      name: repository.name,
      repo: repository.full_name,
      url: repository.html_url,
      description: repository.description || "",
      tags: Array.isArray(repository.topics) ? repository.topics.slice(0, 3) : [],
      featured: false,
      source: "github"
    });
  }

  // ===========================================================================
  // PAGE D'ACCUEIL : grille de cartes (#project-list)
  // ===========================================================================

  function initProjectList(projectList) {
    function createCardMarkup(project) {
      const lang = document.body.dataset.lang || "fr";
      const labels =
        lang === "en"
          ? {
              featured: "Featured",
              project: "Project",
              readmeFallback: "README is not available yet from GitHub.",
              repoButton: "View repository",
              repoFallback: "Repository"
            }
          : {
              featured: "À l'honneur",
              project: "Projet",
              readmeFallback: "Le README n’est pas encore disponible depuis GitHub.",
              repoButton: "Voir le dépôt",
              repoFallback: "Dépôt"
            };

      const tags = project.tags.length
        ? project.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")
        : '<span class="tag">Web</span>';

      return `
        <div class="project-meta">
          <span class="status-pill">${project.featured ? labels.featured : labels.project}</span>
          <span class="tag-list">${tags}</span>
        </div>
        <h3>${project.name}</h3>
        <p class="project-summary">${project.description || (lang === "en" ? "Description not available yet." : "Description non disponible pour le moment.")}</p>
        <div class="project-readme">${project.readme || labels.readmeFallback}</div>
        <div class="project-footer">
          <a class="repo-link" href="${project.url}" target="_blank" rel="noreferrer">${labels.repoButton}</a>
          <span class="repo-name">${project.repo || labels.repoFallback}</span>
        </div>
      `;
    }

    async function enrichProject(project) {
      if (!project.repo) {
        return {
          ...project,
          description: project.description || "Description non disponible pour le moment.",
          readme: project.readme || "Aucun README disponible pour ce projet.",
          source: "local"
        };
      }

      // Les projets découverts automatiquement (source "github") ont déjà leur
      // description/topics/url venus de la liste des dépôts : pas besoin de
      // rappeler l'API pour ça, seul le README nécessite un appel de plus.
      try {
        let repoInfo = null;
        if (project.source !== "github") {
          repoInfo = await fetchGitHubRepositoryInfo(project.repo);
        }

        const fallbackDescription =
          project.description || repoInfo?.description || "Description non disponible pour le moment.";
        const summaryText = await fetchGitHubReadmeSummary(project.repo, fallbackDescription);

        return {
          ...project,
          name: project.name || repoInfo?.full_name.split("/")[1] || "Projet",
          url: project.url || repoInfo?.html_url,
          description: project.description || repoInfo?.description || "Description non disponible pour le moment.",
          tags: project.tags.length ? project.tags : repoInfo?.topics.slice(0, 3) || [],
          readme: summaryText || "Le README n’est pas disponible actuellement.",
          source: "github"
        };
      } catch (error) {
        return {
          ...project,
          description: project.description || "Description non disponible pour le moment.",
          readme: project.readme || "Le README n’est pas disponible actuellement.",
          source: "local"
        };
      }
    }

    async function renderProjects() {
      const localProjects = projects.map(normalizeProject).filter(Boolean);
      let normalizedProjects = localProjects;

      if (config.discoverRepositories) {
        try {
          const repositories = await fetchGitHubRepositories(config.githubOwner);
          const localRepos = new Set(localProjects.map((project) => project.repo.toLowerCase()));
          const excludedRepositories = new Set(
            (config.excludedRepositories || []).map((repository) => repository.toLowerCase())
          );
          const discoveredProjects = repositories
            .filter((repository) => {
              const repositoryName = repository.name.toLowerCase();
              const fullName = repository.full_name.toLowerCase();
              return (
                !repository.fork &&
                !localRepos.has(fullName) &&
                !excludedRepositories.has(repositoryName) &&
                !excludedRepositories.has(fullName)
              );
            })
            .map(projectFromRepository);
          normalizedProjects = [...localProjects, ...discoveredProjects];
        } catch (error) {
          normalizedProjects = localProjects;
        }
      }

      projectList.innerHTML = "";

      for (const project of normalizedProjects) {
        const card = document.createElement("article");
        card.className = `project-card ${project.featured ? "featured" : ""}`;
        card.dataset.projectId = project.id;
        card.setAttribute("role", "link");
        card.tabIndex = 0;
        card.style.cursor = "pointer";
        card.innerHTML = createCardMarkup(project);

        const goToDetail = () => {
          window.location.href = `project.html?id=${encodeURIComponent(project.id)}&repo=${encodeURIComponent(project.repo)}`;
        };
        card.addEventListener("click", goToDetail);
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            goToDetail();
          }
        });

        projectList.appendChild(card);

        const enrichedProject = await enrichProject(project);
        card.innerHTML = createCardMarkup(enrichedProject);
      }
    }

    renderProjects();
  }

  // ===========================================================================
  // PAGE PROJET : détail + README (#project-detail)
  // ===========================================================================

  function initProjectDetail(detailContainer) {
    function extractProjectIdFromUrl() {
      return new URLSearchParams(window.location.search).get("id");
    }

    function extractRepositoryFromUrl() {
      return new URLSearchParams(window.location.search).get("repo");
    }

    function formatMarkdownToHtml(markdown) {
      if (!markdown || !markdown.trim()) {
        return "<p>No README content available.</p>";
      }

      const renderer = new marked.Renderer();
      renderer.link = (href, title, text) => {
        const safeHref = href || "#";
        const safeTitle = title ? ` title="${title}"` : "";
        return `<a href="${safeHref}" target="_blank" rel="noreferrer noopener"${safeTitle}>${text}</a>`;
      };

      marked.setOptions({ breaks: true, gfm: true, renderer });

      const html = marked.parse(markdown);
      return DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        ADD_ATTR: ["target", "rel"]
      });
    }

    function addCopyButtons() {
      document.querySelectorAll(".readme-panel pre").forEach((block) => {
        if (block.querySelector(".copy-button")) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "copy-button";
        button.textContent = "Copy";
        button.addEventListener("click", async () => {
          const code = block.querySelector("code");
          const text = code ? code.textContent : block.textContent;
          try {
            await navigator.clipboard.writeText(text);
            button.textContent = "Copied";
          } catch (error) {
            button.textContent = "Failed";
          } finally {
            setTimeout(() => {
              button.textContent = "Copy";
            }, 1200);
          }
        });

        block.appendChild(button);
      });

      if (window.hljs) {
        document.querySelectorAll(".readme-panel pre code").forEach((codeBlock) => {
          window.hljs.highlightElement(codeBlock);
        });
      }
    }

    async function loadProjectDetail() {
      const projectId = extractProjectIdFromUrl();
      const repositoryName = extractRepositoryFromUrl();
      let project = projects.map(normalizeProject).find((item) => item && item.id === projectId);

      if (!project && repositoryName) {
        project = normalizeProject({
          id: projectId || repositoryName.split("/")[1],
          name: repositoryName.split("/")[1],
          repo: repositoryName,
          url: `https://github.com/${repositoryName}`,
          tags: [],
          source: "github"
        });
      }

      const lang = document.body.dataset.lang || "fr";
      const t =
        lang === "en"
          ? {
              project: "Project",
              notFound: "Project not found",
              notFoundText: "The requested project could not be found.",
              summaryMissing: "Project summary unavailable.",
              viewRepository: "View repository",
              backToPortfolio: "Back to portfolio",
              noReadme: "README is currently unavailable, but the repository remains accessible."
            }
          : {
              project: "Projet",
              notFound: "Projet introuvable",
              notFoundText: "Le projet demandé est introuvable.",
              summaryMissing: "Résumé du projet indisponible.",
              viewRepository: "Voir le dépôt",
              backToPortfolio: "Retour au portfolio",
              noReadme: "Le README est actuellement indisponible, mais le dépôt reste accessible."
            };

      if (!project) {
        detailContainer.innerHTML = `
          <div class="empty-state">
            <h1>${t.notFound}</h1>
            <p>${t.notFoundText}</p>
          </div>
        `;
        return;
      }

      try {
        const repoInfo = await fetchGitHubRepositoryInfo(project.repo);
        const readmeMarkdown = await fetchGitHubReadmeContent(project.repo);
        const readmeHtml = formatMarkdownToHtml(
          readmeMarkdown || repoInfo.description || (lang === "en" ? "No README available." : "Aucun README disponible.")
        );

        detailContainer.innerHTML = `
          <div class="detail-header">
            <p class="eyebrow" data-i18n="projectPageTitle">${t.project}</p>
            <h1>${project.name}</h1>
            <p class="detail-summary">${project.description || repoInfo.description || t.summaryMissing}</p>
            <div class="detail-actions">
              <a class="button primary" href="${project.url}" target="_blank" rel="noreferrer">${t.viewRepository}</a>
              <a class="button secondary" href="index.html" data-i18n="backToPortfolio">${t.backToPortfolio}</a>
            </div>
          </div>
          <div class="detail-meta">
            <span class="tag">${project.repo}</span>
            ${project.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
          </div>
          <section class="readme-panel">
            ${readmeHtml}
          </section>
        `;
        addCopyButtons();
      } catch (error) {
        detailContainer.innerHTML = `
          <div class="detail-header">
            <p class="eyebrow" data-i18n="projectPageTitle">${t.project}</p>
            <h1>${project.name}</h1>
            <p class="detail-summary">${project.description || t.summaryMissing}</p>
          </div>
          <section class="readme-panel">
            <p>${t.noReadme}</p>
          </section>
        `;
      }

      applyTranslations(lang);
    }

    loadProjectDetail();
  }

  // ===========================================================================
  // POINT D'ENTRÉE
  // ===========================================================================

  document.addEventListener("DOMContentLoaded", () => {
    initLanguageToggle();

    const projectList = document.querySelector("#project-list");
    const detailContainer = document.querySelector("#project-detail");

    if (projectList) initProjectList(projectList);
    if (detailContainer) initProjectDetail(detailContainer);
  });
})();
