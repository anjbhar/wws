"""Check and enlarge the actual engine views of the corrected facade joins."""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json
R=Path(__file__).resolve().parent.parent
O=R/'docs/maps/courtyard-v8-joins'
im=Image.open(O/'initial.png').convert('RGB')
assert im.size==(1280,720)
checks={}
for name,box in {'west-wall':(496,88,514,132),'east-wall':(766,88,784,132),'sill':(518,190,762,193)}.items():
    a=np.array(im.crop(box),dtype=int)
    count=int(np.sum(a[:,:,1]>a[:,:,0]+8))
    assert count==0,(name,'Grass visible through structural join',count)
    checks[name]={'exposedGrassPixels':count,'engineBox':box}
names=['door-left','door-right','veranda-west','veranda-east','dojo-west','dojo-east']
sheet=Image.new('RGB',(1280,1200),'#242729');d=ImageDraw.Draw(sheet)
for i,name in enumerate(names):
    crop=Image.open(O/(name+'.png')).crop((480,65,800,250)).resize((640,370),Image.Resampling.NEAREST)
    x=i%2*640;y=i//2*400
    sheet.paste(crop,(x,y+25));d.text((x+8,y+5),name,fill='white')
sheet.save(O/'joins-contacts.png')
(O/'join-pixel-checks.json').write_text(json.dumps(checks,indent=2)+'\n')
print('PASS: zero exposed grass pixels in both wall joins and sill; fresh engine contact sheet exported')
