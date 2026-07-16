# ybelik story engine

[![npm](https://img.shields.io/npm/v/%40ybelik%2Freveal-engine?label=%40ybelik%2Freveal-engine)](https://www.npmjs.com/package/@ybelik/reveal-engine) [![npm](https://img.shields.io/npm/v/%40ybelik%2Fscene-player?label=%40ybelik%2Fscene-player)](https://www.npmjs.com/package/@ybelik/scene-player) [![npm](https://img.shields.io/npm/v/%40ybelik%2Fnavigation-shell?label=%40ybelik%2Fnavigation-shell)](https://www.npmjs.com/package/@ybelik/navigation-shell) [![npm](https://img.shields.io/npm/v/%40ybelik%2Fscene-compiler?label=%40ybelik%2Fscene-compiler)](https://www.npmjs.com/package/@ybelik/scene-compiler)

**live pens:** [live compile](https://codepen.io/asafgolan/pen/ZYLrzQO) · [bucket reveal](https://codepen.io/asafgolan/pen/MYJQgKy) · [scene player](https://codepen.io/asafgolan/pen/QwdQLyW) · [full shell](https://codepen.io/asafgolan/pen/bNgLbVP) · [all pens](https://codepen.io/asafgolan/pen/JoEpPGr) — index & recipes: [codepens/](codepens/README.md)

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

**Docs** — start at [docs/README.md](docs/README.md) — the index:
quickstart → API → architecture → history.

**License** — MIT, see [LICENSE](LICENSE).
