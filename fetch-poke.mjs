// TCGdex(日本語)からポケモンカードのセット・カード一覧を取得して data/poke.json に保存する
import { writeFile, mkdir } from 'node:fs/promises';
const API = process.env.TCGDEX_API || 'https://api.tcgdex.net/v2/ja';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(path, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(API + path);
      if (!r.ok) throw new Error(path + ' ' + r.status);
      return await r.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(1000 * (i + 1));
    }
  }
}
const [list, allCards] = await Promise.all([get('/sets'), get('/cards')]);
console.log('sets:', list.length, 'global Japanese cards:', allCards.length);

const sets = [];
const failedSets = [];
let next = 0;
async function worker() {
  while (next < list.length) {
    const s = list[next++];
    try {
      const d = await get('/sets/' + encodeURIComponent(s.id));
      sets.push({
        id: d.id, n: d.name, r: d.serie?.id || '',
        t: d.cardCount?.official ?? d.cardCount?.total ?? (d.cards || []).length,
        c: (d.cards || []).map(c => [c.localId, c.name]),
      });
    } catch (e) { failedSets.push({ id: s.id, name: s.name || s.id, error: e.message }); console.warn('skip', s.id, e.message); }
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
sets.sort((a, b) => a.id.localeCompare(b.id));
if (!sets.length) throw new Error('no data');
// TCGdex does not yet list the Japanese 30th CELEBRATION set.
// Keep the officially released set discoverable without inventing individual card entries.
if (!sets.some(s => s.id === 'M6a')) {
  sets.push({
    id: 'M6a',
    n: '30th CELEBRATION',
    r: 'MEGA',
    t: 187,
    c: [],
    source: 'https://www.30th.pokemon-card.com/product/m6a?rss=260918',
    dataStatus: 'series_registered_card_list_pending'
  });
  sets.sort((a, b) => a.id.localeCompare(b.id));
  console.log('registered official set metadata only: M6a 30th CELEBRATION; individual card names not fabricated');
}
// Recover set lists omitted from individual set responses using the global card index.
const bySetId = new Map(sets.map(s => [s.id, s]));
const sortedSetIds = [...bySetId.keys()].sort((a, b) => b.length - a.length);
const fallbackCards = new Map();
for (const card of allCards) {
  const cardId = String(card.id || '');
  const matchedSetId = sortedSetIds.find(id => cardId.toLowerCase().startsWith(id.toLowerCase() + '-'));
  if (!matchedSetId) continue;
  const localId = String(card.localId ?? cardId.slice(matchedSetId.length + 1));
  const name = String(card.name ?? '').trim();
  if (!localId || !name) continue;
  if (!fallbackCards.has(matchedSetId)) fallbackCards.set(matchedSetId, []);
  fallbackCards.get(matchedSetId).push([localId, name]);
}
let fallbackFilled = 0;
for (const set of sets) {
  if (set.c.length) continue;
  const recovered = fallbackCards.get(set.id) || [];
  if (!recovered.length) continue;
  const seen = new Set();
  set.c = recovered.filter(card => {
    if (seen.has(card[0])) return false;
    seen.add(card[0]);
    return true;
  }).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  fallbackFilled++;
  console.log('recovered from global card index:', set.id, set.c.length);
}
const emptySets = sets.filter(s => s.c.length === 0 && Number(s.t) > 0);
const recentSetIds = new Set(['M1L','M1S','M2','M2a','M3','M4','M5','M6','M6a','MC','SV10','SV11B','SV11W','SV9','SV9a']);
const recentSets = sets.filter(s => recentSetIds.has(s.id));
const missingRecentSets = [...recentSetIds].filter(id => !bySetId.has(id));
const emptyRecentSets = recentSets.filter(s => s.c.length === 0);
if (missingRecentSets.length || emptyRecentSets.length) {
  console.warn('最近シリーズ要確認:', JSON.stringify({missingRecentSets, emptyRecentSets: emptyRecentSets.map(s => s.id)}));
}
const totalCards = sets.reduce((n, s) => n + s.c.length, 0);
const summary = [
  '## ポケモンカードデータ取得結果',
  '',
  '- APIシリーズ一覧: ' + list.length,
  '- グローバルカード一覧: ' + allCards.length,
  '- グローバル一覧から補完: ' + fallbackFilled + 'シリーズ',
  '- 詳細取得成功: ' + sets.length,
  '- 詳細取得失敗: ' + failedSets.length,
  '- 取得できたカード: ' + totalCards,
  '- 公式収録数はあるがカード一覧が空（全期間）: ' + emptySets.length,
  '- 2025〜2026年の主要シリーズ: ' + recentSets.length + '/' + recentSetIds.size,
  '- 2025〜2026年の主要シリーズでカード一覧が空: ' + emptyRecentSets.length,
  '- 2025〜2026年の主要シリーズ一覧に未登録: ' + missingRecentSets.length,
  '',
  '### 2025〜2026年の主要シリーズ確認',
  ...recentSets.map(s => '- ' + s.id + ' — ' + s.n + ': ' + s.c.length + '件'),
  '',
  '### カード一覧が空のシリーズ（旧シリーズ含む）',
  ...emptySets.map(s => '- ' + s.id + ' — ' + s.n + '（公式収録数: ' + s.t + '）'),
  '',
  '### 詳細取得に失敗したシリーズ',
  ...(failedSets.length ? failedSets.map(s => '- ' + s.id + ' — ' + s.name + ': ' + s.error) : ['- なし'])
].join('\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import('node:fs/promises');
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
}
// Never replace a previously good master with a partial download.
if (failedSets.length > 0) {
  throw new Error('シリーズ詳細の取得に失敗したため、既存のポケモンデータを上書きしません: ' + failedSets.length + '件');
}
await mkdir('data', { recursive: true });
await writeFile('data/poke.json', JSON.stringify({ sets }));
console.log('cards:', totalCards);
