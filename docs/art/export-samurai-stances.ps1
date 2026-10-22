param([string]$SourceDirectory = (Join-Path $PSScriptRoot 'samurai-npc/stances'), [switch]$ReplaceGenerated)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies @([Drawing.Bitmap].Assembly.Location, [Drawing.Color].Assembly.Location) -TypeDefinition @'
using System;
using System.Drawing;
public static class WwsStanceBounds {
    public static int[] Read(Bitmap b) {
        int left=b.Width,top=b.Height,right=-1,bottom=-1,transparent=0;
        for(int y=0;y<b.Height;y++) for(int x=0;x<b.Width;x++) {
            int alpha=b.GetPixel(x,y).A;
            if(alpha==0) transparent++;
            // Ignore near-invisible generation residue for ALIGNMENT only.
            // The export retains the original alpha; this is not a mask.
            if(alpha>=64) { left=Math.Min(left,x);right=Math.Max(right,x);top=Math.Min(top,y);bottom=Math.Max(bottom,y); }
        }
        int footLeft=b.Width,footRight=-1;
        for(int y=Math.Max(0,bottom-(bottom-top)*22/100);y<=bottom;y++) for(int x=left;x<=right;x++) {
            if(b.GetPixel(x,y).A>=64) { footLeft=Math.Min(footLeft,x);footRight=Math.Max(footRight,x); }
        }
        return new int[]{left,top,right,bottom,transparent,footLeft,footRight};
    }
}
'@
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$poses = @('Chudan','Jodan','Gedan','Kasumi','Waki')
$records = @()
$preview = [Drawing.Bitmap]::new(1440,288,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$previewGraphics = [Drawing.Graphics]::FromImage($preview)
$previewGraphics.Clear([Drawing.Color]::FromArgb(225,221,208))
foreach ($pose in $poses) {
    $sourcePath = Join-Path $SourceDirectory ($pose.ToLower()+'-source-v1.png')
    $outputPath = Join-Path $projectRoot ('img/enemies/SamuraiInstructor-'+$pose+'-v1.png')
    if ((Test-Path -LiteralPath $outputPath) -and !$ReplaceGenerated) { throw "Already exists: $outputPath. Use a new asset version." }
    $source = [Drawing.Bitmap]::new($sourcePath)
    $bounds=[WwsStanceBounds]::Read($source)
    $minX=$bounds[0]; $minY=$bounds[1]; $maxX=$bounds[2]; $maxY=$bounds[3]; $transparent=$bounds[4]
    if ($maxX -lt 0 -or $transparent -eq 0) { throw "$pose needs visible art and genuine alpha transparency." }
    # Preserve the complete generated figure. Native-size export uses nearest
    # neighbor only; never repaint, mask, or interpolate the generated pixels.
    $scale=288.0/$source.Width
    $offsetY=[int][Math]::Round(268-($maxY+1)*$scale)
    $lowerMinX=$bounds[5]; $lowerMaxX=$bounds[6]
    $anchorX=($lowerMinX+$lowerMaxX)/2
    $sideReach=[Math]::Max($anchorX-$minX,$maxX-$anchorX)
    $scale=[Math]::Min($scale,140.0/$sideReach)
    $scale=[Math]::Min($scale,264.0/($maxY-$minY+1))
    $offsetY=[int][Math]::Round(268-($maxY+1)*$scale)
    $offsetX=[int][Math]::Round(144-$anchorX*$scale)
    if (($minX*$scale+$offsetX) -lt 2 -or ($maxX*$scale+$offsetX) -gt 285 -or ($minY*$scale+$offsetY) -lt 2) {
        throw "$pose would clip after alignment; inspect and adjust its export before continuing."
    }
    $sprite=[Drawing.Bitmap]::new(288,288,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g=[Drawing.Graphics]::FromImage($sprite)
    $g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
    $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
    $g.DrawImage($source,[Drawing.Rectangle]::new($offsetX,$offsetY,[int][Math]::Round($source.Width*$scale),[int][Math]::Round($source.Height*$scale)),0,0,$source.Width,$source.Height,[Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $sprite.Save($outputPath,[Drawing.Imaging.ImageFormat]::Png)
    $previewGraphics.DrawImageUnscaled($sprite,($records.Count*288),0)
    $records += [pscustomobject]@{Pose=$pose; Source=@($source.Width,$source.Height); Bounds=@($minX,$minY,$maxX,$maxY); Offset=@($offsetX,$offsetY); Scale=$scale; FootBaseline=268; Output=('img/enemies/SamuraiInstructor-'+$pose+'-v1.png')}
    $sprite.Dispose(); $source.Dispose()
}
$previewGraphics.Dispose()
$preview.Save((Join-Path $SourceDirectory 'stance-preview-v1.png'),[Drawing.Imaging.ImageFormat]::Png)
$preview.Dispose()
$records | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $SourceDirectory 'export-v1.json') -Encoding UTF8
$records | ConvertTo-Json -Depth 4
