/*!
 * scene-compiler.js — JS port of compile_scene.py (Module A) for
 * @ybelik/scene-compiler. Browser global `SceneCompiler` + CommonJS.
 *
 * PARITY CONTRACT: byte-identical output to compile_scene.py at jitter=0
 * (gate: tests/parity_js.mjs vs the Python oracle, live). Jitter>0 is a
 * DECLARED DEVIATION: seeded mulberry32 (deterministic within JS; not
 * cross-language — MT19937 was not ported, aesthetic noise only), drawn
 * in RANK order per the original's call-sequence doctrine.
 *
 * Port hazards honored: pyRound (Python banker's rounding — Math.round
 * would mis-bucket exact .5 ranks), strict hex parsing (parseInt's silent
 * truncation vs int(x,16) throwing), replace-all vs first-only sub
 * semantics, stable-sort tie order, fresh /g regex per call.
 */
(function (global) {
  'use strict';

  var MAX_BUCKETS = 100; // shared contract with reveal-engine.js (b0..b99)

  /* Python round(): half-to-even. x >= 0 here. */
  function pyRound(x) {
    var f = Math.floor(x), d = x - f;
    if (d < 0.5) return f;
    if (d > 0.5) return f + 1;
    return (f % 2 === 0) ? f : f + 1;
  }

  /* mulberry32 — the declared jitter RNG (seeded, JS-deterministic). */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexPair(s) {
    if (s.length === 0 || !/^[0-9a-f]+$/.test(s)) return null;
    return parseInt(s, 16);
  }

  /* verbatim mirror of get_color: fill attr -> fill-in-style ->
     stroke attr -> stroke-in-style -> #808080 */
  function getColor(tag) {
    var attrs = ['fill', 'stroke'];
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      var m = tag.match(new RegExp('\\b' + attr + '="([^"]+)"'));
      if (m && m[1] !== 'none' && m[1] !== 'transparent') return m[1];
      m = tag.match(new RegExp('style="[^"]*\\b' + attr + '\\s*:\\s*([^;"]+)'));
      if (m) {
        var v = m[1].trim();
        if (v !== 'none' && v !== 'transparent') return v;
      }
    }
    return '#808080';
  }

  /* verbatim mirror of luminance: Rec.601, 0.5 fallbacks */
  function luminance(color) {
    var c = color.trim().toLowerCase();
    var r, g, b;
    if (c.charAt(0) === '#') {
      c = c.slice(1);
      if (c.length === 3) c = c.split('').map(function (ch) { return ch + ch; }).join('');
      r = hexPair(c.slice(0, 2)); g = hexPair(c.slice(2, 4)); b = hexPair(c.slice(4, 6));
      if (r === null || g === null || b === null) return 0.5;
    } else if (c.slice(0, 3) === 'rgb') {
      var nums = c.match(/\d+/g);
      if (nums && nums.length >= 3) {
        r = Number(nums[0]); g = Number(nums[1]); b = Number(nums[2]);
      } else return 0.5;
    } else {
      return 0.5; // named colors — skip
    }
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  var SORT_KEYS = {
    luminance: function (tag) { return luminance(getColor(tag)); }
  };
  var DIRECTIONS = ['light-to-dark', 'dark-to-light'];

  function compileScene(svgText, opts) {
    opts = opts || {};
    var sort = opts.sort !== undefined ? opts.sort : 'luminance';
    var direction = opts.direction !== undefined ? opts.direction : 'light-to-dark';
    var buckets = opts.buckets !== undefined ? opts.buckets : MAX_BUCKETS;
    var jitter = opts.jitter !== undefined ? opts.jitter : 8;
    var seed = opts.seed !== undefined ? opts.seed : null;

    if (!SORT_KEYS.hasOwnProperty(sort))
      throw new Error("unknown sort '" + sort + "'; registered: " +
                      Object.keys(SORT_KEYS).sort().join(', '));
    if (DIRECTIONS.indexOf(direction) === -1)
      throw new Error('direction must be one of ' + DIRECTIONS.join(' | '));
    if (!(buckets >= 2 && buckets <= MAX_BUCKETS))
      throw new Error('buckets must be 2..' + MAX_BUCKETS +
                      ' (runtime contract: reveal-engine.js b0..b' + (MAX_BUCKETS - 1) + ')');
    if (jitter < 0) throw new Error('jitter must be >= 0');

    var rand = mulberry32(seed === null ? (Math.random() * 4294967296) >>> 0 : seed);
    function randint(a, b) { return Math.floor(rand() * (b - a + 1)) + a; }

    var keyfn = SORT_KEYS[sort];
    var re = /<path\b[^>]*?>/g;                 // DOTALL dropped: no '.' in pattern
    var matches = [];
    var m;
    while ((m = re.exec(svgText)) !== null)
      matches.push({ index: m.index, text: m[0] });
    var n = matches.length;
    if (n === 0) return svgText;

    var items = matches.map(function (mm, i) {
      return { i: i, k: keyfn(mm.text) };       // key computed ONCE (mirrors key=)
    });
    var ranked = items.slice().sort(direction === 'light-to-dark'
      ? function (a, b) { return b.k - a.k; }   // ≡ sorted(key=-k), stable ties
      : function (a, b) { return a.k - b.k; });

    var span = buckets - 1;
    var denom = Math.max(n - 1, 1);
    var assignments = new Array(n);
    for (var rank = 0; rank < n; rank++) {      // jitter drawn in RANK order
      var bucket = pyRound(rank * span / denom);
      if (jitter) bucket = Math.max(0, Math.min(span, bucket + randint(-jitter, jitter)));
      assignments[ranked[rank].i] = bucket;
    }

    var out = svgText;                          // reverse rewrite (verbatim)
    for (var i = n - 1; i >= 0; i--) {
      var mt = matches[i];
      var bucket2 = assignments[i];
      var cleaned = mt.text.replace(/\brp\s+b\d+\s*/g, '')
                           .replace(/class="\s*"/g, '');
      var neu;
      if (cleaned.indexOf('class=') !== -1)
        neu = cleaned.replace(/class="([^"]*)"/, 'class="rp b' + bucket2 + ' $1"');
      else
        neu = cleaned.replace('<path', '<path class="rp b' + bucket2 + '"');
      out = out.slice(0, mt.index) + neu + out.slice(mt.index + mt.text.length);
    }
    return out;
  }

  /* auditMetrics — the linter half (mirrors audit_svg.audit_metrics). */
  var NONPATH_RE = /<(circle|rect|polygon|ellipse|line|polyline)\b/gi;
  function attrResolvable(tag) {
    var attrs = ['fill', 'stroke'];
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      var m = tag.match(new RegExp('\\b' + attr + '="([^"]+)"'));
      if (m && m[1] !== 'none' && m[1] !== 'transparent') return true;
      m = tag.match(new RegExp('style="[^"]*\\b' + attr + '\\s*:\\s*([^;"]+)'));
      if (m && m[1].trim() !== 'none' && m[1].trim() !== 'transparent') return true;
    }
    return false;
  }
  function lumResolvable(color) {
    var c = color.trim().toLowerCase();
    if (c.charAt(0) === '#') {
      var h = c.slice(1);
      if (h.length === 3) h = h.split('').map(function (ch) { return ch + ch; }).join('');
      return hexPair(h.slice(0, 2)) !== null && hexPair(h.slice(2, 4)) !== null &&
             hexPair(h.slice(4, 6)) !== null;
    }
    if (c.slice(0, 3) === 'rgb') return (c.match(/\d+/g) || []).length >= 3;
    return false;
  }
  function auditMetrics(svgText, opts) {
    opts = opts || {};
    var re = /<path\b[^>]*?>/g, tags = [], m;
    while ((m = re.exec(svgText)) !== null) tags.push(m[0]);
    var n = tags.length, attrFb = 0, lumFb = 0;
    for (var i = 0; i < n; i++) {
      if (!attrResolvable(tags[i])) attrFb++;
      else if (!lumResolvable(getColor(tags[i]))) lumFb++;
    }
    var t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    var compiled = n ? compileScene(svgText, { seed: 42 }) : svgText;
    var ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
    var bset = {}, bm, bre = /\brp b(\d+)\b/g;
    while ((bm = bre.exec(compiled)) !== null) bset[bm[1]] = 1;
    return { paths: n, non_path: (svgText.match(NONPATH_RE) || []).length,
             kb: opts.kb !== undefined ? opts.kb : null,
             attr_fb: attrFb, lum_fb: lumFb, compile_ms: ms,
             buckets: Object.keys(bset).length };
  }

  var api = { compileScene: compileScene, auditMetrics: auditMetrics,
              luminance: luminance, getColor: getColor,
              SORT_KEYS: SORT_KEYS, MAX_BUCKETS: MAX_BUCKETS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.SceneCompiler = api;

})(typeof window !== 'undefined' ? window : this);
