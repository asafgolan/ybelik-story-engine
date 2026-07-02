import re, random
    
FNAME = 'file.svg'   # ← your file
JITTER = 8           # randomize within +/- this many buckets (0 = pure order)
        
src = open(FNAME).read()
        
# Extract each path tag (handles self-closing and multi-line)
paths = list(re.finditer(r'<path\b[^>]*?>', src, re.DOTALL))

def get_color(tag):
    """Return fill color, falling back to stroke. Default to mid-gray."""
    for attr in ('fill', 'stroke'):
        # attribute form: fill="#abc" or fill="rgb(...)"
        m = re.search(rf'\b{attr}="([^"]+)"', tag)
        if m and m.group(1) not in ('none', 'transparent'):
            return m.group(1)
        # style form: style="fill:#abc;..."
        m = re.search(rf'style="[^"]*\b{attr}\s*:\s*([^;"]+)', tag)
        if m and m.group(1).strip() not in ('none', 'transparent'):
            return m.group(1).strip()
    return '#808080'  # mid-gray fallback

def luminance(color):
    """Return 0..1 perceived brightness. 0 = black, 1 = white."""
    c = color.strip().lower()
    if c.startswith('#'):
        c = c[1:]
        if len(c) == 3: c = ''.join(ch*2 for ch in c)
        try: r, g, b = int(c[0:2],16), int(c[2:4],16), int(c[4:6],16)
        except: return 0.5 
    elif c.startswith('rgb'):
        nums = re.findall(r'\d+', c)
        if len(nums) >= 3: r, g, b = map(int, nums[:3])
        else: return 0.5
    else:
        return 0.5  # named colors — skip
    return (0.299*r + 0.587*g + 0.114*b) / 255

# Sort by luminance (light first), assign evenly distributed buckets
ranked = sorted(enumerate(paths), key=lambda x: -luminance(get_color(x[1].group(0))))
n = len(ranked)
print(f"Found {n} paths, sorting light→dark")
        
assignments = {}
for rank, (orig_idx, _m) in enumerate(ranked):
    bucket = round(rank * 99 / max(n - 1, 1))
    if JITTER:
        bucket = max(0, min(99, bucket + random.randint(-JITTER, JITTER)))
    assignments[orig_idx] = bucket
            
# Rewrite in reverse to keep string indices valid
out = src
for i in range(n - 1, -1, -1):
    m = paths[i]
    bucket = assignments[i]  
    original = m.group(0)
    # Strip any existing rp/bNN, then add fresh
    cleaned = re.sub(r'\brp\s+b\d+\s*', '', original)
    cleaned = re.sub(r'class="\s*"', '', cleaned)
    if 'class=' in cleaned:
        new = re.sub(r'class="([^"]*)"', f'class="rp b{bucket} \\1"', cleaned, count=1)
    else:
        new = cleaned.replace('<path', f'<path class="rp b{bucket}"', 1)
    out = out[:m.start()] + new + out[m.end():]
    
open(FNAME, 'w').write(out)
print(f"Done. JITTER={JITTER} — set to 0 for pure painter's order.")