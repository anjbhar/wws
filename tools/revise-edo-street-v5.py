"""Review-driven street composition; v4 is retained in a pre-edit snapshot.

Facade pixels and collision remain native. New roof and north/south barrier
art is registered independently. The courtyard change extracts only its canopy
so a local rendering cutaway can reveal the actual player beneath it.
"""
from pathlib import Path
import json, copy
import numpy as np
from PIL import Image, ImageOps

R=Path(__file__).resolve().parents[1]
A=R/'docs/art/edo-street-v5'
B=R/'docs/maps/backups/before-edo-street-v5'
N=Image.Resampling.NEAREST
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
def origin(t):return ((t//128%2*8+t%8)*48,(t%256//8%16)*48)

def build():
    m=read(R/'data/Map003.json');c=read(R/'data/Map001.json');sets=read(R/'data/Tilesets.json')
    oldm=read(B/'data/Map003.json');oldc=read(B/'data/Map001.json')
    assert {k:v for k,v in m.items() if k!='note'}=={k:v for k,v in oldm.items() if k!='note'}
    gatec=copy.deepcopy(oldc)
    for gx in [11,13]:
        for gy in [12,13]:gatec['data'][(15+gy)*25+gx]=512
    gatec['events'][8]=None;gatec['events'][9]=None
    content=lambda v:{k:x for k,x in v.items() if k!='note'}
    assert content(c) in [content(oldc),content(gatec)]
    assert (m['width'],m['height'])==(42,15)
    src=Image.open(A/'ground-source.png').convert('RGBA')
    im=Image.new('RGBA',(2016,720))
    # Use each generated terrain region once; register the drain to row 12.
    for sy,ey,dy,de in [(0,534,0,576),(534,594,576,624),(594,731,624,720)]:
        band=src.crop((0,round(sy*src.height/731),src.width,round(ey*src.height/731)))
        im.paste(band.resize((2016,de-dy),N),(0,dy))
    ar=np.array(im);ref=np.array(Image.open(R/'docs/art/courtyard-v9/ground.png').convert('RGB'))[320:450,450:750]
    target=np.median(ref.reshape(-1,3),axis=0)
    earth=ar[:576,:,:3].astype(float);center=np.median(earth[290:470].reshape(-1,3),axis=0)
    ar[:576,:,:3]=np.clip((earth-center)*.84+target,0,255).astype('uint8')
    # Stone-dust frontage: a quiet, visibly distinct apron within the same earth
    # palette. Soft 6px shoulders avoid an artificial painted stripe.
    for y in range(192,240):
        weight=.32*min(1,(y-191)/6,(240-y)/6)
        ar[y,:,:3]=np.clip(ar[y,:,:3]*(1-weight)+np.array([167,157,128])*weight,0,255).astype('uint8')
    im=Image.fromarray(ar)
    props=Image.open(R/'img/tilesets/EdoVillage_B-v1.png').convert('RGBA')
    post=props.crop((147,109,157,141)) # visible post only, no tile margins
    cores=[props.crop((160,118,184,124)),props.crop((160,129,184,135))]
    assert all(np.array(core)[:,:,3].min()>=200 for core in cores)
    fence_records=[]
    def fence(length,posts=True):
        f=Image.new('RGBA',(length,40))
        for core,dy in zip(cores,[14,25]):
            for x in range(0,length,core.width):f.alpha_composite(core,(x,dy))
        if posts:
            spans=max(1,round((length-10)/44))
            for i in range(spans+1):f.alpha_composite(post,(round(i*(length-10)/spans),8))
        # Both rails are continuous, including underneath every support.
        for y in [16,27]:assert np.array(f)[y,:,3].min()>=200
        return f
    # Generated north/south fences have standing posts and a depth rail, rather
    # than screen-rotated front-view modules. Terminals remain part of the art.
    raw=Image.open(A/'fence-source.png').convert('RGBA')
    fa=np.array(raw)
    cols=np.where((fa[:,:,3]>128).sum(axis=0)>120)[0]
    rows=np.where((fa[:,cols.min():cols.max()+1,3]>128).sum(axis=1)>5)[0]
    box=(int(cols.min())-2,int(rows.min())-1,int(cols.max())+3,int(rows.max())+2)
    raw=raw.crop(box)
    for name,x,y,h,mirror in [('west',8,168,420,False),('east',1976,108,480,True)]:
        width=round(raw.width*h/raw.height)
        piece=raw.resize((width,h),N)
        if mirror:piece=ImageOps.mirror(piece)
        # Post line centered in the blocked edge cell.
        px=x+(32-width)//2
        piece.save(A/f'{name}-stop.png');im.alpha_composite(piece,(px,y))
        fence_records.append(dict(name=name,box=[px,y,px+width,y+h]))
    # Frontage rails meet visible foundation edges; final support never sits
    # under a step. The merchant connection turns behind its front basket.
    runs=[('west-home',24,166),('home-tea',514,680),('tea-merchant',950,1100),('merchant-dojo',1392,1516)]
    for name,x,end in runs:
        f=fence(end-x,posts=name!='west-home')
        if name=='west-home':
            for px in [42,86]:f.alpha_composite(post,(px,8))
        f.save(A/f'{name}-fence.png');im.alpha_composite(f,(x,152))
        fence_records.append(dict(name=name,box=[x,152,end,192],railRows=[166,177]))
    # Short depth return joins above the merchant's containers, leaving the
    # basket's ground contact and silhouette unobstructed.
    # Use one native-depth bay, not a compressed copy of all eight posts.
    short=raw.crop((0,0,raw.width,320)).resize((18,80),N)
    im.alpha_composite(short,(1088,112))
    im.alpha_composite(fence(22,False),(1096,104))
    # Native facades at one shared y=192 foundation. The replacement roofing
    # is fitted uniformly to each original roof width and cropped from above.
    roofsrc=Image.open(A/'roof-source.png').convert('RGBA')
    ra=np.array(roofsrc);occupied=(ra[:,:,3]>128).sum(axis=0)>10
    spans=[]
    for x,v in enumerate(occupied):
        if v:
            if spans and spans[-1][-1]==x-1:spans[-1].append(x)
            else:spans.append([x])
    spans=[v for v in spans if len(v)>100];assert len(spans)==3
    buildings=[];v2meta=read(R/'docs/art/edo-street-v2/export.json')
    for (name,x,eave),span in zip([('home',144,63),('tea-shop',668,82),('merchant',1106,74)],spans):
        sprite=Image.open(R/f'docs/art/edo-street-v2/{name}.png').convert('RGBA')
        y=192-sprite.height
        lower=sprite.crop((0,eave-y,sprite.width,sprite.height))
        im.alpha_composite(lower,(x,eave))
        # Generated roof ends at its original first eave course (about y=160
        # on its 2048px-wide artboard). Uniform native scale keeps tile size.
        bottom=round(160*roofsrc.width/2048)
        roof=roofsrc.crop((span[0],0,span[-1]+1,bottom))
        scale=sprite.width/roof.width
        fitted=roof.resize((sprite.width,round(roof.height*scale)),N)
        if fitted.height<eave:raise AssertionError((name,'roof too short'))
        fitted=fitted.crop((0,fitted.height-eave,fitted.width,fitted.height))
        im.alpha_composite(fitted,(x,0));fitted.save(A/f'{name}-roof.png')
        door=next(v['doorBox'] for v in v2meta['buildings'] if v['name']==name)
        buildings.append(dict(name=name,position=[x,y],nativeSize=list(sprite.size),baseY=192,
            roofBox=[x,0,x+sprite.width,eave],doorHeight=76,doorBox=door,facadeCopiedExactly=True))
    arch=Image.open(R/'docs/art/courtyard-v8/architecture.png').convert('RGBA')
    # Thin native tiled cap, with a deeper plaster/timber wall body. No roof
    # slab behind it and no transparent cap margin exposing ground at the join.
    wall=arch.crop((96,584,480,672))
    wing=Image.new('RGBA',(384,132))
    wing.alpha_composite(wall.crop((0,0,384,28)),(0,0))
    wing.alpha_composite(wall.crop((0,26,384,88)).resize((384,106),N),(0,26))
    # Fill only the cap's one-pixel top fringe with its solid interior course.
    wing.paste(wing.crop((0,3,384,4)),(0,0))
    for x,end in [(1536,1796),(1948,2016)]:
        start=x
        while x<end:
            part=wing.crop((0,0,min(384,end-x),132));im.alpha_composite(part,(x,0));x+=part.width
        fence_records.append(dict(name='dojo-wing',box=[start,0,end,132]))
    # Native side wall and corner; an upright with a stone toe finishes the
    # return, replacing the old horizontal timber stub.
    side=arch.crop((24,144,64,336));im.alpha_composite(side,(1496,0))
    im.alpha_composite(arch.crop((24,48,72,96)),(1496,0))
    upright=arch.crop((524,584,544,672));im.alpha_composite(upright,(1516,104))
    toe=arch.crop((524,660,544,672)).resize((40,12),N)
    im.alpha_composite(toe,(1496,180))
    gate=Image.open(R/'docs/art/edo-street-v2/gate-native.png').convert('RGBA')
    # Strip the original lower wall stubs so they cannot introduce a second cap.
    gate.paste((0,0,0,0),(0,44,20,132));gate.paste((0,0,0,0),(172,44,192,132))
    im.alpha_composite(gate,(1776,0))
    for x in [96,768,1392]:im.alpha_composite(fence(144),(x,640))
    im.save(A/'edo-street.png')
    # Existing map layout and collision are retained; the repaired frontage
    # now actually sits on the existing row-3 boundary.
    pages=[Image.new('RGBA',(768,768)) for _ in range(3)]
    for y in range(15):
        for x in range(42):
            t=m['data'][y*42+x];p,local=divmod(t,256);px,py=origin(local)
            pages[p].paste(im.crop((x*48,y*48,x*48+48,y*48+48)),(px,py))
    names=[f'EdoStreet_{k}-v5' for k in 'BCD']
    for page,name in zip(pages,names):page.save(R/f'img/tilesets/{name}.png')
    sets[m['tilesetId']]['tilesetNames'][5:9]=names+['']
    sets[m['tilesetId']]['note']='wws:edo-street-v5;continuous rail cores;native facade baseline192;finished boundaries'
    m['note']='wws:edo-street-v5;42x15;road rows5-10;no NPCs encounters or interiors;closed ends'
    # Courtyard canopy extraction: same pixels, same placement, same passage.
    oldsets=read(B/'data/Tilesets.json');cs=sets[c['tilesetId']]
    dname=oldsets[c['tilesetId']]['tilesetNames'][7]
    sheet=Image.open(B/f'img/tilesets/{dname}.png').convert('RGBA')
    canopy=Image.new('RGBA',(192,60))
    for cy in [11,12]:
        for cx in range(10,15):
            t=c['data'][(2*15+cy)*25+cx];assert 512<=t<768
            sx,sy=origin(t);tile=sheet.crop((sx,sy,sx+48,sy+48))
            for ly in range(48):
                wy=cy*48+ly
                for lx in range(48):
                    wx=cx*48+lx
                    selected=(504<=wx<696 and 540<=wy<584) or (544<=wx<656 and 584<=wy<600)
                    if selected:
                        canopy.putpixel((wx-504,wy-540),tile.getpixel((lx,ly)));tile.putpixel((lx,ly),(0,0,0,0))
            sheet.paste(tile,(sx,sy))
    canopy.save(R/'img/pictures/EdoCourtyardGateCanopy-v5.png')
    canopy.save(A/'courtyard-canopy.png')
    sheet.save(R/'img/tilesets/EdoCourtyard_D-v5.png');cs['tilesetNames'][7]='EdoCourtyard_D-v5'
    # The native player overlaps a jamb at the two side-cell centers. Those
    # cells now use the existing blocked marker; only the clear central
    # threshold transfers. Other courtyard collision and events stay intact.
    for gx in [11,13]:
        for gy in [12,13]:c['data'][(15+gy)*25+gx]=512
    c['events'][8]=None;c['events'][9]=None
    if 'wws:gate-canopy-v5' not in c['note']:c['note']+=';wws:gate-canopy-v5'
    for n,v in [('Map001',c),('Map003',m),('Tilesets',sets)]:write(R/f'data/{n}.json',v)
    write(A/'export.json',dict(mapSize=[42,15],roadRows=list(range(5,11)),buildings=buildings,
        fences=fence_records,streetThreshold=[[38,2],[39,2]],streetArrival=[38,3],
        courtyardArrival=[12,12],courtyardThreshold=[[12,13]],
        canopyBox=[504,540,696,600],canopyActiveOpacity=48,facadeScaleUnchanged=True))
    print('Built v5 street and local courtyard canopy cutaway; native facades and adjacent gate arrivals retained.')

if __name__=='__main__':build()
