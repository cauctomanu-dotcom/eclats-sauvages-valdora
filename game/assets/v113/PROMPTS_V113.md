# Provenance des images V113

Mode utilisé : génération et édition avec l’outil intégré **ImageGen**. Les références sont toutes des fichiers locaux fournis avec le jeu. Les originaux n’ont pas été écrasés ; les résultats utilisent des noms versionnés V113.

## Joueur en bouée — face

Références : `SOURCE_HEROS_VALIDE.png`, `hero_down_idle_v102e.png`.

Consigne essentielle : produire le personnage exact de Valdora vu de face, conserver casquette rouge/blanche, cheveux noirs, manches rouges, haut blanc, sac bleu marine et proportions chibi 3D ; masquer entièrement jambes et pieds dans une bouée turquoise et jaune ; fond réellement transparent, sans eau ni décor.

Sortie : `player_buoy_front_v113.png`.

Une seconde édition ImageGen a retiré le faux damier et créé un canal alpha réel sans modifier le personnage.

## Joueur en bouée — profil droit

Références : `SOURCE_HEROS_VALIDE.png`, `player_buoy_front_v113.png`.

Consigne essentielle : même personnage et même bouée, profil strict à 90 degrés vers la droite, mêmes vêtements, couleurs, proportions et matières, jambes invisibles, fond transparent.

Sortie : `player_buoy_right_v113.png`. La vue gauche est obtenue en jeu par miroir horizontal de ce profil.

## Joueur en bouée — dos

Références : `SOURCE_HEROS_VALIDE.png`, `player_buoy_front_v113.png`, `player_buoy_right_v113.png`.

Consigne essentielle : même personnage directement vu de dos, casquette et sac bleu marine visibles, même bouée turquoise et jaune, jambes invisibles, fond transparent.

Sortie : `player_buoy_back_v113.png`.

## Nageur — profil droit

Références : `assets/v112/swimmer_npc_chibi3d_v112.png`, `SOURCE_PNJ_DIRECTIONNELS_HOMMES.png`.

Consigne essentielle : même nageur, cheveux bruns hérissés, lunettes bleues, haut bleu/orange, bouée turquoise à hibiscus blancs ; profil droit strict et fond transparent.

Sortie : `swimmer_npc_right_v113.png`. La vue gauche est obtenue par miroir horizontal.

## Nageur — dos

Références : `assets/v112/swimmer_npc_chibi3d_v112.png`, `swimmer_npc_right_v113.png`.

Consigne essentielle : même nageur directement vu de dos, conserver cheveux, lunettes, haut et motif hibiscus ; ne rien ajouter ; fond transparent.

Sortie : `swimmer_npc_back_v113.png`.

## Buisson chibi 3D

Références : `assets/v112/tree_chibi3d_v112.png`, `assets/v112/roadside_cluster_chibi3d_v112.png`.

Consigne essentielle : petit buisson isolé assorti au style végétal chibi 3D existant, feuilles émeraude et pointes vert clair, volumes lisibles, ombres douces, sans arbre, chemin ni décor, fond transparent.

Sortie : `bush_chibi3d_v113.png`.

## Citadelle du Cœur canonique

Références : `ASSETS_BATIMENTS_V103C/sceau_coeur_face.png`, `SOURCE_SANCTUAIRES_FACE_GAUCHE_DROITE_DERRIERE.jpeg`.

Consigne essentielle : la première référence commande strictement l’architecture ; conserver sanctuaire compact de pierre et de racines, arche centrale, sceau végétal vert, branches-racines ascendantes, mousse et deux cascades latérales ; utiliser la seconde uniquement pour la finition chibi 3D ; ne pas transformer le bâtiment en château différent.

Sortie : `citadelle_coeur_canon_v113.png`.

Une seconde édition ImageGen a remplacé le faux damier par une vraie transparence sans modifier le bâtiment.

