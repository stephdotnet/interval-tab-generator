# Tab d'intervalles

App web (Vite + React + TypeScript) qui génère des tabs pour travailler des intervalles : tonalité + degrés -> notes posées sur le manche selon un système de doigté -> tab jouée en boucle par alphaTab.

Avant de toucher au moteur, lire `docs/DOMAIN.md` (règles musicales et raisons des choix). Périmètre et idées à venir : `docs/ROADMAP.md`.

## Commandes

```sh
npm run dev       # copie les assets alphaTab puis lance Vite (http://localhost:5173)
npm test          # Vitest, moteur + export alphaTex
npm run lint      # oxlint
npm run build     # copie des assets + tsc -b + vite build
npm run peek -- "<query string>"            # dump texte d'un exercice (positions, mesures)
npm run peek -- --compare "<query string>"  # best path de chaque système x preset de coût
```

La query string est celle de l'app (ex : `deg=1,2,3,4,5,6,7&nav=bestPath&dir=up`). Dans `peek`, les notes s'écrivent `corde:case` avec les cordes numérotées comme une tab (1 = la plus aiguë).

Avant de rendre la main : `npm test`, `npm run lint` et `npx tsc -b` doivent passer.

## Architecture

- `src/engine/` : moteur en TypeScript pur. **Jamais d'import React, DOM ou alphaTab ici** (seuls les tests importent alphaTab, pour parser l'alphaTex généré).
  - `theory/` : hauteurs, degrés, orthographe des notes, `TargetSet` (pitch class -> degré), `library.ts` (gammes et arpèges, recherche, nommage).
  - `instrument/` : presets, accordages, `Fretboard` (manche + plage de cases + cordes désactivées).
  - `fingering/` : un système = une `FingeringStrategy` (`box`, `caged`, `nps`) enregistrée dans `registry.ts`. `windowCollector.ts` est partagé par box et CAGED.
  - `navigation/` : modes `single` / `all` / `bestPath`. `bestPath.ts` = Viterbi, `cost.ts` = poids et presets.
  - `patterns/` : ordre des notes (montée/descente, séquences, aléatoire, paires).
  - `enclosures.ts` : notes d'approche insérées avant les cibles, après l'enchaînement (forme `D+ C-` orientée selon le sens de la ligne, gamme des approches, placement, alignement sur les temps).
  - `rhythm/`, `export/alphatex.ts` : mesures puis alphaTex.
  - `settings.ts` (types + défauts + `sanitizeSettings`), `url.ts` (sérialisation), `exercise.ts` (orchestration : `buildExercise(settings)`).
  - `presets.ts` : exercices sauvegardés (données pures : création, lecture tolérante, fusion à l'import, nom par défaut, tags, tri, filtre).
  - `labels.ts` : libellés partagés (systèmes, modes d'enchaînement, motifs).
  - `debug/describe.ts` : sorties texte utilisées par `npm run peek`.
- `src/player/useAlphaTab.ts` : cycle de vie de l'API alphaTab, lecture, boucle, accélération.
- `src/ui/` : panneaux, manche SVG, liste des positions. `state/useSettings.ts` garde les réglages dans l'URL. `state/usePresets.ts` + `PresetDrawer.tsx` : « Mes exercices » (tiroir ouvert par le bouton de l'en-tête ou la touche E).

Flux : `Settings` -> `buildExercise` (positions -> `navigate` -> `applyEnclosures` -> mesures -> alphaTex) -> `Exercise { positions, steps, bars, tex, problems, enclosure, subdivision }` -> UI + alphaTab. Utiliser `exercise.subdivision` (l'alignement des enclosures peut l'imposer), pas `settings.rhythm.subdivision`. L'UI ne recalcule rien, elle lit l'`Exercise`.

## Invariants

- **Cordes** : en interne, corde 0 = la plus grave. En alphaTex, la corde 1 = la plus aiguë (`texString = nbCordes - idx`). Dans le modèle alphaTab parsé, `note.string` 1 = la plus grave.
- `Position.notes` : une seule note par hauteur, triée par hauteur. C'est ce que jouent les modes `single` et `all`.
- `Position.candidates` : tous les emplacements d'une hauteur dans la fenêtre. Utilisé uniquement par le best path.
- Pour chaque note, `exercise.bars[bar][beat]` a le même index que le beat alphaTex correspondant. Le surlignage du manche en dépend. Seuls les silences **après la dernière note** d'une mesure sont regroupés (voir `fillWithRests`) : ne jamais regrouper des silences placés avant une note.
- Réglages : un nouveau champ va dans `Settings` + `DEFAULT_SETTINGS` + `FIELDS` (url.ts) + le test d'aller-retour de `settings.test.ts`. L'URL ne contient que les valeurs différentes des défauts. Une valeur invalide dans l'URL est ignorée (le défaut reste).
- Un problème bloquant (degré manquant, système indisponible, rythme impossible) va dans `exercise.problems`, jamais en exception.
- **Notes d'approche** : `FretNote.approach = true`, leur degré nomme la vraie hauteur (même hors des degrés choisis). Un `Step` peut aussi être `{ kind: 'rest' }` (silence d'alignement) : tout code qui parcourt les steps doit le gérer.
- **Presets** : un preset stocke la query string de l'URL, jamais l'objet `Settings`. Le codec URL rend ainsi les vieux presets lisibles : ne pas changer la clé d'un champ de `FIELDS` sans migration. Stockage : `localStorage['interval-tab:presets']` = `{ version, presets }` ; preset chargé dans l'onglet : `sessionStorage['interval-tab:current-preset']`. Tout accès au stockage passe par les fonctions protégées de `usePresets.ts` (navigation privée, stockage bloqué).

