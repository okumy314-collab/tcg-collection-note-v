
import { mkdir, writeFile } from 'node:fs/promises';

const SOURCE =
  'https://unpkg.com/one-piece-card-game-json@latest/jp/cards.json';

function normalize(card) {
  const number = String(card.card_number ?? '').trim();
  const name = String(card.card_name ?? '').trim();
  const rarity = String(card.rarity ?? '').trim();
  const imageName = String(card.image_name ?? '').trim();
  const sets = String(card.card_sets ?? '').trim();

  if (!number || !name || !rarity || !imageName) {
    return null;
  }

  const match = sets.match(/\[([^\]]+)\]\s*$/);

  return [
    number,
    name,
    rarity,
    imageName,
    card.is_alternate_art ? 1 : 0,
    match ? match[1] : '',
    sets.replace(/\s*\[[^\]]+\]\s*$/, '').trim()
  ];
}

async function main() {
  console.log('ワンピースカードのデータを取得します');

  const response = await fetch(SOURCE);

  if (!response.ok) {
    throw new Error(`データ取得失敗: HTTP ${response.status}`);
  }

  const source = await response.json();

  if (!Array.isArray(source) || source.length === 0) {
    throw new Error('取得データが空、または形式が不正です');
  }

  const cards = source.map(normalize).filter(Boolean);

  if (cards.length < 200) {
    throw new Error(
      `有効なカードが少なすぎます: ${cards.length}件`
    );
  }

  const keys = new Set();
  const uniqueCards = [];

  for (const card of cards) {
    const key = [
      card[0],
      card[3],
      card[2]
    ].join('|');

    if (keys.has(key)) continue;

    keys.add(key);
    uniqueCards.push(card);
  }

  if (uniqueCards.length < 200) {
    throw new Error('重複除去後のカード数が不足しています');
  }

  await mkdir('data', { recursive: true });

  await writeFile(
    'data/op.json',
    JSON.stringify({ cards: uniqueCards }),
    'utf8'
  );

  console.log(`保存完了: ${uniqueCards.length}件`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
