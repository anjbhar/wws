"""Independent PNG/source-pixel check of frozen gameplay captures."""
import json,sys
from pathlib import Path
import numpy as np
from PIL import Image
folder=Path(sys.argv[1]);report=json.loads((folder/'engine-checks.json').read_text())
results=[]
for s in report['captures']:
    png=np.array(Image.open(folder/(s['name']+'.png')).convert('RGB'))
    src=np.array(Image.open(folder/(s['name']+'-source-frame-documentation.png')).convert('RGBA'))
    d=s['displayed'];h,w=src.shape[:2]
    x=round(d['screen'][0]-w*d['anchor'][0]);y=round(d['screen'][1]-h*d['anchor'][1])
    mask=src[:,:,3]>250
    samples=[]
    for dy in range(-3,4):
        for dx in range(-3,4):
            region=png[y+dy:y+dy+h,x+dx:x+dx+w]
            if region.shape[:2]!=(h,w):continue
            expectedPixels=src[:,:,:3].astype(float).copy();visible=mask.copy()
            if s['map']==1:
                # Compare the actual composite under the known roof patch.
                # Solid structural pixels occlude the player and cannot audit
                # its pose; translucent roof pixels can, after alpha blending.
                roof=np.array(Image.open(Path(__file__).resolve().parents[1]/'img/pictures/EdoCourtyardGateCanopy-v5.png').convert('RGBA'))
                rx=round(504-s['display'][0]*48);ry=round(540-s['display'][1]*48)
                for py in range(h):
                    for px in range(w):
                        u=x+dx+px-rx;v=y+dy+py-ry
                        if not (0<=u<192 and 0<=v<60):continue
                        alpha=roof[v,u,3]/255
                        alpha*=s['canopyOpacity']/255 if 40<=u<152 and v<44 else 1
                        if alpha>.98:visible[py,px]=False
                        else:expectedPixels[py,px]=expectedPixels[py,px]*(1-alpha)+roof[v,u,:3]*alpha
            err=np.abs(region.astype(float)-expectedPixels).mean(axis=2)[visible]
            # Occluding architecture may cover the body; retain the best 60%
            # of opaque pixels and separately report their matching fraction.
            samples.append((float(np.sort(err)[:int(len(err)*.6)].mean()),dx,dy,float((err<8).mean())))
    best=min(samples)
    expected=next(v for v in samples if v[1:3]==(0,0))
    assert expected[0]<3,(s['name'],expected)
    assert expected[0]<=best[0]+.05,(s['name'],'position lag',best,expected)
    assert d['direction']==s['direction'] and d['pattern']==s['pattern']
    results.append(dict(name=s['name'],meanRGBErrorBest60Percent=round(expected[0],3),
                        matchingOpaqueFraction=round(expected[3],3),bestOffset=list(best[1:3]),
                        frameMatchesLogicalPose=True))
(folder/'frame-pixel-audit.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps({'audited':len(results),'allFrameAndPositionChecksPassed':True}))
