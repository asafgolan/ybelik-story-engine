// scene-tracer.js — @ybelik/scene-tracer core (ESM, environment-free).
// The auto-tune ladder from the retired trace_scene.py, wrapping wasm_vtracer.
// Wiring is injected: pass the glue module + wasm bytes/URL to initTracer.
export const DEFAULT_POLICY = {
  color_precision: 8,                       // pinned — the quality axis
  ld_ladder: [8, 16, 24, 32, 48, 64],       // layer_difference steps
  target_paths: [1500, 3500],               // the jank-safe band
  max_kb: 2048,                             // weight ceiling
  downscale_px: 1024,                       // one downscale retry when heavy
};
const MAX_ITERS = 4;

export async function initTracer({ glue, wasm }) {
  const bytes = (typeof wasm === 'string' || wasm instanceof URL)
    ? await fetch(wasm).then((r) => r.arrayBuffer()) : wasm;
  const { instance } = await WebAssembly.instantiate(bytes, { './wasm_vtracer_bg.js': glue });
  glue.__wbg_set_wasm(instance.exports);
  instance.exports.__wbindgen_start();
  return new Tracer(glue);
}

class Tracer {
  constructor(glue) { this.vt = glue; }
  _cfg(cp, ld) {
    const c = new this.vt.TracerConfig();
    c.setColorMode(0); c.setHierarchical(0); c.setPathSimplifyMode(1);
    c.setFilterSpeckle(4); c.setColorPrecision(cp); c.setLayerDifference(ld);
    c.setCornerThreshold(60); c.setLengthThreshold(4); c.setSpliceThreshold(45);
    c.setPathPrecision(3);
    return c;                                // fresh per call — the wasm consumes it
  }
  traceScene(rgba, width, height, opts = {}) {
    const P = Object.assign({}, DEFAULT_POLICY, opts.policy || {});
    let img = { rgba: new Uint8Array(rgba), width, height };
    let downscaled = false;
    let li = P.ld_ladder.indexOf(32); if (li < 0) li = Math.floor(P.ld_ladder.length / 2);
    let tried = [], svg, paths, kb;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < MAX_ITERS; i++) {
        svg = this.vt.convertImageToSvg(img.rgba.slice(0), img.width, img.height,
          this._cfg(P.color_precision, P.ld_ladder[li]));
        paths = (svg.match(/<path/g) || []).length;
        kb = Math.round(svg.length / 1024);
        tried.push('ld' + P.ld_ladder[li] + '=' + paths);
        if (paths < P.target_paths[0] && li > 0) { li--; continue; }
        if (paths > P.target_paths[1] && li < P.ld_ladder.length - 1) { li++; continue; }
        break;
      }
      if (kb > P.max_kb && !downscaled && Math.max(img.width, img.height) > P.downscale_px) {
        img = boxDownscale(img, P.downscale_px); downscaled = true;
        li = P.ld_ladder.indexOf(32); tried.push('downscaled');
        continue;
      }
      break;
    }
    let flag = '';
    if (paths < P.target_paths[0] && li === 0) flag = 'chunky-by-content';
    else if (paths > P.target_paths[1] || kb > P.max_kb) flag = 'over-ceiling';
    else if (li === 0 || li === P.ld_ladder.length - 1) flag = 'band-edge';
    const withBox = svg.includes('viewBox') ? svg
      : svg.replace('<svg', '<svg viewBox="0 0 ' + img.width + ' ' + img.height + '"');
    return { svg: withBox, settings: {
      color_precision: P.color_precision, layer_difference: P.ld_ladder[li],
      paths, kb, ladder: tried, flag, downscaled, width: img.width, height: img.height } };
  }
}

function boxDownscale({ rgba, width, height }, maxPx) {
  const s = maxPx / Math.max(width, height);
  const w = Math.max(1, Math.round(width * s)), h = Math.max(1, Math.round(height * s));
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.min(width - 1, Math.round(x / s)), sy = Math.min(height - 1, Math.round(y / s));
    const si = (sy * width + sx) * 4, di = (y * w + x) * 4;
    out[di] = rgba[si]; out[di+1] = rgba[si+1]; out[di+2] = rgba[si+2]; out[di+3] = rgba[si+3];
  }
  return { rgba: out, width: w, height: h };
}
