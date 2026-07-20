#!/usr/bin/env node
// @ybelik/mcp-server — the engine's agent door (MCP stdio, local).
// Deterministic hands, the calling agent is the judge: geometry tools here,
// naming/adjudication in the client. Zero inference code by doctrine (#36).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const SC = require("@ybelik/scene-compiler");

// ---------- path bbox (pure, conservative via control points) ----------
// Handles the traced vocabulary (relative m/l/h/v/c/s/z + absolute forms).
// Tokenizer copes with glued negatives, commas, and 1e-3 exponents.
const NUM = /-?(?:\d*\.\d+|\d+\.?)(?:e-?\d+)?/gi;
function pathBBox(d) {
  let x = 0, y = 0, sx = 0, sy = 0, px = null, py = null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const grow = (gx, gy) => { if (gx < x0) x0 = gx; if (gy < y0) y0 = gy; if (gx > x1) x1 = gx; if (gy > y1) y1 = gy; };
  const segs = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
  for (const seg of segs) {
    const c = seg[0], rel = c === c.toLowerCase();
    const n = (seg.slice(1).match(NUM) || []).map(Number);
    let i = 0;
    switch (c.toLowerCase()) {
      case "m":
        while (i + 1 < n.length + 1 && i + 1 <= n.length - 1 + 1 && i < n.length) {
          x = rel ? x + n[i] : n[i]; y = rel ? y + n[i + 1] : n[i + 1];
          if (i === 0) { sx = x; sy = y; }
          grow(x, y); i += 2;
        }
        px = py = null; break;
      case "l": case "t":
        while (i < n.length) { x = rel ? x + n[i] : n[i]; y = rel ? y + n[i + 1] : n[i + 1]; grow(x, y); i += 2; }
        px = py = null; break;
      case "h":
        while (i < n.length) { x = rel ? x + n[i] : n[i]; grow(x, y); i += 1; }
        px = py = null; break;
      case "v":
        while (i < n.length) { y = rel ? y + n[i] : n[i]; grow(x, y); i += 1; }
        px = py = null; break;
      case "c":
        while (i + 5 < n.length + 1 && i < n.length) {
          const c1x = rel ? x + n[i] : n[i], c1y = rel ? y + n[i + 1] : n[i + 1];
          const c2x = rel ? x + n[i + 2] : n[i + 2], c2y = rel ? y + n[i + 3] : n[i + 3];
          x = rel ? x + n[i + 4] : n[i + 4]; y = rel ? y + n[i + 5] : n[i + 5];
          grow(c1x, c1y); grow(c2x, c2y); grow(x, y);
          px = c2x; py = c2y; i += 6;
        }
        break;
      case "s":
        while (i + 3 < n.length + 1 && i < n.length) {
          const rx = px === null ? x : 2 * x - px, ry = py === null ? y : 2 * y - py; // reflected c1
          const c2x = rel ? x + n[i] : n[i], c2y = rel ? y + n[i + 1] : n[i + 1];
          x = rel ? x + n[i + 2] : n[i + 2]; y = rel ? y + n[i + 3] : n[i + 3];
          grow(rx, ry); grow(c2x, c2y); grow(x, y);
          px = c2x; py = c2y; i += 4;
        }
        break;
      case "q":
        while (i + 3 < n.length + 1 && i < n.length) {
          const qx = rel ? x + n[i] : n[i], qy = rel ? y + n[i + 1] : n[i + 1];
          x = rel ? x + n[i + 2] : n[i + 2]; y = rel ? y + n[i + 3] : n[i + 3];
          grow(qx, qy); grow(x, y); px = qx; py = qy; i += 4;
        }
        break;
      case "a": // rare in traced output; conservative: endpoints + radii box
        while (i + 6 < n.length + 1 && i < n.length) {
          const rxr = Math.abs(n[i]), ryr = Math.abs(n[i + 1]);
          const ex = rel ? x + n[i + 5] : n[i + 5], ey = rel ? y + n[i + 6] : n[i + 6];
          grow(x - rxr, y - ryr); grow(x + rxr, y + ryr);
          grow(ex - rxr, ey - ryr); grow(ex + rxr, ey + ryr);
          x = ex; y = ey; px = py = null; i += 7;
        }
        break;
      case "z": x = sx; y = sy; px = py = null; break;
    }
  }
  return x0 === Infinity ? null : [x0, y0, x1, y1];
}

