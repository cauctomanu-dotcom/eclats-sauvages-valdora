from __future__ import annotations

import csv
import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TREE_FILE = ROOT / "ARBORESCENCE_GITHUB.txt"
HASH_FILE = ROOT / "MANIFESTE_SHA256.csv"
EXCLUDED = {".git", "_site", "__pycache__"}
GENERATED = {TREE_FILE.name, HASH_FILE.name}


def files() -> list[Path]:
    return sorted(
        path
        for path in ROOT.rglob("*")
        if path.is_file()
        and path.name not in GENERATED
        and not any(part in EXCLUDED for part in path.relative_to(ROOT).parts)
    )


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def main() -> None:
    repository_files = files()
    tree_lines = [
        "ÉCLATS SAUVAGES — VALDORA V118 — NOMENCLATURE GITHUB",
        "",
        "Chaque ligne est le chemin d’un fichier. GitHub recrée les dossiers à partir de ces chemins.",
        "Les deux manifestes générés sont volontairement exclus de leur propre liste.",
        "",
    ]
    tree_lines.extend(path.relative_to(ROOT).as_posix() for path in repository_files)
    TREE_FILE.write_text("\n".join(tree_lines) + "\n", encoding="utf-8")

    with HASH_FILE.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.writer(stream, delimiter=";")
        writer.writerow(["chemin", "taille_octets", "sha256"])
        for path in repository_files:
            writer.writerow([path.relative_to(ROOT).as_posix(), path.stat().st_size, sha256(path)])

    print(f"Arborescence : {TREE_FILE}")
    print(f"Manifest SHA-256 : {HASH_FILE}")
    print(f"Fichiers indexés : {len(repository_files)}")


if __name__ == "__main__":
    main()
