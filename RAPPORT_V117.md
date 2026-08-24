# Éclats Sauvages — Valdora V117 — Rapport de stabilisation

## Résultat

La V117 corrige les clignotements signalés dans les sanctuaires et dans le menu latéral. Le repaire du légendaire, les arbres, les décors thématiques et les commandes restent maintenant présents et stables pendant le déplacement. Les onze sanctuaires ont également été enrichis et différenciés.

## Causes trouvées

1. Le monde était dessiné simultanément par la boucle principale du jeu et par une seconde boucle lancée toutes les 90 ms par l’ancien module audio des biomes. Les deux images se remplaçaient et produisaient le clignotement.
2. Un ancien module V112 reconstruisait périodiquement les scènes légendaires, vidait certains arbres et remplaçait leurs thèmes. Le décor pouvait donc disparaître après son apparition.
3. Plusieurs générations du menu latéral imposaient en parallèle des règles opposées au Livret secret, au nom de la Carte du monde et aux outils Créateur.
4. Un ancien installateur musical ajoutait un bouton vide. Un autre module ajoutait tardivement la navigation Créateur, ce qui modifiait la hauteur du menu en cours de jeu.
5. Le repaire légendaire utilisait encore une variation d’opacité et d’ombre, visuellement proche d’une disparition dans certains décors.

## Systèmes réécrits ou consolidés

- Suppression de la seconde boucle de rendu ; le décor est uniquement dessiné dans la boucle principale du moteur.
- Configuration idempotente des scènes : les contrôles périodiques ne recréent plus les tableaux de décors.
- Protection des sanctuaires V117 contre les anciennes réécritures V112 et V115.
- Opacité et ombre fixes pour le repaire du légendaire.
- Gestionnaire unique et déterministe du menu latéral : ordre canonique, hauteur de ligne stable, suppression des entrées vides et écritures DOM uniquement quand elles sont nécessaires.
- Règle unifiée du Livret secret entre les versions Joueur et Créateur.
- Carte du monde verrouillée sur l’identité V117.
- Masquage de l’ancien panneau de routes qui se superposait au jeu.
- Audit V117 étendu au rendu, au menu, à la composition de chaque scène et à la persistance du repaire.

## Personnalisation des sanctuaires

Chaque sanctuaire possède désormais quatre familles d’éléments visuels propres, huit éléments majeurs autour de son aire centrale et douze accents secondaires.

| Sanctuaire | Environnement et familles d’assets |
| --- | --- |
| Nature — Sylvarion | forêt dense, racines, stèles végétales, vasques, lucioles |
| Feu — Pyralis | terre volcanique, obsidienne, braseros, lave, volcan |
| Eau — Aquarion | îlot marin, coraux, coquillages, vasques aquatiques |
| Orage — Fulgurys | sol rocailleux, paratonnerres, bobines, cristaux, rivière animée et pont |
| Vieille usine — Ferronox | générateurs, cuves, conduites et machines abandonnées |
| Roche — Terragorn | monolithes, cairns, blocs et relief minéral |
| Air — Aeralys | nuages, courants de vent, cristaux et structures aériennes |
| Spores — Mycoris | champignons géants, lanternes fongiques et sous-bois |
| Glace — Crysalune | arches gelées, aiguilles et cristaux de glace |
| Lumière — Soléclat | miroirs solaires, prismes et halos lumineux |
| Origine — Primordia | prismes, orbites d’énergie et architecture cosmique |

## Tests réalisés après correction

- Ouverture de `index.html` (Joueur) et `CREATEUR.html` (Créateur).
- Observation prolongée des menus : aucun ajout/retrait de case, aucun bouton vide et aucune alternance de libellé.
- Contrôle du Livret secret : visible en Créateur, caché en Joueur sans le troisième sceau.
- Inspection visuelle des onze sanctuaires et comparaison d’un même sanctuaire à plusieurs secondes d’intervalle.
- Contrôle des scènes Nature et Air : les tableaux d’arbres et de décors restent inchangés après les maintenances périodiques.
- Déplacement réel dans le sanctuaire Orage : la rivière bloque le joueur hors du pont et le pont permet la traversée.
- Interaction avec le repaire de Sylvarion puis lancement d’un vrai combat légendaire.
- Présence en combat des quatre attaques et de leurs PP, précision et puissance, ainsi que des commandes Sac, Orbes, Changer et Fuir.
- Audit automatique V117 : onze sanctuaires complets, menu stable, rendu principal unique, repaire à opacité fixe, 108 portails et 231 portes hérités détectés ; aucune anomalie remontée.
- Vérification syntaxique des scripts V112, V115 et V117.

## Non-régression et portée

Les moteurs historiques de progression, sauvegarde, combats ordinaires, boutiques, transports et bâtiments n’ont pas été réécrits par cette intervention : leurs comportements existants sont conservés. Les tests ont ciblé les systèmes touchés et leurs jonctions directes avec le monde, le déplacement, les collisions et le combat. Une campagne complète de bout en bout n’a pas été rejouée pour cette livraison ciblée.

## Fichiers principaux modifiés

- `game/VALDORA_SANCTUARIES_V117.js`
- `game/VALDORA_BIOMES_AUDIO_V115.js`
- `game/VALDORA_BIOMES_V112.js`
- `game/index.html`
- `game/CREATEUR.html`
- `README.txt`

## Conclusion

La V117 fournit des sanctuaires persistants, lisibles et nettement plus différenciés, tout en supprimant les deux courses concurrentes responsables du clignotement du monde et du menu.