function readPaths(svgPath) {
  const svg = readFileSync(svgPath, "utf8");
  const ds = [...svg.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  return { svg, boxes: ds.map(pathBBox) };
}

function canvasOf(svg) {
  const vb = svg.match(/viewBox="([\d.\s-]+)"/);
  if (vb) { const p = vb[1].trim().split(/\s+/).map(Number); return { w: p[2], h: p[3] }; }
  const w = svg.match(/\swidth="([\d.]+)/), h = svg.match(/\sheight="([\d.]+)/);
  return { w: w ? +w[1] : 300, h: h ? +h[1] : 300 };
}

const server = new McpServer({ name: "ybelik", version: "0.1.0" });

server.tool(
  "inventory",
  "Structure harvest from an SVG scene: path count, groups, ids (first 60).",
  { path: z.string().describe("absolute path to the SVG file") },
  async ({ path }) => {
    const svg = readFileSync(path, "utf8");
    const paths = (svg.match(/<path[\s>]/g) || []).length;
    const groups = (svg.match(/<g[\s>]/g) || []).length;
    const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]).slice(0, 60);
    const entities = [...svg.matchAll(/\sdata-entity="([^"]+)"/g)].map((m) => m[1]);
    return { content: [{ type: "text", text: JSON.stringify({ paths, groups, ids, entities: [...new Set(entities)] }) }] };
  }
);

server.tool(
  "cluster",
  "Deterministic entity candidates: stratifies canvas-spanning washes to a background layer, then connected-components the foreground by padded-bbox overlap. Returns clusters with path indices and bboxes — render crops of these and judge.",
  {
    path: z.string(),
    wash_threshold: z.number().default(0.2).describe("bbox area fraction of canvas above which a path is background wash"),
    pad: z.number().default(4).describe("bbox padding for overlap test, scene units"),
    min_size: z.number().default(5).describe("clusters smaller than this are reported as tiny"),
  },
  async ({ path, wash_threshold, pad, min_size }) => {
    const { svg, boxes } = readPaths(path);
    const { w, h } = canvasOf(svg);
    const CA = w * h;
    const idx = boxes.map((b, i) => [b, i]).filter(([b]) => b);
    const wash = [], fg = [];
    for (const [b, i] of idx) ((b[2] - b[0]) * (b[3] - b[1]) > wash_threshold * CA ? wash : fg).push(i);
    const parent = new Map(fg.map((i) => [i, i]));
    const find = (i) => { while (parent.get(i) !== i) { parent.set(i, parent.get(parent.get(i))); i = parent.get(i); } return i; };
    const union = (i, j) => parent.set(find(i), find(j));
    const CELL = Math.max(w, h) / 8;
    const grid = new Map();
    for (const i of fg) {
      const b = boxes[i]; // pad-expanded insertion: near-boundary pairs must co-occur in a cell
      for (let gx = Math.floor((b[0] - pad) / CELL); gx <= Math.floor((b[2] + pad) / CELL); gx++)
        for (let gy = Math.floor((b[1] - pad) / CELL); gy <= Math.floor((b[3] + pad) / CELL); gy++) {
          const k = gx + ":" + gy;
          if (!grid.has(k)) grid.set(k, []);
          grid.get(k).push(i);
        }
    }
    const ov = (a, b) => !(a[2] + pad < b[0] - pad || b[2] + pad < a[0] - pad || a[3] + pad < b[1] - pad || b[3] + pad < a[1] - pad);
    for (const cell of grid.values())
      for (let a = 0; a < cell.length; a++)
        for (let c = a + 1; c < cell.length; c++)
          if (find(cell[a]) !== find(cell[c]) && ov(boxes[cell[a]], boxes[cell[c]])) union(cell[a], cell[c]);
    const groups = new Map();
    for (const i of fg) { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(i); }
    const clusters = [...groups.values()]
      .map((m) => {
        const bb = [Math.min(...m.map((i) => boxes[i][0])), Math.min(...m.map((i) => boxes[i][1])),
                    Math.max(...m.map((i) => boxes[i][2])), Math.max(...m.map((i) => boxes[i][3]))];
        return { n: m.length, bbox: bb.map((v) => +v.toFixed(1)), indices: m };
      })
      .sort((a, b) => b.n - a.n);
    const big = clusters.filter((c) => c.n >= min_size);
    const tiny = clusters.length - big.length;
    return { content: [{ type: "text", text: JSON.stringify({ canvas: { w, h }, wash: { n: wash.length, indices: wash }, clusters: big, tiny_clusters: tiny }) }] };
  }
);

