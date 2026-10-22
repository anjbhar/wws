"""Tile export only: generated sources -> native scale, atlas packing, seam repair."""
from pathlib import Path
import json
from PIL import Image, ImageOps
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'docs/art/courtyard-finish'
SOURCES=ART/'sources'
NN=Image.Resampling.NEAREST
def source(name):
    im=Image.open(SOURCES/(name+'.png')).convert('RGBA')
    # Generated solid regions sometimes arrive at alpha 254: normalize those
    # near-opaque interiors so adjacent architecture never leaks ground color.
    im.putalpha(im.getchannel('A').point(lambda a:255 if a>=248 else a))
    return im
def tight(im):
    # Ignore nearly invisible fringe in bbox, retaining original alpha in export.
    box=im.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
    return im.crop(box) if box else im
def fitted(im,size,visible=None,top=False):
    im=tight(im);w,h=visible or size
    scale=min(w/im.width,h/im.height)
    im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),NN)
    out=Image.new('RGBA',size)
    out.alpha_composite(im,((size[0]-im.width)//2,0 if top else size[1]-im.height))
    return out
atlas=Image.new('RGBA',(768,768));assets={}
def add(name,im,x,y,w,h):
    assert im.size==(w*48,h*48)
    atlas.alpha_composite(im,(x*48,y*48))
    im.save(ART/(name+'-v1.png'))
    assets[name]=dict(x=x,y=y,w=w,h=h)
add('gate',fitted(source('gate'),(192,144)),0,0,4,3)
add('veranda',fitted(source('veranda'),(192,48),top=True),0,3,4,1)
add('bokken-rack',fitted(source('bokken-rack'),(96,96),(86,70)),0,4,2,2)
add('dummy',fitted(source('dummy'),(48,96),(44,68)),2,4,1,2)
add('lantern',fitted(source('lantern'),(48,96),(44,68)),3,4,1,2)
add('basin',fitted(source('basin'),(48,48),(44,34)),0,6,1,1)
add('planting',fitted(source('planting'),(96,48),(88,34)),1,6,2,1)
stones=source('stones')
for i in range(3):
    crop=stones.crop((i*stones.width//3,0,(i+1)*stones.width//3,stones.height))
    add('stone-'+str(i),fitted(crop,(48,48),(42,30)),i,7,1,1)
joins=source('wall-joins')
corner=tight(joins.crop((0,0,joins.width*7//10,joins.height)))
post=tight(joins.crop((joins.width*7//10,0,joins.width,joins.height)))
corner_canvas=Image.new('RGBA',(144,192))
corner_canvas.alpha_composite(corner.resize((144,175),NN),(0,17))
add('corner',corner_canvas,4,0,3,4)
add('corner-right',ImageOps.mirror(corner_canvas),4,4,3,4)
add('post',fitted(post,(48,144),(40,144)),7,0,1,3)
side=tight(source('sidewall'))
# Use the middle of the generated repeatable straight strip; omit its end caps.
side=side.crop((0,side.height//4,side.width,side.height*3//4)).resize((48,48),NN)
# Make the repeating first/last pixel row identical to avoid breaks in cap lines.
row=side.crop((0,0,48,1));side.paste(row,(0,47))
add('side-left',side,3,8,1,1)
add('side-right',ImageOps.mirror(side),4,8,1,1)
atlas.save(ROOT/'img/tilesets/EdoCourtyard_E-v1.png')
# Export a four-by-four native tile swatch. Mirrored edge sampling gives exactly
# matching opposite rows and columns without adding any hand-drawn terrain.
g=source('ground').convert('RGB').resize((96,96),NN)
terrain=Image.new('RGB',(192,192))
terrain.paste(g,(0,0));terrain.paste(ImageOps.mirror(g),(96,0))
terrain.paste(ImageOps.flip(g),(0,96));terrain.paste(ImageOps.flip(ImageOps.mirror(g)),(96,96))
ground=Image.new('RGBA',(384,768));ground.paste(terrain,(0,0))
ground.save(ROOT/'img/tilesets/EdoCourtyard_A5-v1.png')
terrain.save(ART/'earth-repeat-v1.png')
# Preserve the building, wall and bamboo pixel-for-pixel. Fill transparent panel
# joins with nearby generated wall pixels on this versioned sheet only.
d=Image.open(ROOT/'img/tilesets/EdoRedWoodExterior_D-v3.png').convert('RGBA')
panel=d.crop((0,384,144,528))
for y in range(144):
    for x in range(144):
        if panel.getpixel((x,y))[3]<255:
            q=min(range(144),key=lambda xx:abs(xx-x) if panel.getpixel((xx,y))[3]==255 else 1000)
            if panel.getpixel((q,y))[3]==255: panel.putpixel((x,y),panel.getpixel((q,y)))
d.paste(panel,(0,384));d.save(ROOT/'img/tilesets/EdoRedWoodExterior_D-v4.png')
(ART/'export.json').write_text(json.dumps(dict(tileSize=48,assets=assets,tool='built-in image_gen',terrainPeriod=[4,4]),indent=2))
print('Exported custom A5 terrain, D architecture, E props and native source crops.')
