#!/usr/bin/env python3
r"""
generate_scene.py — pipeline stage 0 client (pairs with generate/worker.js).

Completes the chain the extraction map opened on day one:
    GENERATE (this) -> trace_scene -> compile_scene -> runtime

Mirrors trace_scene's conventions exactly: seed batches for pick-by-eye,
and settings-are-data — every image gets a JSON sidecar (style, subject,
seed, steps, model, endpoint) written next to it, straight from the
worker's X-Gen-Settings header. Zero dependencies (stdlib urllib).

Usage:
  export GENERATE_ENDPOINT=https://ybelik-generate.<acct>.workers.dev
  export GENERATE_TOKEN=<your token>
  python3 generate_scene.py --style sumi-e-hero \
      --subject "a solitary bird perched on a gnarled pine branch over still water" \
      --seeds 42-45 --name a1-bird --out ../../test-corpus/raster/

Then the existing acceptance loop takes over unchanged:
  trace_scene.py auto-converges it, audit_svg judges it, compile buckets it.
"""
import argparse
import json
import os
import sys
import urllib.request
import urllib.error


def load_env_file(path=None):
    """Load KEY=VALUE lines from the repo-root .env into os.environ WITHOUT
    overriding variables already set — the real environment wins over the file
    (so `GENERATE_TOKEN=wrong python3 generate_scene.py ...` still uses 'wrong').
    Zero-dep, best-effort: a missing .env is fine (falls back to plain environ).
    Call this BEFORE ArgumentParser is built — the --endpoint/--token defaults
    capture os.environ at construction time."""
    if path is None:
        # packages/generate/ -> repo root (two levels up); resolve relative to
        # THIS file, not the cwd
        path = os.path.join(os.path.dirname(os.path.dirname(
            os.path.dirname(os.path.abspath(__file__)))), '.env')
    try:
        with open(path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, _, val = line.partition('=')
                key, val = key.strip(), val.strip()
                if len(val) >= 2 and val[0] in '"\'' and val[-1] == val[0]:
                    val = val[1:-1]
                if key and key not in os.environ:  # environ wins over file
                    os.environ[key] = val
    except FileNotFoundError:
        pass
    return path


def parse_seeds(spec):
    """'42-45' -> [42,43,44,45] · '42,50,99' -> [42,50,99] · '42' -> [42]"""
    seeds = []
    for part in spec.split(','):
        part = part.strip()
        if '-' in part:
            a, b = part.split('-', 1)
            seeds.extend(range(int(a), int(b) + 1))
        elif part:
            seeds.append(int(part))
    if not seeds:
        raise ValueError('no seeds parsed')
    return seeds


def generate(endpoint, token, style, subject, seed, steps):
    req = urllib.request.Request(
        endpoint.rstrip('/') + '/generate',
        data=json.dumps({'style': style, 'subject': subject,
                         'seed': seed, 'steps': steps}).encode('utf-8'),
        headers={'Content-Type': 'application/json',
                 'Authorization': f'Bearer {token}',
                 # urllib's default UA (Python-urllib/x) trips Cloudflare's
                 # bot-signature filter -> 403 error 1010; identify ourselves.
                 'User-Agent': 'ybelik-generate-scene/0.1'},
        method='POST')
    with urllib.request.urlopen(req, timeout=120) as resp:
        image = resp.read()
        settings = json.loads(resp.headers.get('X-Gen-Settings', '{}'))
    return image, settings


def main():
    load_env_file()  # repo-root .env -> environ (before argparse captures defaults)
    ap = argparse.ArgumentParser(description='Generate styled scene rasters '
                                 'via the ybelik generate worker.')
    ap.add_argument('--style', required=True)
    ap.add_argument('--subject', required=True)
    ap.add_argument('--seeds', default='42', help="e.g. '42-45' or '42,50'")
    ap.add_argument('--steps', type=int, default=4)
    ap.add_argument('--name', required=True, help='output basename, e.g. a1-bird')
    ap.add_argument('--out', default='.', help='output directory')
    ap.add_argument('--endpoint', default=os.environ.get('GENERATE_ENDPOINT'))
    ap.add_argument('--token', default=os.environ.get('GENERATE_TOKEN'))
    args = ap.parse_args()

    if not args.endpoint or not args.token:
        ap.error('set GENERATE_ENDPOINT / GENERATE_TOKEN (env or flags)')

    os.makedirs(args.out, exist_ok=True)
    seeds = parse_seeds(args.seeds)
    failures = 0

    for seed in seeds:
        base = os.path.join(args.out, f'{args.name}-s{seed}')
        try:
            image, settings = generate(args.endpoint, args.token,
                                       args.style, args.subject,
                                       seed, args.steps)
        except urllib.error.HTTPError as e:
            print(f'  seed {seed}: HTTP {e.code} — {e.read().decode()[:200]}',
                  file=sys.stderr)
            failures += 1
            continue
        except Exception as e:
            print(f'  seed {seed}: {e}', file=sys.stderr)
            failures += 1
            continue

        with open(base + '.jpg', 'wb') as f:
            f.write(image)
        settings['subject'] = args.subject
        settings['endpoint'] = args.endpoint
        with open(base + '.settings.json', 'w', encoding='utf-8') as f:
            json.dump(settings, f, indent=2, ensure_ascii=False)
        print(f'  seed {seed}: {base}.jpg ({len(image)//1024} KB) + sidecar')

    print(f'done — {len(seeds) - failures}/{len(seeds)} generated')
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
