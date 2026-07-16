// record-demo.mjs — records demo/index.html -> WebM for the README GIF (#34).
// Run from repo root with a server on :8000 (`python3 -m http.server 8000`).
// Deps: scripts/package.json (npm install once). Re-record = re-run this file.
import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 800, height: 600 },
  recordVideo: { dir: '/tmp/demo-rec', size: { width: 800, height: 600 } },
});
const page = await context.newPage();

await page.goto('http://localhost:8000/demo/index.html', { waitUntil: 'networkidle' });
await page.waitForSelector('#loadingVeil', { state: 'detached' });   // veil lifts on player.ready, removed +700ms
await page.waitForTimeout(800);                                       // settle on the intro

// engage: bring #story into ScrollTrigger's window; ScrollEngagement scroll-locks and paints
await page.evaluate(() => document.getElementById('story').scrollIntoView({ behavior: 'smooth' }));
await page.waitForTimeout(4000);                                      // seam (800ms) + entrance paint (~1.6s) + dwell

// three forward steps — one wheel burst each, spaced past cooldown(250) + paint(1.6s)
for (let i = 0; i < 3; i++) {
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(3200);
}

const video = page.video();
await context.close();                                                // finalizes the WebM
await browser.close();
console.log('webm:', await video.path());
