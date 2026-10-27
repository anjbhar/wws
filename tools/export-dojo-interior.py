"""Import generated dojo art as a native 48px MZ tile map. Run with source PNG."""
import copy
import json
import shutil
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
if (ROOT / 'data/Map002.json').exists():
    current = json.loads((ROOT / 'data/Map002.json').read_text(encoding='utf-8-sig'))
    assert current.get('note', '').startswith('wws:dojo-interior-v1'), 'Map002 already exists.'
ART = ROOT / 'docs/art/dojo-interior-v1'
ART.mkdir(parents=True, exist_ok=True)
source = Path(sys.argv[1])
saved = ART / 'generation-source.png'
if source.resolve() != saved.resolve():
    shutil.copyfile(source, saved)
image = Image.open(saved).convert('RGBA')
# Export only: nearest-neighbor preserves generated pixel clusters at engine scale.
image = image.resize((816, 720), Image.Resampling.NEAREST)
image.save(ART / 'dojo-interior.png')
sheet = Image.new('RGBA', (768, 768))
flags = [15] * 8192
flags[0] = 16
width, height = 17, 15
data = [0] * (width * height * 6)
walkable = []
for y in range(height):
    for x in range(width):
        tile = 1 + y * width + x
        tx = (tile // 128 * 8 + tile % 8) * 48
        ty = (tile % 128 // 8) * 48
        sheet.paste(image.crop((x*48, y*48, x*48+48, y*48+48)), (tx, ty))
        data[y*width+x] = tile
        open_floor = 1 <= x <= 15 and 3 <= y <= 12
        rack = x in (1, 2) and 4 <= y <= 6
        equipment = x in (14, 15) and 5 <= y <= 7
        entrance = 7 <= x <= 9 and y in (13, 14)
        if (open_floor and not rack and not equipment) or entrance:
            flags[tile] = 0
            walkable.append([x, y])
sheet.save(ROOT / 'img/tilesets/DojoInterior_B-v1.png')

def read(name):
    return json.loads((ROOT / 'data' / name).read_text(encoding='utf-8-sig'))

def write(name, value):
    (ROOT / 'data' / name).write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')

backup = ROOT / 'docs/maps/backups/before-dojo-interior-v1'
backup.mkdir(parents=True, exist_ok=True)
for name in ('Map001.json', 'MapInfos.json', 'Tilesets.json'):
    if not (backup / name).exists():
        shutil.copyfile(ROOT / 'data' / name, backup / name)

sets = read('Tilesets.json')
existing = next((s for s in sets if s and s['name'] == 'Neighborhood Dojo Interior'), None)
tileset_id = existing['id'] if existing else len(sets)
tileset = dict(id=tileset_id, mode=1, name='Neighborhood Dojo Interior',
               note='wws:dojo-interior-v1; 48px baked artwork, per-cell collision', flags=flags,
               tilesetNames=['', '', '', '', '', 'DojoInterior_B-v1', '', '', ''])
if existing:
    sets[tileset_id] = tileset
else:
    sets.append(tileset)
write('Tilesets.json', sets)

courtyard = read('Map001.json')
door = courtyard['events'][5]
assert door['x'] == 12 and door['y'] == 3, 'Courtyard entrance moved; review connection.'
template = copy.deepcopy(door['pages'][0])
door['name'] = 'Enter neighborhood dojo'
door['pages'][0]['trigger'] = 1
door['pages'][0]['list'] = [dict(code=201, indent=0, parameters=[0, 2, 8, 13, 8, 0]),
                          dict(code=0, indent=0, parameters=[])]
write('Map001.json', courtyard)
events = [None]
for x in (7, 8, 9):
    page = copy.deepcopy(template)
    page.update(priorityType=0, trigger=1, through=True)
    page['list'] = [dict(code=201, indent=0, parameters=[0, 1, 12, 4, 2, 0]),
                    dict(code=0, indent=0, parameters=[])]
    events.append(dict(id=len(events), name='Return to courtyard', note='wws:dojo-interior-exit',
                       x=x, y=14, pages=[page]))
interior = {key: copy.deepcopy(value) for key, value in courtyard.items()
            if key not in ('data', 'events')}
interior.update(autoplayBgm=False, autoplayBgs=False, displayName='Neighborhood Dojo',
                width=width, height=height, tilesetId=tileset_id,
                note='wws:dojo-interior-v1; 48px tiles; 15x11 floor envelope; source docs/art/dojo-interior-v1',
                parallaxName='', data=data, events=events, encounterList=[], scrollType=0)
write('Map002.json', interior)
infos = read('MapInfos.json')
assert len(infos) <= 2 or infos[2] is None or infos[2]['name'] == 'Neighborhood Dojo', 'Map002 already exists.'
while len(infos) <= 2:
    infos.append(None)
infos[2] = dict(id=2, expanded=False, name='Neighborhood Dojo', order=2, parentId=1, scrollX=408, scrollY=360)
write('MapInfos.json', infos)
(ART / 'export.json').write_text(json.dumps(dict(tileSize=48, mapSize=[width,height],
    sourceSize=list(Image.open(saved).size), outputSize=[816,720],
    tilesetId=tileset_id, walkable=walkable), indent=2)+'\n', encoding='utf-8')
print('Exported Map002, DojoInterior_B-v1, courtyard entrance and return exits.')
