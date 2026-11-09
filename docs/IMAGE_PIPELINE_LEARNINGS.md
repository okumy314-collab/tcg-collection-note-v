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

## Confirmed Pokemon rarity success (2026-11-09)
- User verified on iPhone that M6a 129/103 Mew ex now displays the correct card image and the app shows the Japanese rarity code SAR.
- TCGdex returns the English rarity label "Special illustration rare". Normalize this source label to the app's canonical "SAR" code before showing the selected-card summary, saving collection metadata, or writing Card Master records.
- Preserve the source label separately as source metadata when useful, but do not let it overwrite the canonical app rarity on later renders.
- Regression test: the Pokemon rarity normalization workflow must pass before preview deployment.

## M6a image source audit and canonical IDs (2026-11-10)
- TCG Journal's M6a catalogue lists 176 entries: 103 officially numbered cards, 62 secret-numbered cards 104/103–165/103, 8 basic energy cards, and 3 Mew RGB variants B/G/R. Source: https://tcgjournal.de/karten/pokemon/japanisch/m6a/.
- Direct image paths under /kartenbilder/tpc/M6a/{id}/low.webp returned image bytes for numbered IDs 001–103 and 136–165 plus B/G/R. This gives 136 working TCG Journal image paths.
- Paths 104–135 did not all resolve under that same URL pattern. Do not infer they are missing from the source page; inspect their exact <img> tags and resolve alternate path patterns. 129/103 and 135/103 retain individually checked image URLs.
- The previous hand-built M6a list had 176 rows but assigned 166–168 to duplicate Mew rows and 169–176 to energies. Canonical collector IDs are B/G/R for the three Mew RGB variants, and GRA/FIR/WAT/LIG/PSY/FIG/DAR/MET for the eight basic energies. The data rows are now mapped to those IDs.
- Current M6a master has 138 explicit image URLs: 134 TCG Journal paths plus 4 individually verified overrides. 38 rows remain without image URLs (30 special numbered artworks excluding 129, plus 8 energies). Do not call the set image-complete.
- Added separate validation for canonical 176 IDs and current image coverage, and split base/classic URL checks from special-art follow-up so expected 404s do not mask successful coverage.

## M6a rarity support (2026-11-10)
- M6a has 20 Illustration Rare, 10 Special Illustration Rare, 2 Futuristic Rare, and 3 RGB Rare cards, in addition to Classic Collection. TCG Journal source confirms these set counts.
- The app previously normalized Illustration Rare and Special Illustration Rare, but did not normalize Futuristic Rare or RGB Rare. Add canonical `FUR` and `RGB` codes and include both in the Pokemon rarity selector so these printings can be selected and retained consistently.
- This is a data/label fix, not proof that the corresponding artwork URLs are complete. Keep image coverage status separate from rarity metadata status.
