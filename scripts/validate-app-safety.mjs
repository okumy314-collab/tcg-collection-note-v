import { readFileSync } from 'node:fs';
const html = readFileSync('index.html', 'utf8');
const checks = [
  ['backup menu is exposed', html.includes('全データをバックアップ（JSON）')],
  ['restore file input is exposed', html.includes('onchange="restoreFullBackup(this)"')],
  ['backup contains collection and card master', html.includes("appState:{cards:S.cards,hist:S.hist},cardMaster:master")],
  ['backup format and version are explicit', html.includes("format:'tcg-collection-note-backup',version:1")],
  ['restore validates both collection and master data', html.includes("payload?.format==='tcg-collection-note-backup'") && html.includes('Array.isArray(state?.cards)') && html.includes('Array.isArray(master)')],
  ['restore asks before replacing existing data', html.includes('現在のコレクションとカードマスターを、バックアップの内容に置き換えます。続行しますか？')],
  ['restore attempts rollback on write failure', html.includes('await masterReplace(previousMaster)')],
  ['opening master does not run destructive official reconciliation', !html.includes('await masterSyncPromise;if(OP_READY&&OPI.length)await masterReconcileOfficialRecords()')],
  ['retry counts protected user images separately', html.includes('if(userImage){skippedUser++;continue}') && html.includes('ユーザー画像のため保護')],
  ['candidate image provenance is not marked as confirmed', html.includes("current.imageStatus=candidate?'candidate_unverified':'url_saved'")],
  ['candidate image status is visible in master', html.includes("String(r.imageVerificationStatus||'').startsWith('candidate_unverified')")]
];
let failed = 0;
for (const [name, ok] of checks) { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) failed++; }
if (failed) throw new Error(failed + ' app safety checks failed');
