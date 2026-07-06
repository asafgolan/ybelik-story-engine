# Corpus B — wild hand-authored SVGs (robustness probe · DOD-G TG4)

License paper trail for the specimens that appear in the public generalization
report. **Every file here is Public Domain / CC0** (hard licensing rule). Fetched
2026-07-02 from Wikimedia Commons via `Special:FilePath`; license read from the
Commons API (`iiprop=extmetadata`, `LicenseShortName`).

These files are chosen to **make the compiler's fallbacks fire** — the inverted
acceptance test: a Corpus-B specimen that audits clean is the wrong specimen.
Compiled AS-IS (no trace) with `compile_scene(seed=42)` → `../compiled/`.

## Audit (raw, before compile)

```
file                     paths  non-p     kB   attr-fb  lum-fb  bkts   fires
B1-gradient-sphere.svg       5      0      9      0.0%  100.0%     5   lum-fb (gradients)
B2-groupfill-x29.svg       209      0     26     85.6%    0.0%    88   attr-fb (<g fill> inherit)
B3-shapebuilt-su47.svg      36     60     71      5.6%    0.0%    31   non-path (52 line + 8 polyline)
```

## Specimens

### B1 · gradient / named-color illustration → **lum-fb 100%**
- **File:** `B1-gradient-sphere.svg`
- **Source (Commons):** File:LGreen2 sphere.svg — https://commons.wikimedia.org/wiki/File:LGreen2_sphere.svg
- **Direct:** https://upload.wikimedia.org/wikipedia/commons/a/a5/LGreen2_sphere.svg
- **License:** Public domain · **Author:** Resident Mario
- **Signature:** all 5 paths filled with `url(#…)` gradient refs. `luminance()`
  can't parse a gradient → every path takes the **0.5 fallback** → 100% lum-fb.
  The gradient/named-color boundary (map §7), maxed out.

### B2 · group-fill icon (`<g fill>` inheritance) → **attr-fb 85.6%**
- **File:** `B2-groupfill-x29.svg`
- **Source (Commons):** File:Grumman X-29 3-view line art.svg — https://commons.wikimedia.org/wiki/File:Grumman_X-29_3-view_line_art.svg
- **Direct:** https://upload.wikimedia.org/wikipedia/commons/8/82/Grumman_X-29_3-view_line_art.svg
- **License:** Public domain · **Author:** Dryden Flight Research Center (NASA)
- **Signature:** a single `<g fill="#000000">` wraps bare `<path d="…"/>` tags that
  carry **no own fill/stroke**. `get_color` reads only the path's own tag → 85.6%
  of paths hit the **#808080 mid-gray fallback** → they collapse into one bucket
  (mush). This is the exact §7 group-inherited-fill boundary and the GG4 decision
  driver.

### B3 · shape-built line drawing (non-path) → **60 ignored elements**
- **File:** `B3-shapebuilt-su47.svg`
- **Source (Commons):** File:Sukhoi Su-47 outline.svg — https://commons.wikimedia.org/wiki/File:Sukhoi_Su-47_outline.svg
- **Direct:** https://upload.wikimedia.org/wikipedia/commons/a/ae/Sukhoi_Su-47_outline.svg
- **License:** Public domain · **Author:** Lukeroberts~commonswiki
- **Signature:** drawing built from **52 `<line>` + 8 `<polyline>`** plus 36
  `<path>`. `compile_scene`'s contract is `<path>` only — it **silently ignores
  60 of the 96 marks**. Reveals ~1/3 of the artwork. The "hand-authored SVG isn't
  paths" boundary; the audit's `non-p` column is the linter for it.

## Rejected candidates (audited clean → wrong specimen, per the inverted test)
- `Coat_of_arms_of_Nova_Scotia.svg` — 1273 paths, 0.0%/0.0% (self-filled). Clean.
- `Coat_of_arms_of_Seychelles.svg` — 257 paths, 0.4% attr-fb. Too clean.
- `Inkscape_radial_gradient_test_1.svg` — 0 `<path>` (all `<rect>`/`<circle>`);
  compiler ignores the whole file → empty audit, not an informative fallback.
