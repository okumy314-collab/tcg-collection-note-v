const base = 'https://tcgjournal.de/kartenbilder/tpc/M6a/';
const ids = [
  ...Array.from({ length: 103 }, (_, i) => String(i + 1).padStart(3, '0')),
  ...Array.from({ length: 30 }, (_, i) => String(i + 136).padStart(3, '0')),
  'B', 'G', 'R'
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
    if (!ok) console.log('MISSING', JSON.stringify(results[results.length - 1]));
  } catch (error) {
    results.push({ id, url, ok: false, error: error.message });
    console.log('MISSING', JSON.stringify(results[results.length - 1]));
  }
}
const ok = results.filter(x => x.ok);
console.log('M6A_BASE_CLASSIC_SUMMARY', JSON.stringify({ expected: ids.length, ok: ok.length, failed: results.length - ok.length, failedIds: results.filter(x => !x.ok).map(x => x.id) }));
if (ok.length !== ids.length) throw new Error('M6a base/classic image validation failed: ' + ok.length + '/' + ids.length);
