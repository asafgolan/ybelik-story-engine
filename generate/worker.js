/*!
 * worker.js — generate_scene, pipeline stage 0, deployed on Cloudflare
 * Workers AI (@cf/black-forest-labs/flux-1-schnell; Apache-2.0 outputs).
 *
 * Contract:
 *   GET  /health            -> { ok, styles[] }            (no auth)
 *   POST /generate          -> image bytes (jpeg)          (Bearer auth)
 *        body: { style, subject, seed?, steps? }
 *        The style registry is enforced SERVER-side: clients send intent
 *        (style + subject), never raw prompts — that's the fixed-prompts-
 *        for-styles mechanism, and it keeps prompt engineering versioned
 *        here, not scattered in clients.
 *   Settings-are-data: the response carries X-Gen-Settings (JSON: style,
 *   seed, steps, model, promptChars) so clients can write the sidecar.
 *
 * Auth: one Bearer token per consumer via `wrangler secret put` —
 *   GENERATE_TOKENS = comma-separated list. Token-per-customer is the
 *   entire "few starting customers" mechanism for v0; real multi-tenancy
 *   (quotas, KV counters) is explicitly NOT v0.
 *
 * Capacity math (verified 2026-07): flux-1-schnell = 4.80 neurons per
 * 512x512 tile + 9.60 per step. 1024x1024 @ 4 steps ~= 57.6 neurons.
 * Free daily allocation 10,000 neurons ~= ~173 images/day at $0; beyond,
 * $0.011 / 1,000 neurons (~$0.0006/image) on Workers Paid.
 */
import { STYLES, GEN_DEFAULTS } from './styles.js';

const MAX_SUBJECT = 300;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, styles: Object.keys(STYLES), model: GEN_DEFAULTS.model });
    }

    if (request.method === 'POST' && url.pathname === '/generate') {
      if (!authorized(request, env)) return json({ error: 'unauthorized' }, 401);

      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'invalid JSON body' }, 400); }

      const { style, subject } = body;
      if (!STYLES[style])
        return json({ error: `unknown style; registered: ${Object.keys(STYLES).join(', ')}` }, 400);
      if (typeof subject !== 'string' || !subject.trim() || subject.length > MAX_SUBJECT)
        return json({ error: `subject required, 1..${MAX_SUBJECT} chars` }, 400);

      const seed = Number.isInteger(body.seed) && body.seed >= 0
        ? body.seed
        : Math.floor(Math.random() * 2 ** 31);
      const steps = Number.isInteger(body.steps)
        ? Math.min(8, Math.max(1, body.steps))
        : GEN_DEFAULTS.steps;

      const prompt = STYLES[style](subject.trim());

      let result;
      try {
        result = await env.AI.run(GEN_DEFAULTS.model, { prompt, seed, steps });
      } catch (e) {
        return json({ error: 'model call failed', detail: String(e) }, 502);
      }

      // Workers AI returns { image: <base64> }
      const bin = atob(result.image);
      const bytes = Uint8Array.from(bin, (c) => c.codePointAt(0));
      const settings = { style, seed, steps, model: GEN_DEFAULTS.model,
                         promptChars: prompt.length };

      return new Response(bytes, {
        headers: {
          'Content-Type': 'image/jpeg',
          'X-Gen-Settings': JSON.stringify(settings),
          'Cache-Control': 'no-store',
        },
      });
    }

    return json({ error: 'not found' }, 404);
  },
};

function authorized(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const valid = (env.GENERATE_TOKENS || '').split(',').map(t => t.trim()).filter(Boolean);
  return token && valid.includes(token);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
