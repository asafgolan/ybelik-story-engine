# DOD-R · EDIT MANIFEST — implementation-grade companion to docs/dod-r-plan.md
### Harvested from disk 2026-07-06 by the analyzer (Opus). Executor: Claude Code on a simpler model.

## EXECUTOR CONTRACT — read before anything
1. **No discovery. No judgment. No improvement.** Every change below is an exact
   OLD→NEW pair or a complete replacement file. You never search for what to
   change; you match what is written here.
2. **Exact-match-or-STOP:** before each edit, verify the OLD block exists
   byte-for-byte (including indentation and double-spaces). If it does not
   match, DO NOT adapt — STOP and comment on the ticket with the diff you see.
   A mismatch means the repo drifted since this manifest; the analyzer re-syncs.
3. Apply in ticket order (TR0→TR5). Within TR2, apply in the order listed.
4. Anything not listed here and not in `dod-r-plan.md` is out of scope.
5. If the plan and this manifest disagree on a *value*, THIS manifest wins
   (it was read from disk later); on *scope*, the plan wins.

## VERIFIED STATE (2026-07-06)
- Branch: `main`. Repo flat, matches the plan's move map inventory.
- **Preconditions still open, in this order:** ① execute #8 (LICENSE/MIT — on
  main, before branching), ② commit `dod-r-plan.md` to root, ③ commit THIS
  file as `dod-r-edit-manifest.md` to root (both move to `docs/` in TR1).
- `audit_svg.py` carries a `# RESTRUCTURE BACKLOG:` comment block (Claude Code's
  annotation) — TR3's replacement file below intentionally supersedes it.
- `generate/generate_scene.py` gained a `User-Agent` header (Cloudflare 1010
  fix) and a single-path `load_env_file` — both accounted for below.

---

## TR1 — MOVES (complete command block; commit 1a = these only)

```bash
mkdir -p packages/{reveal-engine,scene-player,navigation-shell,themes} \
         packages/scene-compiler/{oracle,tests} demo labs docs
git mv reveal-engine.js        packages/reveal-engine/
git mv scene-player.js         packages/scene-player/
git mv scene-player.css        packages/scene-player/
git mv navigation-shell.js     packages/navigation-shell/
git mv theme-yael.css          packages/themes/
git mv compile_scene.py        packages/scene-compiler/
git mv audit_svg.py            packages/scene-compiler/
git mv trace_scene.py          packages/scene-compiler/
git mv test_compile_parity.py  packages/scene-compiler/tests/
git mv svg/bucket_svg.py       packages/scene-compiler/oracle/
git mv generate                packages/generate
git mv index.html              demo/
git mv story.json              demo/
git mv svg                     demo/svg
git mv bucket-lab.html         labs/
git mv scene-lab.html          labs/
git mv reusable-components-extraction-map.md dod-g-plan.md \
       dod-g-part2-handover.md generalization-report.md \
       live-images-tbd.md dod-r-plan.md dod-r-edit-manifest.md docs/
rm -rf __pycache__
git commit -m "restructure: moves only (pure renames) — packages/, demo/, labs/, docs/"
git show --stat HEAD | tail -1   # MUST end: 0 insertions(+), 0 deletions(-)
```
Then commit 1b (the only new file):
```bash
mkdir -p packages/entity-engine
cat > packages/entity-engine/README.md << 'EOF'
# entity-engine — engine #2 (scaffold)
The sequential/entity animation mode. Developing in the dev-quest repo per the
womb pattern (prototype inside a consumer, extract when proven); graduates
here. No code yet **by design** — this directory declares the destination.
EOF
git add packages/entity-engine/README.md
git commit -m "chore: entity-engine scaffold (declared home of engine #2)"
```

---

## TR2 — REFERENCE EDITS (exact pairs; apply top to bottom)

