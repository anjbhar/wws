"""Pack generated street panels into native MZ tiles; preserve existing content.

Use the bundled Python/Pillow runtime. Sources are retained under docs/art.
The four B-E pages contain baked map artwork, matching the courtyard workflow.
"""
from pathlib import Path
import copy
import json
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'docs/art/edo-street-v1'
BACKUP = ROOT / 'docs/maps/backups/before-edo-street-v1'
W, H, T = 64, 15, 48


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')


def tile_origin(tile):
    return ((tile // 128 * 8 + tile % 8) * T, (tile % 128 // 8) * T)


def build():
    assert len(sys.argv) == 3, 'Usage: build-edo-street.py LEFT.png RIGHT.png'
    ART.mkdir(parents=True, exist_ok=True)
    sources = []
    for side, source in zip(('left', 'right'), sys.argv[1:]):
        destination = ART / f'{side}-source.png'
        if Path(source).resolve() != destination.resolve():
            destination.write_bytes(Path(source).read_bytes())
        sources.append(Image.open(destination).convert('RGBA'))
    panels = [im.resize((1536, 720), Image.Resampling.NEAREST) for im in sources]
    image = Image.new('RGBA', (W*T, H*T))
    image.paste(panels[0], (0, 0))
    image.paste(panels[1], (1536, 0))
    # Blend only the deliberately empty joining verge/road, preserving buildings.
    # A broad low-contrast join avoids a visible vertical change in soil color.
    seam = 96
    for offset in range(-seam, seam):
        x = 1536 + offset
        weight = (offset + seam) / (2 * seam - 1)
        left = panels[0].crop((1536 + min(offset, -1), 0, 1537 + min(offset, -1), 720))
        right_x = max(offset, 0)
        right = panels[1].crop((right_x, 0, right_x + 1, 720))
        image.paste(Image.blend(left, right, weight), (x, 0))
    image.save(ART / 'edo-street.png')

    sets = read(ROOT / 'data/Tilesets.json')
    infos = read(ROOT / 'data/MapInfos.json')
    assert not (ROOT / 'data/Map003.json').exists(), 'Map003 exists: review before replacing.'
    assert len(infos) <= 3 or infos[3] is None, 'Map003 is already registered.'
    assert not any(s and s['name'] == 'Edo Neighborhood Street' for s in sets)
    tileset_id = len(sets)
    flags = [15] * 8192
    flags[0] = 16
    pages = [Image.new('RGBA', (768, 768)) for _ in range(4)]
    data = [0] * (W * H * 6)
    walkable = []
    for y in range(H):
        for x in range(W):
            tile = 1 + y * W + x
            page, local = divmod(tile, 256)
            px, py = tile_origin(local)
            pages[page].paste(image.crop((x*T, y*T, (x+1)*T, (y+1)*T)), (px, py))
            data[y*W+x] = tile
            # Four continuously clear road rows; the shop apron is available
            # except where facade props stand. North buildings and drainage block.
            open_cell = 7 <= y <= 10
            if y == 6:
                open_cell = not (4 <= x <= 12 or 18 <= x <= 28 or 38 <= x <= 45)
            if 56 <= x <= 58 and y in (4, 5):
                open_cell = True
            if open_cell:
                flags[tile] = 0
                walkable.append([x, y])
    names = [f'EdoStreet_{letter}-v1' for letter in 'BCDE']
    for page, name in zip(pages, names):
        page.save(ROOT / 'img/tilesets' / f'{name}.png')
    sets.append(dict(id=tileset_id, mode=1, name='Edo Neighborhood Street',
                     note='wws:edo-street-v1; baked 48px environment tiles with cell collision',
                     flags=flags, tilesetNames=['']*5 + names))

    courtyard = read(ROOT / 'data/Map001.json')
    original = read(BACKUP / 'Map001.json')
    assert courtyard == original, 'Courtyard changed since snapshot; refresh snapshot before building.'
    template = copy.deepcopy(courtyard['events'][10]['pages'][0])
    for event_id in (8, 9, 10):
        event = courtyard['events'][event_id]
        assert event['note'] == 'wws:courtyard-boundary'
        event['name'] = 'Leave courtyard for Edo street'
        event['note'] = 'wws:courtyard-street-exit'
        page = event['pages'][0]
        page.update(priorityType=0, trigger=1, through=True)
        page['list'] = [dict(code=201, indent=0, parameters=[0, 3, 57, 8, 4, 0]),
                        dict(code=0, indent=0, parameters=[])]

    page = copy.deepcopy(template)
    page.update(priorityType=0, trigger=1, through=True)
    page['list'] = [dict(code=201, indent=0, parameters=[0, 1, 12, 13, 8, 0]),
                    dict(code=0, indent=0, parameters=[])]
    events = [None]
    for x in (56, 57, 58):
        events.append(dict(id=len(events), name='Return through dojo gate',
                           note='wws:edo-street-return', x=x, y=5, pages=[copy.deepcopy(page)]))
    street = {key: copy.deepcopy(value) for key, value in courtyard.items()
              if key not in ('data', 'events')}
    street.update(width=W, height=H, tilesetId=tileset_id, displayName='Edo Neighborhood',
                  note='wws:edo-street-v1; no NPCs, encounters or interiors; west edge reserved for next area',
                  autoplayBgm=True, autoplayBgs=False, scrollType=0,
                  parallaxName='', encounterList=[], data=data, events=events)
    while len(infos) <= 3:
        infos.append(None)
    infos[3] = dict(id=3, expanded=False, name='Edo Neighborhood Street', order=3,
                    parentId=0, scrollX=2688, scrollY=360)
    write(ROOT / 'data/Map003.json', street)
    write(ROOT / 'data/Map001.json', courtyard)
    write(ROOT / 'data/Tilesets.json', sets)
    write(ROOT / 'data/MapInfos.json', infos)
    write(ART / 'export.json', dict(mapId=3, tilesetId=tileset_id,
          sourceSizes=[list(im.size) for im in sources], outputSize=list(image.size),
          mapSize=[W,H], tileSize=T, roadRows=[7,8,9,10], walkable=walkable,
          entry=[57,8], returnTriggers=[[56,5],[57,5],[58,5]], returnDestination=[1,12,13],
          bakedArtwork=True, seamBlendWidth=192))
    print('Built Map003: 64x15 street, four native tile pages, no NPCs; linked courtyard gate.')


if __name__ == '__main__':
    build()
