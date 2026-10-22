"""Asset invariants and readable contact sheets from actual engine captures."""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parent.parent
A=R/'docs/art/courtyard-v6';O=R/'docs/maps/courtyard-v6-checks'
g=Image.open(A/'earth-periodic.png');v=np.array(g,dtype=float)
assert np.array_equal(v[0],v[-1]) and np.array_equal(v[:,0],v[:,-1])
assert not np.array_equal(v[:192],v[192:][::-1]),'No mirrored halves'
assert v.std(axis=(0,1)).max()<5,'Low terrain contrast'
old=Image.open(R/'docs/maps/backups/before-courtyard-v6/EdoRedWoodExterior_D-v4.png')
new=Image.open(R/'img/tilesets/EdoRedWoodExterior_D-v4.png')
assert old.tobytes()==new.tobytes(),'Retained original dojo, wall and bamboo sheet'
export=json.loads((A/'export.json').read_text());atlas=Image.open(R/'img/tilesets/EdoCourtyard_E-v2.png')
for name,p in export['assets'].items():
    im=Image.open(A/(name+'.png'))
    assert im.size==(p['w']*48,p['h']*48)
    assert im.getchannel('A').getextrema()==(0,255),name
    assert atlas.crop((p['x']*48,p['y']*48,(p['x']+p['w'])*48,(p['y']+p['h'])*48)).tobytes()==im.tobytes(),name
assert len(list((A/'sources').glob('*.png')))==6
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)
def montage(name,items):
    out=Image.new('RGB',(960,((len(items)+2)//3)*260),'#242729');draw=ImageDraw.Draw(out)
    for i,(label,file,box) in enumerate(items):
        im=Image.open(file).crop(box);im.thumbnail((312,230),Image.Resampling.NEAREST)
        x=(i%3)*320;y=(i//3)*260
        out.paste(im,(x,y+24));draw.text((x+4,y+3),label,font=font,fill='white')
    out.save(O/(name+'.png'))
initial=R/'docs/maps/courtyard-in-game.png'
montage('architecture',[(n,initial,b) for n,b in [
 ('Northwest joins',(40,32,370,210)),('Northeast joins',(910,32,1240,210)),
 ('Southwest joins',(40,540,370,720)),('Southeast joins',(910,540,1240,720)),
 ('Gate connections',(460,550,820,720)),('Dojo sill',(500,125,750,260))]])
boxes={
 'rack':(190,230,390,420),'dummy':(85,330,285,550),
 'lantern':(940,250,1140,470),'bamboo-west':(90,60,290,360),
 'bamboo-east':(1000,140,1200,440),'gate':(510,480,770,720),
 'basin':(1000,320,1200,530)}
for group in ['rack','dummy','lantern','bamboo-west','bamboo-east','gate','basin']:
    files=sorted(O.glob(group+'-*.png'))
    montage(group+'-overlaps',[(p.stem,p,boxes[group]) for p in files if 'overlaps' not in p.name])
montage('veranda-foot-contact',[(n,O/(n+'.png'),(500,125,750,290)) for n in ['veranda-foot','dojo-below','dojo-beside']])
repeat=Image.new('RGB',(768,768))
for y in [0,384]:
    for x in [0,384]:repeat.paste(g,(x,y))
repeat.save(O/'earth-large-repeat.png')
print('PASS: retained art pixels; original dojo 288x192; transparent native atlas; six archived sources; periodic non-mirrored quiet terrain. Engine contact sheets exported.')
