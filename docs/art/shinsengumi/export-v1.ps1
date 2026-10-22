$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$source = [Drawing.Bitmap]::new((Join-Path $PSScriptRoot 'chudan-source-v1.png'))
$left=$source.Width; $top=$source.Height; $right=-1; $bottom=-1; $transparent=0
for($y=0;$y -lt $source.Height;$y++) {
  for($x=0;$x -lt $source.Width;$x++) {
    $a=$source.GetPixel($x,$y).A
    if($a -eq 0) {$transparent++}
    if($a -ge 64) {$left=[Math]::Min($left,$x); $right=[Math]::Max($right,$x); $top=[Math]::Min($top,$y); $bottom=[Math]::Max($bottom,$y)}
  }
}
if($transparent -eq 0 -or $right -lt 0) {throw 'Expected visible artwork and genuine alpha transparency.'}
$scale=[Math]::Min(244.0/($bottom-$top+1),268.0/($right-$left+1))
$width=[int][Math]::Round($source.Width*$scale)
$height=[int][Math]::Round($source.Height*$scale)
$offsetX=[int][Math]::Round(144-(($left+$right+1)/2)*$scale)
$offsetY=[int][Math]::Round(268-($bottom+1)*$scale)
$sprite=[Drawing.Bitmap]::new(288,288,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g=[Drawing.Graphics]::FromImage($sprite)
$g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
$g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
$g.DrawImage($source,[Drawing.Rectangle]::new($offsetX,$offsetY,$width,$height),0,0,$source.Width,$source.Height,[Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$output=Join-Path $PSScriptRoot '../../../img/enemies/Shinsengumi-Chudan-v1.png'
if(Test-Path -LiteralPath $output) {throw 'Export exists; choose a new version.'}
$sprite.Save($output,[Drawing.Imaging.ImageFormat]::Png)
$record=[ordered]@{Generator='built-in image_gen';SourceSize=@($source.Width,$source.Height);SourceBounds=@($left,$top,$right,$bottom);TransparentSourcePixels=$transparent;Canvas=@(288,288);FootBaseline=268;Scale=$scale;Offset=@($offsetX,$offsetY);Resampling='NearestNeighbor';Output='img/enemies/Shinsengumi-Chudan-v1.png';Status='Visual review; not integrated into encounter'}
$record | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'export-v1.json') -Encoding utf8
$record | ConvertTo-Json -Depth 3
$sprite.Dispose(); $source.Dispose()
