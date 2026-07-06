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
