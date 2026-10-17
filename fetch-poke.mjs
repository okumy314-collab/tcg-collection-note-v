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
    } catch (e) { console.warn('skip', s.id, e.message); }
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
sets.sort((a, b) => a.id.localeCompare(b.id));
if (!sets.length) throw new Error('no data');
await mkdir('data', { recursive: true });
await writeFile('data/poke.json', JSON.stringify({ sets }));
console.log('cards:', sets.reduce((n, s) => n + s.c.length, 0));
