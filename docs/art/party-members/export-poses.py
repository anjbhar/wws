"""Export generated sources with uniform nearest-neighbor scale and shared feet."""
import json
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

ART = Path(__file__).resolve().parent
ROOT = ART.parents[2]
manifest = json.loads((ART / 'generation-prompts.json').read_text())
records = []
preview = Image.new('RGB', (6 * 480, 2 * 424), '#ded9ca')
draw = ImageDraw.Draw(preview)
for entry in manifest['images']:
    character, pose = entry['character'], entry['pose']
    source = Image.open(ART / entry['source']).convert('RGBA')
    pixels = np.array(source)
    # Discard only near-transparent generator noise, outside the drawn sprite.
    pixels[pixels[:, :, 3] < 64] = 0
    source = Image.fromarray(pixels)
    left, top, right, bottom = source.getbbox()
    crown = {('Masanori', 'Jodan'): 218, ('Shinsengumi', 'Jodan'): 234,
             ('Shinsengumi', 'Seigan'): 214}.get((character, pose), top)
    body_height = 260 if pose == 'Kasumi' else 280
    scale = body_height / (bottom - crown)
    # Feet/sandals supply the ground axis; blades never determine body scale.
    r, g, b, alpha = (pixels[:, :, i].astype(float) for i in range(4))
    warm = (alpha >= 64) & (r >= 70) & (r > g * 1.08) & (g > b * 1.12)
    warm[:bottom - int((bottom - crown) * .13)] = False
    ys, xs = np.where(warm)
    assert len(xs), f'No feet found: {character} {pose}'
    axis = (int(xs.min()) + int(xs.max())) / 2
    crop = source.crop((left, top, right, bottom))
    size = (round(crop.width * scale), round(crop.height * scale))
    offset = (round(240 - (axis - left) * scale), 368 - size[1])
    assert offset[0] >= 4 and offset[1] >= 4, (entry, offset)
    assert offset[0] + size[0] <= 476, (entry, offset, size)
    sprite = Image.new('RGBA', (480, 384))
    sprite.paste(crop.resize(size, Image.Resampling.NEAREST), offset)
    bounds = sprite.getbbox()
    assert bounds[3] == 368 and bounds[0] >= 4 and bounds[2] <= 476
    prefix = 'SamuraiInstructor' if character == 'Masanori' else character
    output = ROOT / 'img' / 'battlers' / f'{prefix}-{pose}Back-v1.png'
    sprite.save(output)
    row = 0 if character == 'Masanori' else 1
    col = ['Chudan', 'Jodan', 'Gedan', 'Kasumi', 'Waki', 'Seigan'].index(pose)
    preview.paste(sprite, (col * 480, row * 424 + 32), sprite)
    draw.text((col * 480 + 12, row * 424 + 10), f'{character} / {pose}', fill='#29251e')
    records.append(dict(character=character, pose=pose, source=entry['source'],
                        sourceSize=source.size, sourceBounds=[left, top, right, bottom],
                        crown=crown, footAxis=axis, scale=scale, offset=offset,
                        canvas=[480,384], bodyHeight=body_height, soleBaseline=368,
                        output=str(output.relative_to(ROOT)), visibleBounds=bounds))
preview.save(ART / 'poses-preview-v1.png')
(ART / 'export-v1.json').write_text(json.dumps(records, indent=2) + '\n')
print(f'Exported {len(records)} transparent 480x384 poses with sole baseline 368.')
