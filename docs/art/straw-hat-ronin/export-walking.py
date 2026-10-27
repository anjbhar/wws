"""Pack generated ronin art into the current WWS 64x88 overworld standard."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

FOLDER = Path(__file__).resolve().parent
ROOT = FOLDER.parents[2]
FW, FH, SOLE = 64, 88, 84

def runs(values, gap=3):
    indices = np.flatnonzero(values)
    result = []
    if not len(indices):
        return result
    start = last = int(indices[0])
    for value in indices[1:]:
        value = int(value)
        if value-last > gap+1:
            result.append((start, last+1))
            start = value
        last = value
    result.append((start, last+1))
    return result

source = Image.open(FOLDER / "walking-source-v2.png").convert("RGBA")
pixels = np.array(source)
pixels[:, :, 3] = np.where(pixels[:, :, 3] >= 64, pixels[:, :, 3], 0)
source = Image.fromarray(pixels)
mask = pixels[:, :, 3] >= 64
assert pixels[:, :, 3].min() == 0, "Real transparency required"
rows = runs(mask.any(axis=1))
assert len(rows) == 4, rows
sheet = Image.new("RGBA", (192, 352))
records = []
for row, (top, bottom) in enumerate(rows):
    columns = runs(mask[top:bottom].any(axis=0), gap=12)
    assert len(columns) == 3, (row, columns)
    boxes = []
    for left, right in columns:
        ys, xs = np.where(mask[top:bottom, left:right])
        boxes.append((left+int(xs.min()), top+int(ys.min()),
                      left+int(xs.max())+1, top+int(ys.max())+1))
    scale = 67 / (boxes[1][3]-boxes[1][1])
    for col, box in enumerate(boxes):
        sprite = source.crop(box)
        width, height = round(sprite.width*scale), round(sprite.height*scale)
        feet = np.array(sprite.getchannel("A"))[round(sprite.height*.90):] >= 64
        xs = np.flatnonzero(feet.any(axis=0))
        foot_axis = (int(xs[0])+int(xs[-1])+1)/2
        x, y = round(32-foot_axis*scale), SOLE-height
        assert 0 < x and x+width < FW and 0 < y, (row, col, x, y, width, height)
        sprite = sprite.resize((width, height), Image.Resampling.NEAREST)
        sheet.alpha_composite(sprite, (col*FW+x, row*FH+y))
        records.append(dict(row=row, column=col, sourceBounds=box,
                            scale=scale, visibleSize=[width, height], offset=[x, y]))
for row in range(4):
    for col in range(3):
        cell = sheet.crop((col*FW, row*FH, (col+1)*FW, (row+1)*FH))
        bounds = cell.getbbox()
        assert bounds and bounds[0] > 0 and bounds[2] < FW and bounds[1] > 0
        assert bounds[3] == SOLE, (row, col, bounds)
        assert cell.getchannel("A").getextrema()[0] == 0
output = ROOT / "img/characters/$StrawHatRonin-v1.png"
sheet.save(output)
sheet.resize((576, 1056), Image.Resampling.NEAREST).save(FOLDER / "walking-preview-v1.png")

# Compare all four directions against the current production cast.
comparison = Image.new("RGBA", (640, 432), (53, 56, 62, 255))
draw = ImageDraw.Draw(comparison)
specs = [
    ("Hayato", "$Samurai-v3.png"),
    ("Masanori", "$SamuraiInstructor-v3.png"),
    ("Shinsengumi", "$Shinsengumi-v2.png"),
    ("Ronin", "$StrawHatRonin-v1.png"),
]
for i, (name, filename) in enumerate(specs):
    cast = Image.open(ROOT / "img/characters" / filename).convert("RGBA")
    draw.text((i*160+12, 8), name, fill="white", font_size=17)
    for row in range(4):
        frame = cast.crop((64, row*88, 128, (row+1)*88))
        comparison.alpha_composite(frame, (i*160+48, 32+row*96))
comparison.resize((1280, 864), Image.Resampling.NEAREST).save(FOLDER / "walking-cast-comparison.png")

# Four-direction loop for reviewing the exported walking cycle.
animation = []
for col in (1, 0, 1, 2):
    panel = Image.new("RGBA", (320, 112), (53, 56, 62, 255))
    for row in range(4):
        panel.alpha_composite(sheet.crop((col*64, row*88, (col+1)*64, (row+1)*88)), (row*80+8, 12))
    animation.append(panel.resize((960, 336), Image.Resampling.NEAREST).convert("RGB"))
animation[0].save(FOLDER / "walking-cycle-preview.gif", save_all=True,
                  append_images=animation[1:], duration=180, loop=0)
record = dict(generator="built-in image_gen", source="walking-source-v2.png",
              output=str(output.relative_to(ROOT)), canvas=[192,352], frameSize=[64,88],
              standingHeight=67, soleBaseline=84, rowOrder=["down","left","right","up"],
              columnOrder=["walk A","stand","walk B"], trueAlpha=True,
              equipment="Both swords sheathed at anatomical left hip", frames=records,
              assignedToMap=False)
(FOLDER / "walking-export-v1.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
print(json.dumps(dict(output=record["output"], frames=len(records),
                     visibleSizes=[r["visibleSize"] for r in records], checks="passed"), indent=2))
