// make-gif.mjs — WebM -> optimized README GIF, all binaries npm-local (no system tools).
// Canonical ffmpeg palettegen/paletteuse chain + gifsicle -O3.
// Usage (from repo root): node packages/demo-gif-creator/make-gif.mjs <capture.webm> [--colors N] [--fps N]
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import ffmpegPath from 'ffmpeg-static';
import gifsiclePath from 'gifsicle';

const args = process.argv.slice(2);
const webm = args[0];
if (!webm) { console.error('usage: node packages/demo-gif-creator/make-gif.mjs <capture.webm> [--colors N] [--fps N]'); process.exit(2); }
const opt = (name, dflt) => { const i = args.indexOf(name); return i === -1 ? dflt : args[i + 1]; };
const colors = opt('--colors', '128');
const fps = opt('--fps', '12');
const OUT = 'docs/assets/demo.gif';

mkdirSync('docs/assets', { recursive: true });
execFileSync(ffmpegPath, ['-y', '-loglevel', 'error', '-i', webm,
  '-vf', `fps=${fps},scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
  '-loop', '0', OUT], { stdio: 'inherit' });
execFileSync(gifsiclePath, ['-O3', '--colors', colors, '-b', OUT], { stdio: 'inherit' });
console.log(OUT, statSync(OUT).size, 'bytes');
