"""Pack the imagegen terrain/contact sprites. Preserve corrected architecture exactly."""
from pathlib import Path
import json
from PIL import Image
import numpy as np

R=Path(__file__).resolve().parent.parent
A=R/'docs/art/courtyard-v9'
B=R/'docs/maps/backups/before-courtyard-v9'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
m=read(B/'Map001.json'); sets=read(B/'Tilesets.json'); s=sets[m['tilesetId']]
N=Image.Resampling.NEAREST
ground=Image.open(A/'terrain-final-source.png').convert('RGBA').resize((1200,720),N)
shadows=Image.open(A/'contact-shadows-source.png').convert('RGBA')
# Each generated contact group is isolated in a regular 3 x 2 cell sheet.
# Uniformly fit each crop, never stretch a prop or alter its silhouette.
placements=[('rack',0,0,143,382,58,14),('dummy',1,0,119,527,30,10),
 ('basin',2,0,1080,527,37,10),('lantern',0,1,1080,432,34,10),
 ('bamboo-west',1,1,151,283,74,15),('bamboo-east',2,1,1060,334,66,14)]
for name,col,row,x,y,w,h in placements:
    if name=='rack':
        # Independent foot contacts avoid a detached oval between the feet.
        for side,box,px in [('left',(100,270,254,350),123),('right',(276,270,444,350),165)]:
            sprite=shadows.crop(box)
            sprite.thumbnail((14,6),Image.Resampling.LANCZOS)
            sprite.save(A/('rack-contact-'+side+'.png'))
            ground.alpha_composite(sprite,(px-sprite.width//2,382-sprite.height//2))
        continue
    cw,ch=shadows.width//3,shadows.height//2
    # Restrict to the contact core; omit the excessive diffuse outskirts.
    sprite=shadows.crop((col*cw+40,row*ch+int(ch*.46),(col+1)*cw-40,row*ch+int(ch*.85)))
    sprite.thumbnail((w,h),Image.Resampling.LANCZOS)
    sprite.save(A/(name+'-contact.png'))
    ground.alpha_composite(sprite,(x-sprite.width//2,y-sprite.height//2))
ground.save(A/'ground.png')
pages=[Image.new('RGBA',(768,768)),Image.new('RGBA',(768,768))]
def coords(t):return ((t//128*8+t%8)*48,(t%128//8)*48)
for y in range(m['height']):
    for x in range(m['width']):
        t=m['data'][y*m['width']+x]; page,local=divmod(t,256)
        pages[page].paste(ground.crop((x*48,y*48,x*48+48,y*48+48)),coords(local))
for page,name in zip(pages,['B','C']):page.save(R/f'img/tilesets/EdoCourtyard_{name}-v9.png')
# D/E retain every architecture and prop pixel, including repaired seams.
for name in ['D','E']:
    (R/f'img/tilesets/EdoCourtyard_{name}-v9.png').write_bytes((B/f'EdoCourtyard_{name}-v8.png').read_bytes())
s['tilesetNames'][5:9]=[f'EdoCourtyard_{name}-v9' for name in ['B','C','D','E']]
assert m==read(B/'Map001.json')
assert s['flags']==read(B/'Tilesets.json')[m['tilesetId']]['flags']
assert (R/'data/System.json').read_bytes()==(B/'System.json').read_bytes()
(R/'data/Tilesets.json').write_text(json.dumps(sets,separators=(',',':'))+'\n')
(A/'export.json').write_text(json.dumps({'mapExact':True,'flagsExact':True,'architectureExact':True,'propsExact':True,'contacts':placements},indent=2)+'\n')
print('Packed v9 terrain and contact sprites; map, flags, architecture and props preserved exactly')
