#!/usr/bin/env python3
"""Collect direct image candidates from existing YAC1 product-page references.

This intentionally does NOT write candidate URLs into imageUrl. Product-page
metadata can point to a wrong rarity/artwork variant, so all output remains
unverified until a human checks the card face.
"""
import json
import re
import time
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "ygo-oac.json"
OUT = ROOT / "data" / "ygo-oac-image-candidates.json"
CARD_RE = re.compile(r"^YAC1-JP\d{3}$")
MAX_PAGES_PER_CARD = 3
TIMEOUT = 12

class MetaParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = []
        self.title_parts = []
        self.in_title = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag.lower() == "meta":
            key = (a.get("property") or a.get("name") or "").lower()
            val = a.get("content")
            if key in ("og:image", "og:image:url", "twitter:image", "twitter:image:src") and val:
                self.meta.append((key, val.strip()))
        if tag.lower() == "title":
            self.in_title = True
    def handle_endtag(self, tag):
        if tag.lower() == "title":
            self.in_title = False
    def handle_data(self, data):
        if self.in_title and data.strip():
            self.title_parts.append(data.strip())

def page_refs(card):
    refs = card.get("variantImageReferences")
    if not isinstance(refs, dict):
        return []
    urls = []
    for value in refs.values():
        if isinstance(value, str) and value.startswith("https://") and value not in urls:
            urls.append(value)
    return urls[:MAX_PAGES_PER_CARD]

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "TCGCollectionNote-image-candidate-check/1.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
        content_type = response.headers.get("Content-Type", "")
        if "text/html" not in content_type.lower():
            return None
        raw = response.read(1_500_000)
    parser = MetaParser()
    parser.feed(raw.decode("utf-8", errors="replace"))
    image_urls = []
    for _, value in parser.meta:
        resolved = urljoin(url, value)
        if resolved.startswith("https://") and resolved not in image_urls:
            image_urls.append(resolved)
    return {
        "pageTitle": " ".join(parser.title_parts)[:240],
        "imageCandidates": image_urls,
        "contentType": content_type,
    }

def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    cards = [c for c in data.get("cards", []) if CARD_RE.match(str(c.get("cardNumber", "")))]
    results = []
    for card in cards:
        if card.get("imageUrl"):
            continue
        for page_url in page_refs(card):
            row = {
                "cardNumber": card["cardNumber"],
                "cardName": card.get("baseName") or card.get("name") or "",
                "sourcePageUrl": page_url,
                "status": "unverified_candidate",
                "pageTitle": "",
                "imageCandidates": [],
                "error": None,
            }
            try:
                info = fetch(page_url)
                if info:
                    row.update(info)
                else:
                    row["error"] = "source did not return HTML"
            except Exception as exc:
                row["error"] = type(exc).__name__ + ": " + str(exc)[:180]
            results.append(row)
            time.sleep(1.0)
    output = {
        "title": "YAC1 direct image URL candidates",
        "status": "unverified_candidates_only",
        "generatedBy": "scripts/collect-ygo-image-candidates.py",
        "warning": "These are social/OG metadata candidates from product pages, not confirmed card artwork. Never copy into data/ygo-oac.json imageUrl until the exact YAC1 artwork variant is checked.",
        "cardsScanned": len(cards),
        "sourcePagesChecked": len(results),
        "candidateImageCount": sum(len(r.get("imageCandidates", [])) for r in results),
        "results": results,
    }
    OUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: output[k] for k in ("cardsScanned", "sourcePagesChecked", "candidateImageCount")}, ensure_ascii=False))

if __name__ == "__main__":
    main()
