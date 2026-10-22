param([Parameter(Mandatory=$true)][ValidateSet('masked','unmasked')][string]$Variant,
      [Parameter(Mandatory=$true)][int]$BodyCrown,[switch]$ReplaceExport)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$source=[Drawing.Bitmap]::new((Join-Path $PSScriptRoot ($Variant+'-source-v1.png')))
$left=$source.Width; $top=$source.Height; $right=-1; $bottom=-1; $transparent=0
for($y=0;$y -lt $source.Height;$y++) {
    for($x=0;$x -lt $source.Width;$x++) {
        $alpha=$source.GetPixel($x,$y).A
        if($alpha -eq 0){$transparent++}
        if($alpha -ge 64){
            $left=[Math]::Min($left,$x);$right=[Math]::Max($right,$x)
            $top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y)
        }
    }
}
if($transparent -eq 0 -or $right -lt 0){throw 'Expected genuine alpha transparency and visible art.'}
# Extra vertical canvas accommodates the complete naginata without cropping it.
$scale=[Math]::Min(268.0/($right-$left+1),352.0/($bottom-$top+1))
$scale=[Math]::Min($scale,236.0/($bottom+1-$BodyCrown))
$offsetX=[int][Math]::Round(144-(($left+$right+1)/2)*$scale)
$offsetY=[int][Math]::Round(368-($bottom+1)*$scale)
$sprite=[Drawing.Bitmap]::new(288,384,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g=[Drawing.Graphics]::FromImage($sprite)
$g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
$g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
$g.DrawImage($source,[Drawing.Rectangle]::new($offsetX,$offsetY,[int][Math]::Round($source.Width*$scale),[int][Math]::Round($source.Height*$scale)),0,0,$source.Width,$source.Height,[Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$title=if($Variant -eq 'masked'){'Masked'}else{'Unmasked'}
$filename='WarriorMonk-'+$title+'-v1.png'
$projectRoot=Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
$output=Join-Path $projectRoot ('img/enemies/'+$filename)
if((Test-Path -LiteralPath $output) -and !$ReplaceExport){throw 'Choose a new version or explicitly replace this export.'}
$sprite.Save($output,[Drawing.Imaging.ImageFormat]::Png)
$bounds=@(($offsetX+$left*$scale),($offsetY+$top*$scale),($offsetX+($right+1)*$scale),($offsetY+($bottom+1)*$scale))
if($bounds[0] -lt 1 -or $bounds[1] -lt 1 -or $bounds[2] -ge 288 -or $bounds[3] -ge 384){throw 'Export clips canvas edge.'}
$record=[ordered]@{Generator='built-in image_gen';Variant=$Variant;SourceSize=@($source.Width,$source.Height);SourceBounds=@($left,$top,$right,$bottom);BodyCrown=$BodyCrown;TargetBodyHeight=236;TransparentSourcePixels=$transparent;Canvas=@(288,384);ArtworkBottom=368;Scale=$scale;Offset=@($offsetX,$offsetY);Resampling='NearestNeighbor';Output=('img/enemies/'+$filename);Status='Standalone battle asset; no enemy or encounter assigned'}
$record|ConvertTo-Json -Depth 3|Set-Content -LiteralPath (Join-Path $PSScriptRoot ($Variant+'-export-v1.json')) -Encoding utf8
$record|ConvertTo-Json -Depth 3
$sprite.Dispose();$source.Dispose()
