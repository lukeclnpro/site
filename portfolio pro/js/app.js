const { projects } = window.PortfolioData;
const { fetchGitHubReadmeSummary, fetchGitHubRepositoryInfo } = window.PortfolioGithub;
const { initLanguageToggle } = window.PortfolioI18n;

const projectList = document.querySelector("#project-list");
const projectCount = document.querySelector("#project-count");

function normalizeProject(project) {
  if (!project || typeof project !== "object") {
    return null;
  }

  const repoName = typeof project.repo === "string" ? project.repo.trim() : "";
  const name = typeof project.name === "string" && project.name.trim() ? project.name.trim() : repoName.split("/")[1] || "Projet";

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

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "project";
}

function createCardMarkup(project) {
  const lang = document.body.dataset.lang || "fr";
  const labels = lang === "en"
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

  try {
    const repoInfo = await fetchGitHubRepositoryInfo(project.repo);
    const summaryText = await fetchGitHubReadmeSummary(project.repo, project.description || repoInfo.description || "Description non disponible pour le moment.");

    return {
      ...project,
      name: project.name || repoInfo.full_name.split("/")[1] || "Projet",
      url: project.url || repoInfo.html_url,
      description: project.description || repoInfo.description || "Description non disponible pour le moment.",
      tags: project.tags.length ? project.tags : repoInfo.topics.slice(0, 3),
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
  if (!projectList) {
    return;
  }

  const normalizedProjects = projects
    .map(normalizeProject)
    .filter(Boolean);

  projectList.innerHTML = "";
  projectCount.textContent = String(normalizedProjects.length);

  for (const project of normalizedProjects) {
    const card = document.createElement("article");
    card.className = `project-card ${project.featured ? "featured" : ""}`;
    card.dataset.projectId = project.id;
    card.setAttribute("role", "link");
    card.tabIndex = 0;
    card.style.cursor = "pointer";
    card.innerHTML = createCardMarkup(project);
    card.addEventListener("click", () => {
      window.location.href = `project.html?id=${encodeURIComponent(project.id)}`;
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.location.href = `project.html?id=${encodeURIComponent(project.id)}`;
      }
    });
    projectList.appendChild(card);

    const enrichedProject = await enrichProject(project);
    card.innerHTML = createCardMarkup(enrichedProject);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initLanguageToggle();
  renderProjects();
});
