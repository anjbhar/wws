"""Pack generated monk walking art at cast body scale, with polearm clearance."""
import json
import argparse
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/art/warrior-monks/overworld'
FW,FH,SOLE=64,112,108
VERSION='v1'

def runs(values, merge_gap=0):
    indices=np.flatnonzero(values)
    if not len(indices): return []
    groups=[]; start=last=int(indices[0])
    for value in indices[1:]:
        value=int(value)
        if value-last>merge_gap+1: groups.append((start,last+1));start=value
        last=value
    groups.append((start,last+1))
    return groups

def export(variant):
    source=Image.open(OUT/f'{variant}-source-v2.png').convert('RGBA')
    pixels=np.array(source)
    a=pixels[:,:,3]>=64
    segmentation=a.copy()
    # Export mask: reject transparent residue and saturated matte fringe around
    # silhouettes. Red-brown armor remains inside the preserved source artwork.
    edge=np.zeros(a.shape,dtype=bool)
    padded=np.pad(~a,2,constant_values=True)
    for dy in range(5):
        for dx in range(5): edge |= padded[dy:dy+a.shape[0],dx:dx+a.shape[1]]
    red=(pixels[:,:,0]>170)&(pixels[:,:,1]<75)&(pixels[:,:,2]<75)
    green=(pixels[:,:,1]>pixels[:,:,0]*1.12)&(pixels[:,:,1]>80)&(pixels[:,:,2]<70)
    a &= ~(edge & (red|green))
    pixels[:,:,3]=np.where(a,pixels[:,:,3],0)
    source=Image.fromarray(pixels)
    assert source.getchannel('A').getextrema()[0]==0,'Real transparency required'
    frames=[]
    # Rows can overlap vertically across different columns because the weapons
    # are tall. Find the four isolated figures in each column independently.
    for col in range(3):
        column_left=round(col*source.width/3)
        column_right=round((col+1)*source.width/3)
        rows=runs(segmentation[:,column_left:column_right].any(axis=1))
        assert len(rows)==4,(variant,col,'row bands',rows)
        for row,(top,bottom) in enumerate(rows):
            ys,xs=np.where(a[top:bottom,column_left:column_right])
            left,right=column_left+int(xs.min()),column_left+int(xs.max())+1
            top,bottom=top+int(ys.min()),top+int(ys.max())+1
            mask=a[top:bottom,left:right]
            # Blade/shaft rows are narrow. A sustained broad run locates the
            # head; a few pixels above it include its rounded crown.
            dense=mask.sum(axis=1)>=max(20,(right-left)*.25)
            first=next(i for i in range(len(dense)-2) if dense[i:i+3].all())
            crown=max(0,first-7)
            frames.append(dict(row=row,column=col,box=[left,top,right,bottom],bodyCrown=top+crown,bodyHeight=bottom-top-crown))
    frames.sort(key=lambda f:(f['row'],f['column']))
    standing=frames[1]
    front_scale=67/standing['bodyHeight']
    # The revised art normalizes each direction using its neutral pose. One
    # uniform scale per row retains genuine walking variation without a size
    # jump when the generated back view has a longer body than the front.
    row_scales={row:(67/frames[row*3+1]['bodyHeight'] if VERSION!='v1' else front_scale) for row in range(4)}
    sheet=Image.new('RGBA',(FW*3,FH*4))
    for frame in frames:
        scale=row_scales[frame['row']]
        left,top,right,bottom=frame['box']
        sprite=source.crop((left,top,right,bottom))
        w,h=round(sprite.width*scale),round(sprite.height*scale)
        assert w<FW-2 and h<SOLE-1,(variant,frame,w,h)
        mask=a[top:bottom,left:right]
        feet=mask[round(mask.shape[0]*.90):]
        foot_rows=feet.sum(axis=1)
        xs=np.flatnonzero(feet[int(foot_rows.argmax())])
        foot_axis=(int(xs[0])+int(xs[-1])+1)/2
        x=round(FW/2-foot_axis*scale);y=SOLE-h
        assert 0<x and x+w<FW,(variant,frame,x,w)
        sprite=sprite.resize((w,h),Image.Resampling.NEAREST)
        sheet.alpha_composite(sprite,(frame['column']*FW+x,frame['row']*FH+y))
        frame.update(visibleSize=[w,h],bodyHeightPixels=round(frame['bodyHeight']*scale,2),offset=[x,y],footAxisSource=foot_axis,scale=scale)
    for row in range(4):
        for col in range(3):
            box=sheet.crop((col*FW,row*FH,(col+1)*FW,(row+1)*FH)).getbbox()
            assert box and 0<box[0] and box[2]<FW and 0<box[1] and box[3]<=SOLE,(variant,row,col,box)
    name=f'$WarriorMonk-{variant.title()}-{VERSION}'
    sheet.save(ROOT/'img/characters'/f'{name}.png')
    sheet.resize((576,1344),Image.Resampling.NEAREST).save(OUT/f'{variant}-walking-preview.png')
    return dict(variant=variant,output=name,canvas=sheet.size,frameSize=[FW,FH],soleBaseline=SOLE,bodyHeightTarget=67,scale=front_scale,directionalScales=row_scales,frames=frames)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--directory',default='docs/art/warrior-monks/overworld')
    parser.add_argument('--version',default='v1')
    args=parser.parse_args()
    OUT=ROOT/args.directory
    VERSION=args.version
    records=[export(v) for v in ['masked','unmasked']]
    (OUT/'walking-export.json').write_text(json.dumps(records,indent=2)+'\n')
    print(json.dumps([dict(variant=r['variant'],canvas=r['canvas'],bodyHeights=[f['bodyHeightPixels'] for f in r['frames']]) for r in records]))
