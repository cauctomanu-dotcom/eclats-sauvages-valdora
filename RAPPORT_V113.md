# Éclats Sauvages — Valdora V113 Professionnel

## Résultat

Cette édition V113 remplace les dernières couches graphiques 2D visibles du monde par un rendu chibi 3D cohérent, rétablit la Citadelle du Cœur à partir du visuel canonique fourni, ajoute les quatre orientations aquatiques du joueur et des nageurs, répare définitivement l’interaction du directeur de musée et remplace la musique répétitive par un moteur musical adaptatif multicouche.

Deux éditions sont incluses et testées :

- `game/index.html` — version joueur ;
- `game/CREATEUR.html` — version créateur, avec navigation totale et bouton **Aperçu musée V113**.

## Problèmes trouvés et éléments réécrits

### Joueur et PNJ en bouée

- Le joueur utilisait une seule illustration et l’ancien héros restait visible sous la couche aquatique.
- Les PNJ utilisaient la même vue de face, quelle que soit leur direction.
- Réécriture : moteur aquatique V113 couvrant proprement l’ancien rendu, avec vues face, droite, gauche par miroir fidèle et dos.
- Le joueur reprend les signes visuels du modèle source : casquette rouge et blanche, cheveux noirs, manches rouges, haut blanc et sac bleu marine.
- Les pieds et les jambes sont toujours masqués par la bouée.
- Les couleurs artificielles qui pouvaient teinter la peau des nageurs ont été supprimées.

### Sols, rues, routes, herbes, arbres et buissons

- Les anciens arbres 2D étaient encore dessinés par le moteur principal sous la couche V112.
- Les petits buissons étaient encore des assemblages de cercles plats.
- Les rues et routes utilisaient des aplats et des traits répétitifs.
- Réécriture à la source des fonctions de rendu : sol végétal texturé, variations lumineuses, rues minérales avec bordures et pavés, chemins de terre avec relief et petits cailloux, hautes herbes ombrées, arbres chibi 3D et buissons chibi 3D.
- Les arbres et buissons restent placés en dehors du réseau routier grâce à la géométrie existante ; les collisions et raccords ne sont pas modifiés.
- Port-Écume conserve une vraie plage, une promenade, des parasols et une mer animée.

### Citadelle du Cœur

- L’ancien rendu final était un parvis procédural gris qui ne reprenait pas le design fourni.
- La référence canonique retrouvée est `game/ASSETS_BATIMENTS_V103C/sceau_coeur_face.png`.
- Réécriture : façade chibi 3D fidèle au sanctuaire enraciné, avec arche de pierre, sceau végétal central, racines ascendantes et cascades latérales.
- Le parvis, les arbres, les pavés, la barrière de progression et la position du Maître du Cœur ont été réaccordés au nouveau décor sans modifier les conditions de progression.

### Directeur du musée

- Cause réelle : lorsqu’un bureau était plus proche que le directeur, l’ancien moteur choisissait le meuble comme cible et empêchait l’ouverture du menu du PNJ.
- Réécriture : priorité d’interaction musée au dernier niveau du moteur, compatible avec les deux moteurs d’intérieur encore nécessaires au projet.
- Test réel validé avec la Directrice Cassandre : le menu **Direction du musée** s’ouvre et propose Missions du musée, Réapprendre et Attaques refusées.

### Musique

- L’ancienne musique reposait sur des boucles d’oscillateur courtes et mécaniques.
- Réécriture complète en moteur WebAudio adaptatif hors ligne : accords, basse, arpèges, mélodie, filtres, nappes, percussions, compression et transitions de zone.
- 13 directions musicales : prairie, forêt, eau/littoral, montagne, ombre, ville moderne, industriel, aube, Citadelle, sauvage, dresseur, Team Taron et Gardien.
- Le tempo, l’instrumentation et l’intensité changent selon ville, route, biome et catégorie de combat.
- L’interrupteur Musique ON/OFF a été testé dans les deux sens.

### Stabilité de version

- Un ancien observateur d’interface réimposait périodiquement le nom V112.
- Il a été réécrit pour verrouiller correctement **V113 Professionnel** dans les éditions joueur et créateur.
- Le bouton et l’en-tête de la carte indiquent désormais V113.

## Tests effectués

- Chargement complet joueur et créateur : OK.
- Nouvelle partie, choix du mode de départ, saisie et confirmation du nom : OK.
- Affichage et déplacement à Clairval : OK.
- Sol, rue, haute herbe, arbres et buissons V113 : contrôle visuel OK.
- Lac des Reflets : décor, six PNJ, quatre dresseurs et joueur : OK.
- Orientation joueur face/droite/gauche/dos : OK.
- Orientation nageurs selon le déplacement : OK.
- Citadelle canonique et parvis : contrôle visuel et déplacement d’approche OK.
- Directeur de musée : interaction réelle au clavier et ouverture du menu complet OK.
- Musique ON/OFF et priorité du moteur monde/combat : OK.
- Carte du monde et navigation créateur : OK.
- Audit global V112 repris après la V113 : **0 problème**.
- 50 scènes, 169 créatures, 288 attaques, 20 liaisons canoniques, 11 biomes légendaires : présents.
- Sauvegarde, chargement, combats, codex, boutique, soins, objectifs, sac, PC, transports et Livret secret : points d’entrée toujours disponibles.
- Tous les assets V113 sont chargés avec transparence réelle : OK.

## Éléments non vérifiables automatiquement

- La qualité musicale subjective dépend des enceintes, du volume et des goûts du joueur. Le moteur, ses 13 thèmes, ses transitions et l’interrupteur ont été vérifiés, mais un équilibrage final à l’oreille sur plusieurs appareils reste recommandé.
- Cette passe ciblée n’a pas rejoué manuellement l’intégralité de chaque combat, mission et trajet déjà validés en V112 ; leur non-régression a été contrôlée par l’audit global et par la conservation de leurs moteurs.

## Fichiers principaux ajoutés

- `game/VALDORA_POLISH_V113.js`
- `game/assets/v113/player_buoy_front_v113.png`
- `game/assets/v113/player_buoy_right_v113.png`
- `game/assets/v113/player_buoy_back_v113.png`
- `game/assets/v113/swimmer_npc_right_v113.png`
- `game/assets/v113/swimmer_npc_back_v113.png`
- `game/assets/v113/bush_chibi3d_v113.png`
- `game/assets/v113/citadelle_coeur_canon_v113.png`
- `game/assets/v113/PROMPTS_V113.md`

