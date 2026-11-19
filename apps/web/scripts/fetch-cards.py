#!/usr/bin/env python3
"""One-off: downloads the Tarot nouveau B.P. Grimaud (1898) scans from Wikimedia Commons
(public domain, digitised by the BnF, see public/cards/SOURCES.md) and writes them to
public/cards/<card id>.webp, resized by Commons (its 330 px thumbnail step) and encoded with
`cwebp` (Homebrew: `brew install webp`). Needs only python3 and cwebp: no npm dependency.
The output is committed: the app never loads cards from Commons. Existing files are kept,
so an interrupted run can simply be started again; a file is only written once complete.

Run from apps/web: python3 scripts/fetch-cards.py"""

import json
import pathlib
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

WIDTH = 330
QUALITY = 70
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "cards"
API = "https://commons.wikimedia.org/w/api.php"
PREFIX = "File:Tarot nouveau - Grimaud - 1898 - "
HEADERS = {"User-Agent": "french-tarot-card-fetch/1.0"}
TIMEOUT_S = 30
ATTEMPTS = 8

SUITS = {"Spades": "S", "Hearts": "H", "Diamonds": "D", "Clubs": "C"}
FACES = {"Ace": "01", "Jack": "11", "Knight": "12", "Queen": "13", "King": "14"}


def cards() -> dict[str, str]:
    """Card id -> Commons file title."""
    titles = {}
    for name, code in SUITS.items():
        for n in range(2, 11):
            titles[f"{code}{n:02d}"] = f"{PREFIX}{name} - {n:02d}.jpg"
        for face, rank in FACES.items():
            titles[f"{code}{rank}"] = f"{PREFIX}{name} - {face}.jpg"
    for n in range(1, 22):
        titles[f"T{n:02d}"] = f"{PREFIX}Trumps - {n:02d}.jpg"
    titles["EXC"] = f"{PREFIX}Trumps - Excuse.jpg"
    titles["back"] = f"{PREFIX}Back side.jpg"
    return titles


def get(url: str) -> bytes:
    """GET with a timeout, retrying rate limits (429), server errors and network failures."""
    for attempt in range(ATTEMPTS):
        try:
            request = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(request, timeout=TIMEOUT_S) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 and e.code < 500:
                raise
        except (urllib.error.URLError, TimeoutError):
            pass
        time.sleep(5 * (attempt + 1))
    raise RuntimeError(f"giving up after {ATTEMPTS} attempts: {url}")


def thumb_urls(titles: list[str]) -> dict[str, str]:
    urls = {}
    for i in range(0, len(titles), 50):
        query = urllib.parse.urlencode({
            "action": "query", "format": "json", "prop": "imageinfo",
            "iiprop": "url", "iiurlwidth": WIDTH, "titles": "|".join(titles[i:i + 50]),
        })
        data = json.loads(get(f"{API}?{query}"))
        normalized = {n["to"]: n["from"] for n in data["query"].get("normalized", [])}
        for page in data["query"]["pages"].values():
            title = normalized.get(page["title"], page["title"])
            if "imageinfo" not in page:
                sys.exit(f"Not found on Commons (renamed or deleted?): {title}")
            urls[title] = page["imageinfo"][0]["thumburl"]
    return urls


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    titles = cards()
    missing = {cid: t for cid, t in titles.items() if not (OUT / f"{cid}.webp").exists()}
    urls = thumb_urls(list(missing.values())) if missing else {}
    for cid, title in missing.items():
        jpeg = OUT / f"{cid}.jpg.part"
        webp = OUT / f"{cid}.webp.part"
        try:
            jpeg.write_bytes(get(urls[title]))
            subprocess.run(["cwebp", "-quiet", "-q", str(QUALITY), str(jpeg), "-o", str(webp)],
                           check=True)
            webp.rename(OUT / f"{cid}.webp")
        finally:
            jpeg.unlink(missing_ok=True)
            webp.unlink(missing_ok=True)
        time.sleep(1)
    print(f"{len(titles)} cards in {OUT}")


if __name__ == "__main__":
    main()
