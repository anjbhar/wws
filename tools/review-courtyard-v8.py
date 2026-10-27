"""Native engine contact crops, enlarged with nearest-neighbor for pixel review."""
from pathlib import Path
from PIL import Image,ImageDraw
import json
R=Path(__file__).resolve().parent.parent
O=R/'docs/maps/courtyard-v8-checks'
groups={
 'architecture': [('northwest',(40,35,230,160)),('northeast',(1050,35,1240,160)),('southwest',(40,535,230,690)),('southeast',(1050,535,1240,690)),('door-left',(480,145,800,245)),('veranda-west',(480,165,660,245)),('veranda-east',(620,165,800,245)),('gate-under',(540,530,740,700)),('gate-west',(540,550,740,700)),('gate-east',(540,550,740,700))],
 'props': [('rack-above',(130,300,225,405)),('rack-below',(130,315,225,445)),('dummy-above',(120,430,205,540)),('dummy-below',(120,455,205,600)),('lantern-above',(1070,350,1160,450)),('lantern-below',(1070,365,1160,500)),('basin-above',(1070,475,1160,545)),('basin-below',(1070,500,1160,595)),('bamboo-east-below',(1040,185,1170,405)),('bamboo-west-below',(125,95,250,350))]}
for name,items in groups.items():
 sheet=Image.new('RGB',(1280,((len(items)+3)//4)*320),'#242729');d=ImageDraw.Draw(sheet)
 for i,(n,box) in enumerate(items):
  im=Image.open(O/(n+'.png')).crop(box)
  im=im.resize((im.width*2,im.height*2),Image.Resampling.NEAREST)
  im.thumbnail((312,285),Image.Resampling.NEAREST)
  x=i%4*320;y=i//4*320;sheet.paste(im,(x,y+24));d.text((x+4,y+4),n,fill='white')
 sheet.save(O/(name+'-contacts.png'))
print('Exported architecture and prop contacts from engine captures')
