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
// TCGdex may lag behind newly released Japanese products. Add metadata for recent sets
// that are independently listed in current Japanese set catalogues, but never invent card rows.
const m6aCardNames = ["タマタマ","アローラ ナッシー","バルビート","イルミーゼ","ビビヨン","ファイヤー","ホウオウ","レシラム","ホゲータex","ヤドン","ラプラス","フリーザー","カイオーガ","パルキア","ゲッコウガex","ヨワシ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウ","ピカチュウex","ピカチュウex","サンダー","ゼクロム","ストリンダー","モルペコ","ミライドン","ミュウツー","ミュウツーex","ミュウ","ミュウex","エーフィ","ニンフィアex","アンノーン","フワンテ","シャンデラ","ゼルネアス","コスモッグ","コスモウム","ルナアーラ","コレクレー","グラードン","ルカリオ","ガマゲロゲ","ルガルガン","コライドン","ニドラン♀","ニドリーナ","アローラ ニャース","ゲンガーex","ブラッキー","ズルッグ","イベルタル","ガラル ニャース","ジラーチex","ディアルガ","ナットレイ","ソルガレオ","ザシアン","ザマゼンタ","サーフゴー","ボーマンダex","ジャラコ","ジャランゴ","ジャラランガ","ニャース","メタモン","イーブイ","カビゴン","ププリン","ルギア","ヒスイ ゾロア","ヒスイ ゾロアーク","イッカネズミ","ハイパーボール","ポケパッド","ポケモンいれかえ","アローラ ナッシー","ファイヤー","ラプラス","フリーザー","サンダー","ストリンダー","モルペコ","フワンテ","シャンデラ","ルガルガン","ニドリーナ","アローラ ニャース","ズルッグ","ガラル ニャース","サーフゴー","ジャラランガ","ニャース","メタモン","ヒスイ ゾロア","イッカネズミ","ホゲータex","ゲッコウガex","ピカチュウex","ピカチュウex","ミュウツーex","ミュウex","ニンフィアex","ゲンガーex","ジラーチex","ボーマンダex","ミュウツーex","ミュウex","ピカチュウ","リザードン","カスミ","エリカのプリン","ニューラ","ひかるセレビィ","ルギア","エネコロロ","わるいバンギラス","ハッサムex","メタグロス","パルキア","ユクシー","クロバットG[ギンガ]","ゲンガー","ダークライ&クレセリアLEGEND","ダークライ&クレセリアLEGEND","エヌ","レックウザEX","ゲノセクトEX","サーナイトEX","ゲッコウガBREAK","ソルガレオGX","マッシブーンGX","ピカチュウ&ゼクロムGX","ザシアンV","ライコウ","ミュウVMAX","アルセウスVSTAR","コイキング","ミュウ","ミュウ","ミュウ","基本草エネルギー","基本炎エネルギー","基本水エネルギー","基本雷エネルギー","基本超エネルギー","基本闘エネルギー","基本悪エネルギー","基本鋼エネルギー"];
if (m6aCardNames.length !== 176) throw new Error('M6a card list length mismatch: ' + m6aCardNames.length);
const recentMetadata = [
  { id: 'M6a', n: '30th CELEBRATION', r: 'MEGA', t: 176, source: 'https://pooka.app/ja/list/set/cards/ja-m6a/30th%20Celebration' },
  { id: 'MF', n: '30th CELEBRATION プレミアムデッキセット エーフィ・ブラッキー', r: 'MEGA', t: 49, source: 'https://www.30th.pokemon-card.com/' },
  { id: 'MP1', n: 'スタートデッキ100 バトルコレクション コロちゃおVer.', r: 'MEGA', t: 23, source: 'https://www.pokemon-card.com/' },
  { id: 'MBD', n: 'スターターセットMEGA メガディアンシーex', r: 'MEGA', t: 22, source: 'https://www.pokemon-card.com/' },
  { id: 'MBG', n: 'スターターセットMEGA メガゲンガーex', r: 'MEGA', t: 22, source: 'https://www.pokemon-card.com/' },
  { id: 'MA', n: 'プレミアムトレーナーボックス メガバトル', r: 'MEGA', t: 43, source: 'https://www.pokemon-card.com/' },
];
let addedRecentMetadata = 0;
for (const meta of recentMetadata) {
  if (sets.some(s => s.id.toLowerCase() === meta.id.toLowerCase())) continue;
  sets.push({ ...meta, c: [], dataStatus: 'series_registered_card_list_pending' });
  addedRecentMetadata++;
}
const m6a = sets.find(s => s.id === 'M6a');
const m6aImageOverrides = {
  // Individually confirmed exact images for known special printings.
  '056': 'https://i.ebayimg.com/images/g/lZMAAeSwP-hqqfQq/s-l960.jpg',
  '057': 'https://totalcards.net/cdn/shop/files/39c4d1ebe37b899f428878d954eb35d9.jpg?v=1790065809',
  '129': 'https://item-shopping.c.yimg.jp/i/n/card-museum_pmm06a-129-sar',
  '135': 'https://i.ebayimg.com/images/g/0HoAAeSwAMdqqeF0/s-l1600.jpg',
  // Official Pokémon card database images for the eight M6a YOSHIROTTEN energy cards.
  'GRA': 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050745_E_KIHONKUSAENERUGI.jpg',
  'FIR': 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050746_E_KIHONHONOOENERUGI.jpg',
  'WAT': 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050747_E_KIHONMIZUENERUGI.jpg',
  'LIG': 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050748_E_KIHONKAMINARIENERUGI.jpg',
  'PSY': 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050749_E_KIHONCHIXYOUENERUGI.jpg',
  'FIG': 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050750_E_KIHONTOUENERUGI.jpg',
  'DAR': 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050751_E_KIHONAKUENERUGI.jpg',
  'MET': 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050752_E_KIHONHAGANEENERUGI.jpg'
};
const m6aIds = [
  ...Array.from({length:165}, (_,i)=>String(i+1).padStart(3,'0')).slice(0,165),
];
m6aIds.splice(165, 0, 'B', 'G', 'R');
m6aIds.splice(168, 0, 'GRA', 'FIR', 'WAT', 'LIG', 'PSY', 'FIG', 'DAR', 'MET');
const m6aImageIds = new Set([
  ...Array.from({length:103}, (_,i)=>String(i+1).padStart(3,'0')),
  ...Array.from({length:30}, (_,i)=>String(i+136).padStart(3,'0')),
  'B','G','R'
]);
// Apply exact overrides to both freshly imported and already populated M6a rows.
if (m6a && Array.isArray(m6a.c)) {
  for (const card of m6a.c) {
    const override = m6aImageOverrides[String(card[0] || '')];
    if (override) card[2] = override;
  }
}
if (m6a && m6a.c.length === 0) {
  m6a.c = m6aCardNames.map((name, i) => {
    const no = m6aIds[i];
    const imageUrl = m6aImageOverrides[no] || (m6aImageIds.has(no) ? 'https://tcgjournal.de/kartenbilder/tpc/M6a/' + no + '/low.webp' : '');
    return [no, name, imageUrl];
  });
  m6a.dataStatus = 'partial_exact_number_images_verified_base_and_classic_printings_special_art_pending';
  console.log('imported M6a card names:', m6a.c.length, 'numbered image URLs:', m6aImageIds.size, 'special overrides:', Object.keys(m6aImageOverrides).length);
}
sets.sort((a, b) => a.id.localeCompare(b.id));
console.log('recent product metadata added:', addedRecentMetadata);
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
const recentSetIds = new Set(['M1L','M1S','M2','M2a','M3','M4','M5','M6','M6a','MF','MP1','MBD','MBG','MA','MC','SV10','SV11B','SV11W','SV9','SV9a']);
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
