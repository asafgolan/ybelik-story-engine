/*!
 * RevealEngine — Module B of the ybelik ink-wash story engine.
 * Extracted from index.html per reusable-components-extraction-map.md
 * (absorbs R2 delta-write core + R10 reduced-motion policy hook).
 * Zero dependencies. DOM only.
 *
 * CONTRACT
 *   The container holds an inline SVG whose paths carry class="rp bN"
 *   (N = 0..99), as produced by svg/bucket_svg.py. Page CSS must hide
 *   the base state:  .rp { opacity: 0; }
 *   The engine flips inline per-path opacity, delta-only: only buckets
 *   that cross the threshold are touched.
 *
 * FIDELITY vs the inline original (index.html)
 *   verbatim : the delta-write loop bodies and cursor semantics
 *              (lastLevel[] → this._level), including string '1'/'0'
 *              opacity writes.
 *   verbatim : bucket regex — first `b<digits>` in the class attribute,
 *              exactly as production:  /b(\d+)/
 *   additive : setLevel() rounds + clamps to [-1, 99]. Production's
 *              caller did the rounding (paintPanel: Math.round(obj.v));
 *              moving it inside keeps drivers simpler and behavior
 *              identical.
 *   additive : bucketCount / pathCount discovered from the SVG on scan.
 *   additive : rescan() for re-injected content (view swaps).
 *   policy   : RevealEngine.reducedMotion — drivers should branch on
 *              this and call fill() instead of tweening (the corrected
 *              R10 semantics: reduce motion, keep function).
 */
(function (global) {
  'use strict';

  var MAX_BUCKETS = 100; // bucket_svg.py contract: b0..b99

  function RevealEngine(container) {
    if (!container) throw new Error('RevealEngine: container element required');
    this.container = container;
    this.rescan();
  }

  /**
   * (Re)index all .rp paths in the container into buckets.
   * Call after injecting new SVG content into the same container.
   * Returns this, so `new RevealEngine(host)` and `engine.rescan()`
   * compose the same way.
   */
  RevealEngine.prototype.rescan = function () {
    this.buckets = [];
    for (var i = 0; i < MAX_BUCKETS; i++) this.buckets.push([]);

    var maxSeen = -1;
    var paths = 0;
    var els = this.container.querySelectorAll('.rp');
    for (var j = 0; j < els.length; j++) {
      var el = els[j];
      var m = (el.getAttribute('class') || '').match(/b(\d+)/); // verbatim production regex
      if (!m) continue;
      var b = +m[1];
      if (b < 0 || b >= MAX_BUCKETS) continue;
      this.buckets[b].push(el);
      if (b > maxSeen) maxSeen = b;
      paths++;
    }

    this.bucketCount = maxSeen + 1; // discovered from the SVG
    this.pathCount = paths;
    this._level = -1;               // cursor for delta updates (was lastLevel[i])
    return this;
  };

  /**
   * Show buckets 0..level, hide the rest. Delta-only writes —
   * production logic, verbatim inside the loops.
   */
  RevealEngine.prototype.setLevel = function (level) {
    level = Math.max(-1, Math.min(MAX_BUCKETS - 1, Math.round(level)));
    var prev = this._level;
    if (level === prev) return;            // no-op when nothing changed
    var b = this.buckets;
    if (level > prev) {
      for (var k = prev + 1; k <= level; k++)
        for (var x = 0; x < b[k].length; x++) b[k][x].style.opacity = '1';
    } else {
      for (var k2 = prev; k2 > level; k2--)
        for (var y = 0; y < b[k2].length; y++) b[k2][y].style.opacity = '0';
    }
    this._level = level;
  };

  RevealEngine.prototype.fill  = function () { this.setLevel(MAX_BUCKETS - 1); };
  RevealEngine.prototype.clear = function () { this.setLevel(-1); };

  Object.defineProperty(RevealEngine.prototype, 'level', {
    get: function () { return this._level; }
  });

  /**
   * R10 policy hook. Drivers branch on this and call fill() instead of
   * tweening. Reduce motion, keep function.
   */
  Object.defineProperty(RevealEngine, 'reducedMotion', {
    get: function () {
      return typeof window !== 'undefined'
        && !!window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  });

  // UMD-lite: CommonJS or global.
  if (typeof module !== 'undefined' && module.exports) module.exports = RevealEngine;
  else global.RevealEngine = RevealEngine;

})(typeof window !== 'undefined' ? window : this);
