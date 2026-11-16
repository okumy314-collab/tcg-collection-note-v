import { readFileSync } from 'node:fs';
const html = readFileSync('index.html', 'utf8');
const data = JSON.parse(readFileSync('data/ygo-oac.json', 'utf8'));
const confirmedImages = data.cards.filter(x => x.imageStatus === 'user_confirmed_image').length;
const userConfirmed = data.cards.filter(x => x.imageCandidateStatus === 'user_confirmed_by_user').length;
const reviewNeeded = data.cards.filter(x => x.imageCandidateStatus === 'needs_user_review' || x.imageStatus === 'direct_image_endpoint_available_artwork_needs_user_review').length;
if (confirmedImages !== 100) throw new Error('YAC1 base image confirmations must remain at 100: ' + confirmedImages);
if (userConfirmed !== 100) throw new Error('YAC1 user review confirmations must remain at 100: ' + userConfirmed);
if (reviewNeeded !== 0) throw new Error('YAC1 base image review queue should be empty: ' + reviewNeeded);
console.log('YAC1 base image review status:', confirmedImages, 'confirmed;', reviewNeeded, 'pending; variant-specific image assets remain separately validated.');

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
