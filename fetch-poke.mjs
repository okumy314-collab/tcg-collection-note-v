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
const list = await get('/sets');
console.log('sets:', list.length);
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
const emptySets = sets.filter(s => s.c.length === 0 && Number(s.t) > 0);
const totalCards = sets.reduce((n, s) => n + s.c.length, 0);
const summary = [
  '## ポケモンカードデータ取得結果',
  '',
  '- APIシリーズ一覧: ' + list.length,
  '- 詳細取得成功: ' + sets.length,
  '- 詳細取得失敗: ' + failedSets.length,
  '- 取得できたカード: ' + totalCards,
  '- 公式収録数はあるがカード一覧が空: ' + emptySets.length,
  '',
  '### カード一覧が空のシリーズ',
  ...emptySets.map(s => '- ' + s.id + ' — ' + s.n + '（公式収録数: ' + s.t + '）'),
  '',
  '### 詳細取得に失敗したシリーズ',
  ...(failedSets.length ? failedSets.map(s => '- ' + s.id + ' — ' + s.name + ': ' + s.error) : ['- なし'])
].join('\\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import('node:fs/promises');
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary + '\\n');
}
// Never replace a previously good master with a partial download.
if (failedSets.length > 0) {
  throw new Error('シリーズ詳細の取得に失敗したため、既存のポケモンデータを上書きしません: ' + failedSets.length + '件');
}
await mkdir('data', { recursive: true });
await writeFile('data/poke.json', JSON.stringify({ sets }));
console.log('cards:', totalCards);
