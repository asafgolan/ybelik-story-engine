# @ybelik/mcp-server — the engine's agent door

The ybelik pipeline as an agent-callable **MCP stdio server**. Six deterministic
tools; zero inference code by design — grouping is geometry, **naming and
adjudication belong to the calling agent** (your Claude), which sees rendered
crops as images and rules on them.

| tool | does |
|---|---|
| `inventory` | structure harvest: path/group counts, ids, existing entities |
| `cluster` | wash stratification + connected-component entity candidates (bboxes + indices) |
| `render` | scene or bbox-crop → PNG image block — the adjudication artifact |
| `commit_entities` | write the judged map as `data-entity` attributes (the one write) |
| `compile` | traced/annotated SVG → scene-ready `rp bN` (byte-parity with the shipped compiler at jitter=0) |
| `audit` | input-contract readout: paths, attr-fb %, lum-fb %, buckets |

Typical loop: `inventory` → `cluster` → `render` crops → the agent merges/splits/
names → `commit_entities` → `compile` → `audit`. Annotations survive compilation.

## Wire it to Claude

Claude Code (local checkout):
```bash
claude mcp add --transport stdio ybelik -- node /absolute/path/to/packages/mcp-server/server.mjs
```

Claude Desktop (`claude_desktop_config.json`):

```json
{ "mcpServers": { "ybelik": { "command": "node", "args": ["/absolute/path/to/packages/mcp-server/server.mjs"] } } }
```

Once published to npm, the zero-checkout route becomes:

```bash
claude mcp add --transport stdio ybelik -- npx -y @ybelik/mcp-server
```

## Verify

`node probe.mjs <path-to-demo/svg/03-bird.svg>` — ten PASS lines against the audit landmarks (1825 paths · attr-fb 0.0% · lum-fb 2.0% · 100 buckets).
