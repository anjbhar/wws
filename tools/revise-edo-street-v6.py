"""Scoped native-scale repair of v5. Historical exporters/assets are retained.

Uses the v5 composition recipe, replacing only the three reviewed assemblies.
No generated image edits: these are native map-material and tile assembly rules.
"""
from pathlib import Path
import json, hashlib

R=Path(__file__).resolve().parents[1]
P=R/'tools/revise-edo-street-v5.py'
text=P.read_text(encoding='utf-8')
text=text.replace("A=R/'docs/art/edo-street-v5'", "A=R/'docs/art/edo-street-v6'\nV5=R/'docs/art/edo-street-v5'\nA.mkdir(parents=True,exist_ok=True)")
for name in ['ground-source.png','fence-source.png','roof-source.png']:
    text=text.replace("A/'"+name+"'", "V5/'"+name+"'")
start=text.index('    # Stone-dust frontage:')
end=text.index('    props=Image.open',start)
text=text[:start]+'''    # Compacted frontage earth: retain the source grain, avoid a tinted rectangle.
    # Sparse shallow edge losses and local threshold wear use continuous fields,
    # not repeated tiles, stone clusters or reflected noise bands.
    yy,xx=np.mgrid[0:48,0:2016]
    edge=233+2.2*np.sin(xx[0]/83)+1.3*np.sin(xx[0]/31+1.7)
    amount=np.clip((edge[None,:]-(yy+192))/14,0,1)*.13
    material=np.array([151,139,112])
    strip=ar[192:240,:,:3].astype(float)
    strip=strip*(1-amount[:,:,None])+material*amount[:,:,None]
    # Different thresholds wear naturally into the apron. Dojo is a broader,
    # quieter packed court; shop wear is narrower and approaches existing steps.
    for cx,width,depth in [(315,57,22),(817,43,29),(1250,66,23),(1858,95,39)]:
        wear=np.exp(-((xx-cx)/width)**4)*np.clip(1-yy/depth,0,1)
        strip+=wear[:,:,None]*np.array([3,2,-1])
    ar[192:240,:,:3]=np.clip(strip,0,255).astype('uint8')
    im=Image.fromarray(ar)
''' +text[end:]
start=text.index('    short=raw.crop')
end=text.index('    # Native facades',start)
text=text[:start]+'''    # Thin native timber terminal: one continuous shaft, the same cap and
    # foot vocabulary as the front fence. Two rails socket UNDER facade timber.
    terminal=Image.new('RGBA',(10,80))
    terminal.alpha_composite(post.crop((0,0,10,7)),(0,0))
    terminal.alpha_composite(post.crop((0,7,10,25)).resize((10,66),N),(0,6))
    terminal.alpha_composite(post.crop((0,25,10,32)),(0,73))
    im.alpha_composite(fence(32,False),(1096,104))
    im.alpha_composite(terminal,(1093,112))
    terminal.save(A/'merchant-terminal.png')
''' +text[end:]
start=text.index('    upright=arch.crop')
end=text.index('    gate=Image.open',start)
text=text[:start]+'''    # One continuous upright from the cap down to its native stone shoe.
    # Redraw its shaded timber planes at target scale; no mid-wall splice.
    from PIL import ImageDraw
    corner=Image.new('RGBA',(20,154));d=ImageDraw.Draw(corner)
    d.rectangle((0,0,19,141),fill=(61,34,23,255))
    d.polygon([(1,0),(15,0),(15,140),(1,140)],fill=(91,49,31,255))
    d.line([(2,1),(2,139)],fill=(130,76,48,255),width=1)
    d.line([(15,0),(15,140)],fill=(43,27,21,255),width=2)
    d.line([(18,0),(18,140)],fill=(76,44,30,255),width=1)
    for gx,gy,gh in [(5,8,36),(10,42,46),(7,102,27),(12,6,17)]:
        d.line([(gx,gy),(gx,gy+gh)],fill=(83,44,29,255))
    corner.alpha_composite(arch.crop((524,660,544,672)),(0,142))
    im.alpha_composite(corner,(1516,38))
    # Retain the left roof-return plane; its small native masonry shoe joins
    # the post's foot without doubling the stone texture width.
    shoe=arch.crop((524,660,544,672))
    im.alpha_composite(shoe,(1496,180))
    corner.save(A/'dojo-corner-post.png')
''' +text[end:]
text=text.replace("f'EdoStreet_{k}-v5'", "f'EdoStreet_{k}-v6'")
text=text.replace("wws:edo-street-v5", "wws:edo-street-v6")
start=text.index('    # Courtyard canopy extraction:')
end=text.index("    for n,v in [('Map001'",start)
text=text[:start]+'''    # Courtyard map, extracted v5 artwork and collision remain unchanged.
''' +text[end:]
text=text.replace('canopyActiveOpacity=48','canopyActiveOpacity=72')
text=text.replace("Built v5 street and local courtyard canopy cutaway; native facades and adjacent gate arrivals retained.","Built v6 native street repair; courtyard data and all collision retained.")
exec(compile(text,str(P),'exec'),{'__name__':'__main__','__file__':str(P)})

# Snapshot manifest is taken from the pre-edit copies, not current production.
B=R/'docs/maps/backups/before-edo-street-v6'
manifest={str(p.relative_to(B)):hashlib.sha256(p.read_bytes()).hexdigest()
          for p in B.rglob('*') if p.is_file() and p.name!='source-hashes.json'}
(B/'source-hashes.json').write_text(json.dumps(manifest,indent=2)+'\n')
