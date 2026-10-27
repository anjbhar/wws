$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$source=[Drawing.Bitmap]::new((Join-Path $PSScriptRoot 'battle-source-v1.png'))
$left=$source.Width; $top=$source.Height; $right=-1; $bottom=-1; $transparent=0
for($y=0;$y -lt $source.Height;$y++){
 for($x=0;$x -lt $source.Width;$x++){
  $a=$source.GetPixel($x,$y).A
  if($a -eq 0){$transparent++}
  if($a -ge 64){$left=[Math]::Min($left,$x);$right=[Math]::Max($right,$x);$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y)}
 }
}
if(!$transparent -or $right -lt 0){throw 'True alpha and visible artwork required'}
$scale=[Math]::Min(236.0/($bottom-$top+1),272.0/($right-$left+1))
$ox=[int][Math]::Round(144-(($left+$right+1)/2)*$scale)
$oy=[int][Math]::Round(268-($bottom+1)*$scale)
$sheet=[Drawing.Bitmap]::new(288,288,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g=[Drawing.Graphics]::FromImage($sheet)
$g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
$g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
$g.DrawImage($source,[Drawing.Rectangle]::new($ox,$oy,[int][Math]::Round($source.Width*$scale),[int][Math]::Round($source.Height*$scale)),0,0,$source.Width,$source.Height,[Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$file=Join-Path $projectRoot 'img/enemies/StrawHatRonin-v1.png'
$sheet.Save($file,[Drawing.Imaging.ImageFormat]::Png)
$outBounds=@(288,288,-1,-1)
for($y=0;$y -lt 288;$y++){
 for($x=0;$x -lt 288;$x++){
  if($sheet.GetPixel($x,$y).A -ge 64){
   $outBounds[0]=[Math]::Min($outBounds[0],$x);$outBounds[1]=[Math]::Min($outBounds[1],$y)
   $outBounds[2]=[Math]::Max($outBounds[2],$x);$outBounds[3]=[Math]::Max($outBounds[3],$y)
  }
 }
}
if($outBounds[0] -lt 4 -or $outBounds[2] -gt 283 -or $outBounds[1] -lt 4 -or $outBounds[3] -gt 283){throw 'Insufficient canvas clearance'}
$preview=[Drawing.Bitmap]::new(960,328,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$pg=[Drawing.Graphics]::FromImage($preview)
$pg.Clear([Drawing.Color]::FromArgb(255,53,56,62))
$font=[Drawing.Font]::new('Arial',13)
$pen=[Drawing.Pen]::new([Drawing.Color]::FromArgb(100,150,150,150))
$pg.DrawLine($pen,8,296,952,296)
$names=@('Masanori','Straw hat ronin - draft v1','Shinsengumi')
$paths=@('img/enemies/SamuraiInstructor-v1.png','img/enemies/StrawHatRonin-v1.png','img/enemies/Shinsengumi-Chudan-v2.png')
for($i=0;$i -lt 3;$i++){
 $ref=[Drawing.Bitmap]::new((Join-Path $projectRoot $paths[$i]))
 $pg.DrawImageUnscaled($ref,($i*320+16),28)
 $pg.DrawString($names[$i],$font,[Drawing.Brushes]::White,($i*320+16),6)
 $ref.Dispose()
}
$pg.Dispose();$font.Dispose();$pen.Dispose()
$preview.Save((Join-Path $PSScriptRoot 'battle-comparison-v1.png'),[Drawing.Imaging.ImageFormat]::Png)
$record=[ordered]@{Generator='built-in image_gen';Status='Draft for visual approval';SourceSize=@($source.Width,$source.Height);SourceBounds=@($left,$top,$right,$bottom);Canvas=@(288,288);Scale=$scale;Offset=@($ox,$oy);OutputBounds=$outBounds;VisibleHeight=($outBounds[3]-$outBounds[1]+1);SoleBaseline=268;TrueAlpha=$true;Output='img/enemies/StrawHatRonin-v1.png';AssignedEncounter=$false}
$record|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $PSScriptRoot 'battle-export-v1.json') -Encoding utf8
$record|ConvertTo-Json -Depth 4
$preview.Dispose();$sheet.Dispose();$source.Dispose()
