// probe.mjs — exercises all 6 tools of server.mjs against the real bird.
// PASS gates keyed to the measured landmarks (analyzer sandbox 2026-07-20).
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const BIRD = process.argv[2];
if (!BIRD) { console.error("usage: node probe.mjs <path-to-03-bird.svg>"); process.exit(2); }
const results = [];
const gate = (name, ok, detail) => { results.push(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`); if (!ok) process.exitCode = 1; };

const t = new StdioClientTransport({ command: "node", args: ["server.mjs"] });
const c = new Client({ name: "probe", version: "0" });
await c.connect(t);

const tools = (await c.listTools()).tools.map((x) => x.name).sort();
gate("tools/list", tools.join(",") === "audit,cluster,commit_entities,compile,inventory,render", tools.join(","));

const inv = JSON.parse((await c.callTool({ name: "inventory", arguments: { path: BIRD } })).content[0].text);
gate("inventory", inv.paths === 1825 && inv.groups === 1, `paths=${inv.paths} groups=${inv.groups}`);

const cl = JSON.parse((await c.callTool({ name: "cluster", arguments: { path: BIRD } })).content[0].text);
const insc = cl.clusters.find((x) => x.bbox[0] > 270 && x.n >= 30 && x.n <= 60);
gate("cluster.stratify", cl.wash.n >= 1 && cl.wash.n <= 4, `wash=${cl.wash.n}`);
gate("cluster.inscription", !!insc, insc ? `n=${insc.n} bbox=${insc.bbox.join(",")}` : "not found");
gate("cluster.main-mass", cl.clusters[0].n > 1500, `main n=${cl.clusters[0].n}`);

const r = await c.callTool({ name: "render", arguments: { path: BIRD, crop: insc.bbox, width: 240 } });
const img = r.content.find((x) => x.type === "image");
const buf = Buffer.from(img.data, "base64");
writeFileSync("/tmp/probe-crop.png", buf);
gate("render.crop-image", img.mimeType === "image/png" && buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])), `${buf.length} bytes png`);

const cm = JSON.parse((await c.callTool({ name: "commit_entities", arguments: {
  path: BIRD, out: "/tmp/probe-annotated.svg",
  entities: [{ name: "inscription", indices: insc.indices }, { name: "background", indices: cl.wash.indices }],
} })).content[0].text);
const annCount = (readFileSync("/tmp/probe-annotated.svg", "utf8").match(/data-entity="/g) || []).length;
gate("commit_entities", annCount === insc.indices.length + cl.wash.indices.length && cm.annotated === annCount, `attrs=${annCount}`);

await c.callTool({ name: "compile", arguments: { path: BIRD, out: "/tmp/probe-compiled.svg", jitter: 0, seed: 1, buckets: 100 } });
let parity = "no python reference";
try { execSync("cmp /tmp/bird-py.svg /tmp/probe-compiled.svg"); parity = "byte-identical vs compile_scene.py"; gate("compile.parity", true, parity); }
catch { gate("compile.parity", false, "differs from compile_scene.py output"); }

const au = JSON.parse((await c.callTool({ name: "audit", arguments: { path: BIRD } })).content[0].text);
gate("audit.landmark", au.paths === 1825 && au.attr_fb_pct === 0 && au.lum_fb_pct === 2 && au.buckets === 100,
  `paths=${au.paths} attr=${au.attr_fb_pct}% lum=${au.lum_fb_pct}% bkts=${au.buckets}`);

// annotated scene still compiles + entity survives compile
await c.callTool({ name: "compile", arguments: { path: "/tmp/probe-annotated.svg", out: "/tmp/probe-annotated-compiled.svg", jitter: 0, seed: 1 } });
const survived = (readFileSync("/tmp/probe-annotated-compiled.svg", "utf8").match(/data-entity="inscription"/g) || []).length;
gate("entity-survives-compile", survived === insc.indices.length, `inscription attrs post-compile=${survived}`);

await c.close();
console.log(results.join("\n"));
