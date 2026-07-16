#!/usr/bin/env node
// trace-scene — CLI twin of the retired trace_scene.py.
// usage: trace-scene image.png|jpg out.svg [--min N] [--max N] [--max-kb N]
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { initTracer, DEFAULT_POLICY } from '../scene-tracer.js';
const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
const [input, output] = args;
if (!input || !output) { console.error('usage: trace-scene image.png out.svg [--min N --max N --max-kb N]'); process.exit(2); }
const opt = (n) => { const i = args.indexOf(n); return i === -1 ? null : Number(args[i + 1]); };
const policy = {};
if (opt('--min') || opt('--max'))
  policy.target_paths = [opt('--min') ?? DEFAULT_POLICY.target_paths[0], opt('--max') ?? DEFAULT_POLICY.target_paths[1]];
if (opt('--max-kb')) policy.max_kb = opt('--max-kb');

const buf = readFileSync(input);
let rgba, width, height;
if (buf[0] === 0x89 && buf[1] === 0x50) {                    // PNG
  const { PNG } = require('pngjs');
  const p = PNG.sync.read(buf); rgba = p.data; width = p.width; height = p.height;
} else if (buf[0] === 0xff && buf[1] === 0xd8) {             // JPEG
  const jpeg = require('jpeg-js');
  const j = jpeg.decode(buf, { useTArray: true }); rgba = j.data; width = j.width; height = j.height;
} else { console.error('unsupported input (png/jpeg only)'); process.exit(2); }

const glue = await import('wasm_vtracer/wasm_vtracer_bg.js');
const wasm = readFileSync(require.resolve('wasm_vtracer/wasm_vtracer_bg.wasm'));
const tracer = await initTracer({ glue, wasm });
const { svg, settings } = tracer.traceScene(rgba, width, height, { policy });
writeFileSync(output, svg);
writeFileSync(output.replace(/\.svg$/, '') + '.settings.json', JSON.stringify(settings, null, 2));
console.log(`${input} -> ${output}`);
console.log(`  chosen: cp${settings.color_precision}/ld${settings.layer_difference}  ${settings.paths} paths · ${settings.kb} kB · ${settings.ladder.length} iters${settings.flag ? '  FLAG: ' + settings.flag : ''}`);
console.log(`  ladder: ${settings.ladder.join(' ')}`);
