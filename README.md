# Bagues

Page hors ligne pour lier des photos et un cri de relâché à un numéro de bague, sur une session CRBPO. Les bordereaux restent sur papier. Le site de la session n'est pas dans la page.

Les photos et les sons restent dans le téléphone. Le soir, un ZIP range chaque oiseau dans son dossier, avec un `index.csv`.

## Ouvrir

Chrome sur Android. L'appareil photo et le micro exigent une adresse sûre : https, ou localhost.

Avec le téléphone branché en débogage USB :

```
python servir.py
```

Chrome ouvre `http://127.0.0.1:8080`. Ajouter la page à l'écran d'accueil. Ensuite elle marche sans le câble, y compris en mode avion.

## Contenu

Série de bagues, saut de 10, contrôle étranger qui ne fait pas avancer la série. Codes de la liste monde CRBPO. Photos 4:3 au zoom 1, commentaire dans le JPEG (bague, code, vue). Cri au relâché pour les pouillots véloces et les bergeronnettes printanières : la bague et le code sont écrits dans le WebM.

## Liste d'espèces

`especes.json` est tiré de la liste monde du CRBPO, avec quelques noms français complétés. Vérifier le droit de redistribution avant de rendre ce dépôt public.

## Limite

Visé pour Chrome sur Android. Pas essayé sur iPhone.
