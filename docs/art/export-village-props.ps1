Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$artDirectory = Join-Path $PSScriptRoot 'village-props'
New-Item -ItemType Directory -Force -Path $artDirectory | Out-Null
$sourcePath = 'C:\Users\anjan\.codex\generated_images\01a1178b-6f7a-73c2-827c-5107cf3020a6\exec-6037d666-7f59-4427-b1c3-b924c6116f75.png'
Copy-Item -LiteralPath $sourcePath -Destination (Join-Path $artDirectory 'source-v1.png')
$source = [Drawing.Bitmap]::new($sourcePath)
$sheet = [Drawing.Bitmap]::new(768,768,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$sheetGraphics = [Drawing.Graphics]::FromImage($sheet)
$sheetGraphics.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy

# Source rectangles isolate generated objects; output dimensions reserve whole tiles.
$objects = @(
    @{Name='crate'; Box=@(313,0,314,320); Cell=@(1,0); Size=@(48,48); Max=@(36,36)},
    @{Name='barrel'; Box=@(627,0,313,325); Cell=@(2,0); Size=@(48,48); Max=@(30,40)},
    @{Name='stool'; Box=@(940,0,314,320); Cell=@(3,0); Size=@(48,48); Max=@(26,26)},
    @{Name='table'; Box=@(0,320,627,315); Cell=@(0,1); Size=@(96,48); Max=@(88,36)},
    @{Name='lantern'; Box=@(627,325,313,589); Cell=@(2,1); Size=@(48,96); Max=@(36,86)},
    @{Name='covered-crate'; Box=@(940,320,314,315); Cell=@(3,1); Size=@(48,48); Max=@(40,38)},
    @{Name='fence-straight'; Box=@(0,635,313,260); Cell=@(0,2); Size=@(48,48); Max=@(48,34)},
    @{Name='fence-end-right'; Box=@(313,635,314,260); Cell=@(1,2); Size=@(48,48); Max=@(48,34)},
    @{Name='fence-end-left'; Box=@(940,635,314,260); Cell=@(3,2); Size=@(48,48); Max=@(48,34)},
    @{Name='fence-vertical'; Box=@(0,900,313,354); Cell=@(0,3); Size=@(48,48); Max=@(30,40)},
    @{Name='fence-corner-west'; Box=@(313,900,314,354); Cell=@(1,3); Size=@(48,48); Max=@(48,44)},
    @{Name='fence-corner-east'; Box=@(627,914,313,340); Cell=@(2,3); Size=@(48,48); Max=@(48,44)},
    @{Name='stool-alt'; Box=@(940,900,314,354); Cell=@(3,3); Size=@(48,48); Max=@(26,26)}
)
foreach ($object in $objects) {
    $box = $object.Box
    $minX=$box[0]+$box[2]; $minY=$box[1]+$box[3]; $maxX=-1; $maxY=-1
    for ($y=$box[1]; $y -lt $box[1]+$box[3]; $y++) {
        for ($x=$box[0]; $x -lt $box[0]+$box[2]; $x++) {
            if ($source.GetPixel($x,$y).A -gt 0) {
                $minX=[math]::Min($minX,$x); $minY=[math]::Min($minY,$y)
                $maxX=[math]::Max($maxX,$x); $maxY=[math]::Max($maxY,$y)
            }
        }
    }
    if ($maxX -lt 0) { throw "Empty source region: $($object.Name)" }
    $width=$maxX-$minX+1; $height=$maxY-$minY+1
    $scale=[math]::Min($object.Max[0]/$width,$object.Max[1]/$height)
    $drawWidth=[int][math]::Round($width*$scale); $drawHeight=[int][math]::Round($height*$scale)
    $asset=[Drawing.Bitmap]::new($object.Size[0],$object.Size[1],[Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g=[Drawing.Graphics]::FromImage($asset)
    $g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
    $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
    $left=[int][math]::Floor(($object.Size[0]-$drawWidth)/2)
    $top=$object.Size[1]-2-$drawHeight
    $g.DrawImage($source,[Drawing.Rectangle]::new($left,$top,$drawWidth,$drawHeight),$minX,$minY,$width,$height,[Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $asset.Save((Join-Path $artDirectory ($object.Name+'-v1.png')),[Drawing.Imaging.ImageFormat]::Png)
    $sheetGraphics.DrawImageUnscaled($asset,$object.Cell[0]*48,$object.Cell[1]*48)
    $asset.Dispose()
}
$sheetGraphics.Dispose()
$sheet.Save((Join-Path $projectRoot 'img/tilesets/EdoVillage_B-v1.png'),[Drawing.Imaging.ImageFormat]::Png)

# Compact review image with the actual protagonist at the same pixel scale.
$preview=[Drawing.Bitmap]::new(576,648)
$g=[Drawing.Graphics]::FromImage($preview)
$g.Clear([Drawing.Color]::FromArgb(230,226,215))
$g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
$g.DrawImage($sheet,[Drawing.Rectangle]::new(0,0,576,576),0,0,192,192,[Drawing.GraphicsUnit]::Pixel)
$hero=[Drawing.Bitmap]::new((Join-Path $projectRoot 'img/characters/$Samurai-v1.png'))
$g.DrawImage($hero,[Drawing.Rectangle]::new(0,0,144,216),48,0,48,72,[Drawing.GraphicsUnit]::Pixel)
$hero.Dispose(); $g.Dispose()
$preview.Save((Join-Path $artDirectory 'preview-v1.png'),[Drawing.Imaging.ImageFormat]::Png)
$preview.Dispose(); $sheet.Dispose(); $source.Dispose()
