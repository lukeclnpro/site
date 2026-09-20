const { projects } = window.PortfolioData;
const { fetchGitHubReadmeContent, fetchGitHubRepositoryInfo } = window.PortfolioGithub;
const { applyTranslations, initLanguageToggle } = window.PortfolioI18n;

const detailContainer = document.querySelector("#project-detail");

function normalizeProject(project) {
  if (!project || typeof project !== "object") {
    return null;
  }

  const repoName = typeof project.repo === "string" ? project.repo.trim() : "";
  const name = typeof project.name === "string" && project.name.trim() ? project.name.trim() : repoName.split("/")[1] || "Project";

  return {
    id: project.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    repo: repoName,
    url: project.url || (repoName ? `https://github.com/${repoName}` : "#"),
    description: project.description || "",
    tags: Array.isArray(project.tags) ? project.tags : [],
    featured: Boolean(project.featured),
    source: project.source || "local"
  };
}

function extractProjectIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
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

  marked.setOptions({
    breaks: true,
    gfm: true,
    renderer
  });

  const html = marked.parse(markdown);
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"]
  });
}

function addCopyButtons() {
  const blocks = document.querySelectorAll(".readme-panel pre");
  blocks.forEach((block) => {
    if (block.querySelector(".copy-button")) {
      return;
    }

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
        setTimeout(() => {
          button.textContent = "Copy";
        }, 1200);
      } catch (error) {
        button.textContent = "Failed";
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
  if (!detailContainer) {
    return;
  }

  const projectId = extractProjectIdFromUrl();
  const project = projects
    .map(normalizeProject)
    .find((item) => item && item.id === projectId);

  const lang = document.body.dataset.lang || "fr";
  const t = lang === "en" ? {
    project: "Project",
    notFound: "Project not found",
    notFoundText: "The requested project could not be found.",
    summaryMissing: "Project summary unavailable.",
    viewRepository: "View repository",
    backToPortfolio: "Back to portfolio",
    noReadme: "README is currently unavailable, but the repository remains accessible.",
    backToProjects: "← Back to projects"
  } : {
    project: "Projet",
    notFound: "Projet introuvable",
    notFoundText: "Le projet demandé est introuvable.",
    summaryMissing: "Résumé du projet indisponible.",
    viewRepository: "Voir le dépôt",
    backToPortfolio: "Retour au portfolio",
    noReadme: "Le README est actuellement indisponible, mais le dépôt reste accessible.",
    backToProjects: "← Retour aux projets"
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
    const readmeHtml = formatMarkdownToHtml(readmeMarkdown || repoInfo.description || (lang === "en" ? "No README available." : "Aucun README disponible."));

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

document.addEventListener("DOMContentLoaded", () => {
  initLanguageToggle();
  loadProjectDetail();
});
