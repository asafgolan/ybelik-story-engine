#!/usr/bin/env python3
"""
GA2 — byte-parity oracle test for Module A.

For each of the five production scenes, runs BOTH implementations on the
same input and byte-compares the outputs:

  oracle : svg/bucket_svg.py — the original script, executed as-is except
           for three textual patches: FNAME -> a temp copy of the input,
           JITTER -> the test value, and (for the seeded case) a
           `random.seed(S)` injected right after its import line.
           The algorithm itself is untouched; it remains the oracle.
  new    : compile_scene() imported from compile_scene.py.

Two configurations per scene:
  A. jitter=0            — fully deterministic; parity here proves the
                           sort, distribution, strip and inject logic.
  B. jitter=8, seed=42   — proves the RNG call ORDER is preserved
                           (random.Random(42) must reproduce the global
                           random.seed(42) sequence, drawn in rank order).

Exit code 0 = all cases byte-identical. Any mismatch prints the first
divergence offset with context for triage.

Run from the repo root:  python3 packages/scene-compiler/tests/test_compile_parity.py
Requires: svg/bucket_svg.py present and UNMODIFIED (it is the oracle —
do not edit or delete it until this test is green).
"""

import re
import sys
import time
import tempfile
from pathlib import Path

PKG = Path(__file__).resolve().parents[1]     # packages/scene-compiler
REPO = Path(__file__).resolve().parents[3]    # repo root
ORACLE_PATH = PKG / 'oracle' / 'bucket_svg.py'

SCENES = [
    '01-quiet-sun.svg',
    '02-vivid-sun.svg',
    '03-bird.svg',
    '04-empty-rock.svg',
    '05-girl.svg',
]

CONFIGS = [
    ('jitter=0',          0, None),
    ('jitter=8 seed=42',  8, 42),
]

sys.path.insert(0, str(PKG))
from compile_scene import compile_scene  # noqa: E402


def run_oracle(oracle_src, svg_text, jitter, seed):
    """Execute the original script against a temp copy; return its output."""
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td) / 'scene.svg'
        tmp.write_text(svg_text, encoding='utf-8')

        # Textual patches — replacement via functions to avoid any
        # backslash-escape surprises in re.sub replacement strings.
        src = re.sub(r'FNAME = .*', lambda m: f'FNAME = {str(tmp)!r}',
                     oracle_src, count=1)
        src = re.sub(r'JITTER = .*', lambda m: f'JITTER = {jitter}',
                     src, count=1)
        if seed is not None:
            src = src.replace('import re, random',
                              f'import re, random\nrandom.seed({seed})', 1)

        # Shadow print so the oracle's own chatter stays out of our table.
        g = {'__name__': 'bucket_svg_oracle', 'print': lambda *a, **k: None}
        exec(compile(src, 'bucket_svg_oracle', 'exec'), g)

        return tmp.read_text(encoding='utf-8')


def first_divergence(a, b):
    limit = min(len(a), len(b))
    for i in range(limit):
        if a[i] != b[i]:
            return i
    return limit  # one is a prefix of the other


def main():
    if not ORACLE_PATH.exists():
        print(f'FATAL: oracle missing at {ORACLE_PATH}', file=sys.stderr)
        return 1
    oracle_src = ORACLE_PATH.read_text(encoding='utf-8')

    # Sanity: the two patch targets must still exist in the oracle source.
    if not re.search(r'FNAME = .*', oracle_src) or not re.search(r'JITTER = .*', oracle_src):
        print('FATAL: oracle source changed — FNAME/JITTER lines not found.\n'
              'The textual patch targets in this test assume the original\n'
              'bucket_svg.py. Re-check before trusting any result.',
              file=sys.stderr)
        return 1

    failures = 0
    print(f'{"scene":<22}{"config":<20}{"paths":>7}{"oracle":>9}{"new":>9}  result')
    print('-' * 78)

    for name in SCENES:
        path = REPO / 'demo' / 'svg' / name
        if not path.exists():
            print(f'{name:<22}{"—":<20}{"—":>7}{"—":>9}{"—":>9}  MISSING')
            failures += 1
            continue
        svg_text = path.read_text(encoding='utf-8')
        n = len(re.findall(r'<path\b', svg_text))

        for label, jitter, seed in CONFIGS:
            t0 = time.perf_counter()
            oracle_out = run_oracle(oracle_src, svg_text, jitter, seed)
            t1 = time.perf_counter()
            new_out = compile_scene(svg_text, jitter=jitter, seed=seed)
            t2 = time.perf_counter()

            ok = (oracle_out == new_out)
            verdict = 'PASS' if ok else 'FAIL'
            print(f'{name:<22}{label:<20}{n:>7}'
                  f'{(t1 - t0) * 1000:>8.0f}ms{(t2 - t1) * 1000:>8.0f}ms  {verdict}')

            if not ok:
                failures += 1
                i = first_divergence(oracle_out, new_out)
                lo = max(0, i - 30)
                print(f'    first divergence at offset {i} '
                      f'(oracle len {len(oracle_out)}, new len {len(new_out)})')
                print(f'    oracle: …{oracle_out[lo:i + 30]!r}…')
                print(f'    new   : …{new_out[lo:i + 30]!r}…')

    print('-' * 78)
    if failures:
        print(f'GA2: FAIL — {failures} case(s) diverged. Triage order: '
              f'RNG call order (rank-order jitter), sort-tie stability, '
              f'strip/inject regex drift.')
        return 1
    print('GA2: PASS — all cases byte-identical. '
          'bucket_svg.py may now be retired to reference status.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
