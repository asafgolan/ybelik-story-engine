# Quickstart

Two lanes. **Lane A**: see a reveal in two minutes, browser only, nothing to install.
**Lane B**: bring your own image through the Python trace stage — and reveal that instead.

## Lane A — two script tags, two minutes

Paste this into a blank `.html` file and open it in a browser (no server needed):

```html
<script src="https://unpkg.com/@ybelik/scene-compiler@0.1.0/scene-compiler.js"></script>
<script src="https://unpkg.com/@ybelik/reveal-engine@0.1.0/reveal-engine.js"></script>
<div id="stage" style="max-width:480px"></div>
<script>
  // a tiny traced-style scene: flat paths, own fills, light washes → dark ink
  const svg = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 210 Q200 150 400 220 L400 300 L0 300 Z" fill="#d9d2c4"/>
  <path d="M0 240 Q200 190 400 250 L400 300 L0 300 Z" fill="#bcb2a0"/>
  <path d="M40 250 Q60 170 90 250 Z" fill="#8f8574"/>
  <path d="M300 260 Q330 160 365 260 Z" fill="#6e6353"/>
  <path d="M150 265 Q185 130 225 265 Z" fill="#4a4238"/>
  <path d="M175 150 Q190 120 210 145 Q225 165 200 170 Q180 168 175 150 Z" fill="#2a251f"/>
  <path d="M195 90 L205 60 L215 92 Z" fill="#14110e"/>
</svg>`;
  const stage = document.getElementById('stage');
  stage.innerHTML = SceneCompiler.compileScene(svg, { jitter: 0 });
  const engine = new RevealEngine(stage);
  let level = -1;
  const timer = setInterval(() => {
    engine.setLevel(++level);
    if (level >= engine.bucketCount - 1) clearInterval(timer);
  }, 30);
</script>
```

The compiler sorts the paths by luminance and classes them `rp b0..b99`; the engine
paints them in tonal order — light washes first, ink last. Swap the inline SVG for any
traced SVG (Lane B makes one from your image).

**The full experience** — descriptor-driven player, scroll engagement, gestures, dots —
is the same pattern with more tags. Load orders live in each package's README
([scene-player](../packages/scene-player/README.md) ·
[navigation-shell](../packages/navigation-shell/README.md)); working, proven examples
are the [live pens](../codepens/README.md).

## Lane B — bring your own image (the Python trace stage)

```bash
git clone https://github.com/asafgolan/ybelik-story-engine.git
cd ybelik-story-engine
npx @ybelik/scene-tracer your-image.jpg your-scene.svg
python3 packages/scene-compiler/compile_scene.py your-scene.svg --out your-scene.compiled.svg --seed 42
```

`scene-tracer` auto-tunes the trace for you — `color_precision` pinned at 8 (the quality
axis), `layer_difference` walked down a ladder until the path count lands in the
jank-safe band — and prints the chosen cell, the ladder it walked, and any flag.
A `.settings.json` sidecar lands next to the trace: the full reproduction recipe.

Optional lint before you ship it anywhere:

```bash
python3 packages/scene-compiler/audit_svg.py your-scene.compiled.svg
```

What good looks like: `attr-fb ≈ 0%` · `lum-fb ≈ 0%` · 100 buckets · paths in the
1,500–3,500 band. The policy, the acceptance criteria, and why:
[TRACE-SETTINGS.md](../test-corpus/TRACE-SETTINGS.md).

**Reveal it:** paste your compiled SVG into Lane A's page in place of the inline scene —
or serve the repo (`python3 -m http.server 8000`) and walk it in `/labs/scene-lab.html`.

**No image at all?** Bring intent instead — a style + a subject. That's pipeline
stage 0: [packages/generate](../packages/generate/README.md).
