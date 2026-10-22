# Current exports have their own native-scale and provenance checks.
import json as _json, runpy as _runpy
from pathlib import Path as _Path
_root = _Path(__file__).resolve().parent.parent
if 'wws:dojo-courtyard-v7' in _json.loads((_root/'data/Map001.json').read_text())['note']:
    _runpy.run_path(str(_root/'tools/review-courtyard-v7.py'), run_name='__main__')
    raise SystemExit(0)
if 'wws:dojo-courtyard-v6' in _json.loads((_root/'data/Map001.json').read_text())['note']:
    _runpy.run_path(str(_root/'tools/review-courtyard-v6.py'), run_name='__main__')
    raise SystemExit(0)
from pathlib import Path
import json
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
p=ROOT/'docs/art/courtyard-finish'
a=Image.open(p/'earth-repeat-v1.png')
assert a.crop((0,0,1,192)).tobytes()==a.crop((191,0,192,192)).tobytes()
assert a.crop((0,0,192,1)).tobytes()==a.crop((0,191,192,192)).tobytes()
old=Image.open(ROOT/'img/tilesets/EdoRedWoodExterior_D-v3.png')
new=Image.open(ROOT/'img/tilesets/EdoRedWoodExterior_D-v4.png')
for box in [(0,48,288,240),(192,384,288,576)]:
    assert old.crop(box).tobytes()==new.crop(box).tobytes(),'Original dojo/bamboo pixels'
manifest=json.loads((p/'export.json').read_text())
atlas=Image.open(ROOT/'img/tilesets/EdoCourtyard_E-v1.png')
for name,v in manifest['assets'].items():
    im=Image.open(p/(name+'-v1.png'))
    assert im.getchannel('A').getextrema()==(0,255),name
    assert im.size==(v['w']*48,v['h']*48)
    x,y=v['x']*48,v['y']*48
    # PNGs may retain arbitrary RGB under zero alpha; compare visible pixels.
    def visible(img):
        bg=Image.new('RGBA',img.size,(0,0,0,255))
        bg.alpha_composite(img)
        return bg.tobytes()
    assert visible(atlas.crop((x,y,x+im.width,y+im.height)))==visible(im),name+' atlas'
assert len(list((p/'sources').glob('*.png')))==11
assert Image.open(ROOT/'img/tilesets/EdoCourtyard_A5-v1.png').size==(384,768)
assert atlas.size==(768,768)
print('PASS: seamless terrain edges, transparent props/opaque interiors, intact dojo/bamboo, atlas packing and all 11 generation sources')