### 1 · demo/index.html — 4 edits
**1a** OLD (preserve the alignment double-spaces exactly):
```
  <link rel="preload" href="svg/01-quiet-sun.svg"  as="fetch" crossorigin />
  <link rel="preload" href="svg/02-vivid-sun.svg"  as="fetch" crossorigin />
  <link rel="preload" href="svg/03-bird.svg"       as="fetch" crossorigin />
  <link rel="preload" href="svg/04-empty-rock.svg" as="fetch" crossorigin />
  <link rel="preload" href="svg/05-girl.svg"       as="fetch" crossorigin />
```
NEW:
```
  <link rel="preload" href="/demo/svg/01-quiet-sun.svg"  as="fetch" crossorigin />
  <link rel="preload" href="/demo/svg/02-vivid-sun.svg"  as="fetch" crossorigin />
  <link rel="preload" href="/demo/svg/03-bird.svg"       as="fetch" crossorigin />
  <link rel="preload" href="/demo/svg/04-empty-rock.svg" as="fetch" crossorigin />
  <link rel="preload" href="/demo/svg/05-girl.svg"       as="fetch" crossorigin />
```
**1b** OLD:
```
  <link rel="stylesheet" href="theme-yael.css" />
  <link rel="stylesheet" href="scene-player.css" />
```
NEW:
```
  <link rel="stylesheet" href="/packages/themes/theme-yael.css" />
  <link rel="stylesheet" href="/packages/scene-player/scene-player.css" />
```
**1c** OLD:
```
  <script src="reveal-engine.js"></script>
  <script src="scene-player.js"></script>
  <script src="navigation-shell.js"></script>
```
NEW:
```
  <script src="/packages/reveal-engine/reveal-engine.js"></script>
  <script src="/packages/scene-player/scene-player.js"></script>
  <script src="/packages/navigation-shell/navigation-shell.js"></script>
```
**1d** OLD: `      const story = await fetch('story.json').then(r => {`
NEW:      `      const story = await fetch('/demo/story.json').then(r => {`

### 2 · demo/story.json — 5 edits (identical pattern)
OLD→NEW, one per scene, N = 01..05 with these exact names:
```
"asset": "svg/01-quiet-sun.svg"   → "asset": "/demo/svg/01-quiet-sun.svg"
"asset": "svg/02-vivid-sun.svg"   → "asset": "/demo/svg/02-vivid-sun.svg"
"asset": "svg/03-bird.svg"        → "asset": "/demo/svg/03-bird.svg"
"asset": "svg/04-empty-rock.svg"  → "asset": "/demo/svg/04-empty-rock.svg"
"asset": "svg/05-girl.svg"        → "asset": "/demo/svg/05-girl.svg"
```

### 3 · labs/scene-lab.html — 5 edits (incl. the GUARD FIX — a real bug catch)
**3a** OLD:
```
<link rel="stylesheet" href="theme-yael.css">      <!-- Module E: values -->
<link rel="stylesheet" href="scene-player.css">    <!-- Module C: structure -->
```
NEW:
```
<link rel="stylesheet" href="/packages/themes/theme-yael.css">      <!-- Module E: values -->
<link rel="stylesheet" href="/packages/scene-player/scene-player.css">    <!-- Module C: structure -->
```
**3b** OLD:
```
<script src="reveal-engine.js"></script>
<script src="scene-player.js"></script>
```
NEW:
```
<script src="/packages/reveal-engine/reveal-engine.js"></script>
<script src="/packages/scene-player/scene-player.js"></script>
```
**3c — THE GUARD FIX.** The current `?story=` guard REJECTS root-relative paths
(`q.charAt(0) !== '/'`), so the doctrine's `?story=/test-corpus/story-gen.json`
would silently fall back to the default. Rationale: allow root-relative, still
block full URLs (`://`) and protocol-relative (`//…`).
OLD:
```
  var storyUrl = 'story.json';
  try {
    var q = new URLSearchParams(location.search).get('story');
    if (q && q.indexOf('://') === -1 && q.charAt(0) !== '/') storyUrl = q;
  } catch (e) {}
```
NEW:
```
  var storyUrl = '/demo/story.json';
  try {
    var q = new URLSearchParams(location.search).get('story');
    // same-origin only: block absolute URLs (://) and protocol-relative (//…);
    // root-relative (/test-corpus/…) is the doctrine and MUST pass.
    if (q && q.indexOf('://') === -1 && q.slice(0, 2) !== '//') storyUrl = q;
  } catch (e) {}
```
**3d** OLD (JS comment): `  // ?story= picks the descriptor (default story.json) so the lab can walk any`
NEW: `  // ?story= picks the descriptor (default /demo/story.json) so the lab can walk any`
**3e** OLD (footer): `    compare against <b>index.html</b> in a second window (GC3).`
NEW: `    compare against <b>/demo/index.html</b> in a second window (GC3).`

