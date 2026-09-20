# Portfolio

Professional project portfolio.

## Current project

- GitHub principal: https://github.com/LukeClnpro
- GitHub personnel: https://github.com/LukeCOULON
- Premier projet: https://github.com/lukeclnpro/DIMH

## Structure

- `index.html` : landing page
- `css/styles.css` : styles
- `js/projects.js` : local project registry
- `js/github.js` : GitHub metadata fetch
- `js/app.js` : rendering logic

## Add a project

Edit `js/projects.js` and add a new entry using the structure below:

```js
{
  id: "project-id",
  name: "Project name",
  repo: "owner/repository",
  url: "https://github.com/owner/repository",
  description: "Short project summary.",
  tags: ["Tag1", "Tag2"],
  featured: true,
  source: "local"
}
```

## Open locally

Double-click `index.html` to open the portfolio directly in a browser. The site only requires the files in this folder:

- HTML pages
- `css/styles.css`
- JavaScript files in `js/`

The project list and GitHub README data are loaded by JavaScript from the public GitHub API. An internet connection is therefore required for repository enrichment, but no Python server or backend is needed.
