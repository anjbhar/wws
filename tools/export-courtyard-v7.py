"""Uniform-scale generated enclosure; intact original dojo; native-grid packing.
No independent roof/body resizing, reflection, painting or stock artwork.
"""
from pathlib import Path
import json, hashlib
from PIL import Image
import numpy as np
R=Path(__file__).resolve().parent.parent
A=R/'docs/art/courtyard-v7'; A.mkdir(exist_ok=True)
N=Image.Resampling.NEAREST
def tight(im):
    im=im.convert('RGBA'); im.putalpha(im.getchannel('A').point(lambda v:255 if v>=200 else 0))
    return im.crop(im.getbbox())
def fit(im,box):
    im=tight(im); s=min(box[0]/im.width,box[1]/im.height)
    return im.resize((round(im.width*s),round(im.height*s)),N)
def pad(im,size):
    out=Image.new('RGBA',size);out.alpha_composite(im,((size[0]-im.width)//2,size[1]-im.height));return out
source=Image.open(A/'sources/enclosure.png')
frame=fit(source,(1200,636))
architecture=Image.new('RGBA',(1200,720))
architecture.alpha_composite(frame,((1200-frame.width)//2,672-frame.height))
# Keep the gateway eave at the adjoining wall's exact native depth. The source
# gateway cap was shallower: replace it (do not overlay a second roof) with a
# contiguous 192px straight cap from the same uniformly scaled assembly.
cap=architecture.crop((288,570,480,618))
architecture.paste(cap,(504,570))
# Retain the original straight wall's timber/plaster face beneath the continuous
# generated northern cap. Whole source uniformly scaled first, then face cropped.
original=Image.open(R/'img/tilesets/EdoRedWoodExterior_D-v4.png').convert('RGBA')
wall=original.crop((0,384,144,528)).resize((96,96),N)
for x in range(96,1104,96):
    architecture.alpha_composite(wall.crop((0,38,96,96)),(x,81))
# The hall is translated by half a grid cell, never resized, to the x=600 axis.
dojo=original.crop((0,48,288,240))
architecture.alpha_composite(dojo,(456,0))
architecture.save(A/'architecture.png')
assert np.array_equal(np.array(architecture.crop((456,0,744,192)))[np.array(dojo)[:,:,3]==255],np.array(dojo)[np.array(dojo)[:,:,3]==255])
# Pack complete 48px cells; each atlas tile has its own collision/sort flag.
sheets=[Image.new('RGBA',(768,768)),Image.new('RGBA',(768,768))]
tiles=[];index=1
for y in range(15):
    for x in range(25):
        tile=architecture.crop((x*48,y*48,x*48+48,y*48+48))
        if tile.getbbox():
            slot=index//256; local=index%256
            sx=(local//128*8+local%8)*48;sy=(local%128//8)*48
            sheets[slot].paste(tile,(sx,sy));tiles.append(dict(x=x,y=y,id=index));index+=1
for s,name in zip(sheets,['B','C']):s.save(R/f'img/tilesets/EdoCourtyard_{name}-v7.png')
atlas=Image.new('RGBA',(768,768));assets={}
def add(name,im,x,y,w,h):
    assert im.size==(w*48,h*48)
    atlas.alpha_composite(im,(x*48,y*48));im.save(A/(name+'.png'));assets[name]=dict(x=x,y=y,w=w,h=h)
old=R/'docs/art/courtyard-v6'
add('rack',pad(fit(Image.open(old/'sources/rack.png'),(60,58)),(96,96)),0,0,2,2)
add('dummy',pad(fit(Image.open(A/'sources/dummy.png'),(44,70)),(48,96)),2,0,1,2)
add('lantern',Image.open(old/'lantern.png'),3,0,1,2)
add('basin',pad(fit(Image.open(A/'sources/basin.png'),(44,30)),(48,48)),0,2,1,1)
add('planting',Image.open(old/'planting.png'),1,2,2,1)
# Low single-level threshold: original generated boards uniformly scaled to192w;
# upper portion is deck, without the separately resized multi-step illusion.
ver=fit(Image.open(R/'docs/art/courtyard-finish/veranda-v1.png'),(288,42))
deck=Image.new('RGBA',(336,48));deck.alpha_composite(ver,(24+(288-ver.width)//2,0))
add('veranda',deck,0,3,7,1)
for i,scale in enumerate([1,.94,.98]):
    slab=fit(Image.open(old/'sources/slab.png'),(round(36*scale),round(16*scale)))
    add('slab'+str(i),pad(slab,(48,48)),i,4,1,1)
atlas.save(R/'img/tilesets/EdoCourtyard_E-v7.png')
manifest=dict(tileSize=48,architectureTiles=tiles,assets=assets,anchors=dict(axisX=600,dojo=[456,0,288,192],enclosureBottom=672,uniformEnclosure=frame.size,northFaceBase=139,verandaBase=240),processing='Alpha threshold200 removes translucent generation halos; each generated assembly uniformly scaled once, then cell packed. Original dojo exact RGBA; original wall face retained. No reflections. Ground unchanged.')
(A/'export.json').write_text(json.dumps(manifest,indent=2))
print('Exported',len(tiles),'architecture tiles; anchors',manifest['anchors'])