### 4 · labs/bucket-lab.html — 3 edits
**4a** OLD: `<script src="reveal-engine.js"></script>`
NEW:      `<script src="/packages/reveal-engine/reveal-engine.js"></script>`
**4b** OLD (DEFAULT_STORY, preserve column alignment exactly):
```
      { id:'sc-01', name:'quiet sun',  asset:'svg/01-quiet-sun.svg',  enter:{ effect:'bucket-reveal', params:{ duration:1.6, ease:'power1.out' } } },
      { id:'sc-02', name:'vivid sun',  asset:'svg/02-vivid-sun.svg',  enter:{ effect:'bucket-reveal', params:{ duration:1.6, ease:'power1.out' } } },
      { id:'sc-03', name:'bird',       asset:'svg/03-bird.svg',       enter:{ effect:'bucket-reveal', params:{ duration:1.6, ease:'power1.out' } } },
      { id:'sc-04', name:'empty rock', asset:'svg/04-empty-rock.svg', enter:{ effect:'bucket-reveal', params:{ duration:1.6, ease:'power1.out' } } },
      { id:'sc-05', name:'girl',       asset:'svg/05-girl.svg',       enter:{ effect:'bucket-reveal', params:{ duration:1.6, ease:'power1.out' } } }
```
NEW: same five lines with each `asset:'svg/` → `asset:'/demo/svg/` (nothing else).
**4c** OLD: `    return fetch('story.json')`
NEW:      `    return fetch('/demo/story.json')`

### 5 · test-corpus story descriptors — one deterministic command, no hand edits
```bash
python3 - << 'PY'
import json, os
for f in ('test-corpus/story-gen.json', 'test-corpus/story-sweep.json',
          'test-corpus/story-gen.photos.json'):          # photos file is local-only; skip if absent
    if not os.path.exists(f): print('skip (absent):', f); continue
    d = json.load(open(f, encoding='utf-8'))
    n = 0
    for s in d.get('scenes', []):
        a = s.get('asset', '')
        if a and not a.startswith('/') and '://' not in a:
            s['asset'] = '/' + a; n += 1
    json.dump(d, open(f, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print(f, '->', n, 'assets rooted')
PY
```
Expected: story-gen ≈ every scene rooted; sweep = 9; photos file only if present.

### 6 · packages/scene-compiler/tests/test_compile_parity.py — 4 edits (path constants only)
**6a** OLD:
```
ROOT = Path(__file__).resolve().parent
ORACLE_PATH = ROOT / 'svg' / 'bucket_svg.py'
```
NEW:
```
PKG = Path(__file__).resolve().parents[1]     # packages/scene-compiler
REPO = Path(__file__).resolve().parents[3]    # repo root
ORACLE_PATH = PKG / 'oracle' / 'bucket_svg.py'
```
**6b** OLD: `sys.path.insert(0, str(ROOT))`
NEW:      `sys.path.insert(0, str(PKG))`
**6c** OLD: `        path = ROOT / 'svg' / name`
NEW:      `        path = REPO / 'demo' / 'svg' / name`
**6d** OLD (docstring): `Run from the repo root:  python3 test_compile_parity.py`
NEW: `Run from the repo root:  python3 packages/scene-compiler/tests/test_compile_parity.py`

