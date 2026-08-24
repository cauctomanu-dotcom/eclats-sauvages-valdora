# Éclats Sauvages — Valdora V118 — Rapport « Monde vivant »

## Résultat

La V118 corrige les superpositions, l’immobilité et la répétition des PNJ, repeuple les maisons et bâtiments publics, enrichit les villes de 60 activités secondaires et sécurise l’implantation des bâtiments par rapport aux routes. Les éditions Joueur et Créateur utilisent le même moteur final et conservent les systèmes déjà validés des versions précédentes.

## Problèmes trouvés

1. Plusieurs générations de populations pouvaient conserver des PNJ aux mêmes coordonnées, rendant certains personnages inaccessibles.
2. Une grande partie des habitants hérités n’avait aucune routine active ou perdait son moteur de déplacement après la réinstallation périodique d’un ancien module.
3. Les dialogues génériques utilisaient des banques trop petites et donnaient rapidement l’impression que tous les habitants répétaient la même phrase.
4. Le moteur d’intérieur ne créait généralement qu’un PNJ de service ; les maisons ordinaires paraissaient donc vides.
5. Le placement urbain n’avait pas de contrôle final commun pour repérer les bâtiments fortement engagés sur une route ou superposés entre eux.
6. Un premier branchement V118 du rendu pouvait être réenveloppé tardivement par deux anciens modules d’ambiance et former une récursion. Ce défaut, invisible sur l’écran-titre, a été découvert en entrant réellement en jeu puis supprimé à la source.
7. Plusieurs correctifs historiques tentaient encore d’accéder à d’anciennes fonctions privées et produisaient des avertissements sans interrompre la partie.

## Systèmes réécrits et consolidés

### Population extérieure

- Moteur unifié pour les 15 villes.
- 12 habitants dans une ville normale et 18 dans une grande ville, soit 210 habitants extérieurs.
- Conservation prioritaire des PNJ de quête et réduction des anciens remplissages redondants.
- Placement déterministe sur des emplacements piétons libres, à distance des routes dangereuses, bâtiments, arbres, sorties et autres personnes.
- Réparation automatique d’une superposition éventuelle pendant la partie.
- Routines locales avec destination, marche, orientation, pause, collision et immobilisation temporaire pendant une conversation.
- Mise en cache des emplacements piétons pour éviter les recalculs coûteux à chaque image.

### Dialogues et interactions

- Banque de 1 440 compositions uniques : 96 dialogues par ville.
- Variations selon la ville, le rôle du PNJ, la progression et le nombre de conversations.
- Une nouvelle interaction avec un même habitant fait avancer sa sélection de texte.
- Les interactions Team Taron, quêtes et événements spéciaux gardent la priorité lorsqu’elles sont encore actives.
- Ajout d’une réputation locale persistante fondée sur les habitants rencontrés, les visites et les discussions.

### Intérieurs habités

- Population créée à partir de la géométrie et du mobilier réels de la pièce.
- Maisons : 3 habitants mobiles.
- Résidences, musées, écoles, gares, hôtels, bibliothèques, restaurants, guildes et autres bâtiments publics : 3 à 5 résidents ou visiteurs selon le lieu.
- Les PNJ de service existants sont conservés.
- Les positions évitent le mobilier bloquant, la sortie et les autres personnes.
- Les résidents ont un nom, un rôle, une apparence, une routine de déplacement et des dialogues contextuels.

### Gameplay local

Quatre activités sont disponibles dans chacune des 15 villes :

1. Visages du quartier — rencontrer 5 habitants différents.
2. Porte à porte — visiter 3 intérieurs.
3. Chroniques vivantes — tenir 15 conversations.
4. Ami de la ville — atteindre un score local combinant rencontres, visites et discussions.

Le total atteint 60 activités persistantes avec récompenses en monnaie et objets. Ce contenu encourage à explorer les villes, entrer dans les maisons et revenir parler aux habitants sans bloquer l’histoire principale.

