"""Recompose approved street assets as a compact 42x15 native MZ map.

No art generation or architecture scaling: only material registration, native
sprite placement and tile packing. Snapshot guards preserve unrelated content.
"""
from pathlib import Path
import json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'docs/art/edo-street-v3'
PREVIOUS = ROOT / 'docs/art/edo-street-v2'
BACKUP = ROOT / 'docs/maps/backups/before-edo-street-v3'
W, H, T = 42, 15, 48
N = Image.Resampling.NEAREST


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def write(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')


def build():
    ART.mkdir(parents=True, exist_ok=True)
    names = ['Map001', 'Map003', 'Tilesets', 'MapInfos']
    data = {n: read(ROOT/'data'/f'{n}.json') for n in names}
    for n in names:
        assert data[n] == read(BACKUP/f'{n}.json'), f'{n} changed after snapshot'
    m, sets = data['Map003'], data['Tilesets']
    assert m['note'].startswith('wws:edo-street-v2')
    assert [m['width'], m['height']] == [64,15]
    materials = Image.open(PREVIOUS/'terrain-source.png').convert('RGBA')
    image = Image.new('RGBA', (W*T,H*T))
    # Quiet earth across the entire north band removes all rear lawn. The six
    # road rows are y5-10; north/south aprons have the same unobstructed surface.
    dirt = materials.crop((0,365,W*T,465))
    # Repeat at native pixel density. Alternating vertical reflection keeps
    # adjoining material edges continuous without stretching tiny grain marks.
    for i,y in enumerate(range(0,576,dirt.height)):
        band = ImageOps.flip(dirt) if i % 2 else dirt
        image.paste(band.crop((0,0,W*T,min(dirt.height,576-y))),(0,y))
    image.paste(materials.crop((0,480,W*T,506)).resize((W*T,16),N),(0,576))
    image.paste(materials.crop((0,506,W*T,528)).resize((W*T,32),N),(0,592))
    image.paste(materials.crop((0,528,W*T,624)),(0,624))

    props = Image.open(ROOT/'img/tilesets/EdoVillage_B-v1.png').convert('RGBA')

    def fence(x, y, count):
        for i in range(count):
            col = 3 if i == 0 else (1 if i == count-1 else 0)
            image.alpha_composite(props.crop((col*48,96,col*48+48,144)),(x+i*48,y))

    # Short timber sections close the narrow gaps, not a continuous dojo wall.
    for x,count in [(0,3),(528,3),(960,3),(1392,3)]:
        fence(x,144,count)
    buildings = []
    old_meta = read(PREVIOUS/'export.json')
    for name,x in [('home',144),('tea-shop',668),('merchant',1106)]:
        sprite = Image.open(PREVIOUS/(name+'.png')).convert('RGBA')
        y = 192-sprite.height
        image.alpha_composite(sprite,(x,y))
        buildings.append(dict(name=name,position=[x,y],size=list(sprite.size),
            doorHeight=76,doorBox=next(a['doorBox'] for a in old_meta['buildings'] if a['name']==name)))

    arch = Image.open(ROOT/'docs/art/courtyard-v8/architecture.png').convert('RGBA')
    # The only dojo wall is this short far-right enclosure. Its gate roof meets
    # the north map boundary and its eastern wing terminates at the right edge.
    wall = arch.crop((96,584,480,672))
    for x in list(range(1536,1776,48))+[1968]:
        sx=(x//48 % 8)*48
        image.alpha_composite(wall.crop((sx,0,sx+48,88)),(x,44))
    gate = Image.open(PREVIOUS/'gate-native.png').convert('RGBA')
    image.alpha_composite(gate,(1776,0))
    for x,count in [(96,3),(768,3),(1392,3)]:
        fence(x,636,count)
    image.save(ART/'edo-street.png')

    pages = [Image.new('RGBA',(768,768)) for _ in range(3)]
    flags = [15]*8192
    flags[0] = 16
    tiles = [0]*(W*H*6)
    walkable = []
    for y in range(H):
        for x in range(W):
            tile = 1+y*W+x
            page,local = divmod(tile,256)
            px=(local//128*8+local%8)*48
            py=(local%128//8)*48
            pages[page].paste(image.crop((x*T,y*T,(x+1)*T,(y+1)*T)),(px,py))
            tiles[y*W+x] = tile
            if 4 <= y <= 11 or (x in (38,39) and y in (2,3)):
                flags[tile] = 0
                walkable.append([x,y])
    sheet_names = [f'EdoStreet_{c}-v3' for c in 'BCD']
    for page,name in zip(pages,sheet_names):
        page.save(ROOT/'img/tilesets'/(name+'.png'))
    sets[m['tilesetId']]['tilesetNames'][5:9] = sheet_names+['']
    sets[m['tilesetId']]['flags'] = flags
    sets[m['tilesetId']]['note'] = 'wws:edo-street-v3;42x15;native76px-door buildings;six-row road;edge-only dojo wall'
    m.update(width=W,height=H,data=tiles,
        note='wws:edo-street-v3;42x15;road rows5-10;no rear lawn;edge-only dojo enclosure;no NPCs or interiors')
    for i,x in enumerate((38,39),1):
        m['events'][i]['x'],m['events'][i]['y'] = x,2
    for i in (8,9,10):
        commands = data['Map001']['events'][i]['pages'][0]['list']
        assert commands[0]['code'] == 201 and commands[0]['parameters'] == [0,3,57,8,4,0]
        commands[0]['parameters'] = [0,3,38,6,4,0]
    data['MapInfos'][3]['scrollX'] = 1536
    for name in names:
        write(ROOT/'data'/f'{name}.json',data[name])
    write(ART/'export.json',dict(mapId=3,tilesetId=m['tilesetId'],mapSize=[W,H],
        outputSize=[W*T,H*T],tileSize=T,buildings=buildings,roadRows=list(range(5,11)),
        apronRows=[4,11],walkable=walkable,entry=[38,6],returnTriggers=[[38,2],[39,2]],
        returnDestination=[1,12,13],gatePosition=[1776,0],gateSize=list(gate.size),
        dojoWallBounds=[1536,44,2016,132],rearLawn=False,foregroundGrassRows=[13,14],
        assetsReusedAtNativeSize=True,newImageGeneration=False))
    print('Compacted Map003 to42x15: six road rows, top-edge buildings, dojo wall only at east edge.')


if __name__ == '__main__':
    build()
