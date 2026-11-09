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
const expectedMissing = [...Array.from({length:31},(_,i)=>String(i+104).padStart(3,'0')),'GRA','FIR','WAT','LIG','PSY','FIG','DAR','MET'];
if (JSON.stringify(missing) !== JSON.stringify(expectedMissing)) {
  throw new Error('Unexpected M6a missing image IDs: ' + JSON.stringify(missing));
}
console.log('PASS M6a 176 canonical card IDs');
console.log('PASS M6a ' + (176-missing.length) + '/176 explicit image URLs');
console.log('PENDING_SPECIAL_ART_AND_ENERGY_IMAGES ' + JSON.stringify(missing));
