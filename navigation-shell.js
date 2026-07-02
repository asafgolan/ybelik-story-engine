/*!
 * navigation-shell — Module D of the ybelik ink-wash story engine.
 * Extracted from index.html per reusable-components-extraction-map.md
 * (absorbs R6 scroll engagement, R7 gesture navigator, R8 progress
 * dots). Requires GSAP + ScrollTrigger. Drives a ScenePlayer (Module C)
 * through its public surface: next()/prev()/goTo(), the
 * onSceneChange/onBoundary callbacks, and — for two documented
 * production quirks — the public panels[]/captions[]/state.
 *
 * FIDELITY vs the inline original (index.html, post-F1–F4)
 *   verbatim : ENGAGE sequencing — sealing lock + body scroll lock,
 *              paint kicks at t=0 IN PARALLEL with the entry scroll
 *              (SEAM.ENTRY), `engaged` flips after the scroll lands
 *              and BEFORE the paint completes
 *   verbatim : DISENGAGE sequencing — current panel+caption fade
 *              WITHOUT clearing (the fade-no-clear quirk; done by the
 *              host via onExitForward/Backward), wait EXIT*0.25, then
 *              scroll out over SEAM.EXIT; forward lands on the exit
 *              section's optical line, backward on trigger top minus
 *              one viewport
 *   verbatim : smoothScrollTo — easeInOutQuad over rAF; instant when
 *              reduced motion / dy<1 / duration<=0 (F4 semantics)
 *   verbatim : ctaOpticalY — visible h1,h2,h3,p,a,button cluster,
 *              cluster midpoint minus 0.42 of the viewport (the eye's
 *              rest line, not geometric 0.5), with both fallbacks
 *   verbatim : gesture guards — wheel captures (preventDefault) while
 *              engaged OR sealing but steps only when engaged AND NOT
 *              sealing; wheel lock 350ms; deltaY threshold 4; touch
 *              threshold 30px with passive:false only on touchmove;
 *              keydown swallows during EXIT seal (engaged && sealing)
 *              but returns untouched during ENTRY seal (!engaged) —
 *              the production entry/exit asymmetry, preserved
 *   verbatim : step discipline — one gesture = one step; busy check
 *              BEFORE the cooldown so a blocked gesture never stamps
 *              the cooldown; the stamp lands AFTER the awaited step;
 *              boundary calls are fired un-awaited, then stamped
 *   verbatim : constants — cooldown 250ms, wheel lock 350ms, wheel
 *              threshold 4, touch threshold 30, SEAM {entry:800,
 *              exit:600}, ScrollTrigger 'top bottom-=20%'
 *   additive : everything is config with those verbatim defaults;
 *              ProgressDots BUILDS its spans from a count (descriptor-
 *              driven) instead of reading pre-declared HTML;
 *              destroy() on the navigator; classes instead of
 *              module-scope lets
 */
