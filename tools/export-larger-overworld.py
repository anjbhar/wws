"""Pack generated walking art into MZ cells, preserving sole padding and identities."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/art/overworld-larger-v1'
SPECS = [('player', '$Samurai-v2', '$Samurai-v3'),
         ('instructor', '$SamuraiInstructor-v2', '$SamuraiInstructor-v3'),
         ('shinsengumi', '$Shinsengumi-v1', '$Shinsengumi-v2')]

def export(key, old, new):
    source = Image.open(OUT / (key + '-source.png')).convert('RGBA')
    mask = source.getchannel('A').point(lambda a: 255 if a >= 64 else 0)
    assert source.getchannel('A').getextrema()[0] == 0
    bands, start, last = [], None, None
    for y in range(source.height):
        if mask.crop((0, y, source.width, y+1)).getbbox():
            if start is None: start = y
            last = y
        elif start is not None and y-last > 3:
            bands.append((start, last+1)); start = None
    if start is not None: bands.append((start, last+1))
    assert len(bands) == 4, (key, bands)
    original = Image.open(ROOT / 'img/characters' / (old+'.png')).convert('RGBA')
    sheet = Image.new('RGBA', (192, 352))
    records = []
    for row, (top, bottom) in enumerate(bands):
        columns, first, last_x = [], None, None
        for x in range(source.width):
            if mask.crop((x,top,x+1,bottom)).getbbox():
                if first is None: first=x
                last_x=x
            elif first is not None and x-last_x > 12:
                columns.append((max(0,first-1),last_x+2)); first=None
        if first is not None: columns.append((max(0,first-1),last_x+2))
        assert len(columns)==3, (key,row,columns)
        for col, (left,right) in enumerate(columns):
            bounds = mask.crop((left, top, right, bottom)).getbbox()
            assert bounds and bounds[0] > 0 and bounds[2] < right-left, (key,row,col,bounds)
            box = (left+bounds[0], top+bounds[1], left+bounds[2], top+bounds[3])
            sprite = source.crop(box)
            ref = original.crop((col*48,row*72,(col+1)*48,(row+1)*72)).getbbox()
            target_height = round((ref[3]-ref[1])*1.15)
            scale = target_height/sprite.height
            width = round(sprite.width*scale)
            assert width <= 60, (key,row,col,width)
            feet = sprite.getchannel('A').crop((0,round(sprite.height*.82),sprite.width,sprite.height)).getbbox()
            foot_x = (feet[0]+feet[2])/2
            x = round(32-foot_x*scale)
            assert 0 < x and x+width < 64, (key,row,col,x,width)
            # Same four transparent pixels below soles as the original 48x72 sheets.
            y = 84-target_height
            sprite = sprite.resize((width,target_height),Image.Resampling.NEAREST)
            sheet.alpha_composite(sprite,(col*64+x,row*88+y))
            records.append(dict(row=row,column=col,sourceBounds=box,visibleSize=[width,target_height],originalHeight=ref[3]-ref[1]))
    for row in range(4):
        for col in range(3):
            b=sheet.crop((col*64,row*88,(col+1)*64,(row+1)*88)).getbbox()
            assert b and 0 < b[0] < b[2] < 64 and 0 < b[1] < b[3] < 88
    sheet.save(ROOT/'img/characters'/(new+'.png'))
    sheet.resize((576,1056),Image.Resampling.NEAREST).save(OUT/(key+'-preview.png'))
    return dict(character=key,original=old,output=new,frameSize=[64,88],soleBaseline=84,frames=records)

if __name__ == '__main__':
    results=[export(*s) for s in SPECS]
    (OUT/'export.json').write_text(json.dumps(results,indent=2)+'\n')
    print(json.dumps(results,indent=2))
