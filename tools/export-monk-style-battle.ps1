param([Parameter(Mandatory=$true)][ValidateSet('masked','unmasked')][string]$Variant,
      [Parameter(Mandatory=$true)][int]$BodyCrown)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot=Split-Path $PSScriptRoot -Parent
$directory=Join-Path $projectRoot 'docs/art/warrior-monks/style-v2'
$source=[Drawing.Bitmap]::new((Join-Path $directory ($Variant+'-battle-source.png')))
$left=$source.Width;$top=$source.Height;$right=-1;$bottom=-1;$transparent=0
for($y=0;$y -lt $source.Height;$y++){
 for($x=0;$x -lt $source.Width;$x++){
  $a=$source.GetPixel($x,$y).A
  if($a -eq 0){$transparent++}
  if($a -ge 64){$left=[Math]::Min($left,$x);$right=[Math]::Max($right,$x);$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y)}
 }
}
if(!$transparent -or $right -lt 0){throw 'Visible art and true alpha required.'}
$scale=[Math]::Min(236.0/($bottom+1-$BodyCrown),[Math]::Min(268.0/($right-$left+1),352.0/($bottom-$top+1)))
$ox=[int][Math]::Round(144-(($left+$right+1)/2)*$scale)
$oy=[int][Math]::Round(368-($bottom+1)*$scale)
$sheet=[Drawing.Bitmap]::new(288,384,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g=[Drawing.Graphics]::FromImage($sheet)
$g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
$g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
$g.DrawImage($source,[Drawing.Rectangle]::new($ox,$oy,[int][Math]::Round($source.Width*$scale),[int][Math]::Round($source.Height*$scale)),0,0,$source.Width,$source.Height,[Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$title=if($Variant -eq 'masked'){'Masked'}else{'Unmasked'}
$file='WarriorMonk-'+$title+'-v2.png'
$sheet.Save((Join-Path $projectRoot ('img/enemies/'+$file)),[Drawing.Imaging.ImageFormat]::Png)
$record=[ordered]@{Generator='built-in image_gen';Variant=$Variant;SourceSize=@($source.Width,$source.Height);SourceBounds=@($left,$top,$right,$bottom);BodyCrown=$BodyCrown;TargetBodyHeight=236;Canvas=@(288,384);ArtworkBottom=368;Scale=$scale;Offset=@($ox,$oy);Output=('img/enemies/'+$file)}
$record|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $directory ($Variant+'-battle-export.json')) -Encoding utf8
$record|ConvertTo-Json -Depth 4
$source.Dispose();$sheet.Dispose()
