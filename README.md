# Tab d'intervalles

Générateur de tabs pour travailler des intervalles et des arpèges : on choisit une tonalité et des degrés (ex : 1 - 2 en C), l'app pose les notes sur le manche selon un système de doigté, génère la tab et la joue en boucle (alphaTab).

## Lancer

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # tests du moteur (Vitest)
npm run build
```

Le plugin Vite d'alphaTab copie la police et la soundfont dans `public/font` et `public/soundfont` au démarrage (fichiers ignorés par git).

## Architecture

- `src/engine` : moteur pur TypeScript, sans React, entièrement testé.
  - `theory` : hauteurs, degrés chromatiques, nom des notes selon la tonalité.
  - `instrument` : presets (guitare 6/7/8, basse 4/5), accordages, manche.
  - `fingering` : systèmes de doigté derrière une interface commune (`FingeringStrategy`) : box N cases + extensions, CAGED, N notes par corde.
  - `navigation` : une position, toutes les positions, ou best path (Viterbi sur un coût paramétrable : déplacements, grands sauts, changements de corde, extensions, notes max par corde...).
  - `patterns` : montée / descente, séquences (motifs d'offsets), aléatoire à graine, paires d'intervalles.
  - `rhythm`, `export/alphatex` : découpage en mesures et génération de l'alphaTex.
  - `settings`, `url` : réglages et leur sérialisation dans l'URL (seules les valeurs différentes des défauts).
- `src/player` : hook alphaTab (lecture, boucle, métronome, décompte, accélération progressive).
- `src/ui` : panneaux de réglages, manche SVG, liste des positions, tab.

Ajouter un système de doigté : implémenter `FingeringStrategy` et l'enregistrer dans `src/engine/fingering/registry.ts`.
