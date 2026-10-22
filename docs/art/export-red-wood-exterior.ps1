param([Parameter(Mandatory=$true)][string]$SourcePath)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$artDirectory = Join-Path $PSScriptRoot 'red-wood-exterior'
New-Item -ItemType Directory -Force -Path $artDirectory | Out-Null
$sheetPath = Join-Path $projectRoot 'img/tilesets/EdoRedWoodExterior_D-v1.png'
if (Test-Path -LiteralPath $sheetPath) { throw 'Version 1 already exists; export a new version instead of overwriting.' }
Copy-Item -LiteralPath $SourcePath -Destination (Join-Path $artDirectory 'source-v1.png')
$source = [Drawing.Bitmap]::new($SourcePath)
$minX=$source.Width; $minY=$source.Height; $maxX=-1; $maxY=-1; $transparent=0
for ($y=0; $y -lt $source.Height; $y++) {
    for ($x=0; $x -lt $source.Width; $x++) {
        $alpha=$source.GetPixel($x,$y).A
        if ($alpha -eq 0) { $transparent++ }
        if ($alpha -gt 0) {
            $minX=[Math]::Min($minX,$x); $minY=[Math]::Min($minY,$y)
            $maxX=[Math]::Max($maxX,$x); $maxY=[Math]::Max($maxY,$y)
        }
    }
}
if ($maxX -lt 0 -or $transparent -eq 0) { throw 'Expected visible artwork on real alpha transparency.' }
$building = [Drawing.Bitmap]::new(384,288,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g=[Drawing.Graphics]::FromImage($building)
$g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
$g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
# Normalize the continuous facade to its planned 8x6 tile footprint before slicing.
$g.DrawImage($source,[Drawing.Rectangle]::new(0,0,384,288),$minX,$minY,$maxX-$minX+1,$maxY-$minY+1,[Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$building.Save((Join-Path $artDirectory 'building-v1.png'),[Drawing.Imaging.ImageFormat]::Png)
$sheet=[Drawing.Bitmap]::new(768,768,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g=[Drawing.Graphics]::FromImage($sheet)
$g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
$g.DrawImageUnscaled($building,0,48)
$pieces=@(
    @{Name='wall-window'; Source=@(48,144,96,144); Cell=@(0,8)},
    @{Name='roof-middle'; Source=@(144,0,96,144); Cell=@(2,8)},
    @{Name='double-door'; Source=@(144,192,96,96); Cell=@(4,8)},
    @{Name='left-wall-edge'; Source=@(0,144,48,144); Cell=@(6,8)}
)
foreach ($piece in $pieces) {
    $box=$piece.Source
    $asset=$building.Clone([Drawing.Rectangle]::new($box[0],$box[1],$box[2],$box[3]),[Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $asset.Save((Join-Path $artDirectory ($piece.Name+'-v1.png')),[Drawing.Imaging.ImageFormat]::Png)
    $g.DrawImageUnscaled($asset,$piece.Cell[0]*48,$piece.Cell[1]*48)
    $asset.Dispose()
}
$g.Dispose()
$sheet.Save($sheetPath,[Drawing.Imaging.ImageFormat]::Png)
# Actual protagonist at the doorway for native-scale review, enlarged 2x without smoothing.
$preview=[Drawing.Bitmap]::new(864,720,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g=[Drawing.Graphics]::FromImage($preview)
$g.Clear([Drawing.Color]::FromArgb(231,226,213))
$g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
$g.DrawImage($building,[Drawing.Rectangle]::new(48,48,768,576),0,0,384,288,[Drawing.GraphicsUnit]::Pixel)
$hero=[Drawing.Bitmap]::new((Join-Path $projectRoot 'img/characters/$Samurai-v1.png'))
$g.DrawImage($hero,[Drawing.Rectangle]::new(384,480,96,144),48,0,48,72,[Drawing.GraphicsUnit]::Pixel)
$hero.Dispose(); $g.Dispose()
$preview.Save((Join-Path $artDirectory 'scale-preview-v1.png'),[Drawing.Imaging.ImageFormat]::Png)
$metadata=@{sourceWidth=$source.Width;sourceHeight=$source.Height;sourceTransparentPixels=$transparent;sourceBounds=@($minX,$minY,($maxX-$minX+1),($maxY-$minY+1));buildingSize=@(384,288);sheetSize=@(768,768);mainAssembly=@{column=0;row=1;width=8;height=6}}
$metadata | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $artDirectory 'export-v1.json') -Encoding UTF8
$metadata | ConvertTo-Json -Depth 5
$preview.Dispose(); $sheet.Dispose(); $building.Dispose(); $source.Dispose()
