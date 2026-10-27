"""Export the edited ronin at v1's uniform scale and placement."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

folder = Path(__file__).resolve().parent
root = folder.parents[2]
previous = json.loads((folder / "battle-export-v1.json").read_text(encoding="utf-8-sig"))
source = Image.open(folder / "battle-source-v2.png").convert("RGBA")
assert list(source.size) == previous["SourceSize"], "Review scale for changed source dimensions"
scale = previous["Scale"]
offset = tuple(previous["Offset"])
sprite = Image.new("RGBA", (288, 288))
resized = source.resize(tuple(round(v * scale) for v in source.size), Image.Resampling.NEAREST)
sprite.paste(resized, offset)
alpha = sprite.getchannel("A")
bounds = alpha.point(lambda a: 255 if a >= 64 else 0).getbbox()
assert bounds and bounds[0] >= 4 and bounds[1] >= 4 and bounds[2] <= 284 and bounds[3] <= 284
assert alpha.getextrema()[0] == 0
output = root / "img/enemies/StrawHatRonin-v2.png"
sprite.save(output)
preview = Image.new("RGBA", (960, 328), (53, 56, 62, 255))
draw = ImageDraw.Draw(preview)
draw.line((8, 296, 952, 296), fill=(150, 150, 150, 100))
items = [
    ("Masanori", root / "img/enemies/SamuraiInstructor-v1.png"),
    ("Straw hat ronin - draft v2", output),
    ("Shinsengumi", root / "img/enemies/Shinsengumi-Chudan-v2.png"),
]
for i, (label, path) in enumerate(items):
    preview.alpha_composite(Image.open(path).convert("RGBA"), (i * 320 + 16, 28))
    draw.text((i * 320 + 16, 6), label, fill="white", font_size=17)
preview.save(folder / "battle-comparison-v2.png")
record = {
    "Generator": "built-in image_gen",
    "Status": "Draft for visual approval",
    "SourceSize": list(source.size),
    "Canvas": list(sprite.size),
    "Scale": scale,
    "Offset": list(offset),
    "OutputBoundsExclusive": list(bounds),
    "VisibleHeight": bounds[3] - bounds[1],
    "TrueAlpha": True,
    "Output": str(output.relative_to(root)),
    "AssignedEncounter": False,
}
(folder / "battle-export-v2.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
print(json.dumps(record, indent=2))
