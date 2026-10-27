"""Export the approved loose-haori Shinsengumi set; retain all v1 art."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

art = Path(__file__).resolve().parent
root = art.parents[2]
poses = ['Chudan', 'Jodan', 'Gedan', 'Kasumi', 'Waki', 'Seigan']
sheet = Image.new('RGB', (480 * 3, 424 * 2), '#ded9ca')
draw = ImageDraw.Draw(sheet)
records = []
for i, pose in enumerate(poses):
    source_name = f'shinsengumi-{pose.lower()}-source-v2.png'
    source = Image.open(art / source_name).convert('RGBA')
    pixels = np.array(source)
    pixels[pixels[:, :, 3] < 64] = 0
    clean = Image.fromarray(pixels)
    left, top, right, bottom = clean.getbbox()
    # Crown landmarks exclude Jodan's and Seigan's raised blades.
    crown = {'Jodan': 234, 'Seigan': 216}.get(pose, top)
    body_height = 260 if pose == 'Kasumi' else 280
    scale = body_height / (bottom - crown)
    r, g, b, alpha = (pixels[:, :, j].astype(float) for j in range(4))
    feet = (alpha >= 64) & (r >= 70) & (r > g * 1.08) & (g > b * 1.12)
    feet[:bottom - int((bottom - crown) * .13)] = False
    ys, xs = np.where(feet)
    assert len(xs), f'No feet found: {pose}'
    axis = (int(xs.min()) + int(xs.max())) / 2
    crop = clean.crop((left, top, right, bottom))
    size = (round(crop.width * scale), round(crop.height * scale))
    offset = (round(240 - (axis - left) * scale), 368 - size[1])
    sprite = Image.new('RGBA', (480, 384))
    sprite.paste(crop.resize(size, Image.Resampling.NEAREST), offset)
    bounds = sprite.getbbox()
    assert offset[0] >= 4 and offset[1] >= 4 and offset[0] + size[0] <= 476, (pose, offset, size)
    assert bounds[3] == 368, (pose, bounds)
    output = root / 'img/battlers' / f'Shinsengumi-{pose}Back-v2.png'
    # Chudan must remain exactly the approved export.
    if pose == 'Chudan':
        assert np.array_equal(np.array(sprite), np.array(Image.open(output).convert('RGBA')))
    else:
        sprite.save(output)
    x, y = (i % 3) * 480, (i // 3) * 424
    sheet.paste(sprite, (x, y + 32), sprite)
    draw.text((x + 12, y + 10), f'Shinsengumi / {pose}', fill='#29251e')
    records.append(dict(character='Shinsengumi', pose=pose, source=source_name,
                        sourceSize=source.size, sourceBounds=[left, top, right, bottom],
                        crown=crown, scale=scale, footAxis=axis, offset=offset,
                        canvas=[480, 384], bodyHeight=body_height, soleBaseline=368,
                        visibleBounds=bounds, output=output.relative_to(root).as_posix()))
sheet.save(art / 'shinsengumi-poses-preview-v2.png')
(art / 'shinsengumi-export-v2.json').write_text(json.dumps(records, indent=2) + '\n')
print('Exported six corrected 480x384 poses; approved Chudan pixels preserved.')
