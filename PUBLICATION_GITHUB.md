# Mettre Éclats Sauvages — Valdora sur GitHub

## Ce que GitHub reçoit réellement

GitHub enregistre des **fichiers accompagnés de leur chemin**. Il ne reçoit pas un dossier vide, mais dès qu’un fichier porte le chemin `game/assets/image.png`, GitHub recrée automatiquement les dossiers `game` puis `assets`.

Il ne faut donc pas envoyer les 1 900 fichiers un par un dans le navigateur. Le lanceur fourni exécute `git add --all`, qui transmet tous les fichiers et toute leur nomenclature en une seule opération.

## Première publication

1. Connecte-toi à GitHub.
2. Crée un nouveau dépôt nommé par exemple `eclats-sauvages-valdora`.
3. Choisis **Private** pour que le code et les fichiers du jeu restent confidentiels.
4. Laisse le dépôt vide : ne demande pas à GitHub de créer un README, un `.gitignore` ou une licence.
5. Copie l’adresse HTTPS du dépôt, par exemple `https://github.com/mon-compte/eclats-sauvages-valdora.git`.
6. Dans le dossier du jeu, double-clique sur `PUBLIER_SUR_GITHUB.bat`.
7. Colle l’adresse du dépôt lorsque le programme la demande.
8. Saisis ton nom d’auteur et ton adresse Git uniquement si Git ne les connaît pas encore.
9. Laisse la publication se terminer. Le premier envoi contient environ 202 Mio et peut durer plusieurs minutes.

Le programme ne demande et n’enregistre aucun mot de passe ou jeton GitHub. L’authentification officielle de Git/GitHub s’ouvre séparément si elle est nécessaire.

## Conserver le jeu privé

Ne configure pas **Settings → Pages** : GitHub Pages sert à publier un site Web et ne doit pas être activé pour cette édition confidentielle.

Pour donner accès au projet à une personne précise :

1. Ouvre le dépôt sur GitHub.
2. Va dans **Settings → Collaborators**.
3. Choisis **Add people** et invite uniquement les personnes autorisées.

Une Release créée dans ce dépôt privé reste accessible uniquement aux personnes ayant accès au dépôt.

## Mettre le jeu à jour

Après une modification, relance simplement `PUBLIER_SUR_GITHUB.bat`. Le script détecte le dépôt existant, ajoute les fichiers modifiés, crée un nouveau commit puis publie la branche `main`.

## Créer une version téléchargeable

Le ZIP Windows final ne doit pas être placé dans les fichiers normaux du dépôt. Il est ignoré par `.gitignore`.

Pour le proposer aux joueurs :

1. Ouvre **Releases** sur GitHub.
2. Choisis **Draft a new release**.
3. Crée une étiquette comme `v118`.
4. Ajoute l’archive Windows dans la zone des pièces jointes de la Release.
5. Publie la Release.

Les Releases sont prévues pour les gros fichiers téléchargeables, tandis que le dépôt contient les fichiers sources et les assets individuels.

## En cas de problème

- « Git est introuvable » : installe Git for Windows ou GitHub Desktop, puis relance le script.
- « Repository not found » : vérifie l’adresse du dépôt et les droits du compte connecté.
- « Rejected / non-fast-forward » : le dépôt GitHub n’était probablement pas vide. Recrée un dépôt vide ou récupère d’abord son historique.
- GitHub Pages affiche une erreur : vérifie l’onglet **Actions**, puis lance `python outils/verifier_depot.py` localement.
