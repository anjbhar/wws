"""Pack courtyard wall/bamboo on unused D-sheet cells; preserve the small home."""
from pathlib import Path
import json
import shutil
import sys
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/art/dojo-courtyard'
OUT.mkdir(parents=True,exist_ok=True)
sheet=Image.open(ROOT/'img/tilesets/EdoRedWoodExterior_D-v2.png').convert('RGBA')
records={}
for i,(name,size,pos) in enumerate([('wall',(144,144),(0,384)),('bamboo',(96,192),(192,384))]):
    source=OUT/(name+'-source-v1.png')
    if len(sys.argv)>i+1:
        if source.exists():raise SystemExit('Source exists: '+str(source))
        shutil.copyfile(sys.argv[i+1],source)
    im=Image.open(source).convert('RGBA')
    assert im.getchannel('A').getextrema()[0]==0
    bounds=im.getchannel('A').point(lambda a:255 if a>=64 else 0).getbbox()
    asset=im.crop(bounds).resize(size,Image.Resampling.NEAREST)
    asset.save(OUT/(name+'-v1.png'))
    sheet.paste(asset,pos)
    records[name]={'sourceSize':im.size,'bounds':bounds,'size':size,'sheetCell':[pos[0]//48,pos[1]//48]}
sheet.save(ROOT/'img/tilesets/EdoRedWoodExterior_D-v3.png')
(OUT/'export-v1.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf-8')
print('Exported D-v3: unchanged 6x4 home, 3x3 wall, 2x4 bamboo; alpha-preserving nearest-neighbor')
