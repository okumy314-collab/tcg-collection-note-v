import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('data/poke.json', 'utf8'));
const set = data.sets.find(s => s.id === 'M6a');
if (!set) throw new Error('M6a set missing');
const expectedIds = [
  ...Array.from({length:165},(_,i)=>String(i+1).padStart(3,'0')),
  'B','G','R','GRA','FIR','WAT','LIG','PSY','FIG','DAR','MET'
];
if (set.c.length !== 176) throw new Error('M6a row count must be 176, got ' + set.c.length);
const actualIds = set.c.map(c => String(c[0]));
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
  throw new Error('M6a IDs are not in canonical order: ' + JSON.stringify(actualIds.slice(-12)));
}
const missing = set.c.filter(c => !c[2]).map(c => c[0]);
const expectedMissing = [...Array.from({length:24},(_,i)=>String(i+105).padStart(3,'0')),...Array.from({length:5},(_,i)=>String(i+130).padStart(3,'0'))];
if (JSON.stringify(missing) !== JSON.stringify(expectedMissing)) {
  throw new Error('Unexpected M6a missing image IDs: ' + JSON.stringify(missing));
}
console.log('PASS M6a 176 canonical card IDs');
console.log('PASS M6a ' + (176-missing.length) + '/176 explicit image URLs');
console.log('PENDING_SPECIAL_ART_AND_ENERGY_IMAGES ' + JSON.stringify(missing));
const officialEnergyImages = {
  GRA: 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050745_E_KIHONKUSAENERUGI.jpg',
  FIR: 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050746_E_KIHONHONOOENERUGI.jpg',
  WAT: 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050747_E_KIHONMIZUENERUGI.jpg',
  LIG: 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050748_E_KIHONKAMINARIENERUGI.jpg',
  PSY: 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050749_E_KIHONCHIXYOUENERUGI.jpg',
  FIG: 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050750_E_KIHONTOUENERUGI.jpg',
  DAR: 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050751_E_KIHONAKUENERUGI.jpg',
  MET: 'https://www.pokemon-card.com/assets/images/card_images/large/M6a/050752_E_KIHONHAGANEENERUGI.jpg'
};
for (const [id, url] of Object.entries(officialEnergyImages)) {
  const row = set.c.find(card => String(card[0]) === id);
  if (!row || row[2] !== url) throw new Error('Official M6a energy image mapping mismatch: ' + id);
}
console.log('PASS M6a eight official YOSHIROTTEN energy image mappings');
const rgbImages = {
  R: "https://media.on-gacha.com/wp-content/uploads/2026/09/mew-r-rgb.webp",
  G: "https://media.on-gacha.com/wp-content/uploads/2026/09/mew-g-rgb.webp",
  B: "https://media.on-gacha.com/wp-content/uploads/2026/09/mew-b-rgb.webp"
};
for (const [id, url] of Object.entries(rgbImages)) {
  const row = set.c.find(card => String(card[0]) === id);
  if (!row || row[2] !== url) throw new Error('M6a RGB Mew artwork mapping mismatch: ' + id);
}
console.log('PASS M6a exact R/G/B RGB Mew artwork mappings');