### Ambiance et implantation

- Particules colorées discrètes propres à chaque ville.
- Bulles d’émotion contextuelles au-dessus des habitants en pause.
- Indication stable « E / Entrée » près d’un interlocuteur.
- Audit et déplacement conservateur des bâtiments réellement engagés sur une route.
- Préservation des gares reliées aux voies et tolérance adaptée pour les parvis d’hôtels.
- Protection explicite du rendu et des interactions V118 contre les réinstallations tardives V107D, V112 et V113.
- Nettoyage des avertissements historiques V109W et déclassement des anciens diagnostics V111 en informations non bloquantes.

## Tests réalisés après correction

- Vérification syntaxique de `VALDORA_LIVING_WORLD_V118.js`, `VALDORA_SANCTUARIES_V117.js`, `V109W_CORRECTIFS_GAMEPLAY.js` et `VALDORA_PRO_V111.js`.
- Ouverture prolongée de `index.html` et `CREATEUR.html` après toutes les maintenances différées.
- Identité confirmée : V118 Joueur et V118 Créateur, Carte du monde V118 et menu Vie locale V118.
- Nouvelle partie rapide, saisie et confirmation du nom « Testeur », puis arrivée réelle à Clairval.
- Chargement d’une sauvegarde locale existante : retour réussi sur la Route 1 avec équipe, monnaie et progression restaurées.
- Entrée réelle dans une maison depuis l’outil Créateur : 3 résidents, 3 mobiles, jusqu’à 2 observés en déplacement simultané et 0 superposition.
- Deux interactions successives avec le même résident : deux dialogues différents affichés.
- Observation du rendu intérieur après plusieurs secondes : mobilier, héros et habitants restent visibles, sans récursion ni clignotement.
- Audit des 15 villes : population cible atteinte partout et 0 superposition détectée.
- Audit des bâtiments : 0 bâtiment restant sur une route selon le seuil final et 0 paire de bâtiments superposés.
- Audit des dialogues : 1 440 textes générés, 1 440 uniques.
- Audit des quatre branchements V118 : déplacement extérieur, interaction extérieure, interaction intérieure et animation du monde actifs.
- Audit des sanctuaires V117 conservé sans anomalie.
- Journaux des éditions Joueur et Créateur contrôlés dans des sessions neuves : aucune erreur et aucun avertissement.

## Non-régression et limites de vérification

Les combats, captures, transports, Codex, musiques, légendaires, missions principales et sanctuaires restent servis par leurs moteurs antérieurs, que V118 ne remplace pas. Leurs branchements communs avec l’interaction, le rendu, les bâtiments et la progression ont été conservés et les audits précédents restent valides.

Une campagne complète de plusieurs dizaines d’heures n’a pas été rejouée de bout en bout pour cette livraison. Les 60 activités ont été vérifiées structurellement et dans l’interface, mais leurs 60 remises de récompense n’ont pas toutes été accomplies manuellement. Tous les modèles de bâtiment n’ont pas été parcourus pièce par pièce ; le test manuel a porté sur une maison, complété par l’audit de population intérieure commun à toutes les catégories.

## Fichiers principaux modifiés

- `game/VALDORA_LIVING_WORLD_V118.js`
- `game/VALDORA_SANCTUARIES_V117.js`
- `game/V109W_CORRECTIFS_GAMEPLAY.js`
- `game/VALDORA_PRO_V111.js`
- `game/index.html`
- `game/CREATEUR.html`
- `README.txt`
- `LIRE_MOI_V118.txt`

## Conclusion

La V118 ne se contente pas d’ajouter quelques PNJ : elle fournit un moteur commun de population, dialogue, animation, interaction, exploration intérieure, activité locale et contrôle urbain. Le monde est plus dense et plus vivant, tout en restant stable et compatible avec les systèmes déjà présents.
