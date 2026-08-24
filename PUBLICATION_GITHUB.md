# Mettre Éclats Sauvages — Valdora sur GitHub

## Ce que GitHub reçoit réellement

GitHub enregistre des **fichiers accompagnés de leur chemin**. Il ne reçoit pas un dossier vide, mais dès qu’un fichier porte le chemin `game/assets/image.png`, GitHub recrée automatiquement les dossiers `game` puis `assets`.

Il ne faut donc pas envoyer les 1 900 fichiers un par un dans le navigateur. Le lanceur fourni exécute `git add --all`, qui transmet tous les fichiers et toute leur nomenclature en une seule opération.

## Adresse du jeu

La version Web est publiée automatiquement à cette adresse :

**https://cauctomanu-dotcom.github.io/eclats-sauvages-valdora/**

Chaque publication sur la branche `main` déclenche la vérification du dépôt puis la mise en ligne du contenu de `game/` avec GitHub Pages.

## Installer sur iPhone

1. Ouvre l’adresse du jeu dans **Safari**.
2. Touche le bouton **Partager** (le carré avec une flèche vers le haut).
3. Choisis **Sur l’écran d’accueil**.
4. Touche **Ajouter**.
5. Lance ensuite **Valdora** depuis son icône, comme une application.

Le mode paysage est recommandé. Les commandes tactiles apparaissent automatiquement ; le bouton **MENU** ouvre les objectifs, l’équipe, le Codex, la carte, le sac et la sauvegarde.

## Première publication du dépôt

1. Connecte-toi à GitHub.
2. Crée un nouveau dépôt nommé par exemple `eclats-sauvages-valdora`.
3. Choisis **Public** pour permettre l’accès à GitHub Pages et partager le jeu avec un simple lien.
4. Laisse le dépôt vide : ne demande pas à GitHub de créer un README, un `.gitignore` ou une licence.
5. Copie l’adresse HTTPS du dépôt, par exemple `https://github.com/mon-compte/eclats-sauvages-valdora.git`.
6. Dans le dossier du jeu, double-clique sur `PUBLIER_SUR_GITHUB.bat`.
7. Colle l’adresse du dépôt lorsque le programme la demande.
8. Saisis ton nom d’auteur et ton adresse Git uniquement si Git ne les connaît pas encore.
9. Laisse la publication se terminer. Le premier envoi contient environ 202 Mio et peut durer plusieurs minutes.

Le programme ne demande et n’enregistre aucun mot de passe ou jeton GitHub. L’authentification officielle de Git/GitHub s’ouvre séparément si elle est nécessaire.

## Activer GitHub Pages

1. Ouvre le dépôt sur GitHub.
2. Va dans **Settings → Pages**.
3. Dans **Build and deployment**, sélectionne **GitHub Actions** comme source.
4. Ouvre l’onglet **Actions** et attends la fin de l’action **Publier le jeu Web**.
5. Ouvre l’adresse indiquée plus haut.

Cette opération n’est nécessaire qu’une seule fois. Les mises à jour suivantes sont publiées automatiquement.

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

Les Releases restent utiles pour proposer l’archive Windows. Les joueurs sur iPhone ou dans un navigateur utilisent directement l’adresse GitHub Pages.

## En cas de problème

- « Git est introuvable » : installe Git for Windows ou GitHub Desktop, puis relance le script.
- « Repository not found » : vérifie l’adresse du dépôt et les droits du compte connecté.
- « Rejected / non-fast-forward » : le dépôt GitHub n’était probablement pas vide. Recrée un dépôt vide ou récupère d’abord son historique.
- GitHub Pages affiche une erreur : vérifie l’onglet **Actions**, puis lance `python outils/verifier_depot.py` localement.