### 7 · packages/scene-compiler/trace_scene.py — 1 edit (import hardening)
CLI runs survive the move (Python prepends the script's dir); this makes
*module* imports safe too. OLD:
```
import vtracer
from compile_scene import PATH_RE      # <path> only — the trace contract, shared with audit_svg
```
NEW:
```
import vtracer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # same-dir import, cwd-independent
from compile_scene import PATH_RE      # <path> only — the trace contract, shared with audit_svg
```

### 8 · packages/generate/generate_scene.py — 2 edits (loader depth + docstring)
**8a** The shipped loader is single-path, resolving ONE level up (= repo root
today, = `packages/` after the move → silently wrong). OLD:
```
        # generate/ -> repo root; resolve relative to THIS file, not the cwd
        path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
```
NEW:
```
        # packages/generate/ -> repo root (two levels up); resolve relative to
        # THIS file, not the cwd
        path = os.path.join(os.path.dirname(os.path.dirname(
            os.path.dirname(os.path.abspath(__file__)))), '.env')
```
**8b** OLD (docstring): `      --seeds 42-45 --name a1-bird --out ../test-corpus/raster/`
NEW: `      --seeds 42-45 --name a1-bird --out ../../test-corpus/raster/`
(Do NOT touch the `User-Agent` header block — it is the Cloudflare-1010 fix.)

### 9 · packages/generate/README.md — 2 edits
**9a** OLD: `cd generate` → NEW: `cd packages/generate`
**9b** OLD: `  --seeds 42-45 --name a1-bird --out ../test-corpus/raster/`
NEW: `  --seeds 42-45 --name a1-bird --out ../../test-corpus/raster/`

### 10 · root README.md — FULL REPLACEMENT (entire file becomes):
```markdown
# ybelik story engine

An ink-wash **view-transition** story engine — monorepo. Pipeline:

    generate → trace → compile → reveal
    (intent)   (auto)  (buckets)  (paints)

**Layout**

| path | what |
|---|---|
| `packages/reveal-engine` | Module B — runtime bucket reveal |
| `packages/scene-player` | Module C — view player (+ structural CSS) |
| `packages/navigation-shell` | Module D — scroll/gesture/dots |
| `packages/themes` | Module E — theme tokens (Yael's values) |
| `packages/scene-compiler` | Module A + trace stage: `compile_scene`, `trace_scene`, `audit_svg`, `oracle/`, `tests/` |
| `packages/generate` | stage 0 — Cloudflare Workers AI client + worker |
| `packages/entity-engine` | engine #2 scaffold (developing in dev-quest) |
| `demo/` | integrated proof: `index.html` + `story.json` + scenes |
| `labs/` | `bucket-lab` (Module B gate) · `scene-lab` (Module C gate, `?story=` picks a descriptor) |
| `docs/` | the extraction map (authoritative) + every DOD plan/report |
| `test-corpus/` | DOD-G corpus + `TRACE-SETTINGS.md` (policy mirror) |

**Run** (serve over http, not `file://`):

    python3 -m http.server 8000

then open `/demo/index.html`, `/labs/scene-lab.html`, `/labs/bucket-lab.html`.

**Docs** — start at [docs/reusable-components-extraction-map.md](docs/reusable-components-extraction-map.md)
(the module map; every extraction verdict). Generalization gate:
[docs/generalization-report.md](docs/generalization-report.md).

**License** — MIT, see [LICENSE](LICENSE).
```

### 11 · docs/reusable-components-extraction-map.md — APPEND (exact block, end of file):
```markdown

---

## Restructure addendum (DOD-R · engine-2.0-layout)

Flat root → monorepo. Module → package mapping:

| module | package |
|---|---|
| A · scene compiler (+ trace stage, audit/linter, oracle, parity tests) | `packages/scene-compiler/` |
| B · reveal-engine | `packages/reveal-engine/` |
| C · scene-player (+ structural CSS) | `packages/scene-player/` |
| D · navigation-shell | `packages/navigation-shell/` |
| E · theme tokens | `packages/themes/` |
| stage 0 · generate (worker + client + styles registry) | `packages/generate/` |
| engine #2 (sequential/entity) | `packages/entity-engine/` — scaffold; womb = dev-quest |

Consumer/demo → `demo/` · gate harnesses → `labs/` · plans/reports → `docs/`.
Path doctrine: dev serving from repo root; all page references root-relative.
Spec: `docs/dod-r-plan.md` + `docs/dod-r-edit-manifest.md`.
```

---

## TR3 — HYGIENE (complete replacements; no authoring by the executor)

### 3.1 · packages/scene-compiler/audit_svg.py — REPLACE ENTIRE FILE with:
```python
#!/usr/bin/env python3
r"""
audit_svg.py — input auditor / linter (DOD-G TG5; promoted reusable component).

Per SVG, reports the mechanical mis-bucket predictors BEFORE compiling:
  paths        — <path> tag count (compile_scene's contract: paths only)
  non-path     — other drawable tags the compiler will IGNORE (circle/rect/
                 polygon/ellipse/line/polyline) — high counts = hand-authored SVG
  kB           — file size
  attr-fb %    — paths whose own tag has NO usable fill/stroke (get_color would
                 return the #808080 fallback; the group-inherited-fill signature)
  lum-fb %     — paths whose resolved color luminance() can't parse (named
                 colors, url(#gradient), currentColor → the 0.5 fallback)
  compile ms   — timed compile_scene(seed=42) run
  buckets      — distinct buckets in the compiled output (spread sanity)

Mirrors compile_scene's own resolution logic by importing it (stays in sync).

API (DOD-R): audit_metrics(svg_text, kb=None) -> dict with raw numbers
  {paths, non_path, kb, attr_fb, lum_fb, compile_ms, buckets}
— consumed by trace_scene / the future editor input-linter. The CLI table is a
formatter over it; its output is byte-identical to the pre-refactor tool.
Usage: python3 audit_svg.py file.svg [more.svg ...] ; exit 0 always (report tool).
"""
import re, sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from compile_scene import PATH_RE, get_color, luminance, compile_scene

NONPATH_RE = re.compile(r'<(circle|rect|polygon|ellipse|line|polyline)\b', re.I)

def attr_resolvable(tag):
    """True if the path's OWN tag carries a usable fill/stroke (mirrors get_color)."""
    for attr in ('fill', 'stroke'):
        m = re.search(rf'\b{attr}="([^"]+)"', tag)
        if m and m.group(1) not in ('none', 'transparent'):
            return True
        m = re.search(rf'style="[^"]*\b{attr}\s*:\s*([^;"]+)', tag)
        if m and m.group(1).strip() not in ('none', 'transparent'):
            return True
    return False

def lum_resolvable(color):
    """True if luminance() parses this color (mirrors its branches)."""
    c = color.strip().lower()
    if c.startswith('#'):
        h = c[1:]
        if len(h) == 3: h = ''.join(ch * 2 for ch in h)
        try: int(h[0:2], 16); int(h[2:4], 16); int(h[4:6], 16); return True
        except Exception: return False
    if c.startswith('rgb'):
        return len(re.findall(r'\d+', c)) >= 3
    return False  # named colors, url(#...), currentColor -> 0.5 fallback

def audit_metrics(svg_text, kb=None):
    """Raw metrics dict — the machine-readable core (trace_scene / editor linter)."""
    tags = [m.group(0) for m in PATH_RE.finditer(svg_text)]
    n = len(tags)
    attr_fb = sum(1 for t in tags if not attr_resolvable(t))
    lum_fb = sum(1 for t in tags
                 if attr_resolvable(t) and not lum_resolvable(get_color(t)))
    t0 = time.time()
    compiled = compile_scene(svg_text, seed=42) if n else svg_text
    ms = (time.time() - t0) * 1000
    return {
        'paths': n,
        'non_path': len(NONPATH_RE.findall(svg_text)),
        'kb': kb,
        'attr_fb': attr_fb,
        'lum_fb': lum_fb,
        'compile_ms': ms,
        'buckets': len(set(re.findall(r'\brp b(\d+)\b', compiled))),
    }

def audit(path):
    """CLI row formatter over audit_metrics — output byte-identical to pre-refactor."""
    txt = open(path, encoding='utf-8').read()
    m = audit_metrics(txt, kb=os.path.getsize(path) / 1024)
    n = m['paths']
    pct = lambda x: f'{(100.0 * x / n):5.1f}%' if n else '    —'
    return (os.path.basename(path), n, m['non_path'], f"{m['kb']:8.0f}",
            pct(m['attr_fb']), pct(m['lum_fb']), f"{m['compile_ms']:7.1f}",
            m['buckets'])

def main(argv):
    if not argv:
        print('usage: audit_svg.py file.svg [...]'); return 0
    print(f'{"file":<34}{"paths":>7}{"non-p":>7}{"kB":>9}'
          f'{"attr-fb":>9}{"lum-fb":>9}{"cmp ms":>9}{"bkts":>6}')
    print('-' * 90)
    for p in argv:
        f, n, np_, kb, afb, lfb, ms, b = audit(p)
        print(f'{f:<34}{n:>7}{np_:>7}{kb:>9}{afb:>9}{lfb:>9}{ms:>9}{b:>6}')
    print('-' * 90)
    print('attr-fb: no own fill/stroke -> #808080 (group-fill signature) · '
          'lum-fb: unparseable color -> 0.5 (named/gradient)')
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
```
**Proof:** run the CLI on `demo/svg/03-bird.svg` before and after; diff must be
empty. Landmark row: `03-bird.svg  1825  1  …  0.0%  2.0%  …  100`.
(`cmp ms` may differ run-to-run — it is a timing; compare all columns EXCEPT it,
or run both twice and eyeball. Everything else must be byte-equal.)

### 3.2 · packages/scene-compiler/trace_scene.py — the downscale nit (1 pair)
OLD:
```
    scale = max_px / max(w, h)
    if scale >= 1.0:
        scale = max_px / max(w, h)  # only ever shrinks; if already small, this is a no-op resize
```
NEW:
```
    scale = max_px / max(w, h)
    # NOTE: if the source is already smaller than max_px this UPSCALES (scale > 1).
    # Theoretical here: this path only triggers on trace-HEAVY sources, which are
    # >= 1024px in practice; worst case downstream is an 'over-ceiling' flag.
```
(Behavior byte-identical — the removed branch recomputed the same value.)

### 3.3 · package.json stubs — 3 new files (MIT per issue #8's supersession)
`packages/reveal-engine/package.json`:
```json
{ "name": "@ybelik/reveal-engine", "version": "0.1.0",
  "main": "reveal-engine.js", "license": "MIT" }
```
`packages/scene-player/package.json`:
```json
{ "name": "@ybelik/scene-player", "version": "0.1.0",
  "main": "scene-player.js", "license": "MIT" }
```
`packages/navigation-shell/package.json`:
```json
{ "name": "@ybelik/navigation-shell", "version": "0.1.0",
  "main": "navigation-shell.js", "license": "MIT" }
```
⛔ STOP remains: Asaf confirms `@ybelik` on issue #5 before commit 3.

---

## VERIFICATION ANCHORS (TR0 baseline & TR4 must both hit these)
- Parity: `10/10`, paths column `1295 / 4236 / 1825 / 3345 / 4111`.
- Audit bird row: `1825 · 1 · 0.0% · 2.0% · 100` (the 36-gradient-path landmark).
- Labs: zero console errors; `?story=/test-corpus/story-gen.json` MUST load the
  corpus (if it loads the Yael default instead, guard fix 3c was missed).
- GR5 smoke: sidecar JSON lands next to /tmp outputs; `.env` resolved from root.

## MODEL ADVISORY
With this manifest, TR0–TR2 and TR4 are copy/paste + run — Haiku-class safe.
TR3 is copy/paste too (full files provided). The only judgment left anywhere is
STOP-on-mismatch, which is the desired behavior. If the executor ever "adapts"
an OLD block instead of stopping, that is the failure mode this document exists
to prevent — treat it as a gate failure.
