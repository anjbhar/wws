"""Export the generated entrance correction without changing the rest of the dojo."""
import json
import shutil
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'docs/art/dojo-interior-v2'
ART.mkdir(parents=True, exist_ok=True)
BACKUP = ROOT / 'docs/maps/backups/before-dojo-entrance-v2'
BACKUP.mkdir(parents=True, exist_ok=True)
for name in ('Map001.json', 'Map002.json', 'Tilesets.json'):
    if not (BACKUP / name).exists():
        shutil.copyfile(ROOT / 'data' / name, BACKUP / name)

source = Path(sys.argv[1])
saved = ART / 'entrance-source.png'
if source.resolve() != saved.resolve():
    shutil.copyfile(source, saved)
generated = Image.open(saved).convert('RGBA').resize((816, 720), Image.Resampling.NEAREST)
image = Image.open(ROOT / 'docs/art/dojo-interior-v1/dojo-interior.png').convert('RGBA')
# Use only the generated entrance patch; all other original pixels stay exact.
patch = (312, 576, 504, 720)
image.paste(generated.crop(patch), patch[:2])
image.save(ART / 'dojo-interior.png')
sheet = Image.new('RGBA', (768, 768))
for y in range(15):
    for x in range(17):
        tile = 1 + y * 17 + x
        tx = (tile // 128 * 8 + tile % 8) * 48
        ty = (tile % 128 // 8) * 48
        sheet.paste(image.crop((x*48, y*48, x*48+48, y*48+48)), (tx, ty))
sheet.save(ROOT / 'img/tilesets/DojoInterior_B-v2.png')

map_path = ROOT / 'data/Map002.json'
map_data = json.loads(map_path.read_text(encoding='utf-8-sig'))
assert (map_data['width'], map_data['height']) == (17, 15)
sets_path = ROOT / 'data/Tilesets.json'
sets = json.loads(sets_path.read_text(encoding='utf-8-sig'))
tileset = sets[map_data['tilesetId']]
assert tileset['name'] == 'Neighborhood Dojo Interior'
tileset['tilesetNames'][5] = 'DojoInterior_B-v2'
for x in (7, 9):
    # The recessed landing is three cells wide; the south doorway is narrower.
    tile = map_data['data'][14 * 17 + x]
    tileset['flags'][tile] = 15
for index, event in enumerate(map_data['events']):
    if event and event['note'] == 'wws:dojo-interior-exit' and event['x'] != 8:
        map_data['events'][index] = None
if 'entrance-v2' not in map_data['note']:
    map_data['note'] += '\nentrance-v2: wooden doorway matches exterior; center exit only.'
map_path.write_text(json.dumps(map_data, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')
sets_path.write_text(json.dumps(sets, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')
(ART / 'export.json').write_text(json.dumps(dict(patch=list(patch), tileSize=48,
    mapSize=[17,15], doorwayCenter=[8,14], landing=[7,13,3,1],
    preservedOutsidePatch=True, tileset='DojoInterior_B-v2'), indent=2)+'\n', encoding='utf-8')
print('Updated entrance artwork and center doorway collision; courtyard preserved.')
