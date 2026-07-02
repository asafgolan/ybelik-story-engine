/*!
 * ScenePlayer — Module C of the ybelik ink-wash story engine.
 * Extracted from index.html per reusable-components-extraction-map.md
 * (absorbs R1 loader, R4 paint/hide, R5 view state machine, R9 caption
 * mechanism). Sits on RevealEngine (Module B) + GSAP core.
 *
 * CONTRACT
 *   new ScenePlayer(stageEl, story, config?) — builds one .panel per
 *   story.scenes[] entry inside stageEl, fetches each scene's asset
 *   (inline SVG with rp bN classes, as produced by compile_scene.py),
 *   attaches a RevealEngine per panel, renders captions from scene
 *   data, and owns view-to-view transitions. Requires scene-player.css
 *   (structure) + a theme tokens file (values) on the page.
 *
 * FIDELITY vs the inline original (index.html, post-F1–F4)
 *   verbatim : paint mechanics — clear → panel visible → GSAP tween
 *              v:-1→99 (duration 1.6 default, ease power1.out),
 *              engine.setLevel per update (engine rounds internally,
 *              matching the original's caller-side Math.round),
 *              fill on complete
 *   verbatim : caption timing — fires at 35% of paint duration,
 *              12px slide; INHERITED QUIRK preserved: only the `tl`
 *              position slides from -12px, all others slide from
 *              +12px (original checked only classList.contains('tl'))
 *   verbatim : hide mechanics — caption off, panel opacity 0 (the
 *              0.5s CSS transition does the fade), 0.45s wait (0.35s
 *              on the jump path), then engine.clear
 *   verbatim : state machine — {i, painted, busy} with the same
 *              guards; forward navigation PAINTS (goTo), backward
 *              JUMPS to fully painted (jumpToPainted) — the
 *              production asymmetry, embodied in next()/prev()
 *   verbatim : reduced-motion semantics per fix F4 — instant fill +
 *              caption, zero hide wait (via RevealEngine.reducedMotion)
 *   additive : panels are BUILT from the descriptor (scenes[].asset)
 *              instead of read from pre-declared data-src HTML — the
 *              R1 absorption that makes the player reusable
 *   additive : captions are RENDERED from descriptor data
 *              (scene.caption = {num, he, en, position}) instead of
 *              hardcoded HTML — the map §6 boundary crossing. Text is
 *              inserted via text nodes (\n → <br>), never innerHTML.
 *   additive : config callbacks onSceneChange(i) / onBoundary(dir) —
 *              the Module D attachment surface (dots, gestures,
 *              engage/disengage live there, not here)
 *   additive : ready promise (all scenes fetched) replaces the
 *              page-level loading veil, which stays a host concern
 *   seam     : config.transition — validated, single registered type
 *              'dissolve-repaint' (the verbatim behavior). paint-over
 *              / wipe register here later; goTo's hide→paint sequence
 *              is the branch point.
 */
