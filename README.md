# birdfile

Fiche photo et son d'un oiseau en main, liée à son numéro de bague. Tout reste sur l'appareil, hors ligne.

## Installer

Avant le terrain, une seule fois, avec du réseau ou le câble. Ensuite l'icône marche sans le PC, y compris en mode avion.

Chrome Android. Menu Chrome, Ajouter à l'écran d'accueil. L'icône s'appelle Bagues. Ce geste n'est pas un bouton de la page : Chrome le range dans son menu.

Pour l'essai sur son propre téléphone, câble et débogage USB :

```
python servir.py
```

Chrome ouvre `http://127.0.0.1:8080`. `localhost` sur le même port est un autre site : les photos de l'un ne sont pas dans l'autre. Garder l'adresse de l'icône.

Le script n'écoute que sur cet ordinateur. Il ne contient pas les oiseaux. Chrome peut tenter une adresse https, échouer, puis charger la page en http. Une fois l'icône ajoutée, Ctrl+C : elle reste utilisable.

## Fiche

Le numéro de bague accepte les lettres. Il avance de 1 ou de 10. Contrôle met la série de côté, pour une bague étrangère. Retour à la série reprend le numéro et l'espèce laissés, sans avancer. L'espèce est facultative.

Sur la fiche, une recherche puis un appui ajoutent l'espèce. La recherche se bloque. Retirer l'espèce la débloque. L'onglet Code est une recherche seule, pour le bordereau : les lignes ne sont pas des boutons. Le latin est en petit sous le nom. Il n'y a pas de nom anglais dans la liste.

Une bague déjà enregistrée se rouvre avec son espèce, même si elle a été retirée. Une bague neuve, sans photo ni audio, garde l'espèce de la série jusqu'à ce retrait.

Sans espèce, les sept vues sont là : tête, dessus, croupion, aile droite, queue, profil, face. Avec une espèce, restent les vues de son protocole, plus celles déjà prises. Ajouter photos n'apparaît que si l'espèce n'a pas de série de vues. Il ouvre ces sept vues. Reprendre une vue la remplace.

La photo se prend à l'horizontale. Le cadre 4:3 occupe toute la hauteur. Le déclencheur est à droite. Le zoom doit être à 1.

Ajouter audio démarre le son. Si l'espèce demande un cri au relâché, le bouton le dit. Un son déjà gardé propose Refaire l'audio.

Choisir une espèce n'écrit pas la fiche. Elle est écrite en gardant une photo, ou en arrêtant un audio.

## Export

Télécharger le ZIP. Un dossier par bague, les JPEG, le son, et `index.csv`.

Colonnes, séparées par des points-virgules :

`bague;code;nom;latin;controle;vue;fichier;largeur;hauteur;zoom;prise;duree_s`

`controle` vaut `oui` pour un contrôle, sinon il est vide. `vue` est le nom du fichier (`tete`, `aile`, `cri`). `duree_s` ne concerne que le son. Si le téléphone n'a pas indiqué le zoom, la cellule contient `non lu`. Si l'espèce a été retirée, `code`, `nom` et `latin` sont vides : l'ancien nom ne reste pas. Un code encore présent retrouve le nom et le latin dans la liste au moment de l'export.

Le commentaire JPEG contient la bague, le code et la vue. L'aile droite est écrite `AILE_DROITE`. Le son contient la bague et le code. L'export réécrit ces textes avec l'espèce en cours, pas avec celle du moment de la prise.

Tout effacer ouvre deux écrans rouges, calés sur la zone visible. Le premier bouton, Effacer, est en haut à gauche. Le second, Effacer définitivement, est en bas à droite. Annuler, en bas, laisse les fiches. Un ZIP déjà dans Téléchargements n'est pas touché.

Les photos et les sons sont dans la mémoire Chrome de cette adresse, pas dans la galerie.

## Liste d'espèces

`especes.json` vient d'une liste de codes de baguage (liste monde CRBPO). Quelques noms français ont été complétés. Le CSV source n'est pas dans le dépôt. `generer_especes.py` sert en local et a besoin de Pillow.

## Test

```
node logic.test.mjs
```

## Limite

Visé pour Chrome sur Android. Pas essayé sur iPhone. La page ne remplace pas la fiche papier et n'enregistre pas le lieu.
