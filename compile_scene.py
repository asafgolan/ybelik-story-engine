#!/usr/bin/env python3
r"""
compile_scene — Module A of the ybelik ink-wash story engine.
Extracted from svg/bucket_svg.py per reusable-components-extraction-map.md
(absorbs P1 get_color, P2 luminance, P3 bucket assigner, P4 class injector).

Turns a traced SVG into a scene-ready SVG: every <path> gets
class="rp bN" (N = 0..buckets-1) so the runtime (reveal-engine.js)
can paint it bucket by bucket, light -> dark by default.

FIDELITY vs svg/bucket_svg.py
  verbatim : path extraction regex (<path ...>, DOTALL) — <path> only;
             that is the trace contract
  verbatim : get_color resolution order (fill attr -> fill-in-style ->
             stroke attr -> stroke-in-style -> #808080), with
             none/transparent skipped
  verbatim : Rec.601 luminance and its 0.5 fallbacks (bad hex,
             short rgb(), named colors)
  verbatim : rank-even distribution round(rank*span/max(n-1,1)),
             stable-sort tie order, jitter clamp — and, critical for
             seeded reproducibility, jitter is drawn in RANK order,
             matching the original's RNG call sequence exactly
  verbatim : strip regex (\brp\s+b\d+\s*), empty-class cleanup, class
             prepend/insert, reverse-order rewrite. Idempotent: safe to
             re-run on already-bucketed files.
  additive : function API (svg_text in -> svg_text out) + CLI; the CLI
             never overwrites its input unless --in-place is explicit
  additive : seed — random.Random(seed) reproduces the exact sequence
             of `random.seed(seed)` + global randint in the original
             (same MT19937), which is what the GA2 parity test exploits
  additive : direction — 'light-to-dark' (verbatim: negated key) or
             'dark-to-light' (positive key)
  additive : buckets parameterized. Default 100 is verbatim and also
             the CEILING: the runtime contract (reveal-engine.js
             MAX_BUCKETS = 100, classes b0..b99). Values 2..100.
  seam     : SORT_KEYS registry, one entry (luminance). Future sorts —
             hue, saturation, spatial/centroid, size — register here;
             nothing downstream changes.

DOCUMENTED BOUNDARIES (inherited from the original, not fixed — map §7)
  - group-inherited fills are not resolved: a path colored only by a
    parent <g fill=...> falls to #808080 (mid bucket)
  - named colors / gradients / currentColor -> 0.5
  - opacity / fill-opacity are ignored by luminance
"""

import re
import random
import sys

MAX_BUCKETS = 100  # shared contract with reveal-engine.js (b0..b99)

PATH_RE = re.compile(r'<path\b[^>]*?>', re.DOTALL)


def get_color(tag):
    """Return fill color, falling back to stroke. Default to mid-gray. (verbatim)"""
    for attr in ('fill', 'stroke'):
        # attribute form: fill="#abc" or fill="rgb(...)"
        m = re.search(rf'\b{attr}="([^"]+)"', tag)
        if m and m.group(1) not in ('none', 'transparent'):
            return m.group(1)
        # style form: style="fill:#abc;..."
        m = re.search(rf'style="[^"]*\b{attr}\s*:\s*([^;"]+)', tag)
        if m and m.group(1).strip() not in ('none', 'transparent'):
            return m.group(1).strip()
    return '#808080'  # mid-gray fallback


def luminance(color):
    """Return 0..1 perceived brightness. 0 = black, 1 = white. (verbatim, Rec.601)"""
    c = color.strip().lower()
    if c.startswith('#'):
        c = c[1:]
        if len(c) == 3:
            c = ''.join(ch * 2 for ch in c)
        try:
            r, g, b = int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)
        except Exception:
            return 0.5
    elif c.startswith('rgb'):
        nums = re.findall(r'\d+', c)
        if len(nums) >= 3:
            r, g, b = map(int, nums[:3])
        else:
            return 0.5
    else:
        return 0.5  # named colors — skip
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255


# ── the seam: sort-key registry ──────────────────────────────────────
# A sort key maps a raw <path ...> tag string to one number.
# Adding a reveal axis later (hue, spatial, size, ...) = one entry here.
SORT_KEYS = {
    'luminance': lambda tag: luminance(get_color(tag)),
}

DIRECTIONS = ('light-to-dark', 'dark-to-light')


