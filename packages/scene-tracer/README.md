# @ybelik/scene-tracer

Image → traced SVG, auto-tuned. The trace stage of the ybelik pipeline
(`generate → trace → compile → reveal` — see the [root README](../../README.md)):
a deterministic `layer_difference` ladder walks the trace until the path count lands
in the jank-safe band, then the result is ready for `@ybelik/scene-compiler`.

The vector core is [visioncortex vtracer](https://github.com/visioncortex/vtracer) via
`wasm_vtracer` — CLI-parity verified on real photographic input (identical path count
and render vs the native vtracer CLI). Succeeded the project's Python `trace_scene.py`
on 2026-07-16.

## CLI (Node)

```bash
npx @ybelik/scene-tracer image.png scene.svg
# or with a custom band / ceiling:
npx @ybelik/scene-tracer image.jpg scene.svg --min 1500 --max 3500 --max-kb 2048
```

Prints the chosen cell, the ladder it walked, and any flag; writes a
`scene.settings.json` sidecar — the full reproduction recipe (settings-are-data).
PNG and JPEG in; SVG (with `viewBox`) out.

## Browser (ESM, no build step)

```js
import * as glue from 'https://cdn.jsdelivr.net/npm/wasm_vtracer@0.2.0/wasm_vtracer_bg.js';
import { initTracer } from 'https://cdn.jsdelivr.net/npm/@ybelik/scene-tracer@0.1.0/scene-tracer.js';

const tracer = await initTracer({
  glue,
  wasm: 'https://cdn.jsdelivr.net/npm/wasm_vtracer@0.2.0/wasm_vtracer_bg.wasm',
});
const { svg, settings } = tracer.traceScene(imageData.data, imageData.width, imageData.height);
```

The visitor's device pays the CPU (~1–3 s per ladder step at 1024 px); nothing uploads.

## Policy

`DEFAULT_POLICY` — `color_precision: 8` (pinned) · `ld_ladder: [8,16,24,32,48,64]` ·
`target_paths: [1500, 3500]` · `max_kb: 2048` · `downscale_px: 1024`. Override any key
via `traceScene(..., { policy })`. Flags: `band-edge` · `over-ceiling` ·
`chunky-by-content` (features, not failures). The numbers' home — rationale and
acceptance criteria: [TRACE-SETTINGS.md](../../test-corpus/TRACE-SETTINGS.md).

MIT · part of the [ybelik story engine](https://github.com/asafgolan/ybelik-story-engine).
