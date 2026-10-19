# Agents

Dépôt public : birdfile. Le dossier local reste `bagues`. Le titre à l'écran est BirdFile. L'icône est l'oiseau sur fond vert, `icon-192.png` et `icon-512.png`. La base IndexedDB reste `bagues`. La description publique est dans `index.html`, `manifest.webmanifest`, `README.md`, `llms.txt`, `sites.txt`, `robots.txt` et `sitemap.xml`.

La page publique est https://kevin-guille.github.io/birdfile/ . Le README la montre en premier. Sur Android, l'installation passe par le menu Chrome, Ajouter à l'écran d'accueil. Sur iPhone, elle passe par Safari, Partage, puis Sur l'écran d'accueil. Chrome sur iPhone n'ouvre pas la photo.

Les commits locaux sont signés Kevin Guille. Le push se fait depuis le compte kevin-guille, dans le terminal : `git push`, puis le jeton `ghp_` quand le terminal demande `Password for 'https://kevin-guille@github.com'`. Le `.git/config` de ce dépôt laisse les assistants d'identifiants vides pour github.com et fixe le nom `kevin-guille`. Ne pas remettre d'assistant graphique, ni `gh`, ni le compte InvNat. Ne pas modifier le git config global.

Les fichiers restent sans chemin personnel, sans nom d'utilisateur Windows, sans modèle de téléphone, sans lieu et sans coordonnées. L'auteur Kevin Guille reste visible.

Le README ouvre sur le lien, puis sur à quoi sert le dossier, puis sur l'installation. La liste de codes arrive plus loin. Les trois captures sont dans un tableau d'une seule ligne, largeur 210. Pas de framework, pas de package.json, pas d'intégration continue. La commande de test est `node logic.test.mjs`.

Les textes lus par un humain (interface, README) n'utilisent ni tiret cadratin, ni tiret demi-cadratin, ni double tiret.

`logic.js` reste le protocole de cette page. Une généralisation se fait seulement sur demande.

Fiche : l'espèce est facultative. L'onglet Code ne sélectionne rien. Choisir une espèce bloque la recherche jusqu'à Retirer l'espèce, et n'écrit une fiche que si une photo ou un audio existe déjà. Une bague enregistrée rouvre son code, même vide. Une bague neuve garde l'espèce de la série.

Libellés : Ajouter photos (seulement sans série de vues), Ajouter audio, Cri au relâché si le protocole le demande, Refaire l'audio si un son est déjà gardé. Pas de nom anglais. Le latin vient du champ `s`.

Photo : paysage, cadre 4:3 sur toute la hauteur, déclencheur à droite. Le fichier est le plus grand 4:3 proposé, zoom 1, JPEG d'origine. L'écran montre l'aperçu. Alerte sous 2400 px de large. Sept vues nommées, une photo chacune. Pas de pile Autres. Safari sur iPhone a ImageCapture et la photo fonctionne. Chrome sur iPhone ne l'a pas : la photo ne s'ouvre pas, le son oui.

Mémoire : IndexedDB `bagues` / `oiseaux` et le localStorage survivent à l'extinction, pour l'origine exacte. Rien n'est écrit avant Garder ou Stop. `storage.persist()` est demandé. Retirer l'icône n'efface pas. Tout effacer, Effacer cette bague, ou vider les données du site efface.

Export : le ZIP s'appelle `birdfile_` suivi de la date et de l'heure. `index.csv` a les colonnes `bague;code;nom;latin;controle;vue;fichier;largeur;hauteur;zoom;prise;duree_s`. Un code vide efface nom et latin. Un zoom absent s'écrit `non lu`. Le ZIP réétiquette les fichiers avec l'espèce courante. La fiche garde `bague`, `code`, `nom`, `latin`, `controle`, `vues` (blob, w, h, zoom, ts) et `cri` (blob, mime, duree, ts).

Tout effacer : deux écrans rouges calés sur la zone visible, sous la barre d'adresse. Le bouton passe du haut gauche au bas droit. Annuler reste en bas.

Après un changement de `app.js`, `logic.js`, `app.css` ou `index.html`, augmenter `VERSION` dans `sw.js` et le `?v=` de la feuille de style.