def compile_scene(svg_text,
                  sort='luminance',
                  direction='light-to-dark',
                  buckets=MAX_BUCKETS,
                  jitter=8,
                  seed=None):
    """
    Compile a traced SVG into a scene-ready SVG (string in -> string out).

    sort      : key in SORT_KEYS (currently: 'luminance')
    direction : 'light-to-dark' (default, verbatim behavior) or 'dark-to-light'
    buckets   : 2..100. Default 100 (b0..b99) — the runtime contract ceiling.
    jitter    : +/- buckets of organic randomization (0 = pure order)
    seed      : int for reproducible jitter; None = entropy-seeded
    """
    if sort not in SORT_KEYS:
        raise ValueError(f"unknown sort {sort!r}; registered: {sorted(SORT_KEYS)}")
    if direction not in DIRECTIONS:
        raise ValueError(f"direction must be one of {DIRECTIONS}")
    if not (2 <= buckets <= MAX_BUCKETS):
        raise ValueError(f"buckets must be 2..{MAX_BUCKETS} "
                         f"(runtime contract: reveal-engine.js b0..b{MAX_BUCKETS - 1})")
    if jitter < 0:
        raise ValueError("jitter must be >= 0")

    rng = random.Random(seed)
    keyfn = SORT_KEYS[sort]

    paths = list(PATH_RE.finditer(svg_text))
    n = len(paths)
    if n == 0:
        return svg_text  # nothing to do; caller may warn

    # Sort (stable; ties keep document order). Negated key = verbatim
    # light-first behavior; positive key = dark-first.
    if direction == 'light-to-dark':
        ranked = sorted(enumerate(paths), key=lambda x: -keyfn(x[1].group(0)))
    else:
        ranked = sorted(enumerate(paths), key=lambda x: keyfn(x[1].group(0)))

    # Assign evenly distributed buckets — jitter drawn in RANK order
    # (do not reorder this loop: seeded parity depends on call sequence).
    span = buckets - 1
    assignments = {}
    for rank, (orig_idx, _m) in enumerate(ranked):
        bucket = round(rank * span / max(n - 1, 1))
        if jitter:
            bucket = max(0, min(span, bucket + rng.randint(-jitter, jitter)))
        assignments[orig_idx] = bucket

    # Rewrite in reverse to keep string indices valid (verbatim).
    out = svg_text
    for i in range(n - 1, -1, -1):
        m = paths[i]
        bucket = assignments[i]
        original = m.group(0)
        # Strip any existing rp/bNN, then add fresh (idempotent).
        cleaned = re.sub(r'\brp\s+b\d+\s*', '', original)
        cleaned = re.sub(r'class="\s*"', '', cleaned)
        if 'class=' in cleaned:
            new = re.sub(r'class="([^"]*)"', f'class="rp b{bucket} \\1"', cleaned, count=1)
        else:
            new = cleaned.replace('<path', f'<path class="rp b{bucket}"', 1)
        out = out[:m.start()] + new + out[m.end():]

    return out


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(
        description='Compile a traced SVG into a scene-ready SVG (rp bN classes).')
    ap.add_argument('input', help='input SVG path')
    ap.add_argument('--out', help='output SVG path (required unless --in-place)')
    ap.add_argument('--in-place', action='store_true',
                    help='explicitly overwrite the input file')
    ap.add_argument('--sort', default='luminance', choices=sorted(SORT_KEYS))
    ap.add_argument('--direction', default='light-to-dark', choices=list(DIRECTIONS))
    ap.add_argument('--buckets', type=int, default=MAX_BUCKETS)
    ap.add_argument('--jitter', type=int, default=8)
    ap.add_argument('--seed', type=int, default=None)
    args = ap.parse_args(argv)

    import os
    in_path = os.path.abspath(args.input)
    if args.in_place:
        out_path = in_path
    elif args.out:
        out_path = os.path.abspath(args.out)
        if out_path == in_path:
            ap.error('--out equals the input path; pass --in-place if you mean it')
    else:
        ap.error('refusing to overwrite the input: pass --out PATH or --in-place')

    with open(in_path, encoding='utf-8') as f:
        svg_text = f.read()

    n = len(PATH_RE.findall(svg_text))
    if n == 0:
        print('warning: no <path> tags found — output equals input', file=sys.stderr)

    result = compile_scene(svg_text,
                           sort=args.sort,
                           direction=args.direction,
                           buckets=args.buckets,
                           jitter=args.jitter,
                           seed=args.seed)

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(result)

    seed_note = f', seed={args.seed}' if args.seed is not None else ''
    print(f'Found {n} paths · {args.sort} · {args.direction} · '
          f'{args.buckets} buckets · jitter={args.jitter}{seed_note}')
    print(f'Wrote {out_path}')


if __name__ == '__main__':
    main()
