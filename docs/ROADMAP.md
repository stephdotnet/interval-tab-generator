# Roadmap

## Fait (v1)

- Degrés chromatiques sur 12 toniques, orthographe selon la tonalité.
- Guitare 6/7/8 cordes, basse 4/5, accordages prédéfinis ou perso, cordes désactivables, plage de cases.
- Doigtés : box (3 à 6 cases, extensions), CAGED, N notes par corde.
- Enchaînement : une position, toutes, best path avec 3 presets et coût réglable.
- Motifs : montée/descente, séquences, aléatoire à graine, paires.
- Lecture alphaTab : curseur, boucle, métronome, décompte, accélération progressive, 9 sons.
- Manche SVG synchronisé, portée optionnelle, réglages partagés via l'URL.
- Déploiement GitHub Pages.

## Prévu, pas encore fait

- **Presets d'exercices** sauvegardés dans le navigateur (liste de favoris).
- **Exports** : Guitar Pro / MusicXML (alphaTab sait exporter), PDF / impression (`api.print()`).

## Idées (à valider avec l'utilisateur avant de coder)

- Système « une seule corde » (travail horizontal).
- Doigtés personnalisés (dessiner une position sur le manche).
- Plage de hauteurs pour le best path (« de E2 à E5 ») en plus de la plage de cases.
- Rythmes mixtes (motifs rythmiques, notes pointées, note finale longue).
- Code-splitting d'alphaTab pour alléger le premier chargement (bundle > 500 kB).

Hors périmètre tant que l'utilisateur ne le demande pas : comptes, backend, mode multi-pistes.
