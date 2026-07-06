#!/usr/bin/env python3
r"""
trace_scene — the TRACE stage of the ybelik pipeline (DOD-G Part 2, TP2).

Fills the `TRACE (GAP)` in reusable-components-extraction-map.md §1:
    TRACE (this) -> scene-compiler (compile_scene) -> runtime (reveal-engine)
Turns a raster into a scene-ready traced SVG at auto-tuned settings, so
Corpus A (and later every uploaded image) traces to a consistent, jank-safe
path budget without a human choosing a quantization cell per image.

DUAL-PURPOSE (why it's product, not scaffolding): built now to finish Corpus A
consistently; graduates to a package at the restructure; becomes the editor
prep-panel's "Auto" mode and the trace service's core. OUT OF SCOPE NOW: any
UI, HTTP service, or browser port.

POLICY (locked, GG5 · decisions A & B in dod-g-part2-handover.md)
  color_precision = 8      pinned — the quality axis (tonal layering -> soft
                           edges). Lower chunks soft content.
  layer_difference         auto-tuned per asset along ld_ladder, because path
                           count is content-driven (34 / 2,496 / 7,760 paths on
                           different content at one setting) so no fixed cell
                           scales. cp buys softness; ld trims weight cheaply.
  target_paths (1500,3500) production range, jank-safe (Yael: 1295..4236).
  max_kb 2048              weight ceiling; cp8/ld8 (3 MB) is the measured jank
                           point, kept OUT of band.

THE LOOP (deterministic, build-time only; converges in 2-4 trace/audit cycles)
  start ld=32 (mid-ladder, a sane first probe) ->
  trace -> count paths (PATH_RE, the same contract audit_svg uses) ->
    in band and kb<=max          -> STOP, this is the chosen cell
    paths above band OR kb>max    -> step ld UP the ladder   (higher ld -> fewer paths)
    paths below band              -> step ld DOWN the ladder (lower  ld -> more  paths)
  edge cases are FEATURES, not failures:
    ran off the heavy end (ld=64 still heavy) -> downscale source to ~1024px,
        retry the ladder once; still heavy -> FLAG 'over-ceiling'
    ran off the light end (ld=8 still sparse) -> FLAG 'chunky-by-content'
        (a GG3 envelope fact — the tuner normalizes settings, not content)
    band skipped between two adjacent cells   -> pick the cell nearest the
        band, FLAG 'band-edge'

DETERMINISM CHAIN: vtracer is deterministic per (input, settings) -> path count
is arithmetic -> the ladder is a fixed procedure -> compile_scene is seeded.
So: same image in => same settings + trace + compiled SVG out, forever.

Usage:
  from trace_scene import trace_scene
  svg, settings = trace_scene('img.png', out_svg='out.svg')   # writes out.svg + out.svg.settings.json
  python3 trace_scene.py img.png out.svg [--min 1500 --max 3500 --max-kb 2048]
Exit 0 on an in-band converge; exit 0 with a flagged settings file on an edge
case (a report tool, like audit_svg — flags are data, not errors).
"""
import os
import sys
import json
import tempfile

import vtracer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # same-dir import, cwd-independent
from compile_scene import PATH_RE      # <path> only — the trace contract, shared with audit_svg

# locked baseline for every opt EXCEPT color_precision / layer_difference
# (mirrors test-corpus/TRACE-SETTINGS.md)
BASE = dict(colormode="color", hierarchical="stacked", mode="spline",
            filter_speckle=4, corner_threshold=60, length_threshold=4.0,
            max_iterations=10, splice_threshold=45, path_precision=8)

DEFAULT_POLICY = dict(
    color_precision=8,                       # pinned
    ld_ladder=[8, 16, 24, 32, 48, 64],
    target_paths=(1500, 3500),
    max_kb=2048,
    downscale_px=1024,
)


def _trace_measure(image_path, cp, ld):
    """One deterministic probe: trace -> (svg_text, path_count, kb)."""
    fd, tmp = tempfile.mkstemp(suffix=".svg")
    os.close(fd)
    try:
        vtracer.convert_image_to_svg_py(image_path, tmp,
                                        color_precision=cp, layer_difference=ld, **BASE)
        svg = open(tmp, encoding="utf-8").read()
    finally:
        os.unlink(tmp)
    n = len(PATH_RE.findall(svg))
    kb = len(svg.encode("utf-8")) / 1024
    return svg, n, kb


def _downscaled_copy(image_path, max_px):
    """Downscale the longest side to ~max_px; returns a temp PNG path (caller unlinks)."""
    from PIL import Image
    im = Image.open(image_path)
    w, h = im.size
    scale = max_px / max(w, h)
    if scale >= 1.0:
        scale = max_px / max(w, h)  # only ever shrinks; if already small, this is a no-op resize
    im = im.convert("RGB").resize((max(1, round(w * scale)), max(1, round(h * scale))))
    fd, tmp = tempfile.mkstemp(suffix="_ds.png")
    os.close(fd)
    im.save(tmp)
    return tmp


