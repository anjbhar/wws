"""Preserve the generated source and export the battle viewport without smoothing."""
import json
import shutil
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/art/practice-background'
OUT.mkdir(parents=True, exist_ok=True)
source = OUT / 'source-v1.png'
if len(sys.argv) > 1:
    if source.exists():
        raise SystemExit('Source already saved; rerun without a source argument.')
    shutil.copyfile(sys.argv[1], source)
im = Image.open(source).convert('RGBA')
assert im.getchannel('A').getextrema() == (255, 255), 'Expected opaque scene'
im.resize((1280, 720), Image.Resampling.NEAREST).convert('RGB').save(
    ROOT / 'img/battlebacks1/EdoPracticeCourtyard-v1.png')
(OUT / 'export-v1.json').write_text(json.dumps({
    'sourceSize': im.size, 'outputSize': [1280, 720], 'resample': 'nearest-neighbor',
    'battleback1': 'EdoPracticeCourtyard-v1', 'battleback2': '', 'troopId': 6,
    'mode': 'built-in image_gen', 'transparent': False
}, indent=2) + '\n', encoding='utf-8')
print('Exported opaque practice background: 1280 x 720')
