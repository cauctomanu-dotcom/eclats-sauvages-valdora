from __future__ import annotations

import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / "game"
MAX_GITHUB_FILE = 100 * 1024 * 1024
IGNORED_PARTS = {".git", "_site", "__pycache__"}
REQUIRED = [
    ROOT / "README.md",
    ROOT / "LICENSE.md",
    ROOT / "PUBLICATION_GITHUB.md",
    ROOT / "JOUER_VALDORA.bat",
    ROOT / "CREATOR_VALDORA.bat",
    ROOT / ".github" / "workflows" / "verify.yml",
    ROOT / ".github" / "workflows" / "pages.yml",
    GAME / "index.html",
    GAME / "CREATEUR.html",
    GAME / "manifest.webmanifest",
    GAME / "pwa.js",
    GAME / "sw.js",
    GAME / "VALDORA_SAVE_V118.js",
    GAME / "VALDORA_LIVING_WORLD_V118.js",
    GAME / "VALDORA_SANCTUARIES_V117.js",
]


class AssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.references: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        for key in ("src", "href", "poster"):
            value = values.get(key)
            if value:
                self.references.append(value)


def repository_files() -> list[Path]:
    return sorted(
        path
        for path in ROOT.rglob("*")
        if path.is_file() and not any(part in IGNORED_PARTS for part in path.relative_to(ROOT).parts)
    )


def local_target(html_file: Path, reference: str) -> Path | None:
    parsed = urlsplit(reference.strip())
    if parsed.scheme or parsed.netloc or not parsed.path or parsed.path.startswith(("#", "data:", "javascript:")):
        return None
    path = unquote(parsed.path).replace("\\", "/")
    if path.startswith("/"):
        return GAME / path.lstrip("/")
    return html_file.parent / path


def exact_case(path: Path, files_by_lower: dict[str, str]) -> bool:
    try:
        relative = path.resolve().relative_to(ROOT.resolve()).as_posix()
    except ValueError:
        return False
    return files_by_lower.get(relative.lower()) == relative


def main() -> int:
    issues: list[str] = []
    files = repository_files()
    files_by_lower = {path.relative_to(ROOT).as_posix().lower(): path.relative_to(ROOT).as_posix() for path in files}

    for required in REQUIRED:
        if not required.is_file():
            issues.append(f"Fichier indispensable absent : {required.relative_to(ROOT).as_posix()}")

    for path in files:
        size = path.stat().st_size
        if size >= MAX_GITHUB_FILE:
            issues.append(f"Fichier refusé par GitHub (100 Mio ou plus) : {path.relative_to(ROOT).as_posix()}")

    manifest_file = GAME / "manifest.webmanifest"
    if manifest_file.is_file():
        try:
            manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
            for key in ("name", "short_name", "start_url", "display", "icons"):
                if not manifest.get(key):
                    issues.append(f"Manifest Web incomplet : propriété {key} absente")
        except (OSError, json.JSONDecodeError) as error:
            issues.append(f"Manifest Web invalide : {error}")

    for html_file in (GAME / "index.html", GAME / "CREATEUR.html"):
        if not html_file.is_file():
            continue
        parser = AssetParser()
        parser.feed(html_file.read_text(encoding="utf-8", errors="replace"))
        for reference in parser.references:
            parsed_reference = urlsplit(reference.strip())
            if not parsed_reference.scheme and not parsed_reference.netloc and parsed_reference.path.startswith("/"):
                issues.append(
                    f"Chemin absolu incompatible avec une page de projet GitHub dans {html_file.name} : {reference}"
                )
                continue
            target = local_target(html_file, reference)
            if target is None:
                continue
            if not target.is_file():
                issues.append(f"Référence absente dans {html_file.name} : {reference}")
            elif not exact_case(target, files_by_lower):
                issues.append(f"Casse incompatible avec GitHub Pages dans {html_file.name} : {reference}")

        html_text = html_file.read_text(encoding="utf-8", errors="replace")
        if "VALDORA_LIVING_WORLD_V118.js" not in html_text:
            issues.append(f"Le moteur V118 n'est pas chargé par {html_file.name}")

    total = sum(path.stat().st_size for path in files)
    print(f"Fichiers vérifiés : {len(files)}")
    print(f"Taille du dépôt : {total / 1024 / 1024:.2f} Mio")
    print(f"Plus gros fichier : {max((path.stat().st_size for path in files), default=0) / 1024 / 1024:.2f} Mio")

    if issues:
        print("\nÉCHEC :", file=sys.stderr)
        for issue in issues:
            print(f"- {issue}", file=sys.stderr)
        return 1

    print("Dépôt compatible avec GitHub et GitHub Pages.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
