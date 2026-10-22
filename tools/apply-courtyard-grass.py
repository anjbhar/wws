"""Pack generated grass into a versioned A5 sheet and change only map ground.

Usage: python tools/apply-courtyard-grass.py <generated-source.png>
The generated texture supplies all grass artwork; resizing, tile packing, and
terrain-edge alpha masks are deterministic engine export operations.
"""
import json
import shutil
import sys
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'docs/art/courtyard-grass-v1'
BACKUP = ROOT / 'docs/maps/backups/before-courtyard-grass-v1'
ART.mkdir(parents=True, exist_ok=True)
BACKUP.mkdir(parents=True, exist_ok=True)
for name in ('Map001.json', 'Tilesets.json'):
    dest = BACKUP / name
    if not dest.exists():
        shutil.copy2(ROOT / 'data' / name, dest)
source = ART / 'grass-source.png'
if Path(sys.argv[1]).resolve() != source.resolve():
    shutil.copy2(sys.argv[1], source)
old = json.loads((BACKUP / 'Map001.json').read_text(encoding='utf-8'))
sets = json.loads((BACKUP / 'Tilesets.json').read_text(encoding='utf-8'))
m = json.loads(json.dumps(old))
tileset = sets[m['tilesetId']]
dirt = Image.open(ROOT / 'img/tilesets/EdoCourtyard_A5-v2.png').convert('RGBA')
sheet = dirt.copy()
# Export at a consistent two-pixel cluster scale, without smooth interpolation.
texture = Image.open(source).convert('RGB').resize((96, 96), Image.Resampling.NEAREST).resize((192, 192), Image.Resampling.NEAREST)
texture.save(ART / 'grass-repeat-192.png')
texture.crop((0, 0, 48, 48)).save(ART / 'grass-tile-48.png')
tiles = []
def add(grass, mask=None):
    i = len(tiles)
    if mask is not None:
        base = dirt.crop(((i % 8)*48, (i // 8)*48, (i % 8+1)*48, (i // 8+1)*48))
        grass = Image.composite(grass, base, Image.fromarray(mask.astype('uint8')))
    sheet.paste(grass, ((i % 8)*48, (8+i//8)*48))
    tiles.append(1600+i)
    return 1600+i

full = []
for y in range(4):
    for x in range(4):
        full.append(add(texture.crop((x*48, y*48, x*48+48, y*48+48))))

# Feather short irregular turf fringes only into grass cells. Original center
# dirt pixels remain intact. All fringes use the same generated grass material.
yy, xx = np.mgrid[:48, :48]
wave_x = ((xx//2*7 + xx//8*3) % 5)-2
wave_y = ((yy//2*7 + yy//8*3) % 5)-2
dist = {'N': yy-wave_x, 'S': 47-yy-wave_x, 'W': xx-wave_y, 'E': 47-xx-wave_y}
edge = {}
patterns = ['N', 'E', 'S', 'W', 'NE', 'ES', 'SW', 'NW']
for pattern in patterns:
    d = np.minimum.reduce([dist[k] for k in pattern])
    mask = np.clip((d-1)*255/7, 0, 255)
    for v in range(4):
        edge[pattern, v] = add(texture.crop((v*48, 48, v*48+48, 96)), mask)
corner = {}
for name, cx, cy in [('NW', 0, 0), ('NE', 47, 0), ('SE', 47, 47), ('SW', 0, 47)]:
    d = np.sqrt((xx-cx)**2+(yy-cy)**2)
    mask = np.clip((d-1)*255/7, 0, 255)
    for v in range(4):
        corner[name, v] = add(texture.crop((v*48, 96, v*48+48, 144)), mask)
assert len(tiles) == 64
sheet_name = 'EdoCourtyard_A5-grass-v1'
sheet.save(ROOT / 'img/tilesets' / (sheet_name+'.png'))
tileset['tilesetNames'][4] = sheet_name
for tile in tiles:
    tileset['flags'][tile] = 0
W, H = m['width'], m['height']
def is_dirt(x, y):
    return 7 <= x <= 18 and 5 <= y <= 11
grass_count = 0
for y in range(H):
    for x in range(W):
        if is_dirt(x, y):
            continue
        neighbors = ''.join(k for k, dx, dy in [('N',0,-1),('E',1,0),('S',0,1),('W',-1,0)] if is_dirt(x+dx,y+dy))
        neighbors = next((p for p in patterns if set(p)==set(neighbors)), neighbors)
        v = (x+2*y)%4
        tile = full[(y%4)*4+x%4]
        if neighbors:
            tile = edge[neighbors, v]
        else:
            for k,dx,dy in [('NW',-1,-1),('NE',1,-1),('SE',1,1),('SW',-1,1)]:
                if is_dirt(x+dx,y+dy):
                    tile = corner[k,v]
                    break
        m['data'][y*W+x] = tile
        grass_count += 1
assert m['data'][W*H:] == old['data'][W*H:]
assert m['events'] == old['events']
assert grass_count > W*H/2
for name, value in [('Map001',m),('Tilesets',sets)]:
    (ROOT / 'data' / (name+'.json')).write_text(json.dumps(value,separators=(',',':'))+'\n', encoding='utf-8')
record = {'source':'grass-source.png','sheet':sheet_name,'tileSize':48,'grassCells':grass_count,'dirtCells':W*H-grass_count,'dirtRectangleInclusive':[7,5,18,11],'unchanged':'Map layers 1–5, events, architecture, props, spawn and collision','export':'nearest-neighbor 96 to 192; generated grass, deterministic edge masks; original dirt retained in upper A5 half'}
(ART / 'export.json').write_text(json.dumps(record, indent=2)+'\n', encoding='utf-8')
print(json.dumps(record, indent=2))
