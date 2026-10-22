"""Export generated walking sheets with uniform scale and per-frame foot anchors."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]


def export(folder, filename):
    directory = ROOT / 'docs/art' / folder
    source = Image.open(directory / 'walking-source-v2.png').convert('RGBA')
    alpha = source.getchannel('A')
    solid = alpha.point(lambda a: 255 if a >= 64 else 0)
    assert alpha.getextrema()[0] == 0, 'Expected true transparency'
    # Generation may leave unequal gaps between rows; locate the actual bands
    # rather than slicing through a head at an assumed quarter-sheet boundary.
    bands, start, last = [], None, None
    for y in range(source.height):
        occupied = solid.crop((0, y, source.width, y + 1)).getbbox() is not None
        if occupied:
            if start is None:
                start = y
            last = y
        elif start is not None and y - last > 12:
            bands.append((start, last + 1))
            start = None
    if start is not None:
        bands.append((start, last + 1))
    assert len(bands) == 4, f'Expected four sprite rows, found {bands}'
    frames = []
    for row, (top, bottom) in enumerate(bands):
        for col in range(3):
            left, right = round(col * source.width / 3), round((col + 1) * source.width / 3)
            bounds = solid.crop((left, top, right, bottom)).getbbox()
            assert bounds, f'Empty frame {row}, {col}'
            box = (left + bounds[0], top + bounds[1], left + bounds[2], top + bounds[3])
            assert box[0] > left and box[2] < right, f'Frame crosses column boundary: {box}'
            frames.append({'row': row, 'column': col, 'sourceBounds': box})
    scale = min(min(44 / (f['sourceBounds'][2] - f['sourceBounds'][0]),
                        62 / (f['sourceBounds'][3] - f['sourceBounds'][1])) for f in frames)
    sheet = Image.new('RGBA', (144, 288))
    for frame in frames:
        left, top, right, bottom = frame['sourceBounds']
        foot_top = top + round((bottom - top) * .82)
        foot_bounds = solid.crop((left, foot_top, right, bottom)).getbbox()
        anchor = (foot_bounds[0] + foot_bounds[2]) / 2
        width, height = round((right - left) * scale), round((bottom - top) * scale)
        local_x = max(1, min(47 - width, round(24 - anchor * scale)))
        x, y = frame['column'] * 48 + local_x, frame['row'] * 72 + 68 - height
        sprite = source.crop((left, top, right, bottom)).resize((width, height), Image.Resampling.NEAREST)
        sheet.alpha_composite(sprite, (x, y))
        frame['destination'] = [x, y, width, height]
    target = ROOT / 'img/characters' / filename
    assert not target.exists(), f'Choose a new version: {target}'
    sheet.save(target)
    sheet.resize((576, 1152), Image.Resampling.NEAREST).save(directory / 'walking-preview-v2.png')
    # Check every engine cell has visible art and fully transparent edges.
    for row in range(4):
        for col in range(3):
            cell = sheet.crop((col * 48, row * 72, (col + 1) * 48, (row + 1) * 72))
            box = cell.getbbox()
            assert box and 0 < box[0] < box[2] < 48 and 0 < box[1] < box[3] < 72, (row, col, box)
    (directory / 'walking-export-v2.json').write_text(json.dumps({
        'generator': 'built-in image_gen', 'sourceSize': source.size,
        'canvas': sheet.size, 'frameSize': [48, 72], 'scale': scale,
        'rows': ['Down', 'Left', 'Right', 'Up'], 'columns': ['Walk A', 'Stand', 'Walk B'],
        'soleBaseline': 68, 'resampling': 'nearest-neighbor', 'frames': frames,
        'output': str(target.relative_to(ROOT)),
    }, indent=2), encoding='utf-8')
    print(f'PASS: {filename}: transparent 144x288, 12 complete aligned 48x72 frames')


if __name__ == '__main__':
    export('main-character', '$Samurai-v2.png')
    export('samurai-npc', '$SamuraiInstructor-v2.png')
