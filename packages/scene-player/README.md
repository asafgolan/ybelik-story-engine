# @ybelik/scene-player

Descriptor-driven view player for bucket-reveal scenes — builds panels and captions from story.json, owns paint/hide transitions. Module C of the ybelik story engine.

## Use (script tag — primary)
```
<link rel="stylesheet" href="https://unpkg.com/@ybelik/scene-player/scene-player.css">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://unpkg.com/@ybelik/reveal-engine/reveal-engine.js"></script>
<script src="https://unpkg.com/@ybelik/scene-player/scene-player.js"></script>
```
Scenes are compiled SVGs from the [ybelik story engine](https://github.com/asafgolan/ybelik-story-engine)
pipeline (`generate → trace → compile → reveal`). Full API: the header docs in
`scene-player.js` and the [extraction map](https://github.com/asafgolan/ybelik-story-engine/blob/main/docs/reusable-components-extraction-map.md).

MIT · part of the ybelik story engine monorepo.
