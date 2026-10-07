# birdfile

Fiche photo et son d'un oiseau en main, liée à son numéro de bague. Tout reste sur l'appareil, hors ligne.

## Ouvrir

Chrome. L'appareil photo et le micro exigent une adresse sûre : https, ou localhost.

Avec le téléphone branché en débogage USB :

```
python servir.py
```

Chrome ouvre `http://127.0.0.1:8080`. Ajoute la page à l'écran d'accueil. Ensuite elle marche sans le câble, y compris en mode avion.

## Usage

Série de bagues, saut de 10, contrôle qui ne fait pas avancer la série. Photos 4:3 au zoom 1. Le commentaire JPEG contient la bague, le code et la vue. Le cri dépend du code : pour certains il est demandé, pour d'autres seulement proposé. La bague et le code sont écrits dans le fichier son (les lecteurs les montrent sur un WebM ; un M4A contient le même texte). Le soir, un ZIP range chaque oiseau dans son dossier, avec un `index.csv`.

## Liste d'espèces

`especes.json` vient d'une liste de codes de baguage (liste monde CRBPO). Quelques noms français ont été complétés. Le CSV source n'est pas dans le dépôt. `generer_especes.py` sert en local et a besoin de Pillow.

## Test

```
node logic.test.mjs
```

## Limite

Visé pour Chrome sur Android. Pas essayé sur iPhone. La page ne remplace pas la fiche papier et n'enregistre pas le site.
