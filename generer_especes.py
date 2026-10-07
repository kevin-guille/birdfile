# -*- coding: utf-8 -*-
"""Extrait la liste monde CRBPO vers especes.json, et dessine les icônes."""

import csv
import json
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent


def trouver_csv():
    for dossier in HERE.parents:
        candidat = dossier / "Données de préparation" / "Code_espece.csv"
        if candidat.exists():
            return candidat
    raise SystemExit("Code_espece.csv introuvable")


NOMS_SI_VIDE = {
    "HIPPALOPA": "Hypolaïs obscure",
    "HIPPALREI": "Hypolaïs pâle de Reiser",
    "MOTFLAIAE": "Bergeronnette ibérique",
    "MOTFLALLA": "Bergeronnette à tête cendrée",
    "MOTFLARGI": "Bergeronnette nordique",
    "LUSSVECYA": "Gorgebleue à miroir blanc",
    "LUSSVENAM": "Gorgebleue de Nantes",
    "LUSSVESVE": "Gorgebleue à miroir roux",
    "SYLCANALB": "Passerinette orientale",
    "SYLCANCAN": "Passerinette type",
    "SYLCANMOL": "Fauvette de Moltoni",
    "LANSENBAD": "Pie-grièche à tête rousse des Baléares",
    "PHYCOLTRI": "Pouillot de Sibérie",
    "PHYCOLIBE": "Pouillot ibérique",
}

SYLVIA_RESTES = {"atricapilla", "borin", "nisoria"}


def aliases(code, sci):
    trouvés = []
    morceaux = sci.split()
    genre = morceaux[0] if morceaux else ""
    if genre == "Sylvia" and len(morceaux) >= 2 and morceaux[1] not in SYLVIA_RESTES:
        trouvés.append("Curruca " + " ".join(morceaux[1:]))
    if code == "SYLCAN":
        trouvés.append("Curruca iberiae")
        trouvés.append("iberiae")
    if code == "SYLCANMOL":
        trouvés.append("Curruca subalpina")
        trouvés.append("moltonii")
        trouvés.append("Moltoni")
    if code.startswith("HIPPAL"):
        trouvés.append(sci.replace("Hippolais", "Iduna"))
    if code == "HIPPALOPA":
        trouvés.extend(["Iduna opaca", "Hypolaïs obscure", "opaca"])
    if code == "MOTFLAIAE":
        trouvés.extend(["iberiae", "iberique", "flavissima iberiae"])
    if code == "MOTFLAIMA":
        trouvés.extend(["flavissima", "flaveole", "flavéole"])
    if code == "MOTFLARGI":
        trouvés.extend(["thunbergi", "thunbergi"])
    if code == "MOTFLALLA":
        trouvés.append("cinereocapilla")
    if code == "MOTFLAEGG":
        trouvés.append("feldegg")
    if sci.startswith("Phyloscopus") or "collibita" in sci:
        corrigé = sci.replace("Phyloscopus", "Phylloscopus").replace("collibita", "collybita")
        trouvés.append(corrigé)
    vus = set()
    propres = []
    for nom in trouvés:
        cle = nom.casefold()
        if cle and cle not in vus and nom != sci:
            vus.add(cle)
            propres.append(nom)
    return propres


def charger():
    lignes = []
    vus = set()
    with trouver_csv().open(encoding="utf-8-sig", newline="") as fichier:
        for row in csv.DictReader(fichier):
            code = (row.get("Code vrai") or "").strip()
            sci = (row.get("Nom scientifique") or "").strip()
            fr = (row.get("Nom vernaculaire") or "").strip()
            if not code or not sci or code in vus:
                continue
            vus.add(code)
            if not fr:
                fr = NOMS_SI_VIDE.get(code, "")
            item = {"c": code, "s": sci, "f": fr}
            alt = aliases(code, sci)
            if alt:
                item["a"] = alt
            lignes.append(item)
    lignes.sort(key=lambda e: (e["f"].casefold(), e["c"]))
    return lignes


def icone(taille, chemin):
    image = Image.new("RGB", (taille, taille), "#f6f3ec")
    dessin = ImageDraw.Draw(image)
    marge = int(taille * 0.16)
    epaisseur = max(4, taille // 14)
    dessin.ellipse((marge, marge, taille - marge, taille - marge), outline="#141414", width=epaisseur)
    trou = int(taille * 0.34)
    dessin.ellipse((trou, trou, taille - trou, taille - trou), outline="#141414", width=max(3, epaisseur // 2))
    image.save(chemin, "PNG")


def main():
    lignes = charger()
    destination = HERE / "especes.json"
    destination.write_text(json.dumps(lignes, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    icone(192, HERE / "icon-192.png")
    icone(512, HERE / "icon-512.png")
    print(f"{len(lignes)} especes -> {destination} ({destination.stat().st_size} octets)")


if __name__ == "__main__":
    main()
