const url = 'https://pooka.app/ja/list/set/cards/ja-m6a/30th%20Celebration';
const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TCGCollectionNote/1.0)' } });
if (!response.ok) throw new Error('Pooka page fetch failed: ' + response.status);
const html = await response.text();
console.log('page bytes:', html.length);
console.log('title:', (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').slice(0, 180));
const markers = ['タマタマ', '001/103', 'ミュウex', '129/103'];
for (const marker of markers) {
  const i = html.indexOf(marker);
  console.log('\nMARKER', marker, 'index', i);
  if (i >= 0) console.log(html.slice(Math.max(0, i - 900), Math.min(html.length, i + 1500)).replace(/></g, '>\n<').slice(0, 2600));
}
const images = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
console.log('\nIMG COUNT', images.length);
for (const tag of images.slice(0, 12)) console.log(tag.slice(0, 800));