def trace_scene(image_path, policy=None, out_svg=None):
    """Auto-tune layer_difference for image_path; return (svg_text, chosen_settings).

    chosen_settings carries the cell, the audit numbers, the iteration count,
    every ladder trial, and any flag — settings are data: the loop WRITES the
    choice a human used to make by eye."""
    p = {**DEFAULT_POLICY, **(policy or {})}
    ladder, (lo, hi), max_kb = p["ld_ladder"], p["target_paths"], p["max_kb"]
    cp = p["color_precision"]

    src = image_path
    downscaled = False
    tmp_src = None
    trials = []           # (ld, paths, kb) across the whole run, in order
    flag = None

    def band_distance(n):
        return 0 if lo <= n <= hi else (lo - n if n < lo else n - hi)

    start_idx = ladder.index(32) if 32 in ladder else len(ladder) // 2

    while True:
        idx = start_idx
        svg, n, kb = _trace_measure(src, cp, ladder[idx])
        trials.append((ladder[idx], n, kb))
        best = (idx, svg, n, kb)                      # closest-to-band seen this pass

        if lo <= n <= hi and kb <= max_kb:
            chosen = (idx, svg, n, kb)
            break

        # first probe fixes the walk direction (path count is monotone in ld):
        #   heavy -> +1 (up ladder, fewer paths) ; sparse -> -1 (down, more paths)
        direction = 1 if (n > hi or kb > max_kb) else -1
        start_heavy = direction == 1
        chosen = None
        while 0 <= idx + direction < len(ladder):
            idx += direction
            svg, n, kb = _trace_measure(src, cp, ladder[idx])
            trials.append((ladder[idx], n, kb))
            if band_distance(n) < band_distance(best[2]) or (band_distance(n) == 0):
                best = (idx, svg, n, kb)
            if lo <= n <= hi and kb <= max_kb:
                chosen = (idx, svg, n, kb)
                break
            # crossed the band without landing in it -> bracketed between cells
            crossed = (start_heavy and n < lo) or ((not start_heavy) and n > hi)
            if crossed:
                chosen = best
                flag = "band-edge"
                break
        if chosen is not None:
            break

        # ran off an end of the ladder without converging
        if start_heavy:
            if not downscaled:                        # heavy end: shrink source, retry ladder once
                tmp_src = _downscaled_copy(image_path, p["downscale_px"])
                src, downscaled = tmp_src, True
                continue
            chosen, flag = best, "over-ceiling"
            break
        chosen, flag = best, "chunky-by-content"      # light end: content is just sparse
        break

    idx, svg, n, kb = chosen
    settings = {
        "color_precision": cp,
        "layer_difference": ladder[idx],
        **BASE,
        "paths": n,
        "kb": round(kb, 1),
        "iterations": len(trials),
        "downscaled": downscaled,
        "flag": flag,
        "ladder_trials": [{"ld": t[0], "paths": t[1], "kb": round(t[2], 1)} for t in trials],
        "policy": {"target_paths": [lo, hi], "max_kb": max_kb, "ld_ladder": ladder},
    }

    if tmp_src:
        os.unlink(tmp_src)

    if out_svg:
        open(out_svg, "w", encoding="utf-8").write(svg)
        json.dump(settings, open(out_svg + ".settings.json", "w"), indent=2)

    return svg, settings


def main(argv):
    if len(argv) < 2:
        print("usage: trace_scene.py image.png out.svg "
              "[--min N --max N --max-kb N]")
        return 2
    image_path, out_svg = argv[0], argv[1]
    pol = {}
    for i, a in enumerate(argv):
        if a == "--min":     pol.setdefault("target_paths", list(DEFAULT_POLICY["target_paths"]))[0] = int(argv[i + 1])
        elif a == "--max":   pol.setdefault("target_paths", list(DEFAULT_POLICY["target_paths"]))[1] = int(argv[i + 1])
        elif a == "--max-kb": pol["max_kb"] = int(argv[i + 1])
    if "target_paths" in pol:
        pol["target_paths"] = tuple(pol["target_paths"])
    svg, s = trace_scene(image_path, pol or None, out_svg=out_svg)
    flagtxt = f"  FLAG: {s['flag']}" if s["flag"] else ""
    print(f"{os.path.basename(image_path)} -> {out_svg}")
    print(f"  chosen: cp{s['color_precision']}/ld{s['layer_difference']}  "
          f"{s['paths']} paths · {s['kb']:.0f} kB · {s['iterations']} iters"
          f"{'  (downscaled)' if s['downscaled'] else ''}{flagtxt}")
    print(f"  ladder: " + " ".join(f"ld{t['ld']}={t['paths']}" for t in s["ladder_trials"]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