## Ajouter...

- **un système de doigté** : implémenter `FingeringStrategy` (`unavailableReason` + `listPositions`), l'ajouter à `FINGERING_SYSTEMS` et à `registry.ts`, écrire ses tests dans `fingering.test.ts`, ajouter son libellé dans `FingeringPanel.tsx`.
- **un motif** : fonction pure dans `patterns/`, branchée dans `patterns/index.ts`, options dans `PatternOptions` (+ défauts + URL).
- **un poids de coût** : `CostWeights`, les 3 presets, `WEIGHT_KEYS` (url.ts, l'ordre compte), `WEIGHT_FIELDS` (FingeringPanel). Vérifier avec `npm run peek -- --compare` que les presets gardent leur caractère (voir DOMAIN.md).

- **une gamme ou un arpège** : une ligne dans la bonne famille de `theory/library.ts` (id unique, degrés dans l'ordre de `DEGREES`, symbole si c'est un accord, autres noms pour la recherche). Les tests de `library.test.ts` vérifient la cohérence ; ajouter un cas d'orthographe si la formule contient des altérations inhabituelles.

## Conventions

- UI en français, code, identifiants et commentaires en anglais. Commentaires rares, pour le pourquoi.
- Concaténation de chaînes plutôt que templates complexes ou `sprintf`. Pas de variable intermédiaire pour une expression utilisée une seule fois.
- Pas de tiret cadratin (em dash) dans les textes, commits et docs : tiret simple ou reformulation.
- Pas d'enum TypeScript (`erasableSyntaxOnly`) : tableaux `as const` + type dérivé.
- Tests à côté du code (`*.test.ts`). Toute règle du moteur a un test ; un bug corrigé a un test.
- Ne jamais commit ou push sans demande explicite. Commits au nom de l'utilisateur, sans ligne Co-Authored-By.

## Pièges connus

- **alphaTex (alphaTab 1.8)** : les métadonnées à plusieurs arguments veulent des parenthèses : `\ts (4 4)`, `\title ("...")`. Les tests d'export parsent la sortie avec `AlphaTexImporter` et exigent zéro diagnostic : les garder.
- **Police alphaTab en dev** : sans `core.fontDirectory`, alphaTab cherche la police dans `node_modules/.vite/deps/font` et n'affiche rien. Il est forcé à `BASE_URL + 'font/'`.
- **Assets alphaTab** : le plugin Vite copie `font/` et `soundfont/` dans `public/` en parallèle de la copie `public/ -> dist/`. Sur un checkout vierge, la soundfont manquait au build. D'où `scripts/copy-alphatab-assets.ts` avant `dev` et `build`. `public/font` et `public/soundfont` sont ignorés par git.
- **Tours de boucle** : compter avec `api.playerFinished` (émis à chaque fin de boucle quand `isLooping`). Détecter un retour du tick comptait aussi le Stop.
- **Portée** : alphaTab écrit déjà la guitare une octave au-dessus du son réel. Ne pas ajouter de `\displaytranspose`.
- **Débordement horizontal de la tab** : la mise en page Page tient toujours dans la largeur, un débordement n'est qu'un arrondi (zoom d'affichage Windows). `.sheet` masque donc `overflow-x`. `justifyLastSystem` étire la dernière ligne pour ne pas tasser un exercice d'une seule mesure.
- **Superposition** : les curseurs alphaTab ont des z-index élevés. `.sheet` a `isolation: isolate` pour qu'ils restent sous le tiroir des presets (z-index 50).
- **StrictMode** : l'API alphaTab est créée puis détruite deux fois en dev ; `destroy()` dans le cleanup de l'effet suffit.
- **Base path** : `vite.config.ts` lit `BASE_PATH` (GitHub Pages sert sous `/<repo>/`). Toute URL d'asset doit passer par `import.meta.env.BASE_URL`.

## Vérifier dans le navigateur

Les tests ne voient ni le rendu ni l'audio. Pour un changement visible, lancer l'app et la piloter avec le MCP chrome-devtools :

```sh
npx vite --port 5199 --strictPort --host 127.0.0.1     # en arrière-plan
google-chrome --headless=new --remote-debugging-port=9222 \
  --user-data-dir="$(mktemp -d)" --autoplay-policy=no-user-gesture-required about:blank   # en arrière-plan
```

Puis `new_page` sur `http://127.0.0.1:5199/?<query>`. Le headless ne produit pas de son, mais on peut vérifier via `evaluate_script` : bouton `.play` activé (soundfont chargée), `.fb-note.active` qui change pendant la lecture, `.badge` pour l'accélération, console sans erreur. Build de prod : `BASE_PATH=/interval-tab-generator/ npm run build && BASE_PATH=/interval-tab-generator/ npx vite preview`.

## Déploiement

`.github/workflows/deploy.yml` : à chaque push sur `main`, lint + tests + build (`BASE_PATH=/<repo>/`) puis publication sur GitHub Pages. Prérequis côté GitHub : Settings > Pages > Source = "GitHub Actions".
