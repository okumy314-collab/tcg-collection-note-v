import { readFileSync } from 'node:fs';
const html = readFileSync('index.html', 'utf8');
const checks = [
  ['TCGdex Special illustration rare maps to SAR', /specialillustrationrare[^\n]{0,180}['"]SAR['"]/.test(html)],
  ['Japanese Special Art Rare maps to SAR', /スペシャルアートレア[^\n]{0,100}['"]SAR['"]/.test(html)],
  ['Futuristic Rare maps to FUR', /futuristicrare[^\n]{0,100}['"]FUR['"]/.test(html)],
  ['RGB Rare maps to RGB', /rgbrare[^\n]{0,100}['"]RGB['"]/.test(html)],
  ['Pokemon rarity selector includes FUR and RGB', /rr:\[[^\]]*'FUR','RGB'/.test(html)],
  ['Pokemon source rarity is normalized before registration', /if\(F\.g==='poke'&&detail\.rarity\)[\s\S]{0,180}detail\.rarity=tcgRarityCode\(sourceRarity\)/.test(html)],
  ['Canonical rarity is persisted to card metadata', /rarity:detail\.rarity\|\|F\.r/.test(html)]
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name);
  if (!ok) failed++;
}
if (failed) process.exit(1);
