const base = 'https://tcgjournal.de/kartenbilder/tpc/M6a/';
const ids = [
  ...Array.from({ length: 165 }, (_, i) => String(i + 1).padStart(3, '0')),
  'G','R','GRA','FIR','WAT','LIG','PSY','FIG','DAR','MET'
];
const results = [];
for (const id of ids) {
  const url = base + id + '/low.webp';
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 TCGCollectionNote/1.0', 'Referer': 'https://tcgjournal.de/karten/pokemon/japanisch/m6a/' } });
    const bytes = new Uint8Array(await response.arrayBuffer());
    const type = (response.headers.get('content-type') || '').toLowerCase();
    const ok = response.ok && type.startsWith('image/') && bytes.length > 1000;
    results.push({ id, url, status: response.status, type, bytes: bytes.length, ok });
    console.log(JSON.stringify(results[results.length - 1]));
  } catch (error) {
    results.push({ id, url, ok: false, error: error.message });
    console.log(JSON.stringify(results[results.length - 1]));
  }
}
const ok = results.filter(x => x.ok);
console.log('SUMMARY', JSON.stringify({ total: results.length, ok: ok.length, failed: results.length - ok.length, failedIds: results.filter(x => !x.ok).map(x => x.id) }));
if (ok.length < 130) throw new Error('Too few verified M6a base/Classic images: ' + ok.length);
const specialMissing = results.filter(x => !x.ok && /^1(0[4-9]|[12][0-9]|3[0-5])$/.test(x.id)).map(x => x.id);
console.log('SPECIAL_ART_IMAGE_FOLLOWUP', JSON.stringify({ missingSpecialArtworkNumbers: specialMissing, note: 'Do not mark M6a image set complete; resolve alternate image path for AR/SAR/FUR separately.' }));
