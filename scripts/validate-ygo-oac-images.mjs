import { readFileSync } from 'node:fs';
const html = readFileSync('index.html', 'utf8');
const data = JSON.parse(readFileSync('data/ygo-oac.json', 'utf8'));
const confirmedImages = data.cards.filter(x => x.imageStatus === 'user_confirmed_image').length;
const userConfirmed = data.cards.filter(x => x.imageCandidateStatus === 'user_confirmed_by_user').length;
const reviewNeeded = data.cards.filter(x => x.imageCandidateStatus === 'needs_user_review' || x.imageStatus === 'direct_image_endpoint_available_artwork_needs_user_review').length;
const declaredVariants = data.cards.flatMap(x => Array.isArray(x.variants) ? x.variants.map(rarity => ({ card: x, rarity })) : []);
const rarityLabels = new Set(declaredVariants.map(x => x.rarity));
const exactVariantImages = data.cards.reduce((n, x) => {
  const variants = x.imageVariants || x.variantImages || {};
  return n + (Array.isArray(variants)
    ? variants.filter(v => v && typeof (v.imageUrl || v.url) === 'string' && /^https:\/\//.test(v.imageUrl || v.url)).length
    : Object.values(variants).filter(v => /^https:\/\//.test(typeof v === 'string' ? v : (v?.imageUrl || v?.url || ''))).length);
}, 0);
if (confirmedImages !== 100) throw new Error('YAC1 base image confirmations must remain at 100: ' + confirmedImages);
if (userConfirmed !== 100) throw new Error('YAC1 user review confirmations must remain at 100: ' + userConfirmed);
if (reviewNeeded !== 0) throw new Error('YAC1 base image review queue should be empty: ' + reviewNeeded);
console.log('YAC1 base image review status:', confirmedImages, 'confirmed;', reviewNeeded, 'pending; variant-specific image assets remain separately validated.');
if (declaredVariants.length !== 346 || rarityLabels.size !== 14) throw new Error('YAC1 rarity declarations changed unexpectedly: ' + declaredVariants.length + ' entries across ' + rarityLabels.size + ' labels');
const mangaVariantLabels = ['ウルトラレア（モノクロ）', 'ウルトラレア（カラー）', 'シークレットレア（モノクロ）', 'シークレットレア（カラー）'];
if (data.cards.some(x => !Array.isArray(x.variants) || (!String(x.baseRarity || '').includes('MANGA-STYLE') && !x.variants.includes(x.baseRarity)))) throw new Error('Every non-MANGA YAC1 card must declare its base rarity in variants');
if (data.cards.filter(x => String(x.baseRarity || '').includes('MANGA-STYLE')).some(x => mangaVariantLabels.some(label => !x.variants.includes(label)))) throw new Error('Every MANGA-STYLE card must declare all four color/monochrome rarity variants');
const baseRarityCount = label => data.cards.filter(x => x.baseRarity === label).length;
const variantCount = label => data.cards.filter(x => (x.variants || []).includes(label)).length;
const officialCounts = [
  ['base Ultra Rare', baseRarityCount('ウルトラレア'), 25],
  ['base Super Rare', baseRarityCount('スーパーレア'), 45],
  ['base MANGA-STYLE Ultra Rare', baseRarityCount('ウルトラレア（MANGA-STYLE）'), 30],
  ['Ultra Rare Overframe', variantCount('ウルトラレア（オーバーフレーム）'), 10],
  ['Prismatic Secret Rare', variantCount('プリズマティックシークレットレア'), 28],
  ['Prismatic Secret Rare Overframe', variantCount('プリズマティックシークレットレア（オーバーフレーム）'), 10],
  ['Grand Master Rare (both registered labels)', data.cards.filter(x => (x.variants || []).some(v => v === 'グランドマスターレア' || v === 'グランドマスター')).length, 10],
  ['Ultimate Rare', variantCount('アルティメットレア'), 14],
  ['Collectors Rare', variantCount('コレクターズレア'), 14],
  ['MANGA Ultra Rare monochrome', variantCount('ウルトラレア（モノクロ）'), 30],
  ['MANGA Ultra Rare color', variantCount('ウルトラレア（カラー）'), 30],
  ['MANGA Secret Rare monochrome', variantCount('シークレットレア（モノクロ）'), 30],
  ['MANGA Secret Rare color', variantCount('シークレットレア（カラー）'), 30]
];
for (const [label, actual, expected] of officialCounts) {
  if (actual !== expected) throw new Error('YAC1 official rarity count mismatch for ' + label + ': expected ' + expected + ', got ' + actual);
}
console.log('YAC1 rarity declarations:', declaredVariants.length, 'card/rarity combinations across', rarityLabels.size, 'labels;', exactVariantImages, 'direct variant image assets registered.');


const checks = [
  ['YAC1 has 100 unique numbered records', Array.isArray(data.cards) && data.cards.length === 100 && new Set(data.cards.map(x => x.cardNumber || x.id)).size === 100],
  ['all existing YAC1 base image URLs are retained', data.cards.every(x => /^https:\/\//.test(x.imageUrl || ''))],
  ['base image is allowed only when selected rarity matches base rarity', html.includes('ygoRarityKey(hit.baseRarity)===rarity&&hit.imageUrl')],
  ['master retry marks unreviewed base image as candidate, not verified', html.includes("status:hit.imageStatus==='user_confirmed_image'?'user_confirmed_base_rarity':'candidate_unverified_base_rarity'")],
  ['special rarity still requires its own exact variant image', html.includes('const variants=hit.imageVariants||hit.variantImages||{}')],
  ['black magician official title alias is normalized', html.includes("replace(/^黒き魔術師[－-]/,'')")],
  ['YAC1 matching retains exact collector number', html.includes('masterImageNorm(x.cardNumber||x.id)===no')]
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name);
  if (!ok) failed++;
}
if (failed) throw new Error(failed + ' YAC1 image regression checks failed');
