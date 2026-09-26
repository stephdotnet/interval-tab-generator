# Règles du domaine

Ce document explique **ce que fait le moteur et pourquoi**. Les tests vérifient le quoi ; ici on garde les raisons, pour ne pas défaire un choix réfléchi en croyant simplifier.

## Théorie

- **Degrés chromatiques** : `1 b2 2 b3 3 4 #4 b5 5 b6 6 b7 7`, relatifs à la tonique. Pas de mode : « 3 » est toujours la tierce majeure. `#4` et `b5` sont distincts pour que l'orthographe soit juste (F# ou Gb en C). Si les deux sont choisis, ils désignent la même hauteur et le premier gagne (`TargetSet.byPitchClass`).
- **Orthographe** (`spellDegree`) : la lettre est celle de la tonique décalée du numéro du degré (b3 en C : C + 2 lettres = E), puis on calcule l'altération. D'où `E#` pour la 7 de F#, `Bbb` pour la b6 de Db. Les 12 toniques ont une orthographe fixe : `C Db D Eb E F F# G Ab A Bb B`.
- **Degré de référence** : la tonique si elle est choisie, sinon le plus petit degré choisi. Il sert aux paires d'intervalles et à l'option « commencer et finir sur le degré ».
- Les noms de notes des accordages et de l'alphaTex utilisent des dièses (`midiToName`) : c'est de la technique, pas de l'affichage musical.

## Instrument

- Le manche = accordage (MIDI, corde grave en premier) + plage de cases + cordes à vide autorisées ou non + cordes désactivées.
- La case 0 n'est jouable que si les cordes à vide sont autorisées **et** que la plage commence à 0.
- **Accordage « standard-like »** (`standardOffset`) : les 6 cordes aiguës suivent les intervalles 5-5-5-4-5 demi-tons (E A D G B E), transposées ou non. Les cordes graves en plus (7 et 8 cordes) sont en quartes. Renvoie le nombre de cordes graves en plus. Drop D, DADGAD, open tunings et basses ne sont pas standard-like.

## Systèmes de doigté

Chaque système produit une liste de `Position`. Une position a une fenêtre (`lo`, `hi`), un centre (pour mesurer les déplacements de main), ses `notes` (une par hauteur) et ses `candidates` (tous les emplacements).

### Fenêtre commune (`windowCollector`), utilisée par box et CAGED

- Les doigts couvrent `[lo, hi]` (le « cœur »). L'extension de l'index ajoute `lo - 1`, celle de l'auriculaire `hi + 1`, chacune activable.
- Les cordes à vide s'ajoutent si la fenêtre commence à la case 1 (ou 0). Une corde à vide ne compte pas comme une extension.
- **Une hauteur, un emplacement** dans `notes` : le cœur passe avant l'extension, puis la corde la plus grave gagne. Exemple : dans la box 5-8, E4 est à la fois corde de Sol case 9 (extension) et corde de Si case 5 (cœur) : on garde Si 5.
- **Dédoublonnage des positions** : deux fenêtres qui donnent exactement les mêmes notes (même corde, même case) fusionnent, et on garde **celle qui demande le moins d'extensions**. Sans cette règle, avec seulement C et D, la box 6-9 (notes en extension) masquait la box 7-10 où les mêmes notes tombent sous les doigts.

### Box

Une fenêtre de `boxWidth` cases (4 par défaut) pour chaque case de départ, de la plus basse case jouable à `maxFret - largeur + 1`.

### CAGED

- Les 5 formes sont des fenêtres de 4 cases ancrées sur une tonique, sur une corde de référence (accordage standard, 0 = Mi grave). Pour r la case de la tonique :

  | Forme | Corde de la tonique | Fenêtre | En C | En G |
  |---|---|---|---|---|
  | C | La (1) | [r-3, r] | 0-3 | 7-10 |
  | A | La (1) | [r-1, r+2] | 2-5 | 9-12 |
  | G | Mi grave (0) | [r-3, r] | 5-8 | 0-3 |
  | E | Mi grave (0) | [r-1, r+2] | 7-10 | 2-5 |
  | D | Ré (2) | [r, r+3] | 10-13 | 5-8 |

- On répète à +12 tant que la fenêtre tient dans la plage. Une fenêtre qui déborde sous 0 est coupée à 0 (forme A en A : cases 0-2, avec cordes à vide).
- Sur 7 et 8 cordes, la corde de référence est décalée du nombre de cordes graves en plus, qui entrent aussi dans la fenêtre.
- Indisponible (et grisé dans l'UI, avec l'explication) si l'accordage n'est pas standard-like : les formes CAGED n'ont pas de sens ailleurs.

### N notes par corde (`nps`)

