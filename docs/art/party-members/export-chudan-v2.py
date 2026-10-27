"""Export only the revised Chudan review sprite; preserve the active v1 set."""
from pathlib import Path
import json
import numpy as np
from PIL import Image

art = Path(__file__).resolve().parent
root = art.parents[2]
source = Image.open(art / 'shinsengumi-chudan-source-v2.png').convert('RGBA')
pixels = np.array(source)
pixels[pixels[:, :, 3] < 64] = 0
clean = Image.fromarray(pixels)
left, top, right, bottom = clean.getbbox()
scale = 280 / (bottom - top)
r, g, b, alpha = (pixels[:, :, i].astype(float) for i in range(4))
feet = (alpha >= 64) & (r >= 70) & (r > g * 1.08) & (g > b * 1.12)
feet[:bottom - int((bottom - top) * .13)] = False
ys, xs = np.where(feet)
axis = (int(xs.min()) + int(xs.max())) / 2
crop = clean.crop((left, top, right, bottom))
size = (round(crop.width * scale), 280)
offset = (round(240 - (axis - left) * scale), 88)
sprite = Image.new('RGBA', (480, 384))
sprite.paste(crop.resize(size, Image.Resampling.NEAREST), offset)
bounds = sprite.getbbox()
assert bounds[0] >= 4 and bounds[1] == 88 and bounds[2] <= 476 and bounds[3] == 368
output = root / 'img/battlers/Shinsengumi-ChudanBack-v2.png'
sprite.save(output)
record = dict(source='shinsengumi-chudan-source-v2.png', sourceSize=source.size,
              sourceBounds=[left, top, right, bottom], scale=scale, footAxis=axis,
              offset=offset, canvas=[480, 384], bodyHeight=280, soleBaseline=368,
              visibleBounds=bounds, output=str(output.relative_to(root)), status='review')
(art / 'chudan-export-v2.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record))
