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

  // Keep each printed/parallel version as a separate candidate.
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

  const paths = tree.tree
    .filter(item =>
      item.type === 'blob' &&
      /^japanese\/cards\/[^/]+\/[^/]+\.json$/.test(item.path) &&
      !item.path.endsWith('/manifest.json')
    )
    .map(item => item.path);

  if (paths.length < 200) {
    throw new Error(`カードファイル数が少なすぎます: ${paths.length}件`);
  }

  const results = [];
  const batchSize = 12;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = await Promise.all(paths.slice(i, i + batchSize).map(async path => {
      try {
        const card = await getJson(RAW + path);
        const packId = String(card.pack_id ?? path.split('/')[2] ?? '');
        const pack = packs[packId];
        const packTitle = pack?.title_parts?.title || pack?.raw_title || packId;
        return normalize(card, packTitle);
      } catch (error) {
        console.warn(`カードを読み込めませんでした: ${path}: ${error.message}`);
        return null;
      }
    }));
    results.push(...batch.filter(Boolean));
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

  await mkdir('data', { recursive: true });
  await writeFile('data/op.json', JSON.stringify({ cards }), 'utf8');
  console.log(`保存完了: ${cards.length}件（日本語カード名・レアリティ・画像URL）`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
