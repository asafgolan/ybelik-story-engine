# generate/ — pipeline stage 0
### text intent → styled raster · Cloudflare Workers AI · flux-1-schnell (Apache-2.0 outputs)

Completes the pipeline the extraction map opened with `TRACE (GAP)`:

```
GENERATE (this) → trace_scene → compile_scene → runtime
   intent            auto-tune      buckets        paints
```

The user no longer brings an image; they bring a **style + subject**. Prompt
engineering lives server-side in `styles.js` (the registry — same pattern as
SORT_KEYS / TRANSITIONS), versioned once, never scattered in clients.

## Deploy (once, ~5 min)

```bash
cd packages/generate
npx wrangler login                       # your Cloudflare account
npx wrangler secret put GENERATE_TOKENS  # comma-separated; mint one per consumer
npx wrangler deploy                      # → https://ybelik-generate.<acct>.workers.dev
curl <url>/health                        # → { ok, styles, model }
```

## Use

```bash
export GENERATE_ENDPOINT=https://ybelik-generate.<acct>.workers.dev
export GENERATE_TOKEN=<token>
python3 generate_scene.py --style sumi-e-hero \
  --subject "a solitary bird perched on a gnarled pine branch over still water" \
  --seeds 42-45 --name a1-bird --out ../../test-corpus/raster/
```

Each image lands with a `.settings.json` sidecar (style, subject, seed, steps,
model, endpoint) — settings-are-data, same rule as every other stage.

## Capacity (verified 2026-07)

flux-1-schnell bills 4.80 neurons per 512² tile + 9.60 per step →
1024² @ 4 steps ≈ **57.6 neurons/image**. Free daily allocation is 10,000
neurons on Free and Paid plans alike → **~173 images/day at $0**, resetting
00:00 UTC; overflow on Workers Paid at $0.011/1,000 neurons ≈ **$0.0006/image**.
That covers corpus work + a few starting customers on tokens.

## Gates (GEN — run after deploy)

**GEN1 · Deploy + auth. — PASS (2026-07-03).** `/health` lists 5 styles;
`/generate` without token → 401; with token → a 1024² JPEG + `X-Gen-Settings`.
Note: clients MUST send a non-default `User-Agent` — `urllib`'s default trips
Cloudflare's bot filter (403 error 1010); `generate_scene.py` sets one.

**GEN2 · Seed behavior recorded. — DETERMINISTIC (2026-07-03).** Same
style/subject/seed generated twice = byte-identical. Reproducibility holds
end-to-end: intent → image → trace → compiled SVG is a repeatable chain, so the
`.settings.json` sidecar is a **reproduction recipe**, not merely provenance.

**GEN3 · Full-pipeline splice (the first four-stage run). — PASS.** The A1 bird
batch (seeds 42–45) generated → `trace_scene` auto-converged in band (cp8,
ld 8/16/32) → `audit_svg` clean (0% fallbacks) → compiled → walked in scene-lab.
The DOD-G acceptance loop IS this component's QA; nothing new to build.

## Scope boundary (v0)

IN: the worker, the registry, the CLI, per-consumer bearer tokens.
OUT: any UI, customer portal, quotas/KV counters, R2 storage, image sizes
beyond model default. Token-per-customer is the entire multi-tenancy story
for v0. `GEN_DEFAULTS.model` is a constant — newer models (flux-2 family) are
a one-line swap, but schnell stays default while Apache-2.0 output licensing
is the publish requirement.

## Sequencing note

This is a **parallel leaf** — DOD-G (TP4–TP7) still owns the critical path
and is not interrupted by it. GEN3 naturally feeds DOD-G's spirit: every
generated image gets auto-validated by the corpus rig.
