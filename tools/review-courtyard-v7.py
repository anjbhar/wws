"""Preservation/atlas checks and contact sheets from real keyboard-route captures."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parent.parent;A=R/'docs/art/courtyard-v7';O=R/'docs/maps/courtyard-v7-checks'
old=Image.open(R/'docs/maps/backups/before-courtyard-v7/tilesets/EdoRedWoodExterior_D-v4.png').convert('RGBA')
now=Image.open(R/'img/tilesets/EdoRedWoodExterior_D-v4.png').convert('RGBA')
assert old.tobytes()==now.tobytes()
dojo=np.array(old.crop((0,48,288,240)));arch=np.array(Image.open(A/'architecture.png').crop((456,0,744,192)))
assert np.array_equal(dojo[dojo[:,:,3]==255],arch[dojo[:,:,3]==255])
manifest=json.loads((A/'export.json').read_text());atlas=Image.open(R/'img/tilesets/EdoCourtyard_E-v7.png')
for name,p in manifest['assets'].items():
 im=Image.open(A/(name+'.png'));x=p['x']*48;y=p['y']*48
 assert im.size==(p['w']*48,p['h']*48)
 assert atlas.crop((x,y,x+im.width,y+im.height)).tobytes()==im.tobytes(),name
assert Image.open(A/'rack.png').getbbox()[3]-Image.open(A/'rack.png').getbbox()[1]<=58
d=Image.open(A/'dummy.png');assert d.getbbox()[2]-d.getbbox()[0]>=36
assert (R/'img/tilesets/EdoCourtyard_A5-v2.png').read_bytes()==(R/'docs/maps/backups/before-courtyard-v7/tilesets/EdoCourtyard_A5-v2.png').read_bytes()
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)
def montage(name,items):
 out=Image.new('RGB',(1280,((len(items)+3)//4)*270),'#242729');draw=ImageDraw.Draw(out)
 for i,(label,file,box) in enumerate(items):
  im=Image.open(file).crop(box);im.thumbnail((312,240),Image.Resampling.NEAREST)
  x=i%4*320;y=i//4*270;out.paste(im,(x,y+25));draw.text((x+4,y+3),label,font=font,fill='white')
 out.save(O/(name+'.png'))
initial=R/'docs/maps/courtyard-in-game.png'
montage('architecture',[(n,initial,b)for n,b in [
 ('Northwest',(40,28,335,202)),('Northeast',(945,28,1240,202)),('Southwest',(40,530,335,710)),('Southeast',(945,530,1240,710)),
 ('Gate west abutment',(495,540,680,700)),('Gate east abutment',(620,540,805,700)),('Hall west sill',(485,130,655,250)),('Hall east sill',(625,130,795,250))]])
boxes={'rack':(95,265,305,460),'dummy':(80,390,290,600),'lantern':(1010,300,1220,510),'basin':(1010,425,1220,620),
 'bamboo-west':(65,65,315,370),'bamboo-east':(995,115,1240,420),'gate':(490,480,790,720),
 'dojo':(445,90,835,300),'veranda':(450,110,830,300),'northwest':(40,40,310,300),'northeast':(970,40,1240,300),'southwest':(40,420,310,710),'southeast':(970,420,1240,710)}
for group,box in boxes.items():
 files=[p for p in sorted(O.glob(group+'-*.png'))if 'contacts' not in p.name]
 if files:montage(group+'-contacts',[(p.stem,p,box)for p in files])
g=Image.open(R/'docs/art/courtyard-v6/earth-periodic.png');repeat=Image.new('RGB',(1152,768))
for y in range(2):
 for x in range(3):repeat.paste(g,(384*x,384*y))
repeat.save(O/'earth-large-repeat.png')
v=np.array(g,dtype=float);grad=np.abs(np.diff(np.tile(v,(2,2,1)),axis=1)).mean(axis=(0,2));seam=float(grad[383]);interior=float(grad.mean())
(O/'asset-results.json').write_text(json.dumps(dict(originalDojo=[288,192],originalSheetExact=True,atlasExact=True,groundUnchanged=True,terrainBoundaryGradient=seam,terrainMeanGradient=interior,visualApprovalRequired=True),indent=2))
print('PASS: original dojo pixels, retained complete sheet, atlas packing, rack <=58px, broader dummy, unchanged quiet ground. Contact sheets exported. Ground edge-gradient:',seam,'field mean:',interior)
