"""Align Shinsengumi guards without repainting the generated source pixels."""
import json
from pathlib import Path
from PIL import Image

ART = Path(__file__).resolve().parent
ROOT = ART.parents[2]
POSES = ['Chudan', 'Jodan', 'Gedan', 'Kasumi', 'Waki']
original = json.loads((ART / 'export-v1.json').read_text(encoding='utf-8-sig'))
base_width = original['SourceSize'][0]
base_scale = original['Scale']
records = []
preview = Image.new('RGBA', (288 * len(POSES), 288), '#e1ddd0')
for index, pose in enumerate(POSES):
    source_path = ART / ('chudan-source-v1.png' if pose == 'Chudan' else f'stances/{pose.lower()}-source-v1.png')
    source = Image.open(source_path).convert('RGBA')
    alpha = source.getchannel('A')
    assert alpha.getextrema()[0] == 0, f'{pose}: expected genuine transparency'
    solid = alpha.point(lambda a: 255 if a >= 64 else 0)
    left, top, right, bottom = solid.getbbox()
    feet_top = bottom - round((bottom - top) * .15)
    feet = solid.crop((left, feet_top, right, bottom)).getbbox()
    anchor = left + (feet[0] + feet[2]) / 2
    reach = max(anchor - left, right - anchor)
    # Match the approved Chudan pixel density first, reducing only when a
    # raised/extended weapon needs extra clearance inside the 288px canvas.
    scale = min(base_scale * base_width / source.width, 140 / reach, 264 / (bottom - top))
    size = (round(source.width * scale), round(source.height * scale))
    x, y = round(144 - anchor * scale), round(268 - bottom * scale)
    sprite = Image.new('RGBA', (288, 288))
    sprite.alpha_composite(source.resize(size, Image.Resampling.NEAREST), (x, y))
    box = sprite.getchannel('A').point(lambda a: 255 if a >= 64 else 0).getbbox()
    assert box and box[0] >= 2 and box[1] >= 2 and box[2] <= 286 and abs(box[3] - 268) <= 1, (pose, box)
    output = ROOT / f'img/enemies/Shinsengumi-{pose}-v2.png'
    assert not output.exists(), f'Choose another version: {output}'
    sprite.save(output)
    preview.alpha_composite(sprite, (index * 288, 0))
    records.append({'pose': pose, 'source': str(source_path.relative_to(ROOT)),
                    'sourceSize': source.size, 'sourceBounds': [left, top, right, bottom],
                    'footAnchor': anchor, 'scale': scale, 'offset': [x, y],
                    'canvas': [288, 288], 'soleBaseline': 268, 'bounds': box,
                    'output': str(output.relative_to(ROOT))})
preview.convert('RGB').save(ART / 'stances/stance-preview-v2.png')
(ART / 'stances/export-v2.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
print('PASS: five RGBA 288x288 Shinsengumi guards, foot axis x=144, soles y=268, no clipped silhouettes')
