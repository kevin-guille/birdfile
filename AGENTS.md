# Agents

Dépôt public : birdfile. Le dossier local reste `bagues`. Le titre à l'écran reste Bagues.

La page publique est https://kevin-guille.github.io/birdfile/ . Le README la montre en premier. L'installation passe par le menu Chrome, Ajouter à l'écran d'accueil.

Les commits locaux sont signés Kevin Guille. Le push se fait depuis le compte kevin-guille.

Les fichiers restent sans chemin personnel, sans nom d'utilisateur Windows, sans modèle de téléphone, sans lieu et sans coordonnées. L'auteur Kevin Guille reste visible.

Le README présente d'abord la fiche hors ligne. La liste de codes arrive plus loin. Pas de framework, pas de package.json, pas d'intégration continue. La commande de test est `node logic.test.mjs`.

Les textes lus par un humain (interface, README) n'utilisent ni tiret cadratin, ni tiret demi-cadratin, ni double tiret.

`logic.js` reste le protocole de cette page. Une généralisation se fait seulement sur demande.

Fiche : l'espèce est facultative. L'onglet Code ne sélectionne rien. Choisir une espèce bloque la recherche jusqu'à Retirer l'espèce, et n'écrit une fiche que si une photo ou un audio existe déjà. Une bague enregistrée rouvre son code, même vide. Une bague neuve garde l'espèce de la série.

Libellés : Ajouter photos (seulement sans série de vues), Ajouter audio, Cri au relâché si le protocole le demande, Refaire l'audio si un son est déjà gardé. Pas de nom anglais. Le latin vient du champ `s`.

Photo : paysage, cadre 4:3 sur toute la hauteur, déclencheur à droite. Le fichier est le plus grand 4:3 proposé, zoom 1, JPEG d'origine. L'écran montre l'aperçu. Alerte sous 2400 px de large. Sept vues nommées, une photo chacune. Pas de pile Autres.

Mémoire : IndexedDB `bagues` / `oiseaux` et le localStorage survivent à l'extinction, pour l'origine exacte. Rien n'est écrit avant Garder ou Stop. `storage.persist()` est demandé. Retirer l'icône n'efface pas. Tout effacer, Effacer cette bague, ou vider les données du site efface.

Export : `index.csv` a les colonnes `bague;code;nom;latin;controle;vue;fichier;largeur;hauteur;zoom;prise;duree_s`. Un code vide efface nom et latin. Un zoom absent s'écrit `non lu`. Le ZIP réétiquette les fichiers avec l'espèce courante. La fiche garde `bague`, `code`, `nom`, `latin`, `controle`, `vues` (blob, w, h, zoom, ts) et `cri` (blob, mime, duree, ts).

Tout effacer : deux écrans rouges calés sur la zone visible, sous la barre d'adresse. Le bouton passe du haut gauche au bas droit. Annuler reste en bas.

Après un changement de `app.js`, `logic.js`, `app.css` ou `index.html`, augmenter `VERSION` dans `sw.js` et le `?v=` de la feuille de style.
