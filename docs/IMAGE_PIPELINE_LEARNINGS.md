# Image pipeline learnings

## Confirmed successful patterns
- One Piece card images began displaying after adding a bounded fallback/proxy retry for failed image requests. Keep the retry bounded: normalize/proxy once, then show a clear missing-image placeholder.
- Yu-Gi-Oh registration began succeeding after fixing the rarity-selection validation path. Keep selected rarity and selected-card state synchronized before saving.
- For YAC1, match the full collector number (including the YAC1-JP prefix), not a loose prefix or partial number.

## Confirmed failure patterns
- A non-empty image URL does not prove that an image loads. Never mark an image verified merely because a URL exists.
- Generic YAC1 card images can depict a different rarity/printing. Never substitute a generic base image for a selected overframe or special rarity.
- Scraped candidate URLs may be logos, banners, or unrelated page assets. Keep them unverified until the actual card artwork and printing are checked.
- Exact rarity comparisons fail when the UI stores abbreviations (such as PSE OF) but the data stores full Japanese labels. Normalize aliases before matching.
- Manga-style card names can include a suffix in one source but not another. Normalize the suffix while retaining exact card-number matching.
- A bulk re-search reporting URLs found is not sufficient evidence of correct display. Confirm image loading and card/rarity identity separately.

## Required validation sequence
1. Match game + exact card number + set/pack.
2. Match exact printing/rarity after canonicalizing aliases.
3. Verify that the URL actually loads as an image.
4. Verify that the artwork matches the intended card and printing; otherwise keep the missing-image placeholder.
5. Test the same record in search preview, registration, Card Master, My Collection, and detail view.
6. Record whether the result was a confirmed success, URL/load failure, identity mismatch, or rarity mismatch. Do not collapse these states into one generic "image found" status.

## Current known limitations
- data/ygo-oac.json has no confirmed per-rarity imageVariants for most YAC1 records. Rarity alias normalization improves matching but cannot create missing source images.
- An unverified generic image should remain unshown for YAC1 rather than displaying potentially incorrect artwork.

## New verified M6a image case (2026-11-09)
- The manual M6a card-name list had no image field. The app therefore constructed a TCGdex-style URL for all cards, even though the new M6a records were inserted as manual metadata. This can yield an unavailable image despite a valid card name/number.
- Added exact-number image overrides for M6a 056/103 Mew, 057/103 Mew ex RR, 129/103 Mew ex SAR, and 135/103 Mew ex FUR. The four URLs returned HTTP 200 with image/jpeg and >1 KB in the GitHub Actions validator.
- The app now reads an optional third array value as the explicit image URL. The remaining M6a cards continue to use the existing fallback; do not mark the whole set as image-complete.
- Reusable lesson: manual/imported card rows need explicit image URL provenance; never assume an API-generated URL exists just because a set ID and collector number exist.
