"""Create enlarged contacts from fresh native engine screenshots, verify closed joins."""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parent.parent
O=R/'docs/maps/courtyard-v9-checks'
N=Image.Resampling.NEAREST
im=Image.open(O/'initial.png').convert('RGB')
assert im.size==(1280,720)
checks={}
for name,box in {'west-wall':(496,88,514,132),'east-wall':(766,88,784,132),'sill':(518,190,762,193)}.items():
    a=np.array(im.crop(box),dtype=int)
    count=int(np.sum(a[:,:,1]>a[:,:,0]+8))
    assert count==0,(name,count)
    checks[name]={'exposedGrassPixels':count,'engineBox':box}
(O/'join-pixel-checks.json').write_text(json.dumps(checks,indent=2)+'\n')
groups={
 'joins':[(n,(480,65,800,250)) for n in ['door-left','door-right','veranda-west','veranda-east','dojo-west','dojo-east']],
 'props':[('rack-above',(130,300,225,405)),('rack-below',(130,315,225,445)),('dummy-above',(120,430,205,540)),('dummy-below',(120,455,205,600)),('lantern-above',(1070,350,1160,450)),('lantern-below',(1070,365,1160,500)),('basin-above',(1070,475,1160,545)),('basin-below',(1070,475,1160,595)),('bamboo-west-below',(125,95,250,350)),('bamboo-east-below',(1040,185,1170,405))],
 'gate':[(f'gate-{x}-{direction}-{step}-{frame}',(535,510,745,685)) for direction in ['south','north'] for x in [11,12,13] for step,frame in [(0,'moving'),(0,'standing'),(1,'moving'),(1,'standing')]]}
for name,items in groups.items():
    cols=2 if name=='joins' else 4
    cellw=640 if name=='joins' else 420
    cellh=400 if name=='joins' else 390
    sheet=Image.new('RGB',(cols*cellw,((len(items)+cols-1)//cols)*cellh),'#242729')
    draw=ImageDraw.Draw(sheet)
    for i,(n,box) in enumerate(items):
        source=Image.open(O/(n+'.png'));assert source.size==(1280,720)
        crop=source.crop(box);crop=crop.resize((crop.width*2,crop.height*2),N)
        crop.thumbnail((cellw-8,cellh-28),N)
        x=i%cols*cellw;y=i//cols*cellh
        sheet.paste(crop,(x,y+24));draw.text((x+5,y+5),n,fill='white')
    sheet.save(O/(name+'-contacts.png'))
print('PASS: closed wall and sill seams; exported enlarged join, prop and gate engine contacts')
