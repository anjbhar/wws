"""Export generated spring grass and a centered symmetrical training patch to MZ A5."""
import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'docs/art/courtyard-grass-v3'
BACKUP = ROOT / 'docs/maps/backups/before-courtyard-grass-v3'
ART.mkdir(parents=True, exist_ok=True)
BACKUP.mkdir(parents=True, exist_ok=True)
for name in ('Map001.json', 'Tilesets.json'):
    if not (BACKUP / name).exists():
        shutil.copy2(ROOT / 'data' / name, BACKUP / name)
source = ART / 'grass-source.png'
if Path(sys.argv[1]).resolve() != source.resolve():
    shutil.copy2(sys.argv[1], source)
old = json.loads((BACKUP / 'Map001.json').read_text(encoding='utf-8'))
sets = json.loads((BACKUP / 'Tilesets.json').read_text(encoding='utf-8'))
m = json.loads(json.dumps(old))
tileset = sets[m['tilesetId']]
dirt = Image.open(ROOT / 'img/tilesets/EdoCourtyard_A5-v2.png').convert('RGBA')
sheet = dirt.copy()
texture = Image.open(source).convert('RGBA').resize((96, 96), Image.Resampling.NEAREST)
texture = texture.resize((192, 192), Image.Resampling.NEAREST)
texture.save(ART / 'grass-repeat-192.png')
texture.crop((0, 0, 48, 48)).save(ART / 'grass-tile-48.png')
tiles = {}


def pack(tile):
    key = tile.tobytes()
    if key not in tiles:
        i = len(tiles)
        assert i < 64, 'A5 terrain budget exceeded'
        sheet.paste(tile, ((i % 8)*48, (8+i//8)*48))
        tiles[key] = 1600+i
    return tiles[key]


# Balanced practice area centered on the dojo and gate axis at x=600.
# Two-pixel masks preserve the source's pixel scale. Global coordinates keep
# irregular turf contours continuous across tile joins, including corners.
W, H = m['width'], m['height']
yy, xx = np.mgrid[:48, :48]
mixed_cells = 0
terrain_mask = np.zeros((H*48, W*48), dtype=np.uint8)
for y in range(H):
    for x in range(W):
        grass = texture.crop(((x % 4)*48, (y % 4)*48, (x % 4+1)*48, (y % 4+1)*48))
        if 7 <= x <= 17 and 5 <= y <= 11:
            gx = x*48+(xx//2)*2+1
            gy = y*48+(yy//2)*2+1
            # Signed distance to a rounded rectangle inset six pixels.
            qx = np.abs(gx-600)-198
            qy = np.abs(gy-408)-102
            distance = np.sqrt(np.maximum(qx, 0)**2+np.maximum(qy, 0)**2)+np.minimum(np.maximum(qx, qy), 0)-36
            fringe = 1.2*np.cos(np.abs(gx-600)*.31)+1.0*np.cos(np.abs(gy-408)*.43)
            mask = np.clip((2-distance+fringe)/6, 0, 1)
            mask = np.round(mask*4)*255/4
            terrain_mask[y*48:(y+1)*48, x*48:(x+1)*48] = mask.astype('uint8')
            # Retained generated dirt repeats at its original four-cell scale.
            earth = dirt.crop(((x % 4)*48, (y % 4)*48, (x % 4+1)*48, (y % 4+1)*48))
            tile = Image.composite(earth, grass, Image.fromarray(mask.astype('uint8')))
            mixed_cells += int(mask.min() < 255)
        else:
            tile = grass
        m['data'][y*W+x] = pack(tile)

sheet_name = 'EdoCourtyard_A5-grass-v3'
assert np.array_equal(terrain_mask, terrain_mask[:, ::-1]), 'Dirt must mirror across the dojo centerline'
patch = terrain_mask[264:552, 360:840]
assert np.array_equal(patch, patch[::-1, :]), 'Dirt must mirror vertically as well'
Image.fromarray(terrain_mask).save(ART / 'dirt-mask.png')
sheet.save(ROOT / 'img/tilesets' / (sheet_name+'.png'))
tileset['tilesetNames'][4] = sheet_name
for tile_id in tiles.values():
    tileset['flags'][tile_id] = 0
assert m['data'][W*H:] == old['data'][W*H:]
assert m['events'] == old['events']
for name, value in [('Map001', m), ('Tilesets', sets)]:
    (ROOT / 'data' / (name+'.json')).write_text(json.dumps(value, separators=(',', ':'))+'\n', encoding='utf-8')
record = {'source': 'grass-source.png', 'sheet': sheet_name, 'tiles': len(tiles), 'dirtBoundsInclusive': [7, 5, 17, 11], 'centerPixels': [600, 408], 'dirtSizePixels': [468, 276], 'dirtBoundingCells': 77, 'transitionCells': mixed_cells, 'export': 'Generated grass, nearest-neighbor 96 to 192; bilaterally symmetrical rounded pixel turf fringe; retained dirt material', 'unchanged': 'Upper map layers, events, spawn, architecture, props and collision'}
(ART / 'export.json').write_text(json.dumps(record, indent=2)+'\n', encoding='utf-8')
print(json.dumps(record, indent=2))
