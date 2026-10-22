"""Pack the generated compact exterior using nearest-neighbor tile-grid export."""
import json
import shutil
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/art/red-wood-exterior'
source = OUT / 'source-v2.png'
if len(sys.argv) > 1:
    if source.exists():
        raise SystemExit('Source v2 already exists; rerun without a source argument.')
    shutil.copyfile(sys.argv[1], source)
im = Image.open(source).convert('RGBA')
bounds = im.getchannel('A').point(lambda a: 255 if a >= 64 else 0).getbbox()
assert bounds and im.getchannel('A').getextrema()[0] == 0
building = im.crop(bounds).resize((288, 192), Image.Resampling.NEAREST)
building.save(OUT / 'building-v2.png')
sheet = Image.new('RGBA', (768, 768))
sheet.paste(building, (0, 48))
sheet.save(ROOT / 'img/tilesets/EdoRedWoodExterior_D-v2.png')
# Centered two-tile entrance and facade reference.
building.crop((96, 96, 192, 192)).save(OUT / 'double-door-v2.png')
hero = Image.open(ROOT / 'img/characters/$Samurai-v1.png').convert('RGBA').crop((48, 0, 96, 72))
preview = Image.new('RGBA', (384, 256), (231, 226, 213, 255))
preview.alpha_composite(building, (48, 24))
# Keep the soles at the threshold's ground plane, not below the house.
preview.alpha_composite(hero, (168, 144))
preview.resize((768, 512), Image.Resampling.NEAREST).save(OUT / 'scale-preview-v2.png')
metadata = {'sourceSize': im.size, 'sourceBounds': bounds, 'buildingSize': building.size,
            'sheetSize': sheet.size, 'mainAssembly': {'column': 0, 'row': 1, 'width': 6, 'height': 4},
            'doorOpeningApprox': [80, 72], 'export': 'alpha-preserving nearest-neighbor'}
(OUT / 'export-v2.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')
print(json.dumps(metadata))
