# Corpus-A trace settings — DOD-G TG2

**Tracer:** vtracer 0.6.15 (pip, prebuilt wheel `cp313 macosx_11_0_arm64`).
Binding: `vtracer.convert_image_to_svg_py(image_path, out_path, **opts)`.

## LOCKED POLICY (GG5 · DOD-G Part 2, decisions A & B)

- **`color_precision = 8` — pinned.** It is the quality axis (tonal layering →
  soft edges). Lower values chunk soft content.
- **`layer_difference` — auto-tuned per asset** by `trace_scene.py` (ladder
  `[8,16,24,32,48,64]`), because path count is content-driven, so no fixed
  cell scales. cp buys softness; ld trims weight cheaply.
- **Pines demo cell (locked): `cp8 / ld32`** — 2,096 paths · 1.6 MB · ~880 ms
  compile. cp8 softness at production-range weight.
- **Measured jank ceiling: `cp8 / ld8`** — 4,367 paths · 3 MB · 3.5 s compile.
- **A1 aesthetic reference (decision C):** *Hasegawa Tōhaku, Pine Trees
  (Shōrin-zu byōbu)* — the sumi-e north-star TG6 ratings judge against. Style
  reference only; **never a published demo asset** (museum reproduction, fails
  the self-generated licensing rule).

## Baseline settings (apply to every Corpus-A trace unless the sweep says otherwise)

> Baseline = the sweep's starting values (historical; the `color_precision 6` below is superseded). Production pins `color_precision = 8` — see LOCKED POLICY above and `DEFAULT_POLICY` in `packages/scene-compiler/trace_scene.py`.

| opt | value |
|-----|-------|
| colormode | `color` |
| hierarchical | `stacked` |
| mode | `spline` |
| filter_speckle | `4` |
| color_precision | `6`  *(BITS, 1–8 — not a color count)* |
| layer_difference | `16` |
| corner_threshold | `60` |
| length_threshold | `4.0` |
| max_iterations | `10` |
| splice_threshold | `45` |
| path_precision | `8` |

`hierarchical='stacked'` + `colormode='color'` emit **flat `<path>` tags, each with
its own `fill="#hex"`, zero `<g>` groups** → fully `get_color`-compatible; the §7
group-fill boundary never triggers on vtracer output. Confirmed in TG2 smoke
(7760/7760 paths self-colored, 0 groups).

## Acceptance criteria — a trace is ACCEPTED when

1. **audit `attr-fb ≈ 0%` and `lum-fb ≈ 0%`** (`python3 audit_svg.py <trace>.svg`).
2. **path count lands ~500–6,000.** Production range is 1.3k–4.2k
   (1295/4236/1825/3345/4111). Below ~300 the reveal paints **chunky** (sparse
   trace uses few of the 100 buckets — pre-flight: a smooth synthetic gave 34
   paths / 29 buckets). Far above ~8k **flags weight** → see the quantization
   sweep (TG3) / same-bucket merging lever (map §7).
3. If out of range: raise detail via `layer_difference`↓ / `color_precision`↑;
   lower detail the other way. **Path count is content-driven** — smooth/soft
   content traces sparse, textured content traces heavy.

**Every trace records its exact settings next to the output — settings are data.**

## TG2 smoke result (synthetic textured 1024px raster, baseline settings)

```
paths 7760 · non-p 0 · attr-fb 0.0% · lum-fb 0.0% · buckets 100/100 (b0..b99)
groups 0 · every path self-colored: True
```
Contract verified. (7760 is above the acceptance ceiling — the synthetic carried
added noise texture; a real ~1024px raster at baseline is expected to land lower.
The point of the smoke was the *contract*, not the count.)

## Baseline audit row — five production scenes (report reference)

```
file              paths  non-p     kB   attr-fb  lum-fb  cmp ms  bkts
01-quiet-sun.svg   1295      0    494     0.0%    0.0%    55.3   100
02-vivid-sun.svg   4236      0   1112     0.0%    0.0%   687.0   100
03-bird.svg        1825      1    554     0.0%    2.0%   103.5   100
04-empty-rock.svg  3345      0   1034     0.0%    0.0%   485.3   100
05-girl.svg        4111      0   1108     0.0%    0.0%   612.9   100
```

**Bird note (DOD-A loose thread, now closed):** `03-bird.svg`'s 2.0% lum-fb =
36 paths with `fill="url(#…)"` gradient refs (36 gradients in a `<defs>`; 1
`fill="none"`; 1 `<rect>` = the non-path). 36/1825 = 1.97%. And 1825 `<path>` −
36 = **1789**, exactly the `.rp` DOM element count filed in DOD-A. Those 36
gradient-filled paths are the ones that hit the 0.5 luminance fallback *and*
drop out of the DOM index — a ~2% fallback share that has been visually
imperceptible for the site's whole life. Empirical anchor for GG4's contract
wording (small fallback shares harmless; structural ones are not).
