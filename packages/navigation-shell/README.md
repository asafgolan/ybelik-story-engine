# @ybelik/navigation-shell

Scroll engagement, wheel/touch/key gestures and progress dots for the ybelik story engine — drives a ScenePlayer via callbacks.

## Use (script tag — primary)
```
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script src="https://unpkg.com/@ybelik/reveal-engine/reveal-engine.js"></script>
<script src="https://unpkg.com/@ybelik/scene-player/scene-player.js"></script>
<script src="https://unpkg.com/@ybelik/navigation-shell/navigation-shell.js"></script>
```
Scenes are compiled SVGs from the [ybelik story engine](https://github.com/asafgolan/ybelik-story-engine)
pipeline (`generate → trace → compile → reveal`). Full API: the header docs in
`navigation-shell.js` and the [extraction map](https://github.com/asafgolan/ybelik-story-engine/blob/main/docs/reusable-components-extraction-map.md).

MIT · part of the ybelik story engine monorepo.
