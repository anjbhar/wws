"""Native export of retained/generated art. No painted or stock graphics."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageEnhance
R=Path(__file__).resolve().parent.parent
A=R/'docs/art/courtyard-v6'
S=A/'sources'
N=Image.Resampling.NEAREST
def tight(im):
    im=im.convert('RGBA')
    im.putalpha(im.getchannel('A').point(lambda a:255 if a>=248 else (0 if a<20 else a)))
    return im.crop(im.getchannel('A').getbbox())
def source(n): return tight(Image.open(S/(n+'.png')))
def fit(im,size,visible):
    im=tight(im);scale=min(visible[0]/im.width,visible[1]/im.height)
    im=im.resize((round(im.width*scale),round(im.height*scale)),N)
    out=Image.new('RGBA',size);out.alpha_composite(im,((size[0]-im.width)//2,size[1]-im.height))
    return out
assets={}; atlas=Image.new('RGBA',(768,768))
def add(n,im,x,y,w,h):
    atlas.alpha_composite(im,(x*48,y*48));im.save(A/(n+'.png'))
    assets[n]=dict(x=x,y=y,w=w,h=h)
old=R/'docs/art/courtyard-finish'
wall=Image.open(R/'img/tilesets/EdoRedWoodExterior_D-v4.png').convert('RGBA').crop((0,384,144,528))
# One integrated gate assembly. Wall terminates at the gate's existing posts;
# no separate end posts and no duplicate cap fragments.
gate=Image.new('RGBA',(192,144))
gate.alpha_composite(wall.crop((0,0,33,144)),(0,0))
gate.alpha_composite(wall.crop((111,0,144,144)),(159,0))
gate.alpha_composite(tight(Image.open(old/'gate-v1.png')).resize((192,144),N))
add('gate',gate,0,0,4,3)
ver=tight(Image.open(old/'veranda-v1.png')).resize((192,44),N)
deck=Image.new('RGBA',(192,48));deck.alpha_composite(ver,(0,0))
add('veranda',deck,0,3,4,1)
add('rack',fit(source('rack'),(96,96),(78,78)),0,4,2,2)
add('dummy',fit(source('dummy'),(48,96),(44,76)),2,4,1,2)
add('lantern',Image.open(old/'lantern-v1.png').convert('RGBA'),3,4,1,2)
add('basin',fit(source('basin'),(48,48),(44,30)),0,6,1,1)
add('planting',Image.open(old/'planting-v1.png').convert('RGBA'),1,6,2,1)
add('slab',fit(source('slab'),(48,48),(36,22)),0,7,1,1)
atlas.save(R/'img/tilesets/EdoCourtyard_E-v2.png')
# Generated long side walls contain all four correctly oriented corner returns.
# Normalize top/bottom wall ground lines separately, with a long middle span.
im=Image.open(S/'side-returns.png').convert('RGBA')
for name,box in [('west',(0,0,im.width//2,im.height)),('east',(im.width//2,0,im.width,im.height))]:
    p=tight(im.crop(box));out=Image.new('RGBA',(240,672))
    top=round(p.height*.267);bottom=round(p.height*.739)
    out.alpha_composite(p.crop((0,0,p.width,top)).resize((240,144),N),(0,0))
    out.alpha_composite(p.crop((0,top,p.width,bottom)).resize((240,384),N),(0,144))
    out.alpha_composite(p.crop((0,bottom,p.width,p.height)).resize((240,144),N),(0,528))
    # Reuse the retained straight wall at each return, removing generated end
    # posts. The actual directional side roof still supplies the 90-degree bend.
    for y0 in [0,528]:
        cap=out.crop((0,y0,240,y0+144))
        fixed=Image.new('RGBA',(240,144))
        fixed.alpha_composite(cap.crop((0,0,240,60)).resize((240,42),N),(0,0))
        fixed.alpha_composite(cap.crop((0,60,240,144)).resize((240,102),N),(0,42))
        out.paste(fixed,(0,y0))
        start,end=(48,240) if name=='west' else (0,192)
        for x in range(start,end):
            sx=(x-240)%144 if name=='west' else x%144
            out.paste(wall.crop((sx,0,sx+1,144)),(x,y0))
    out.save(A/(name+'.png'))
    sheet=Image.new('RGBA',(768,768));sheet.alpha_composite(out,(0,0))
    if name=='west': sheet.paste(out.crop((0,0,48,48)),(384,0))
    sheet.save(R/('img/tilesets/EdoCourtyard_'+name+'-v1.png'))
# Quiet periodic texture: crossfade original opposing strips, never mirror.
g=Image.open(S/'ground.png').convert('RGB').resize((384,384),Image.Resampling.BOX)
v=np.asarray(g,dtype=float);mean=v.mean(axis=(0,1));v=mean+(v-mean)*.42
for axis in [0,1]:
    v=np.swapaxes(v,0,axis)
    for k in range(24):
        weight=(24-k)/24
        avg=(v[k].copy()+v[-1-k].copy())/2
        v[k]=v[k]*(1-weight)+avg*weight
        v[-1-k]=v[-1-k]*(1-weight)+avg*weight
    v=np.swapaxes(v,0,axis)
g=Image.fromarray(np.uint8(np.clip(v,0,255)))
g.save(A/'earth-periodic.png');sheet=Image.new('RGBA',(384,768));sheet.paste(g,(0,0));sheet.save(R/'img/tilesets/EdoCourtyard_A5-v2.png')
(A/'export.json').write_text(json.dumps(dict(tileSize=48,assets=assets,terrainPeriod=[8,8],processing='Nearest-neighbor prop/architecture sizing; periodic opposite-edge crossfade and 42% terrain contrast; no mirror operations.'),indent=2))
print('Exported native custom terrain, integrated gate, props and directional side walls.')
