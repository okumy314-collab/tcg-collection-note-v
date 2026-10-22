#!/usr/bin/env python3
"""Extract unverified card-image candidates from YAC1 retailer product pages.

Never overwrites imageUrl. The results are review-only and should not be treated
as a confirmed YAC1 print until a human checks the artwork.
"""
import html
import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urljoin

DATA_PATH = Path("data/ygo-oac.json")
USER_AGENT = "Mozilla/5.0 (compatible; YAC1ImageReviewCollector/1.0)"
MAX_PAGES_PER_CARD = 12
TIMEOUT_SECONDS = 15
IMAGE_EXT = re.compile(r"\.(?:jpe?g|png|webp)(?:[?#]|$)", re.I)
META_TAG = re.compile(r"<meta\b[^>]*>", re.I)
IMG_TAG = re.compile(r"<img\b[^>]*>", re.I)
ATTR = re.compile(r"""([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))""", re.I)

def attrs(tag):
    result = {}
    for m in ATTR.finditer(tag):
        result[m.group(1).lower()] = html.unescape(m.group(2) or m.group(3) or m.group(4) or "")
    return result

def fetch_page(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as response:
        content_type = response.headers.get("Content-Type", "").lower()
        final_url = response.geturl()
        if "html" not in content_type:
            return final_url, ""
        body = response.read(2_000_000).decode("utf-8", errors="replace")
        return final_url, body

def extract_images(page_url, body):
    found = []
    for tag in META_TAG.findall(body):
        a = attrs(tag)
        key = (a.get("property") or a.get("name") or "").lower()
        value = a.get("content", "")
        if key in {"og:image", "og:image:url", "twitter:image", "twitter:image:src"} and value:
            found.append((urljoin(page_url, value), "meta:" + key))
    # Parse JSON-LD product image values, common on commerce pages.
    for match in re.finditer(r'"image"\s*:\s*(\[[^\]]*\]|"[^"]+")', body, re.I):
        try:
            value = json.loads(match.group(1))
            values = value if isinstance(value, list) else [value]
            for item in values:
                if isinstance(item, str):
                    found.append((urljoin(page_url, html.unescape(item)), "jsonld:image"))
        except (ValueError, TypeError):
            pass
    for tag in IMG_TAG.findall(body):
        a = attrs(tag)
        value = a.get("data-src") or a.get("data-original") or a.get("data-lazy-src") or a.get("data-zoom-image") or a.get("src") or ""
        if not value:
            continue
        absolute = urljoin(page_url, value)
        # Skip tiny icons, trackers, and obvious UI assets where possible.
        lowered = absolute.lower()
        if any(word in lowered for word in ("logo", "icon", "banner", "sprite", "payment", "cart")):
            continue
        if IMAGE_EXT.search(absolute) or any(k in lowered for k in ("image.php", "image=", "item_image", "product_image", "goods_image")):
            found.append((absolute, "img-tag"))
    unique = []
    seen = set()
    for url, source in found:
        if url.startswith(("https://", "http://")) and url not in seen:
            seen.add(url)
            unique.append({"imageUrl": url, "extractionSource": source})
    return unique[:20]

def walk_urls(value):
    if isinstance(value, str):
        if value.startswith(("https://", "http://")):
            yield value
    elif isinstance(value, dict):
        for item in value.values():
            yield from walk_urls(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk_urls(item)

def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    changed_cards = 0
    failures = 0
    for card in data.get("cards", []):
        number = str(card.get("cardNumber", ""))
        if not re.fullmatch(r"YAC1-JP\d{3}", number):
            continue
        if card.get("imageUrl"):
            continue
        ref_urls = list(dict.fromkeys(
            walk_urls(card.get("variantImageReferences", {}))
        ))
        evidence_urls = list(dict.fromkeys(
            walk_urls(card.get("retailerVariantEvidence", {}))
        ))
        page_urls = list(dict.fromkeys(ref_urls + evidence_urls))[:MAX_PAGES_PER_CARD]
        candidates = []
        for page_url in page_urls:
            try:
                final_url, body = fetch_page(page_url)
                if body:
                    for item in extract_images(final_url, body):
                        candidate = {
                            **item,
                            "sourcePageUrl": page_url,
                            "status": "unverified_review_candidate",
                            "warning": "Extracted from a product page; verify the exact YAC1 artwork and rarity before promoting."
                        }
                        if candidate["imageUrl"] not in [x["imageUrl"] for x in candidates]:
                            candidates.append(candidate)
            except (urllib.error.URLError, TimeoutError, OSError, ValueError):
                failures += 1
            time.sleep(0.2)
        if candidates:
            previous = card.get("imageCandidates", [])
            if previous != candidates:
                card["imageCandidates"] = candidates
                card["imageCandidateStatus"] = "needs_user_review"
                card["imageCandidateSourcePageCount"] = len(page_urls)
                changed_cards += 1
    data["imageCandidateCollection"] = {
        "purpose": "Review-only candidate image URLs extracted from existing retailer references; these do not count as confirmed imageUrl values.",
        "script": "scripts/collect-ygo-image-candidates.py",
        "cardsUpdatedThisRun": changed_cards,
        "fetchFailuresThisRun": failures
    }
    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Candidate metadata updated for {changed_cards} cards; page/image fetch failures: {failures}. Confirmed imageUrl fields were not changed.")

if __name__ == "__main__":
    main()
