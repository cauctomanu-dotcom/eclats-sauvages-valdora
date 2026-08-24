ÉCLATS SAUVAGES — VALDORA V118 MONDE VIVANT

Ce bloc V118 remplace les consignes historiques placées plus bas.

LANCEMENT
1. Décompresse entièrement le ZIP.
2. Double-clique sur JOUER_VALDORA.bat pour jouer.
3. Double-clique sur CREATOR_VALDORA.bat pour ouvrir l’édition Créateur.

La V118 transforme les villes et les intérieurs en monde vivant : 210 habitants extérieurs répartis sans superposition, PNJ mobiles dans toutes les villes, maisons et bâtiments peuplés, 1 440 dialogues contextuels uniques, 60 activités locales, animations ambiantes et implantation urbaine contrôlée. Les acquis V114 à V117 sont conservés. Consulte LIRE_MOI_V118.txt et RAPPORT_V118.md pour le détail.

Pour conserver une partie entre deux versions, exporte ton fichier .valdora puis importe-le depuis l’écran d’accueil.

======================================================================
HISTORIQUE DES VERSIONS ANTÉRIEURES
======================================================================

ÉCLATS SAUVAGES — VALDORA V107Z

SAUVEGARDE — SYSTÈME SIMPLE PAR TÉLÉCHARGEMENT
- Cliquer sur Sauvegarder télécharge immédiatement un fichier .valdora.
- Le fichier arrive dans le dossier de téléchargement configuré dans le navigateur (généralement Téléchargements).
- Aucun AppData, aucune jonction, aucun serveur local et aucun dossier de sauvegarde à sélectionner.
- Pour reprendre une partie, cliquer sur Continuer puis choisir le fichier .valdora voulu.
- Les sauvegardes automatiques disque/navigateur sont désactivées : penser à cliquer sur Sauvegarder avant de quitter.


=== V107Y — SAUVEGARDES PERMANENTES APPDATA ===
Le serveur local PowerShell reste supprimé : Valdora fonctionne hors ligne, sans port local et sans connexion Internet.
Les vraies sauvegardes Windows sont maintenant stockées hors du dossier du jeu :
Au premier enregistrement ou chargement, le navigateur peut demander d'autoriser le sous-dossier joueur ou createur.

Les sections ci-dessous décrivent l'historique des versions précédentes ; en cas de contradiction, les règles V107Y ci-dessus sont prioritaires.

VALDORA V107R — SIX DRAGONS + STARTER SCHNECK
ÉCLATS SAUVAGES — VALDORA V107H — ANIMATIONS DE TRANSPORT

Nouveautés V107H :
- Animation Vol : le symbole d'aile est remplacé par Aeroex, créature de type Air du jeu, affichée de profil droit et volant de gauche vers la droite.
- Animation Bus : le simple emoji est remplacé par un bus Valdora original en style chibi 3D, orienté vers la droite et avançant de gauche vers la droite.
- Ajout de légers effets de vitesse et de flottement pour rendre les deux transitions plus vivantes.
- Aucun changement au moteur de déplacement, aux collisions ni aux entrées de bâtiments.

ÉCLATS SAUVAGES — VALDORA V107F (REBASE V107E)

Cette version repart directement de V107E.
Le moteur de déplacement, les PNJ, les collisions de monde et les entrées de bâtiments de V107E sont conservés.
Les nouveautés V107F sont ajoutées sans remplacer ces moteurs :
- choix du niveau de tutoriel + prologue narratif ;
- menu AIDE ;
- menu SAUVEGARDE et import/export .valdora ;
- légendaires présents dans le PC en mode Créateur ;
- mobilier/arrêts/visuels déjà présents dans la base V107E conservés ;
- package nettoyé des anciens rapports/validations non nécessaires.

Lancer JOUER_VALDORA.bat pour le jeu normal.
Lancer CREATOR_VALDORA.bat pour la version Créateur.

=== V107G — DIDACTICIEL CLAIRVAL ===
- Didacticiel de départ enrichi : déplacements, interactions, quêtes, combats, capture, équipe/PC, inventaire, carte, bus, centres de soins et sauvegardes.
- Clairval signale désormais clairement ses hautes herbes d'entraînement.
- Condition de sortie vers la Route 1 (version Joueur) : au moins 3 créatures dans l'équipe, chacune entre les niveaux 10 et 12 inclus, en plus du parcours de départ déjà requis.
- Le mode Créateur conserve son contournement des barrières de progression pour faciliter les tests.
- Le moteur de déplacement, les collisions de base et les entrées de bâtiments issus de V107E n'ont pas été modifiés.

V107I — BUS OFFICIEL FLUO VAL D'ORA
- L'animation de bus utilise désormais le modèle officiel validé par Manu : Iveco Crossway-inspired Fluo Val d'Ora.
- Le PNG transparent est intégré sans redessin ni modification de la livrée.
- Sens de déplacement de l'animation : gauche vers droite.

=== V107J — VERROUS DE PROGRESSION ===
- Correction racine de la détection Joueur/Créateur : la fonction globale creatorMode() ne peut plus faire passer la version Joueur en mode Créateur par erreur.
- Clairval -> Route 1 est désormais réellement bloquée tant que toutes les conditions ne sont pas réunies.
- Condition d'équipe : au moins 3 créatures de l'équipe doivent être entre les niveaux 10 et 12 inclus.
- Les missions obligatoires de Clairval restent également requises.
- Une seconde barrière protège directement enterZone afin qu'aucun appel de transition ne puisse contourner le verrou.
- Le mode Créateur conserve volontairement son contournement des verrous pour les tests.



V107K — progression et noms
- Verrou central appliqué au portail réellement utilisé par le moteur V78.
- Missions obligatoires de la ville à terminer avant toute nouvelle progression.
- Clairval : 3 créatures niveau 10 à 12 inclus + missions obligatoires.
- Routes : dresseurs obligatoires avant la ville suivante.
- 161 créatures renommées, IDs/sprites/sauvegardes conservés.


V107L — COHÉRENCE DES TYPES D’ÉVOLUTION
Tous les stades d’une même famille gardent strictement le type du premier stade. Aucune exception.


V107M — PERSONNALISATION DU JOUEUR
- Nouvelle partie : choix libre du nom du personnage (1 à 16 caractères).
- Le nom est sauvegardé, chargé et importé avec la partie.
- Journal et certains dialogues utilisent le nom choisi.
- Export .valdora : le nom du personnage est inclus dans le nom du fichier.
- Sauvegardes anciennes compatibles : « Dresseur » si aucun nom n’est présent.

=== V107P — NIVEAUX DES HAUTES HERBES DE CLAIRVAL ===
- Les Éclats sauvages rencontrés dans les hautes herbes de Clairval sont désormais générés uniquement entre les niveaux 2 et 5.
- Aucun Éclat sauvage de Clairval ne peut dépasser le niveau 5.
- Les niveaux des autres routes, biomes et zones du jeu ne sont pas modifiés.
- La règle est appliquée dans les versions Joueur et Créateur.



=== V107Q — SAUVEGARDE WINDOWS FIABLE ===
- Correction de la régression qui pouvait casser l’export .valdora après l’ajout du nom du joueur.
- La version Créateur utilise ses propres fichiers Valdora_Createur.valdora et Valdora_Createur_backup.valdora.
- Le menu SAUVEGARDE propose aussi « Choisir l’emplacement » pour enregistrer un .valdora à l’endroit choisi par le joueur.
- Si l’écriture directe Windows est indisponible, le téléchargement du fichier .valdora est conservé comme solution de secours.
- Les copies localStorage / IndexedDB restent actives en complément.