- Une position par hauteur cible de la corde la plus grave, dans sa première octave jouable. En C majeur, 3 notes par corde et sans corde à vide, on obtient les 7 motifs classiques.
- On monte les cordes en posant les N hauteurs cibles suivantes sur chaque corde.
- **Écart max** (`npsMaxSpan`, 5 par défaut) : si la note suivante est trop loin de la première note de la corde, on passe à la corde suivante. Avec des degrés espacés (1-2 : C D C D...), 3 notes par corde est impossible et chaque corde en reçoit 2 : c'est voulu.
- **Hauteur trop grave pour la corde courante** : on la laisse sur la corde précédente, pour ne pas trouer la ligne.
- **Rien ne tient sur une corde** (la note dépasse la case max) : on passe à la corde suivante au lieu d'arrêter, car une corde plus aiguë peut prendre la note plus bas sur le manche.
- Les notes nps ne sont jamais marquées en extension ; `candidates = notes`.

## Enchaînement

- **`single`** : le motif sur `positions[positionIndex]` (index borné).
- **`all`** : le motif sur chaque position, de la plus grave à la plus aiguë, avec entre deux : rien, une nouvelle mesure, ou une mesure de silence.
- **`bestPath`** : le motif est appliqué à **toutes les hauteurs** atteignables par les positions (réservoir de hauteurs), puis Viterbi choisit pour chaque note une position et un emplacement dans cette position. « CAGED + best path » veut donc dire traverser le manche de forme CAGED en forme CAGED.

### Modèle de coût (`cost.ts`, `bestPath.ts`)

États : (position, emplacement, longueur de la série de notes sur la même corde, plafonnée à `maxRun + 1`).

Coût d'une note :
- `extension` si la note est une extension ;
- `open` si c'est une corde à vide (négatif = préférer les cordes à vide) ;
- `highFret × case`, pour départager en faveur du bas du manche ;
- `runPenalty` si la série sur la même corde dépasse `maxRun` (`maxRun = 0` : pas de limite).

Coût d'un passage d'une note à la suivante :
- si on change de position : `positionChange + shift × d + jump × d²`, avec d = distance entre les centres des positions ;
- `stringChange` si on change de corde ;
- `stringSkip × (cordes sautées)` ;
- `backtrack` si on revient sur une corde plus grave alors que la mélodie monte (ou l'inverse).

### Pourquoi ces termes (historique du réglage)

Sur « gamme de C majeur, montée sur tout le manche, cases 0-15 » (`npm run peek -- --compare "deg=1,2,3,4,5,6,7&dir=up"`) :

1. **Coût linéaire seul** (`shift`, `positionChange`) : un seul grand saut coûte toujours moins cher que plusieurs petits glissements. Résultat : on monte en position 1, puis saut de la case 5 à la case 12. D'où **`jump` (quadratique)**, qui rend plusieurs petits glissements moins chers qu'un grand saut.
2. Avec `jump`, le chemin montait en position 1 puis **glissait 7 notes sur la corde de Mi aigu**. Doigté valide, mais pas une diagonale. D'où **`maxRun` / `runPenalty`**.
3. Les positions ne donnaient qu'un emplacement par hauteur (règle « cœur avant extension »), ce qui forçait parfois un retour sur la corde précédente (Si case 5 puis Sol case 10). D'où les **`candidates`** : le best path peut choisir l'autre emplacement d'une hauteur.
4. Il restait des allers-retours de corde. D'où **`backtrack`**.

Caractère attendu de chaque preset (à vérifier avec `peek --compare` après tout changement du modèle) :
- **stay** (« Rester en position ») : très peu de changements de position, quitte à faire un grand saut.
- **diagonal** : traversée régulière, au plus 4 notes par corde, pas de saut de plus de 5 cases, pas de retour sur une corde plus grave en montant (verrouillé par un test en box). En box et nps : diagonale propre à 4 notes par corde.
- **slide** (« Glisser le long du manche ») : peu de changements de corde, on glisse sur la corde.

## Motifs

Un motif ordonne une liste de notes triées par hauteur.
- **Montée / descente** : montée, descente, aller-retour, retour-aller. Par défaut, la note du demi-tour n'est pas doublée. En répétant un aller-retour, la note commune à deux tours n'est jouée qu'une fois.
- **Séquences** : un motif d'offsets déplacé le long de la liste (`0 1 2` sur C D E F : C D E, D E F). `pas` = décalage entre deux groupes. Offsets négatifs acceptés. En descente, on applique le même motif sur la liste inversée.
- **Aléatoire** : PRNG à graine (mulberry32) : même graine, même exercice. Options : pas deux fois la même note, saut max compté en rangs dans la liste.
- **Paires** : chaque note avec la note de référence la plus proche dans l'octave : au-dessus, en dessous, ou les deux ; référence puis intervalle ou l'inverse. Sans note de référence, la liste est jouée telle quelle.
- **Commencer et finir sur le degré de référence** : coupe la liste entre la première et la dernière note de référence.

## Rythme

- Une subdivision unique pour tout l'exercice. Le calcul se fait en ticks (noire = 48). Une subdivision n'est acceptée que si elle remplit exactement la mesure, et, pour les triolets, par groupes de 3 complets.
- Les dernières notes sont complétées par des silences de la même valeur (l'index des beats doit correspondre à `bars`). Une mesure entièrement silencieuse s'écrit avec un silence par temps.
