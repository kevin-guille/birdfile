# -*- coding: utf-8 -*-
"""Sert l'app sur le PC et la branche sur le téléphone en http://127.0.0.1:8080.

La caméra du navigateur refuse une IP locale (http://192.168...). Le téléphone
doit ouvrir 127.0.0.1, renvoyé vers ce PC par adb reverse. Une fois l'icône
ajoutée à l'écran d'accueil, l'app reste hors ligne.
"""

import shutil
import subprocess
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
PORT = 8080


def adb_reverse(port):
    adb = shutil.which("adb")
    if not adb:
        print("adb introuvable. Installe platform-tools, branche le téléphone, puis:")
        print(f"  adb reverse tcp:{port} tcp:{port}")
        return
    etat = subprocess.run([adb, "devices"], capture_output=True, text=True)
    print(etat.stdout.strip())
    reverse = subprocess.run([adb, "reverse", f"tcp:{port}", f"tcp:{port}"])
    if reverse.returncode != 0:
        print("Brancher le téléphone, accepter le débogage USB, relancer ce script.")


def main():
    adb_reverse(PORT)
    handler = partial(SimpleHTTPRequestHandler, directory=str(HERE))
    serveur = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    print("")
    print("Sur le téléphone, Chrome ouvre: http://127.0.0.1:8080")
    print("Menu Chrome: Ajouter à l'écran d'accueil.")
    print("Puis mode avion, câble débranché, une photo test.")
    print("La photo doit être en 4:3, zoom 1, largeur idéalement au-dessus de 2400 px.")
    print("Ctrl+C pour arrêter. L'icône reste utilisable sans ce script.")
    try:
        serveur.serve_forever()
    except KeyboardInterrupt:
        print("\nArrêt.")
    finally:
        serveur.server_close()


if __name__ == "__main__":
    main()
