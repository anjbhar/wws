"""Pack generated v8 artwork; retain map/event metadata and cell passage semantics."""
from pathlib import Path
import json
from PIL import Image, ImageEnhance
import numpy as np

R = Path(__file__).resolve().parent.parent
A = R/'docs/art/courtyard-v8'
B = R/'docs/maps/backups/before-courtyard-v8'
N = Image.Resampling.NEAREST
read = lambda p: json.loads(p.read_text(encoding='utf-8'))
m = read(B/'Map001.json'); sets = read(B/'Tilesets.json')
oldset = read(B/'Tilesets.json')[m['tilesetId']]
s = sets[m['tilesetId']]; W,H = m['width'],m['height']

def clean(im):
    im = im.convert('RGBA')
    im.putalpha(im.getchannel('A').point(lambda v: 255 if v>=200 else 0))
    return im

def fit(im, size):
    im=clean(im); im=im.crop(im.getbbox())
    scale=min(size[0]/im.width,size[1]/im.height)
    return im.resize((round(im.width*scale),round(im.height*scale)),N)

def padded(im,size):
    out=Image.new('RGBA',size);out.alpha_composite(im,((size[0]-im.width)//2,size[1]-im.height))
    return out

def coords(t):
    return ((t//128*8+t%8)*48,(t%128//8)*48)

def put(x,y,z,t): m['data'][(z*H+y)*W+x]=t

# Full-canvas ground: no repeated edge tiles, independent two-page atlas.
ground=Image.open(A/'terrain-source.png').convert('RGBA').resize((1200,720),N)
# Register the generated wear footprint with the existing practice row.
registered=ground.copy();registered.paste(ground,(0,48));ground=registered
ground.save(A/'ground.png')
pages=[Image.new('RGBA',(768,768)),Image.new('RGBA',(768,768))]
for y in range(H):
    for x in range(W):
        t=1+y*W+x;page,local=divmod(t,256);sx,sy=coords(local)
        pages[page].paste(ground.crop((x*48,y*48,x*48+48,y*48+48)),(sx,sy))
        s['flags'][t]=0;put(x,y,0,t)
for p,name in zip(pages,['B','C']):p.save(R/f'img/tilesets/EdoCourtyard_{name}-v8.png')
s['flags'][0]=16

# Scale the complete registered enclosure once. Restore the intact original hall.
arch=clean(Image.open(A/'architecture-source.png')).resize((1200,720),N)
original=Image.open(R/'img/tilesets/EdoRedWoodExterior_D-v4.png').convert('RGBA')
hall=original.crop((0,48,288,240))
arch.paste((0,0,0,0),(456,0,744,192));arch.alpha_composite(hall,(456,0))
# The rear wall continues behind the hall's narrower visible facade. Use the
# corrected continuous bay as a backing, preserving all existing opaque pixels.
join_source=A/'architecture-joins-source.png'
if join_source.exists():
    correction=clean(Image.open(join_source)).resize((1200,720),N)
    backing=Image.new('RGBA',arch.size)
    backing.alpha_composite(correction.crop((440,81,760,139)),(440,81))
    backing.alpha_composite(arch);arch=backing
# Register the *visible* veranda surface to the sill, including its transparent
# top padding. Export as part of the architecture so it can cross the row seam.
ver=fit(Image.open(A/'veranda-source.png'),(288,42))
deck=Image.new('RGBA',(336,48));deck.alpha_composite(ver,((336-ver.width)//2,0))
arch.alpha_composite(deck,(432,189))
arch.alpha_composite(hall,(456,0))
if join_source.exists():
    pixels=np.array(arch)
    assert np.all(pixels[88:132,450:750,3]==255),'Rear wall has an open join beside the facade'
    assert np.all(pixels[190:193,478:722,3]==255),'Veranda does not meet the visible sill'
arch.save(A/'architecture.png')
atlas=Image.new('RGBA',(768,768));count=2
for y in range(H):
    for x in range(W):
        old=m['data'][(2*H+y)*W+x]
        # Layer two also contains veranda, retained separately below.
        if old and old<512:put(x,y,2,0)
        tile=arch.crop((x*48,y*48,x*48+48,y*48+48))
        if tile.getbbox():
            assert count<256
            sx,sy=coords(count);atlas.paste(tile,(sx,sy))
            s['flags'][512+count]=oldset['flags'][old] if old else 16
            put(x,y,2,512+count);count+=1
atlas.save(R/'img/tilesets/EdoCourtyard_D-v8.png')

# Replace the existing prop atlas in its established cells.
props=Image.open(R/'img/tilesets/EdoCourtyard_E-v7.png').convert('RGBA')
src=Image.open(A/'props-source.png').convert('RGBA')
cw,ch=src.width/3,src.height/2
def cell(col,row):return src.crop((round(col*cw),round(row*ch),round((col+1)*cw),round((row+1)*ch)))
def asset(name,im,x,y,w,h):
    im=padded(im,(w*48,h*48));props.paste((0,0,0,0),(x*48,y*48,(x+w)*48,(y+h)*48));props.alpha_composite(im,(x*48,y*48));im.save(A/(name+'.png'))
asset('rack',fit(cell(0,0),(64,62)),0,0,2,2)
asset('dummy',fit(cell(1,0),(43,70)),2,0,1,2)
asset('basin',fit(cell(2,0),(43,32)),0,2,1,1)
asset('lantern',fit(src.crop((round(src.width*.40),round(src.height*.55),round(src.width*.61),src.height)),(42,68)),3,0,1,2)
ver=fit(Image.open(A/'veranda-source.png'),(288,42))
deck=Image.new('RGBA',(336,48));deck.alpha_composite(ver,((336-ver.width)//2,0))
props.paste((0,0,0,0),(0,144,336,192));props.alpha_composite(deck,(0,144));deck.save(A/'veranda.png')
# Stone source group is segmented after inspecting its transparent component bounds.
stones=clean(src.crop((round(src.width*.63),round(src.height*.86),src.width,src.height)))
occupied=np.any(np.array(stones)[:,:,3]>0,axis=0);runs=[];start=None
for x,v in enumerate(list(occupied)+[False]):
    if v and start is None:start=x
    if not v and start is not None:runs.append((start,x));start=None
runs=[p for p in runs if p[1]-p[0]>20];assert len(runs)==3,runs
for i,(left,right) in enumerate(runs):
    part=stones.crop((left,0,right,stones.height))
    asset('slab'+str(i),fit(part,(36,16)),i,4,1,1)
asset('bamboo-west',original.crop((192,384,288,576)),4,6,2,4)
asset('bamboo-east',fit(cell(0,1),(90,183)),6,6,2,4)
for bx,by,ax in [(2,2,4),(21,3,6)]:
    for yy in range(4):
        for xx in range(2):
            t=768+(6+yy)*8+ax+xx
            s['flags'][t]=16 if yy<3 else 15
            put(bx+xx,by+yy,3,t)
props.save(R/'img/tilesets/EdoCourtyard_E-v8.png')
s['tilesetNames'][5:9]=['EdoCourtyard_B-v8','EdoCourtyard_C-v8','EdoCourtyard_D-v8','EdoCourtyard_E-v8']
assert m['events']==read(B/'Map001.json')['events']
assert np.array_equal(np.array(arch.crop((456,0,744,192)))[np.array(hall)[:,:,3]==255],np.array(hall)[np.array(hall)[:,:,3]==255])
for name,v in [('Map001',m),('Tilesets',sets)]:
    (R/'data'/f'{name}.json').write_text(json.dumps(v,separators=(',',':'))+'\n',encoding='utf-8')
(A/'export.json').write_text(json.dumps(dict(architectureTiles=count-2,groundTiles=W*H,dojo=[456,0,288,192],eventsExact=True,geometryExact=True),indent=2))
print('Exported v8; original hall and complete events preserved')