(function (global) {
  'use strict';

  function reducedMotion() {
    return typeof window !== 'undefined'
      && !!window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function assign(t) {
    for (var a = 1; a < arguments.length; a++) {
      var s = arguments[a];
      if (!s) continue;
      for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k];
    }
    return t;
  }

  /* ══════════════════════════════════════════════════════════════
     ScrollEngagement — R6. Owns engaged/sealing, the body scroll
     lock, the entry/exit seams, and the ScrollTrigger hook.
     ══════════════════════════════════════════════════════════════ */
  var SE_DEFAULTS = {
    trigger: null,                       // story <section> element (required)
    exitSelector: 'section.invitation',  // forward-exit landing section
    seam: { entry: 800, exit: 600 },     // ms (verbatim SEAM)
    scrollStart: 'top bottom-=20%',      // verbatim ScrollTrigger window
    scrollEnd: 'bottom bottom',
    onEngage: null,                      // () => Promise — start the entrance paint (t=0)
    onExitForward: null,                 // () => void — fade last scene (no clear)
    onExitBackward: null,                // () => void — fade first scene (no clear)
    onDisengaged: null                   // () => void — reset player view state
  };

  function ScrollEngagement(config) {
    this.cfg = assign({}, SE_DEFAULTS, config || {});
    if (!this.cfg.trigger) throw new Error('ScrollEngagement: trigger element required');
    if (typeof global.gsap === 'undefined' || typeof global.ScrollTrigger === 'undefined')
      throw new Error('ScrollEngagement: gsap + ScrollTrigger must load first');

    this.engaged = false;
    this.sealing = false;   // entering or leaving — input locked the whole time
    this.reduced = reducedMotion();

    global.gsap.registerPlugin(global.ScrollTrigger);
    var self = this;
    this._st = global.ScrollTrigger.create({
      trigger: this.cfg.trigger,
      start: this.cfg.scrollStart,
      end: this.cfg.scrollEnd,
      onEnter: function () { self.engage(); },
      onEnterBack: function () { self.engage(); }
    });
  }

  /* verbatim smoothScrollTo (easeInOutQuad over rAF, F4 instant path) */
  ScrollEngagement.prototype._smoothScrollTo = function (targetY, duration) {
    var self = this;
    return new Promise(function (resolve) {
      var startY = window.scrollY;
      var dy = targetY - startY;
      if (self.reduced || Math.abs(dy) < 1 || duration <= 0) {
        window.scrollTo(0, targetY); resolve(); return;
      }
      var t0 = performance.now();
      function frame(now) {
        var t = Math.min(1, (now - t0) / duration);
        var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
        window.scrollTo(0, startY + dy * e);
        if (t < 1) requestAnimationFrame(frame); else resolve();
      }
      requestAnimationFrame(frame);
    });
  };

  /* verbatim ctaOpticalY — optical (0.42) landing on the exit section */
  ScrollEngagement.prototype._exitY = function () {
    var trigger = this.cfg.trigger;
    var cta = document.querySelector(this.cfg.exitSelector);
    if (!cta) return trigger.offsetTop + trigger.offsetHeight + 1; // fallback: old behavior
    var items = Array.prototype.slice
      .call(cta.querySelectorAll('h1,h2,h3,p,a,button'))
      .filter(function (e) { return e.offsetHeight > 0; });
    if (!items.length) {
      return Math.max(0, cta.offsetTop + cta.offsetHeight / 2 - window.innerHeight / 2);
    }
    var tops = items.map(function (e) { return e.getBoundingClientRect().top + window.scrollY; });
    var bots = items.map(function (e) { return e.getBoundingClientRect().bottom + window.scrollY; });
    var clusterMid = (Math.min.apply(null, tops) + Math.max.apply(null, bots)) / 2;
    // 0.42 = optical center (eye's rest line), not geometric 0.5
    return Math.max(0, clusterMid - window.innerHeight * 0.42);
  };

  ScrollEngagement.prototype.engage = function () {
    var self = this;
    if (this.engaged || this.sealing) return Promise.resolve();
    this.sealing = true;
    document.body.style.overflow = 'hidden';
    var target = this.cfg.trigger.offsetTop;

    // Paint kicks at t=0 — parallel with the entry scroll (verbatim).
    var paintP = this.cfg.onEngage ? this.cfg.onEngage() : Promise.resolve();
    var scrollP = this._smoothScrollTo(target, this.cfg.seam.entry);

    return scrollP.then(function () {
      self.engaged = true; self.sealing = false;   // before the paint completes (verbatim)
      return paintP;
    });
  };

  ScrollEngagement.prototype.disengageForward = function () {
    var self = this;
    if (!this.engaged || this.sealing) return Promise.resolve();
    this.sealing = true;
    if (this.cfg.onExitForward) this.cfg.onExitForward();   // fade, no clear (quirk)
    return wait(Math.round(this.cfg.seam.exit * 0.25))
      .then(function () { return self._smoothScrollTo(self._exitY(), self.cfg.seam.exit); })
      .then(function () {
        document.body.style.overflow = '';
        self.engaged = false; self.sealing = false;
        if (self.cfg.onDisengaged) self.cfg.onDisengaged();
      });
  };

  ScrollEngagement.prototype.disengageBackward = function () {
    var self = this;
    if (!this.engaged || this.sealing) return Promise.resolve();
    this.sealing = true;
    if (this.cfg.onExitBackward) this.cfg.onExitBackward(); // fade, no clear (quirk)
    var target = Math.max(0, this.cfg.trigger.offsetTop - window.innerHeight);
    return wait(Math.round(this.cfg.seam.exit * 0.25))
      .then(function () { return self._smoothScrollTo(target, self.cfg.seam.exit); })
      .then(function () {
        document.body.style.overflow = '';
        self.engaged = false; self.sealing = false;
        if (self.cfg.onDisengaged) self.cfg.onDisengaged();
      });
  };

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ══════════════════════════════════════════════════════════════
     GestureNavigator — R7. Wheel / touch / keys → one step per
     gesture, with the verbatim capture/step split and cooldown
     discipline. Boundary routing lives in the host's onStep target
     (player.next()/prev() → onBoundary).
     ══════════════════════════════════════════════════════════════ */
  var GN_DEFAULTS = {
    engagement: null,           // ScrollEngagement (required): .engaged / .sealing
    onStep: null,               // (dir) => Promise — e.g. dir>0 ? player.next() : player.prev()
    isBusy: null,               // () => bool — e.g. () => player.state.busy
    cooldown: 250,              // ms (verbatim COOLDOWN_MS)
    wheelLock: 350,             // ms (verbatim inertia-tail lock)
    wheelThreshold: 4,          // |deltaY| minimum (verbatim)
    touchThreshold: 30,         // px swipe minimum (verbatim)
    downKeys: ['ArrowDown', 'PageDown', ' ', 'Spacebar', 'Enter'],  // verbatim
    upKeys: ['ArrowUp', 'PageUp']                                    // verbatim
  };

  function GestureNavigator(config) {
    this.cfg = assign({}, GN_DEFAULTS, config || {});
    if (!this.cfg.engagement) throw new Error('GestureNavigator: engagement required');
    if (typeof this.cfg.onStep !== 'function') throw new Error('GestureNavigator: onStep required');

    this._lastStepAt = 0;
    this._wheelLockUntil = 0;
    this._touchStartY = null;

    var self = this;

    /* wheel — capture while engaged OR sealing; step only when fully engaged (verbatim) */
    this._onWheel = function (e) {
      var g = self.cfg.engagement;
      if (!g.engaged && !g.sealing) return;   // outside slideshow → native scroll
      e.preventDefault();
      var now = performance.now();
      if (now < self._wheelLockUntil) return;
      if (Math.abs(e.deltaY) < self.cfg.wheelThreshold) return;
      self._wheelLockUntil = now + self.cfg.wheelLock;
      if (g.engaged && !g.sealing) self._attempt(e.deltaY > 0 ? 1 : -1);
    };

    /* touch (verbatim passive flags: only touchmove is active-preventing) */
    this._onTouchStart = function (e) {
      var g = self.cfg.engagement;
      if (g.engaged || g.sealing) self._touchStartY = e.touches[0].clientY;
    };
    this._onTouchMove = function (e) {
      var g = self.cfg.engagement;
      if (g.engaged || g.sealing) e.preventDefault();
    };
    this._onTouchEnd = function (e) {
      var g = self.cfg.engagement;
      if (!g.engaged || g.sealing || self._touchStartY === null) return;
      var dy = self._touchStartY - e.changedTouches[0].clientY;
      self._touchStartY = null;
      if (Math.abs(dy) >= self.cfg.touchThreshold) self._attempt(dy > 0 ? 1 : -1);
    };

    /* keys — entry/exit asymmetry preserved: no swallow during ENTRY seal
       (!engaged → plain return), swallow during EXIT seal (verbatim) */
    this._onKey = function (e) {
      var g = self.cfg.engagement;
      if (!g.engaged) return;
      if (g.sealing) { e.preventDefault(); return; }  // swallow keys mid-(exit)-seam
      if (self.cfg.downKeys.indexOf(e.key) !== -1) { e.preventDefault(); self._attempt(1); }
      else if (self.cfg.upKeys.indexOf(e.key) !== -1) { e.preventDefault(); self._attempt(-1); }
    };

    window.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('touchstart', this._onTouchStart, { passive: true });
    window.addEventListener('touchmove', this._onTouchMove, { passive: false });
    window.addEventListener('touchend', this._onTouchEnd, { passive: true });
    window.addEventListener('keydown', this._onKey);
  }

  /* One gesture = one step. Busy check BEFORE cooldown (a blocked
     gesture never stamps); stamp lands AFTER the awaited step (verbatim). */
  GestureNavigator.prototype._attempt = function (dir) {
    var self = this;
    var g = this.cfg.engagement;
    if (!g.engaged || g.sealing) return Promise.resolve();
    if (this.cfg.isBusy && this.cfg.isBusy()) return Promise.resolve();
    if (performance.now() < this._lastStepAt + this.cfg.cooldown) return Promise.resolve();
    return Promise.resolve(this.cfg.onStep(dir)).then(function () {
      self._lastStepAt = performance.now();
    });
  };

  GestureNavigator.prototype.destroy = function () {
    window.removeEventListener('wheel', this._onWheel, { passive: false });
    window.removeEventListener('touchstart', this._onTouchStart, { passive: true });
    window.removeEventListener('touchmove', this._onTouchMove, { passive: false });
    window.removeEventListener('touchend', this._onTouchEnd, { passive: true });
    window.removeEventListener('keydown', this._onKey);
  };

  /* ══════════════════════════════════════════════════════════════
     ProgressDots — R8. Builds its spans from a count (descriptor-
     driven) and toggles .active — verbatim markup shape.
     ══════════════════════════════════════════════════════════════ */
  function ProgressDots(container, count) {
    if (!container) throw new Error('ProgressDots: container required');
    this.container = container;
    this.dots = [];
    container.innerHTML = '';
    for (var i = 0; i < count; i++) {
      var s = document.createElement('span');
      s.setAttribute('data-dot', String(i));
      container.appendChild(s);
      this.dots.push(s);
    }
  }
  ProgressDots.prototype.setActive = function (active) {
    this.dots.forEach(function (d, i) {
      d.classList.toggle('active', i === active);
    });
  };

  /* exports */
  var api = {
    ScrollEngagement: ScrollEngagement,
    GestureNavigator: GestureNavigator,
    ProgressDots: ProgressDots
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else {
    global.ScrollEngagement = ScrollEngagement;
    global.GestureNavigator = GestureNavigator;
    global.ProgressDots = ProgressDots;
  }

})(typeof window !== 'undefined' ? window : this);
