window.PortfolioGithub = window.PortfolioGithub || {};

async function fetchGitHubRepositoryInfo(repoName) {
  if (!repoName || !repoName.includes("/")) {
    throw new Error("Repository GitHub invalide");
  }

  const response = await fetch(`https://api.github.com/repos/${repoName}`, {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub repository unavailable: ${response.status}`);
  }

  const data = await response.json();

  return {
    full_name: data.full_name || repoName,
    description: data.description || "",
    html_url: data.html_url || `https://github.com/${repoName}`,
    default_branch: data.default_branch || "main",
    topics: Array.isArray(data.topics) ? data.topics : [],
    stargazers_count: typeof data.stargazers_count === "number" ? data.stargazers_count : 0
  };
}

async function fetchGitHubReadmeSummary(repoName, fallbackText = "") {
  if (!repoName || !repoName.includes("/")) {
    return fallbackText;
  }

  try {
    const readmeResponse = await fetch(`https://api.github.com/repos/${repoName}/readme`, {
      headers: {
        Accept: "application/vnd.github.v3.raw"
      }
    });

    if (!readmeResponse.ok) {
      return fallbackText;
    }

    const readmeText = await readmeResponse.text();
    return summarizeReadme(readmeText, fallbackText);
  } catch (error) {
    return fallbackText;
  }
}

async function fetchGitHubReadmeContent(repoName) {
  if (!repoName || !repoName.includes("/")) {
    return "";
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repoName}/readme`, {
      headers: {
        Accept: "application/vnd.github.v3.raw"
      }
    });

    if (!response.ok) {
      return "";
    }

    return await response.text();
  } catch (error) {
    return "";
  }
}

function summarizeReadme(markdown, fallbackText) {
  if (!markdown || !markdown.trim()) {
    return fallbackText;
  }

  const cleanText = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) {
    return fallbackText;
  }

  if (cleanText.length > 180) {
    return `${cleanText.slice(0, 177).trim()}...`;
  }

  return cleanText;
}

window.PortfolioGithub.fetchGitHubRepositoryInfo = fetchGitHubRepositoryInfo;
window.PortfolioGithub.fetchGitHubReadmeSummary = fetchGitHubReadmeSummary;
window.PortfolioGithub.fetchGitHubReadmeContent = fetchGitHubReadmeContent;