(function (global) {
  'use strict';

  var TRANSITIONS = ['dissolve-repaint']; // seam: future types register here

  var DEFAULTS = {
    transition: 'dissolve-repaint',
    reveal: { duration: 1.6, ease: 'power1.out' },
    captionDelay: 0.35,     // fraction of paint duration (verbatim)
    captionSlide: 12,       // px (verbatim)
    hideDuration: 0.45,     // s, goTo path (verbatim)
    jumpHideDuration: 0.35, // s, jumpToPainted path (verbatim)
    onSceneChange: null,    // function(i)
    onBoundary: null        // function(dir) — next() past end / prev() past start
  };

  function ScenePlayer(stageEl, story, config) {
    if (!stageEl) throw new Error('ScenePlayer: stage element required');
    if (!story || !story.scenes || !story.scenes.length)
      throw new Error('ScenePlayer: story with scenes[] required');
    if (typeof global.RevealEngine === 'undefined')
      throw new Error('ScenePlayer: reveal-engine.js must load first');
    if (typeof global.gsap === 'undefined')
      throw new Error('ScenePlayer: gsap must load first');

    this.stage = stageEl;
    this.story = story;
    this.config = assign({}, DEFAULTS, story.config || {}, config || {});
    if (TRANSITIONS.indexOf(this.config.transition) === -1)
      throw new Error('ScenePlayer: unknown transition "' + this.config.transition +
                      '"; registered: ' + TRANSITIONS.join(', '));

    this.reduced = global.RevealEngine.reducedMotion; // F4 semantics
    this.state = { i: -1, painted: false, busy: false }; // verbatim shape

    this.panels = [];
    this.captions = [];
    this.engines = [];
    this.ready = this._build();
  }

  /* ── R1: build panels + captions from the descriptor, fetch all ── */
  ScenePlayer.prototype._build = function () {
    var self = this;
    var jobs = this.story.scenes.map(function (scene, i) {
      var panel = el('div', 'panel');
      var host = el('div', 'svg-host');
      panel.appendChild(host);
      self.stage.appendChild(panel);
      self.panels[i] = panel;
      self.captions[i] = scene.caption ? self._buildCaption(scene.caption) : null;
      if (self.captions[i]) self.stage.appendChild(self.captions[i]);

      return fetch(scene.asset)
        .then(function (r) {
          if (!r.ok) throw new Error(r.status + ' ' + scene.asset);
          return r.text();
        })
        .then(function (txt) {
          host.innerHTML = txt; // trusted scene asset, same as production loadPanel
          self.engines[i] = new global.RevealEngine(host);
        });
    });
    return Promise.all(jobs).then(function () { return self; });
  };

  /* Caption DOM from data — text nodes only, \n becomes <br>. */
  ScenePlayer.prototype._buildCaption = function (cap) {
    var root = el('div', 'caption ' + (cap.position || 'br'));
    if (cap.num) { var n = el('span', 'num'); n.textContent = cap.num; root.appendChild(n); }
    if (cap.he) root.appendChild(multiline('p', 'he', cap.he));
    if (cap.en) root.appendChild(multiline('p', 'en', cap.en));
    return root;
  };

  /* ── R4: paint (verbatim mechanics; per-scene params override) ── */
  ScenePlayer.prototype.paintScene = function (i, opts) {
    var self = this;
    var panel = this.panels[i], eng = this.engines[i], cap = this.captions[i];
    var scene = this.story.scenes[i];
    var p = assign({}, this.config.reveal,
                   (scene.enter && scene.enter.params) || {}, opts || {});

    return new Promise(function (resolve) {
      if (self.reduced) {                       // F4: instant, keep function
        eng.fill();
        panel.style.opacity = '1';
        if (cap) { cap.style.opacity = '1'; cap.style.transform = 'none'; }
        resolve(); return;
      }
      eng.clear();
      panel.style.opacity = '1';
      if (cap) {
        // inherited quirk preserved: only 'tl' slides from the left
        var dx = cap.classList.contains('tl')
          ? (-self.config.captionSlide + 'px')
          : (self.config.captionSlide + 'px');
        cap.style.opacity = '0';
        cap.style.transform = 'translateX(' + dx + ')';
        setTimeout(function () {
          cap.style.opacity = '1';
          cap.style.transform = 'translateX(0)';
        }, p.duration * 1000 * self.config.captionDelay);
      }
      var obj = { v: -1 };
      global.gsap.to(obj, {
        v: 99, duration: p.duration, ease: p.ease,
        onUpdate:   function () { eng.setLevel(obj.v); }, // engine rounds internally
        onComplete: function () { eng.fill(); resolve(); }
      });
    });
  };

  /* ── R4: hide (verbatim: CSS transition fades, timeout clears) ── */
  ScenePlayer.prototype.hideScene = function (i, dur) {
    var self = this;
    if (dur == null) dur = this.config.hideDuration;
    var panel = this.panels[i], eng = this.engines[i], cap = this.captions[i];
    return new Promise(function (resolve) {
      if (cap) cap.style.opacity = '0';
      panel.style.opacity = '0';
      setTimeout(function () { eng.clear(); resolve(); },
                 self.reduced ? 0 : dur * 1000);
    });
  };

  /* ── R5: view state machine (verbatim guards + sequencing) ── */
  ScenePlayer.prototype.goTo = function (target, opts) {
    var self = this, s = this.state, N = this.panels.length;
    if (s.busy || target < 0 || target >= N) return Promise.resolve(false);
    s.busy = true;
    var prior = (s.i >= 0 && s.i !== target)
      ? this.hideScene(s.i) : Promise.resolve();
    return prior.then(function () {
      s.i = target; s.painted = false;
      return self.paintScene(target, opts);
    }).then(function () {
      s.painted = true; s.busy = false;
      self._changed(target);
      return true;
    });
  };

  ScenePlayer.prototype.jumpToPainted = function (target) {
    var self = this, s = this.state, N = this.panels.length;
    if (s.busy || target < 0 || target >= N) return Promise.resolve(false);
    s.busy = true;
    var prior = (s.i >= 0 && s.i !== target)
      ? this.hideScene(s.i, this.config.jumpHideDuration) : Promise.resolve();
    return prior.then(function () {
      s.i = target;
      self.panels[target].style.opacity = '1';
      self.engines[target].fill();
      var cap = self.captions[target];
      if (cap) { cap.style.opacity = '1'; cap.style.transform = 'translateX(0)'; }
      s.painted = true; s.busy = false;
      self._changed(target);
      return true;
    });
  };

  /* Production navigation asymmetry: forward paints, backward jumps. */
  ScenePlayer.prototype.next = function () {
    if (this.state.i < this.panels.length - 1) return this.goTo(this.state.i + 1);
    this._boundary(1); return Promise.resolve(false);
  };
  ScenePlayer.prototype.prev = function () {
    if (this.state.i > 0) return this.jumpToPainted(this.state.i - 1);
    this._boundary(-1); return Promise.resolve(false);
  };

  Object.defineProperty(ScenePlayer.prototype, 'index', {
    get: function () { return this.state.i; }
  });
  Object.defineProperty(ScenePlayer.prototype, 'length', {
    get: function () { return this.panels.length; }
  });

  ScenePlayer.prototype._changed = function (i) {
    if (typeof this.config.onSceneChange === 'function') this.config.onSceneChange(i);
  };
  ScenePlayer.prototype._boundary = function (dir) {
    if (typeof this.config.onBoundary === 'function') this.config.onBoundary(dir);
  };

  /* ── helpers ── */
  function el(tag, cls) { var e = document.createElement(tag); e.className = cls; return e; }
  function multiline(tag, cls, text) {
    var e = el(tag, cls);
    String(text).split('\n').forEach(function (line, idx) {
      if (idx) e.appendChild(document.createElement('br'));
      e.appendChild(document.createTextNode(line));
    });
    return e;
  }
  function assign(t) {
    for (var a = 1; a < arguments.length; a++) {
      var src = arguments[a];
      if (!src) continue;
      for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) t[k] = src[k];
    }
    return t;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = ScenePlayer;
  else global.ScenePlayer = ScenePlayer;

})(typeof window !== 'undefined' ? window : this);
