# Éclats Sauvages — Valdora V114 Routes & Biomes

Date de validation : 23 août 2026

## Résultat

La V114 corrige les régressions signalées autour de la Route 4 bis, des sorties de carte et des bâtiments. Elle remplace aussi le rendu faible des sols et la distribution fragile des décors par un système commun aux éditions Joueur et Créateur.

Audit final après chargement tardif : **0 anomalie V114**, 108 portails contrôlés, 231 accès de bâtiments contrôlés, 48 scènes décorées, 7 ressources graphiques chargées et 4 moteurs V114 actifs (déplacement, collision, portail, interaction).

## Problèmes trouvés

- À Soléria, la Route 4 bis et la Passe de Soléria pouvaient occuper le même côté et conduire vers la mauvaise liaison.
- Certains portails avaient une zone logique décalée par rapport au ruban visible de la route.
- Les voies ferrées et leurs quais coupaient physiquement des corridors de sortie.
- Plusieurs couches historiques pouvaient remplacer tardivement les fonctions de déplacement, collision ou interaction.
- Deux enveloppeurs historiques pouvaient se rappeler mutuellement et provoquer une récursion lors d’un déplacement ou d’une interaction ordinaires.
- Les portes dépendaient d’une détection ancienne et trop étroite.
- Le sol herbeux, les routes et certains décors n’étaient pas suffisamment cohérents avec le style chibi 3D.
- Des accessoires de biome pouvaient être placés trop près d’une route ou d’une voie ferrée.

## Systèmes réécrits

- `game/VALDORA_ROUTES_BIOMES_V114.js` devient la couche finale commune et maintenable.
- Topologie canonique bidirectionnelle et création sécurisée de la Route 4 bis si elle manque.
- Affectation déterministe de côtés et de créneaux distincts pour les portails d’une même carte.
- Raccordement de chaque portail à une cellule réelle du réseau routier.
- Corridors de sortie continus, y compris au passage d’une voie ferrée.
- Déplacement extérieur autonome V114 ; il ne rappelle plus l’ancienne chaîne circulaire.
- Collision extérieure autonome : limites, bâtiments, arbres, obstacles, PNJ, dresseurs, Team Taron, train, arrêts de bus et corridors.
- Interaction extérieure autonome : bâtiments, PNJ, missions, Team Taron, dresseurs, objets fouillables, bus et autel final.
- Zones de portes élargies entre le seuil réel et la route.
- Placement déterministe de la végétation et des accessoires avec distances de sécurité autour des routes, sorties, bâtiments et rails.
- Audit automatique qui vérifie aussi que les quatre moteurs actifs sont bien ceux de la V114.

## Graphismes V114

Cinq nouvelles ressources ont été produites avec le générateur d’images intégré puis intégrées dans `game/assets/v114/` :

- herbe chibi 3D répétable — 1254 × 1254 ;
- pavés de ville chibi 3D répétables — 1254 × 1254 ;
- chemin de terre chibi 3D répétable — 1254 × 1254 ;
- touffe de hautes herbes transparente — 1536 × 1024 ;
- atlas transparent de huit familles d’accessoires de biomes — 1536 × 1024.

Les arbres V112 et buissons V113 de bonne qualité ont été conservés. Les nouvelles règles les placent en bordure et jamais au milieu du chemin.

## Tests interactifs effectués

- Chargement prolongé des éditions Joueur et Créateur, avec contrôle des modules qui se réinstallent tardivement.
- Identité visuelle V114, titre de fenêtre et bouton « Carte du monde V114 ».
- Nouvelle partie, choix du niveau de tutoriel, saisie et confirmation du nom `TestV114`.
- Affichage initial de Clairval et déplacement extérieur ordinaire.
- Soléria → Route 4 bis, avec fermeture normale de l’événement Team Taron rencontré sur le trajet.
- Route 4 bis → Soléria.
- Belrive → Route 4 bis.
- Route 4 bis → Belrive.
- Vérification visuelle des sorties : le joueur reste dans l’axe central de la route.
- Traversée des rails à Soléria et Belrive dans les corridors autorisés.
- Entrée dans le laboratoire de Clairval.
- Entrée dans le musée de Soléria.
- Interaction avec la directrice du musée ; menus Missions, Réapprendre et Attaques refusées affichés.
- Déplacement hors porte puis interaction à vide, afin de vérifier l’absence de récursion.
- Contrôle visuel de l’herbe, des pavés, des arbres, des buissons et de l’absence d’accessoire sur les rails.
- Contrôle des journaux des deux éditions : aucune erreur d’exécution sur la révision finale.
- Contrôle syntaxique du module V114.

## Contrôles automatiques finaux

- Portails : 108, tous raccordés et dotés d’un retour lorsque la destination existe.
- Accès bâtiments : 231, zones de portes valides.
- Soléria : lac au sud, Passe de Soléria au nord.
- Biomes aménagés : 48.
- Ressources graphiques : 7/7 chargées.
- Moteurs V114 : déplacement, collision, portail et interaction actifs.
- Éditions Joueur et Créateur : audit vert, aucune erreur d’exécution.

## Compatibilité et limites du contrôle

Les combats, captures, progression, Livret secret, transports, boutiques, centres de soins, Codex, évolutions, légendaires et musiques restent fournis par les systèmes V109 à V113 déjà présents. La V114 ne remplace pas leur logique métier ; elle empêche ses réécritures de routes et de collisions de les court-circuiter.

Le cycle V114 a rejoué les parcours touchés et un contrôle global de démarrage. Il n’a pas rejoué manuellement, du début à la fin, les dizaines d’heures nécessaires pour chaque combat, mission, évolution, légendaire et trajet de l’aventure. L’import/export d’un fichier `.valdora` doit également être essayé dans le navigateur Windows réel du joueur, car le navigateur de validation automatisé ne reproduit pas exactement les autorisations de téléchargement choisies par l’utilisateur.
