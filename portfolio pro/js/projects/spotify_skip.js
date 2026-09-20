// ─────────────────────────────────────────────────────────────────────────
// Une carte de projet = un fichier ici, dans js/projects/.
// Pour ajouter un nouveau projet :
//   1. Duplique ce fichier, renomme-le (ex: js/projects/mon-projet.js).
//   2. Change les valeurs ci-dessous.
//   3. Ajoute une ligne <script src="js/projects/mon-projet.js"></script>
//      dans index.html ET project.html, juste au-dessus de js/global.js.
// C'est tout — global.js va automatiquement le récupérer, aller chercher
// sa description/README sur GitHub, et générer sa carte + sa page détail.
// ─────────────────────────────────────────────────────────────────────────

window.PortfolioProjects = window.PortfolioProjects || [];

window.PortfolioProjects.push({
  // Identifiant unique utilisé dans l'URL (project.html?id=...). Lettres,
  // chiffres et tirets uniquement.
  id: "spotify_skipper",

  // Nom affiché sur la carte et la page détail.
  name: "spotify_skipper",

  // "compte/nom-du-repo" exact sur GitHub — sert à interroger l'API.
  repo: "lukeclnpro/spotify_skipper",

  // Lien "Voir le dépôt". Laisser vide ("") pour le déduire automatiquement
  // de `repo` (https://github.com/<repo>).
  url: "https://github.com/lukeclnpro/spotify_skipper",

  // Description affichée si l'API GitHub ne répond pas (ou en attendant
  // sa réponse). Si tu laisses vide, la description du repo GitHub est
  // utilisée à la place.
  description: "script linux qui permet d'eviter l'achat de spotify premium,

  // Étiquettes affichées sur la carte. Si vide, les "topics" GitHub du
  // repo sont utilisés à la place (jusqu'à 3).
  tags: ["GitHub", "Project", "Development"],

  // true = badge "À l'honneur" + carte mise en avant visuellement.
  featured: true
});
