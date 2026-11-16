import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('data/op.json', 'utf8'));
if (!data || !Array.isArray(data.cards) || data.cards.length < 200) {
  throw new Error('ワンピースカードデータが空、または件数不足です');
}

const byNumber = new Map();
let parallelCount = 0;
for (const row of data.cards) {
  if (!Array.isArray(row) || row.length !== 7) {
    throw new Error('カード行の項目数が7項目ではありません');
  }
  const [rawNo, rawName, rawRarity, rawImage, rawParallel, rawPackId, rawPackName] = row;
  const no = String(rawNo || '').trim();
  const name = String(rawName || '').trim();
  const rarity = String(rawRarity || '').trim();
  const image = String(rawImage || '').trim();
  const packId = String(rawPackId || '').trim();
  const packName = String(rawPackName || '').trim();
  if (![no, name, rarity, image, packId, packName].every(Boolean)) {
    throw new Error('必須情報が欠落しています: ' + no);
  }
  if (!/^https:\/\/www\.onepiece-cardgame\.com\/images\/cardlist\/card\/.+\.png(?:\?.*)?$/.test(image)) {
    throw new Error('公式画像URLの形式が不正です: ' + no);
  }
  const isParallel = /_p\d+$/i.test(no);
  if (Boolean(Number(rawParallel)) !== isParallel) {
    throw new Error('パラレル識別子とカード番号末尾が不一致です: ' + no);
  }
  if (byNumber.has(no)) {
    throw new Error('カード番号が重複しています: ' + no);
  }
  byNumber.set(no, row);
  if (isParallel) parallelCount++;
}

for (const no of ['OP05-098', 'OP05-098_p1', 'OP05-098_p2', 'OP05-098_p3', 'OP05-098_p4']) {
  if (!byNumber.has(no)) throw new Error('版違いの照合サンプルが不足しています: ' + no);
}
const normal = byNumber.get('OP05-098');
const p1 = byNumber.get('OP05-098_p1');
const p3 = byNumber.get('OP05-098_p3');
if (normal[1] !== p1[1] || normal[2] !== p1[2] || normal[5] !== p1[5]) {
  throw new Error('通常版と同パックのパラレルの基本情報が一致しません');
}
if (p3[5] === p1[5] || p3[6] === p1[6]) {
  throw new Error('別パック収録の同番号パラレルを区別できません');
}
console.log('One Piece identity validation passed:', byNumber.size, 'unique full card numbers;', parallelCount, 'parallel arts');
