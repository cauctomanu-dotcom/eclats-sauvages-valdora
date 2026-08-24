# Éclats Sauvages — Valdora V115 — rapport de validation

## Objectif de la version

La V115 reprend la V114 validée et réécrit les trois systèmes concernés par le retour joueur : le déplacement visuel des textures, l’identité des biomes légendaires et la direction musicale.

## Problèmes trouvés

1. Le matériau de route était créé depuis l’origine de l’écran. Pendant le déplacement de la caméra, le chemin se déplaçait mais son motif restait dans le repère de l’écran, produisant un effet de texture qui nage.
2. Le sol d’herbe utilisait un décalage de fond difficile à distinguer d’un parallaxe. Le motif pouvait donner l’impression que toute la couche se déplaçait indépendamment du monde.
3. Les onze biomes légendaires partageaient des accessoires génériques recolorés. Leur identité reposait surtout sur une teinte et non sur un environnement construit.
4. Le Plateau des Orages affichait encore les anciens accessoires « nuage + éclair » de la V112.
5. L’Usine du Néant utilisait surtout une ambiance sombre, sans véritable équipement industriel abandonné.
6. Le moteur musical antérieur employait des sons courts et plusieurs formes d’onde typées rétro. Plusieurs biomes partageaient aussi le même thème général.

## Systèmes réécrits

### Sols et routes

- Les tuiles de sol sont calculées depuis les coordonnées absolues du monde.
- Le motif de route reçoit une transformation compensant exactement la position de la caméra.
- Les textures restent donc attachées au terrain pendant que le personnage et la caméra se déplacent.
- Les ombres, bordures et reflets de chemin sont conservés sans couche de motif flottante.
- Les sols légendaires ne réutilisent plus l’herbe générale : ils sont générés par des matériaux stables propres au lieu.

### Onze biomes légendaires

| Zone | Sol et environnement | Effet vivant | Musique |
|---|---|---|---|
| Forêt Primordiale | mousse, racines monumentales, fougères, pierre ancienne | lucioles et particules végétales | Canopée vivante |
| Caldeira des Braises | basalte, lave, obsidienne, évent volcanique | braises ascendantes | Cœur magmatique |
| Île des Marées | eau turquoise, roches coralliennes, bassin de marée | reflets et ondulations | Respiration des marées |
| Plateau des Orages | dalles de basalte humide, paratonnerres, impacts, cristaux chargés | véritable éclair ramifié et double flash blanc | Front électrique |
| Usine du Néant | béton fissuré, turbine, tuyaux, rouille, marquages de sécurité | vapeur, lampe instable et nappe d’ombre violette | Machines du Néant |
| Canyon des Monolithes | sable ocre, strates, arches et monolithes | poussière minérale | Mémoire des monolithes |
| Falaises Célestes | pierre blanche, îlots flottants, rubans, fleurs alpines | particules portées par le vent | Au-dessus des nuages |
| Marais Mycélien | eau sombre, racines et champignons bioluminescents | spores cyan et violettes | Réseau mycélien |
| Glacier des Échos | neige, glace facettée, cristaux et grotte gelée | éclats et neige fine | Échos de glace |
| Observatoire Solaire | pierre blanche, cuivre, lentilles et anneaux astronomiques | halo solaire animé | Orbites solaires |
| Sanctuaire des Origines | autel minéral équilibré et motifs élémentaires | orbites lentes et motes multicolores | Équilibre originel |

Le Carrefour des Sanctuaires bénéficie en plus d’un portail monumental et d’un profil musical « Convergence ».

### Musique moderne

Le moteur musical a été remplacé par un séquenceur Web Audio atmosphérique :

- 24 profils au total, dont 11 profils légendaires individuels ;
- nappes à attaque lente, doubles oscillateurs doux, basses rondes et motifs espacés ;
- réverbération stéréo, délai léger, filtrage et compression dynamique ;
- textures de vent, d’eau, de spores, de tonnerre et de mécanique selon le lieu ;
- transitions automatiques lors du changement de zone ou de combat ;
- thèmes modernes conservés pour les combats sauvages, dresseurs, Team Taron et gardiens ;
- aucune onde carrée ni dent-de-scie dans le moteur V115.

## Tests effectués

### Versions et lancement

- version Créateur chargée : identité V115, carte V115 et sélecteur de biomes présents ;
- version Joueur chargée puis partie continuée à Clairval ;
- l’outil de prévisualisation V115 est absent de la version Joueur ;
- aucune erreur de console dans les deux versions.

### Rendu et déplacement

- Route 1 ouverte dans l’outil Créateur ;
- dialogue de route fermé puis 32 déplacements vers la droite ;
- caméra, décors, sol et texture de chemin contrôlés avant/après ;
- le matériau reste attaché aux coordonnées du monde, sans glissement indépendant.

### Biomes

- les onze biomes ont été ouverts un par un ;
- onze signatures d’image distinctes ont été obtenues ;
- chaque nom de zone est présent et chaque environnement possède cinq groupes d’assets dédiés ;
- Plateau des Orages : ancien nuage supprimé, éclair ramifié et flash blanc observés en situation ;
- Usine du Néant : turbine, canalisations, béton, rouille, sécurité et ombre animée observés ;
- Observatoire Solaire et Usine du Néant : changement de profil musical vérifié en temps réel.

### Audio

- contexte audio : `running` après interaction joueur ;
- ordonnanceur : actif ;
- profil Observatoire : `legend_lumiere` / « Orbites solaires » ;
- profil Usine : `legend_ombre` / « Machines du Néant » ;
- 11 profils légendaires présents, 24 profils complets présents.

### Non-régression V114

- audit V115 : 0 problème ;
- audit de base V114 : 0 problème ;
- 108 portails réciproques et alignés ;
- 231 portes de bâtiments valides ;
- déplacements, collisions, sorties et interactions toujours branchés ;
- les 6 assets V115/V114 nécessaires au nouveau rendu sont chargés.

## Éléments non vérifiables automatiquement

- Le goût musical reste subjectif. Le moteur a été écouté et contrôlé dans le navigateur, mais un mastering final doit idéalement être validé sur casque, haut-parleurs et plusieurs niveaux de volume.
- Les nouveaux décors sont des assets 2D pré-rendus en style chibi 3D. Ils produisent un rendu 3D cohérent dans le jeu, mais ne sont pas des modèles polygonaux manipulables par une caméra 3D.
- Un parcours intégral de plusieurs heures avec toutes les sauvegardes historiques n’a pas été rejoué dans cette itération ; les systèmes non modifiés restent couverts par l’audit de non-régression V114 et les tests précédents.

## Fichiers principaux

- `game/VALDORA_BIOMES_AUDIO_V115.js`
- `game/assets/v115/legend_elemental_atlas_chibi3d_v115.png`
- `game/assets/v115/legend_darkwild_atlas_chibi3d_v115.png`
- `game/assets/v115/legend_celestial_atlas_chibi3d_v115.png`
- `game/index.html`
- `game/CREATEUR.html`
