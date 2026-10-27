"""Street review revision. Native architecture, new ground plate, scoped data edits.

Inputs and pre-edit data live in versioned docs folders. Does not touch interior,
actors, system, or other tileset entries. Run once against the saved v3 snapshot.
"""
from pathlib import Path
import copy, json
from PIL import Image, ImageOps
import numpy as np

R = Path(__file__).resolve().parents[1]
A = R/'docs/art/edo-street-v4'
B = R/'docs/maps/backups/before-edo-street-v4'
read = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
def write(p, v): p.write_text(json.dumps(v, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')

def build():
    m, court, sets = [read(R/'data'/f'{n}.json') for n in ['Map003','Map001','Tilesets']]
    for n, v in [('Map003',m),('Map001',court),('Tilesets',sets)]:
        assert v == read(B/f'{n}.json'), f'{n} changed since snapshot'
    assert (m['width'],m['height']) == (42,15)
    source = Image.open(A/'terrain-source.png').convert('RGBA')
    # Register the independently generated regions to 48px map cells. No strips
    # repeat or reflect; each source region is used once across the full width.
    im = Image.new('RGBA',(2016,720))
    for sy,ey,dy,de in [(0,530,0,576),(530,580,576,624),(580,731,624,720)]:
        band = source.crop((0,round(sy*source.height/731),source.width,round(ey*source.height/731)))
        im.paste(band.resize((2016,de-dy),Image.Resampling.NEAREST),(0,dy))
    # Match quiet earth to courtyard; retain generated low-frequency variation.
    arr=np.array(im)
    reference=np.array(Image.open(R/'docs/art/courtyard-v9/ground.png').convert('RGB'))[340:440,500:700]
    target=np.median(reference.reshape(-1,3),axis=0)
    earth=arr[:576,:,:3].astype(float)
    center=np.median(earth[280:480].reshape(-1,3),axis=0)
    arr[:576,:,:3]=np.clip((earth-center)*.68+target,0,255).astype('uint8')
    im=Image.fromarray(arr)
    # A narrow native masonry lip makes the apron end legible. This deliberately
    # built straight edge is distinct from repeating terrain noise.
    lip=im.crop((0,576,2016,591)).resize((2016,8),Image.Resampling.NEAREST)
    im.alpha_composite(lip,(0,232))
    props=Image.open(R/'img/tilesets/EdoVillage_B-v1.png').convert('RGBA')
    def fence(length):
        f=Image.new('RGBA',(length,48))
        # Rails extend UNDER posts. Transparent tile margins never split a run.
        rails=props.crop((157,96,191,144))
        for x in range(3,length-3,rails.width): f.alpha_composite(rails,(x,0))
        post=props.crop((145,96,157,144))
        spans=max(1,round((length-12)/44))
        for i in range(spans+1): f.alpha_composite(post,(round(i*(length-12)/spans),0))
        return f
    # Overlap the transparent silhouette margins: runs terminate under actual
    # facade timber, rather than at the rectangular sprite bounding boxes.
    for x,length in [(0,180),(500,192),(936,192),(1374,144)]:
        im.alpha_composite(fence(length),(x,144))
    buildings=[]
    meta=read(R/'docs/art/edo-street-v2/export.json')
    for name,x in [('home',144),('tea-shop',668),('merchant',1106)]:
        sprite=Image.open(R/f'docs/art/edo-street-v2/{name}.png').convert('RGBA')
        # Entire ridges are above the viewport, leaving clean continuous slopes.
        y=-32
        im.alpha_composite(sprite,(x,y))
        buildings.append(dict(name=name,position=[x,y],size=list(sprite.size),doorHeight=76,
            doorBox=next(a['doorBox'] for a in meta['buildings'] if a['name']==name)))
    arch=Image.open(R/'docs/art/courtyard-v8/architecture.png').convert('RGBA')
    # Short roofed boundary at the far-right entrance. Native roof slope fills
    # the old exposed rear-ground strip; the wall, return and gate form one join.
    roof=arch.crop((552,28,648,72))
    for x in range(1536,2016,96): im.alpha_composite(roof,(x,0))
    wall=arch.crop((96,584,480,672))
    for x in range(1536,2016,48):
        if 1776<=x<1968: continue
        sx=((x-1536)//48%8)*48
        im.alpha_composite(wall.crop((sx,0,sx+48,88)),(x,44))
    # North-west enclosure return runs all the way to the adjoining fence.
    side=arch.crop((24,144,64,336))
    im.alpha_composite(side,(1496,0))
    corner=arch.crop((24,48,72,96))
    im.alpha_composite(corner,(1496,0))
    # Native masonry base closes the return and meets the fence's final post.
    im.alpha_composite(arch.crop((18,648,64,672)),(1494,168))
    gate=Image.open(R/'docs/art/edo-street-v2/gate-native.png').convert('RGBA')
    im.alpha_composite(gate,(1776,0))
    # Timber stop fences, not transfer promises. End posts meet frontages/drain.
    stop=Image.new('RGBA',(48,384))
    rail=props.crop((160,96,188,144)).transpose(Image.Transpose.ROTATE_90)
    for y in range(0,384,28): stop.alpha_composite(rail,(0,y))
    post=props.crop((145,96,157,144))
    for y in [0,64,128,192,256,320,336]: stop.alpha_composite(post,(18,y))
    for x in [0,1968]: im.alpha_composite(stop,(x,192))
    # East stop continues to the wall foot. Otherwise column 41 of the
    # forecourt would be blocked bare dirt above the road-end fence.
    im.alpha_composite(stop.crop((0,0,48,60)),(1968,132))
    for x,length in [(96,144),(768,144),(1392,144)]: im.alpha_composite(fence(length),(x,636))
    im.save(A/'edo-street.png')
    pages=[Image.new('RGBA',(768,768)) for _ in range(3)]
    flags=[15]*8192;flags[0]=16
    walk=[]
    for y in range(15):
        for x in range(42):
            t=1+y*42+x; p,local=divmod(t,256)
            px=(local//128*8+local%8)*48;py=(local%128//8)*48
            pages[p].paste(im.crop((x*48,y*48,x*48+48,y*48+48)),(px,py))
            # Continuous frontage fences/buildings close the north. The entire
            # visibly open dojo forecourt is accessible, not just gate columns.
            free=(1<=x<=40 and 4<=y<=11) or (32<=x<=40 and y==3) or (x in [38,39] and y==2)
            if free: flags[t]=0;walk.append([x,y])
    names=[f'EdoStreet_{c}-v4' for c in 'BCD']
    for page,name in zip(pages,names): page.save(R/f'img/tilesets/{name}.png')
    s=sets[m['tilesetId']]
    s['tilesetNames'][5:9]=names+[''];s['flags']=flags
    s['note']='wws:edo-street-v4;native architecture;unique courtyard-palette terrain;visible boundaries'
    m['note']='wws:edo-street-v4;42x15;road rows5-10;no NPCs encounters or interiors;closed unfinished ends'
    for e in m['events']:
        if e:
            assert e['y']==2 and e['x'] in [38,39]
            e['pages'][0]['list'][0]['parameters']=[0,1,12,12,8,0]
    for i in [8,9,10]:
        e=court['events'][i];assert e['y']==14
        e['y']=13
        e['pages'][0]['list'][0]['parameters']=[0,3,38,3,4,0]
    for n,v in [('Map003',m),('Map001',court),('Tilesets',sets)]: write(R/'data'/f'{n}.json',v)
    write(A/'export.json',dict(mapSize=[42,15],roadRows=list(range(5,11)),apronRows=[4,11],
        buildings=buildings,walkable=walk,streetThreshold=[[38,2],[39,2]],streetArrival=[38,3],
        courtyardThreshold=[[11,13],[12,13],[13,13]],courtyardArrival=[12,12],
        closedColumns=[0,41],dojoReturnColumn=31,source='built-in imagegen terrain;native reused architecture'))
    print('Built street v4; preserved architecture scale and previous iterations.')

if __name__=='__main__': build()
