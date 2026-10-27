"""Export imagegen cutouts at measured doorway scale; reuse native dojo masonry.

This replaces only Map003 artwork, its passage flags and its gate triggers.
The original map and generation sources remain in the v1 record and backup.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'docs/art/edo-street-v2'
BACKUP = ROOT / 'docs/maps/backups/before-edo-street-v2'
N = Image.Resampling.NEAREST


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')


def tile_origin(t):
    return ((t // 128 * 8 + t % 8)*48, (t % 128 // 8)*48)


def build():
    measurements = read(ART / 'scale-inputs.json')
    m = read(ROOT / 'data/Map003.json')
    sets = read(ROOT / 'data/Tilesets.json')
    assert [m['width'], m['height']] == [64, 15]
    assert m == read(BACKUP / 'Map003.json'), 'Street changed since backup.'
    assert sets == read(BACKUP / 'Tilesets.json'), 'Tilesets changed since backup.'
    ground = Image.open(ART / 'terrain-source.png').convert('RGBA')
    image = Image.new('RGBA', (3072, 720))
    # Register the generated material bands to the existing four-row route.
    # Architecture is never resized with this terrain plate.
    for source_y, dest_y in [((0, 300), (0, 320)), ((300, 360), (320, 336)),
                             ((360, 480), (336, 528)), ((480, 506), (528, 560)),
                             ((506, 528), (560, 592)), ((528, 724), (592, 720))]:
        band = ground.crop((0, source_y[0], ground.width, source_y[1]))
        image.paste(band.resize((3072, dest_y[1]-dest_y[0]), N), (0, dest_y[0]))
    arch = Image.open(ROOT / 'docs/art/courtyard-v8/architecture.png').convert('RGBA')
    # Native 1x artwork: identical gate and straight wall proportions to Map001.
    wall = arch.crop((96, 584, 480, 672))
    for x in range(0, 3072, 48):
        if 2688 <= x < 2880:
            continue
        sx = (x // 48 % 8)*48
        image.alpha_composite(wall.crop((sx, 0, sx+48, 88)), (x, 248))
    gate = arch.crop((504, 540, 696, 672))
    image.alpha_composite(gate, (2688, 204))
    gate.save(ART / 'gate-native.png')

    exported = []
    for asset in measurements['buildings']:
        sprite = Image.open(ART / asset['source']).convert('RGBA')
        bbox = sprite.getchannel('A').point(lambda a: 255 if a >= 32 else 0).getbbox()
        sprite = sprite.crop(bbox)
        scale = 76 / asset['doorHeight']
        size = [round(sprite.width*scale), round(sprite.height*scale)]
        assert 160 <= size[1] <= 225, (asset['name'], size, 'Door/building ratio needs correction')
        sprite = sprite.resize(size, N)
        x = asset['centerX'] - size[0]//2
        y = 336-size[1]
        image.alpha_composite(sprite, (x, y))
        sprite.save(ART / (asset['name']+'.png'))
        door = asset['doorBox']
        relative_door = [round((door[i]-bbox[i % 2])*scale) for i in range(4)]
        exported.append(dict(name=asset['name'], size=size, position=[x,y],
                             doorHeight=76, doorBox=relative_door,
                             scale=scale, sourceBox=list(bbox)))
    # Reuse existing small fence modules, at their original native pixel size.
    props = Image.open(ROOT / 'img/tilesets/EdoVillage_B-v1.png').convert('RGBA')
    for x, count in [(144, 4), (1056, 3), (1968, 4), (2832, 3)]:
        for i in range(count):
            column = 3 if i == 0 else (1 if i == count-1 else 0)
            image.alpha_composite(props.crop((column*48,96,column*48+48,144)), (x+i*48,624))
    image.save(ART / 'edo-street.png')

    pages = [Image.new('RGBA', (768,768)) for _ in range(4)]
    flags = [15]*8192
    flags[0] = 16
    walkable = []
    for y in range(15):
        for x in range(64):
            t = m['data'][y*64+x]
            assert t == 1+y*64+x
            p, local = divmod(t,256)
            px,py = tile_origin(local)
            pages[p].paste(image.crop((x*48,y*48,(x+1)*48,(y+1)*48)),(px,py))
            if 7 <= y <= 10 or (y == 6 and x in (57,58)):
                flags[t] = 0
                walkable.append([x,y])
    names = [f'EdoStreet_{c}-v2' for c in 'BCDE']
    for page, name in zip(pages,names):
        page.save(ROOT / 'img/tilesets' / (name+'.png'))
    sets[m['tilesetId']]['tilesetNames'][5:9] = names
    sets[m['tilesetId']]['flags'] = flags
    sets[m['tilesetId']]['note'] = 'wws:edo-street-v2; measured76px doors; native courtyard wall/gate; per-cell collision'
    # The smaller native gate has two safe central columns rather than three.
    for i,x in enumerate((57,58),1):
        e=m['events'][i]
        e['x'],e['y']=x,6
    m['events'][3] = None
    m['note'] = 'wws:edo-street-v2; character-scale buildings and native courtyard gate; no NPCs or interiors'
    write(ROOT / 'data/Map003.json',m)
    write(ROOT / 'data/Tilesets.json',sets)

    # Offline native-scale art proof. Player copies are documentation only,
    # never NPC events or baked into production map tiles.
    sam=Image.open(ROOT / 'img/characters/$Samurai-v3.png').convert('RGBA').crop((64,0,128,88))
    sam=sam.crop(sam.getbbox())
    comparison=Image.new('RGBA',(1280,360),(224,217,192,255))
    draw=ImageDraw.Draw(comparison)
    old=arch.crop((456,0,744,240))
    old=old.crop(old.getbbox())
    comparison.alpha_composite(old,(8,246-old.height))
    comparison.alpha_composite(sam,(136-sam.width//2,212-sam.height))
    draw.text((16,14),'Existing dojo / current player',fill=(35,29,24,255))
    for i,asset in enumerate(exported):
        sprite=Image.open(ART/(asset['name']+'.png')).convert('RGBA')
        x=320+i*320+(320-sprite.width)//2
        comparison.alpha_composite(sprite,(x,246-sprite.height))
        door=asset['doorBox']
        # Place the actual player beside the measured opening at its threshold.
        axis=x+door[0]-sam.width//2-6
        comparison.alpha_composite(sam,(axis,246-sprite.height+door[3]-sam.height))
        draw.text((328+i*320,14),asset['name']+' / 76px door',fill=(35,29,24,255))
    comparison.save(ART / 'character-scale-proof.png')
    gate_proof=Image.new('RGBA',(640,240),(224,217,192,255))
    gate_proof.alpha_composite(gate,(32,64))
    gate_proof.alpha_composite(gate,(352,64))
    gate_proof.alpha_composite(sam,(128-sam.width//2,196-sam.height))
    gate_proof.alpha_composite(sam,(448-sam.width//2,196-sam.height))
    gd=ImageDraw.Draw(gate_proof)
    gd.text((32,20),'Courtyard gate - native 1x',fill=(35,29,24,255))
    gd.text((352,20),'Street gate - identical pixels',fill=(35,29,24,255))
    gate_proof.save(ART / 'gate-scale-proof.png')
    write(ART / 'export.json',dict(mapId=3,tilesetId=m['tilesetId'],tileSize=48,
          mapSize=[64,15],outputSize=[3072,720],doorHeight=76,buildings=exported,
          characterVisibleSize=list(sam.size),gateSize=list(gate.size),gateNative1x=True,
          gatePosition=[2688,204],roadRows=[7,8,9,10],walkable=walkable,
          returnTriggers=[[57,6],[58,6]],entry=[57,8],returnDestination=[1,12,13]))
    print('Repacked Map003 with measured76px doors, native gate/walls and two safe gate triggers.')


if __name__ == '__main__':
    build()
