"""Render saved MZ map layers for review without modifying game assets."""
import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
core = (ROOT / 'js/rmmz_core.js').read_text(encoding='utf-8')
floor = json.loads(re.search(r'Tilemap.FLOOR_AUTOTILE_TABLE = (\[[\s\S]*?\]);', core)[1])
wall = json.loads(re.search(r'Tilemap.WALL_AUTOTILE_TABLE = (\[[\s\S]*?\]);', core)[1])
sets = json.loads((ROOT / 'data/Tilesets.json').read_text(encoding='utf-8'))
system = json.loads((ROOT / 'data/System.json').read_text(encoding='utf-8'))
actors = json.loads((ROOT / 'data/Actors.json').read_text(encoding='utf-8'))
out = ROOT / 'docs/maps'
out.mkdir(exist_ok=True, parents=True)
for map_id in (1, 2):
    if not (ROOT / f'data/Map{map_id:03}.json').exists():
        continue
    m = json.loads((ROOT / f'data/Map{map_id:03}.json').read_text(encoding='utf-8'))
    tileset = sets[m['tilesetId']]
    sheets = [Image.open(ROOT / 'img/tilesets' / (name + '.png')).convert('RGBA') if name else None for name in tileset['tilesetNames']]
    image = Image.new('RGBA', (m['width']*48,m['height']*48), (0,0,0,255))
    higher = []
    def draw(tile, x, y):
        if tile == 0:
            return
        if tile < 2048:
            slot = 4 if 1536 <= tile < 1664 else 5 + tile // 256
            sx = ((tile//128 % 2)*8 + tile%8)*48
            sy = (tile%256//8 % 16)*48
            crop = sheets[slot].crop((sx,sy,sx+48,sy+48))
            image.alpha_composite(crop, (x,y))
            return
        kind = (tile-2048)//48
        shape = (tile-2048)%48
        tx,ty = kind%8,kind//8
        if tile < 4352:
            slot,bx,by,table = 1,tx*2,(ty-2)*3,floor
        elif tile < 5888:
            slot,bx,by,table = 2,tx*2,(ty-6)*2,wall
        else:
            slot,bx,by = 3,tx*2,int((ty-10)*2.5 + (0.5 if ty%2 else 0))
            table = wall if ty%2 else floor
        for i,(qx,qy) in enumerate(table[shape]):
            sx,sy=(bx*2+qx)*24,(by*2+qy)*24
            image.alpha_composite(sheets[slot].crop((sx,sy,sx+24,sy+24)),(x+i%2*24,y+i//2*24))
    for z in range(4):
        for y in range(m['height']):
            for x in range(m['width']):
                tile=m['data'][(z*m['height']+y)*m['width']+x]
                if tile and tileset['flags'][tile]&16:
                    higher.append((tile,x*48,y*48))
                else:
                    draw(tile,x*48,y*48)
    for event in sorted((e for e in m['events'] if e), key=lambda e: e['y']):
        graphic=event['pages'][0]['image']
        name=graphic['characterName']
        if not name:
            continue
        sheet=Image.open(ROOT/'img/characters'/f'{name}.png').convert('RGBA')
        single='$' in name
        fw,fh=sheet.width//(3 if single else 12),sheet.height//(4 if single else 8)
        index=graphic['characterIndex']
        sx=(graphic['pattern']+(0 if single else index%4*3))*fw
        sy=((graphic['direction']-2)//2+(0 if single else index//4*4))*fh
        image.alpha_composite(sheet.crop((sx,sy,sx+fw,sy+fh)),(event['x']*48+(48-fw)//2,(event['y']+1)*48-(0 if '!' in name else 6)-fh))
    if map_id == system['startMapId']:
        actor=actors[system['partyMembers'][0]]
        hero_sheet=Image.open(ROOT/'img/characters'/f'{actor["characterName"]}.png').convert('RGBA')
        single='$' in actor['characterName']
        fw,fh=hero_sheet.width//(3 if single else 12),hero_sheet.height//(4 if single else 8)
        index=actor['characterIndex']
        sx=(1+(0 if single else index%4*3))*fw
        sy=((3 if m.get('note','').startswith('wws:dojo-courtyard-v6') else 0)+(0 if single else index//4*4))*fh
        hero=hero_sheet.crop((sx,sy,sx+fw,sy+fh))
        # MZ characters anchor at bottom-center with the ordinary 6px vertical offset.
        image.alpha_composite(hero,(system['startX']*48+(48-fw)//2,(system['startY']+1)*48-6-fh))
    for tile,x,y in higher:
        draw(tile,x,y)
    image.convert('RGB').save(out/f'Map{map_id:03}-preview.png')
    print(f'Rendered map {map_id}: {m["width"]} x {m["height"]}')
