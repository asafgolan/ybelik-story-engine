// Cross-language parity gate: JS compileScene vs Python compile_scene (oracle).
// Gates: byte-identical at jitter=0 on the five canonical scenes; depth-2
// cross-language parity; JS jitter determinism; SEMANTIC idempotency (H10).
// Run from repo root: node packages/scene-compiler/tests/parity_js.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, '..');                       // packages/scene-compiler
const repo = join(pkg, '..', '..');                 // repo root
const { compileScene } = createRequire(import.meta.url)(join(pkg, 'scene-compiler.js'));

const SCENES = ['01-quiet-sun', '02-vivid-sun', '03-bird', '04-empty-rock', '05-girl']
  .map(n => join(repo, 'demo', 'svg', n + '.svg'));

const tmp = mkdtempSync(join(tmpdir(), 'parity-'));
let fail = 0;
console.log('scene                    jitter=0 byte-parity');
console.log('---------------------------------------------');
for (const scene of SCENES) {
  const src = readFileSync(scene, 'utf8');
  const js = compileScene(src, { jitter: 0 });
  const outPy = join(tmp, 'py.svg');
  execFileSync('python3', [join(pkg, 'compile_scene.py'), scene,
    '--out', outPy, '--jitter', '0'], { stdio: ['ignore', 'ignore', 'inherit'] });
  const py = readFileSync(outPy, 'utf8');
  const ok = Buffer.from(js, 'utf8').equals(Buffer.from(py, 'utf8'));
  console.log(`${scene.split('/').pop().padEnd(24)} ${ok ? 'PASS' : 'FAIL'}`);
  if (!ok) {
    fail++;
    for (let i = 0; i < Math.min(js.length, py.length); i++)
      if (js[i] !== py[i]) {
        console.log(`  first diff @ char ${i}:`);
        console.log(`  js: …${js.slice(Math.max(0, i - 40), i + 40)}…`);
        console.log(`  py: …${py.slice(Math.max(0, i - 40), i + 40)}…`);
        break;
      }
  }
}
// declared-deviation + invariant checks
const src0 = readFileSync(SCENES[0], 'utf8');
const a = compileScene(src0, { seed: 42 }), b = compileScene(src0, { seed: 42 });
const c = compileScene(src0, { seed: 43 });
// Verified quirk (H10): recompiling accretes one attribute space per pass —
// inherited from Python, identical in both languages, XML-harmless. Honest
// invariants: (1) cross-language parity at depth 2, (2) SEMANTIC idempotency.
const js1 = compileScene(src0, { jitter: 0 });
const js2 = compileScene(js1, { jitter: 0 });
const py1 = join(tmp, 'py1.svg'), py2p = join(tmp, 'py2.svg');
execFileSync('python3', [join(pkg, 'compile_scene.py'), SCENES[0],
  '--out', py1, '--jitter', '0'], { stdio: ['ignore', 'ignore', 'inherit'] });
execFileSync('python3', [join(pkg, 'compile_scene.py'), py1,
  '--out', py2p, '--jitter', '0'], { stdio: ['ignore', 'ignore', 'inherit'] });
const depth2 = js2 === readFileSync(py2p, 'utf8');
const bk = s => (s.match(/\brp b(\d+)\b/g) || []).join(',');
const semIdem = bk(js1) === bk(js2);
console.log('---------------------------------------------');
console.log(`jitter determinism (seed 42 == seed 42): ${a === b ? 'PASS' : 'FAIL'}`);
console.log(`jitter divergence  (seed 42 != seed 43): ${a !== c ? 'PASS' : 'FAIL'}`);
console.log(`depth-2 cross-language parity:           ${depth2 ? 'PASS' : 'FAIL'}`);
console.log(`semantic idempotency (buckets p1==p2):   ${semIdem ? 'PASS' : 'FAIL'}`);
if (a !== b || a === c || !depth2 || !semIdem) fail++;
rmSync(tmp, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
