# @ybelik/reveal-engine

Bucket-based SVG reveal engine — paints traced ink-wash scenes in tonal order, light to dark. Runtime core of the ybelik story engine.

## Use (script tag — primary)
```
<script src="https://unpkg.com/@ybelik/reveal-engine/reveal-engine.js"></script>
```
Scenes are compiled SVGs from the [ybelik story engine](https://github.com/asafgolan/ybelik-story-engine)
pipeline (`generate → trace → compile → reveal`). Full API: the header docs in
`reveal-engine.js` and the [extraction map](https://github.com/asafgolan/ybelik-story-engine/blob/main/docs/reusable-components-extraction-map.md).

MIT · part of the ybelik story engine monorepo.
