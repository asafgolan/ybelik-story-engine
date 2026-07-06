/*!
 * styles.js — the STYLE REGISTRY for generate_scene (pipeline stage 0).
 *
 * Same pattern as compile_scene's SORT_KEYS and scene-player's TRANSITIONS:
 * a validated registry with few entries and a clear seam. A style is a
 * prompt TEMPLATE with a subject slot — the "fixed prompts for styles"
 * mechanism. Every clause below is load-bearing, learned in DOD-G:
 *
 *   "strong mid-tone washes"      -> guards the pale-Tōhaku trap
 *                                    (washed-out -> sparse trace -> chunky)
 *   "dry-brush / granulation"     -> texture drives path count drives
 *                                    reveal smoothness (pre-flight lesson)
 *   "no border/frame/seal/text"   -> prevents trace artifacts (schnell has
 *                                    no negative prompt; everything must
 *                                    live in the positive)
 *   dark linework clauses         -> late buckets get their ink-lands-last
 *
 * Adding a style = one entry here. Nothing downstream changes: the worker
 * validates against the registry; trace_scene/audit/compile are style-blind.
 */

export const STYLES = {
  // The home style — authentic negative space (ma) allowed.
  'sumi-e': (subject) =>
    `Traditional Japanese sumi-e ink wash painting of ${subject}. ` +
    `Continuous tonal range from warm paper white through soft gray washes ` +
    `and mid-gray tones to dense black ink linework. Strong mid-tone washes, ` +
    `not washed out. Dry-brush texture, ink granulation on paper, confident ` +
    `calligraphic strokes. Full-bleed, no border, no frame, no seal, no text, ` +
    `no signature.`,

  // Hero variant — composition clause guards against large empty fields.
  'sumi-e-hero': (subject) =>
    `Traditional Japanese sumi-e ink wash painting of ${subject}. ` +
    `Balanced composition, subject structure spanning the frame. ` +
    `Continuous tonal range from warm paper white through soft gray washes ` +
    `and mid-gray tones to dense black ink linework. Strong mid-tone washes, ` +
    `dry-brush texture, ink granulation on paper, misty atmospheric depth ` +
    `in the background. Full-bleed, no border, no frame, no seal, no text.`,

  // Adjacent style from the Corpus-A matrix (A2) — swap-in ready.
  'watercolor': (subject) =>
    `Loose watercolor painting of ${subject} on textured paper. Layered ` +
    `translucent washes with rich mid-tones, granulation and pigment ` +
    `blooms, soft wet-in-wet edges with a few darker defined accents. ` +
    `Full-bleed, no border, no frame, no text, no signature.`,

  // Flat graphic / poster (A3) — deliberately few tones + hard edges. Expected
  // to trace SPARSE (large uniform regions -> few paths -> chunky reveal, maybe
  // trace_scene's 'chunky-by-content' flag). That chunkiness IS the envelope
  // finding, not a prompt bug — no texture clause here on purpose.
  'poster': (subject) =>
    `Flat graphic poster illustration of ${subject}. Bold flat color fields, ` +
    `hard clean edges, a limited palette of a few solid tones, large uniform ` +
    `regions, simple geometric mid-century composition. ` +
    `Full-bleed, no border, no frame, no text, no signature.`,

  // Line art / pen sketch (A6) — near-binary (dark ink on paper). Tests the thin
  // end of light->dark: few mid-tones, so bucketing collapses and the reveal is
  // mostly on/off rather than a wash. The collapse is the finding.
  'line-art': (subject) =>
    `Minimal pen-and-ink line drawing of ${subject}. Black ink contour lines ` +
    `on warm white paper, sparse confident linework with a little cross-hatching ` +
    `for shadow, mostly open white space, no color, no wash, no fill. ` +
    `Full-bleed, no border, no frame, no text, no signature.`,
};

export const GEN_DEFAULTS = {
  model: '@cf/black-forest-labs/flux-1-schnell', // Apache-2.0 outputs — publish-clean
  steps: 4,                                      // schnell's ceiling is 8; 4 = its sweet spot
};
