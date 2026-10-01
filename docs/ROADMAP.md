# Roadmap

## Fait (v1)

- Degrés chromatiques sur 12 toniques (dont #2, #5, bb7), orthographe selon la tonalité.
- Bibliothèque de gammes et d'arpèges : 9 familles, recherche, nommage automatique du titre.
- Guitare 6/7/8 cordes, basse 4/5, accordages prédéfinis ou perso, cordes désactivables, plage de cases.
- Doigtés : box (3 à 6 cases, extensions), CAGED, N notes par corde.
- Enchaînement : une position, toutes, best path avec 3 presets et coût réglable.
- Motifs : montée/descente, séquences, aléatoire à graine, paires.
- Lecture alphaTab : curseur, boucle, métronome, décompte, accélération progressive, 9 sons.
- Manche SVG synchronisé, portée optionnelle, réglages partagés via l'URL.
- Déploiement GitHub Pages.
- Enclosures : 13 formes prédéfinies + forme libre (`D+ C-`), orientées selon le sens de la ligne (ou forme fixe, ou deux formes), cibles toutes / tonique / une sur N, gamme des approches auto ou au choix, cibles sur les temps (subdivision et levée), notes fantômes.
- « Mes exercices » : presets dans le localStorage (tiroir latéral, touche E), nom pré-rempli, badge « modifié » et mise à jour, renommer, dupliquer, supprimer avec annulation, recherche et tri, export / import JSON, synchronisation entre onglets.

## Prévu, pas encore fait

- **Exports** : Guitar Pro / MusicXML (alphaTab sait exporter), PDF / impression (`api.print()`).

## Idées (à valider avec l'utilisateur avant de coder)

- Enclosures à résolution retardée (Charlie Parker), rythmes propres aux enclosures (approches en croches, cible longue).
- Raccourcis de motifs « triades / 4 sons diatoniques » (`0 2 4`, `0 2 4 6`) et option « alterner le sens des groupes ».

- Système « une seule corde » (travail horizontal).
- Doigtés personnalisés (dessiner une position sur le manche).
- Plage de hauteurs pour le best path (« de E2 à E5 ») en plus de la plage de cases.
- Rythmes mixtes (motifs rythmiques, notes pointées, note finale longue).
- Code-splitting d'alphaTab pour alléger le premier chargement (bundle > 500 kB).

Hors périmètre tant que l'utilisateur ne le demande pas : comptes, backend, mode multi-pistes.
