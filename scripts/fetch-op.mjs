import { mkdir, writeFile } from 'node:fs/promises';

const OWNER = 'Kuroro1990';
const REPO = 'OPTCG';
const BRANCH = 'main';
const API = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/`;

async function getJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'tcg-collection-note-data-updater' }
  });
  if (!response.ok) throw new Error(`取得失敗 HTTP ${response.status}: ${url}`);
  return response.json();
}

function normalize(card, packTitle) {
  const number = String(card.id ?? '').trim();
  const name = String(card.name ?? '').trim();
  const rarity = String(card.rarity ?? '').trim();
  const imageUrl = String(card.img_full_url ?? '').trim();

  if (!number || !name || !rarity || !imageUrl) return null;

  return [
    number,
    name,
    rarity,
    imageUrl,
    /_p\d+$/i.test(number) ? 1 : 0,
    String(card.pack_id ?? ''),
    packTitle || ''
  ];
}

async function main() {
  console.log('ワンピースカードの日本語マスターデータを取得します');

  const [tree, packs] = await Promise.all([
    getJson(API),
    getJson(RAW + 'japanese/packs.json')
  ]);

  if (!Array.isArray(tree.tree) || !packs || typeof packs !== 'object') {
    throw new Error('データ構造が想定と異なります');
  }

  // The source publishes one JSON array per pack. Fetching these pack files
  // avoids thousands of individual card requests and preserves parallel arts.
  const paths = tree.tree
    .filter(item =>
      item.type === 'blob' &&
      /^japanese\/data\/\d+\.json$/.test(item.path)
    )
    .map(item => item.path);

  if (paths.length < 10) {
    throw new Error(`パックデータのファイル数が少なすぎます: ${paths.length}件`);
  }

  const results = [];
  const batchSize = 8;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = await Promise.all(paths.slice(i, i + batchSize).map(async path => {
      const packId = path.split('/').pop().replace(/\.json$/i, '');
      const response = await getJson(RAW + path);
      if (!Array.isArray(response)) {
        throw new Error(`パックデータの形式が不正です: ${path}`);
      }
      const pack = packs[packId];
      const packTitle = pack?.title_parts?.title || pack?.raw_title || packId;
      return response.map(card => normalize(card, packTitle)).filter(Boolean);
    }));
    results.push(...batch.flat());
  }

  const unique = new Map();
  for (const card of results) {
    const key = [card[0], card[3]].join('|');
    if (!unique.has(key)) unique.set(key, card);
  }
  const cards = [...unique.values()];

  if (cards.length < 200) {
    throw new Error(`有効なカード数が不足しています: ${cards.length}件`);
  }

  const sample = cards.find(card => card[0] === 'OP01-001');
  if (!sample || sample[1] !== 'ロロノア・ゾロ') {
    throw new Error('日本語カード名のサンプル検証に失敗しました');
  }

  await mkdir('data', { recursive: true });
  await writeFile('data/op.json', JSON.stringify({ cards }), 'utf8');
  console.log(`保存完了: ${cards.length}件（${paths.length}パックファイル）`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