server.tool(
  "render",
  "Render the scene (or a bbox crop of it) to PNG, returned as an image — the adjudication artifact. crop = [x0,y0,x1,y1] in scene units.",
  { path: z.string(), crop: z.array(z.number()).length(4).optional(), width: z.number().default(480), margin: z.number().default(5) },
  async ({ path, crop, width, margin }) => {
    let svg = readFileSync(path, "utf8");
    if (crop) {
      const [a, b, c, d] = crop;
      const vb = `${a - margin} ${b - margin} ${c - a + 2 * margin} ${d - b + 2 * margin}`;
      svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${vb}"`);
    }
    const png = new Resvg(svg, { fitTo: { mode: "width", value: width }, background: "#f3ece0" }).render().asPng();
    return { content: [
      { type: "image", data: Buffer.from(png).toString("base64"), mimeType: "image/png" },
      { type: "text", text: `rendered${crop ? " crop [" + crop.join(",") + "]" : ""} -> ${png.length} bytes` },
    ] };
  }
);

server.tool(
  "commit_entities",
  "Write the judged entity map into the SVG as data-entity attributes (the one write). entities = [{name, indices}] with indices from cluster; wash indices may be committed as e.g. 'background'.",
  {
    path: z.string(),
    out: z.string().describe("absolute output path; may equal path to annotate in place"),
    entities: z.array(z.object({ name: z.string().regex(/^[a-z0-9-]+$/), indices: z.array(z.number().int().nonnegative()) })),
  },
  async ({ path, out, entities }) => {
    const svg = readFileSync(path, "utf8");
    const byIndex = new Map();
    for (const e of entities) for (const i of e.indices) byIndex.set(i, e.name);
    let k = -1;
    const annotated = svg.replace(/<path\b/g, (m) => {
      k += 1;
      return byIndex.has(k) ? `<path data-entity="${byIndex.get(k)}"` : m;
    });
    writeFileSync(out, annotated);
    const wrote = [...byIndex.values()].reduce((acc, n) => ((acc[n] = (acc[n] || 0) + 1), acc), {});
    return { content: [{ type: "text", text: JSON.stringify({ out, total_paths: k + 1, annotated: byIndex.size, per_entity: wrote }) }] };
  }
);

server.tool(
  "compile",
  "Compile a traced/annotated SVG into a scene-ready SVG (rp bN classes) — byte-parity with the shipped compiler at jitter=0.",
  {
    path: z.string(), out: z.string(),
    direction: z.enum(["light-to-dark", "dark-to-light"]).default("light-to-dark"),
    buckets: z.number().int().min(1).max(100).default(100),
    jitter: z.number().min(0).default(0), seed: z.number().int().default(1),
  },
  async ({ path, out, direction, buckets, jitter, seed }) => {
    const src = readFileSync(path, "utf8");
    const res = SC.compileScene(src, { sort: "luminance", direction, buckets, jitter, seed });
    const compiled = typeof res === "string" ? res : res.svg;
    writeFileSync(out, compiled);
    return { content: [{ type: "text", text: JSON.stringify({ out, bytes: compiled.length, buckets, direction, jitter, seed }) }] };
  }
);

server.tool(
  "audit",
  "Input-contract linter readout for a scene SVG: path counts, attr/lum fallback (as % like the shipped audit table, raw counts included), bucket count.",
  { path: z.string() },
  async ({ path }) => {
    const src = readFileSync(path, "utf8");
    const m = SC.auditMetrics(src, {});
    const pct = (n) => (m.paths ? +((100 * n) / m.paths).toFixed(1) : 0);
    return { content: [{ type: "text", text: JSON.stringify({
      paths: m.paths, non_path: m.non_path,
      attr_fb_pct: pct(m.attr_fb), lum_fb_pct: pct(m.lum_fb),
      attr_fb_count: m.attr_fb, lum_fb_count: m.lum_fb,
      buckets: m.buckets, compile_ms: Math.round(m.compile_ms),
    }) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
