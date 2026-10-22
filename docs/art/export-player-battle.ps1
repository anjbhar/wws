param([Parameter(Mandatory=$true)][string]$SourcePath)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies @([Drawing.Bitmap].Assembly.Location,[Drawing.Color].Assembly.Location) -TypeDefinition @'
using System;
using System.Drawing;
public static class WwsPlayerBounds {
    public static int[] Read(Bitmap b) {
        int left=b.Width,top=b.Height,right=-1,bottom=-1,transparent=0;
        for(int y=0;y<b.Height;y++) for(int x=0;x<b.Width;x++) {
            int a=b.GetPixel(x,y).A;
            if(a==0) transparent++;
            // Bounds ignore faint background residue; exported alpha is unchanged.
            if(a>=64) {left=Math.Min(left,x);top=Math.Min(top,y);right=Math.Max(right,x);bottom=Math.Max(bottom,y);}
        }
        return new int[]{left,top,right,bottom,transparent};
    }
}
'@
$root=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$art=Join-Path $PSScriptRoot 'main-character'
$output=Join-Path $root 'img/battlers/Samurai-ChudanBack-v1.png'
if(Test-Path -LiteralPath $output){throw 'Player battle sprite v1 already exists; use a new version.'}
New-Item -ItemType Directory -Force -Path (Split-Path $output -Parent) | Out-Null
Copy-Item -LiteralPath $SourcePath -Destination (Join-Path $art 'battle-chudan-source-v1.png')
$source=[Drawing.Bitmap]::new($SourcePath)
$bounds=[WwsPlayerBounds]::Read($source)
if($bounds[4] -eq 0 -or $bounds[2] -lt 0){throw 'Expected genuine alpha and visible artwork.'}
$scale=[Math]::Min(280.0/($bounds[3]-$bounds[1]+1),300.0/($bounds[2]-$bounds[0]+1))
$x=[int][Math]::Round(160-(($bounds[0]+$bounds[2])/2)*$scale)
$y=[int][Math]::Round(304-($bounds[3]+1)*$scale)
$sprite=[Drawing.Bitmap]::new(320,320,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g=[Drawing.Graphics]::FromImage($sprite)
$g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
$g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
$g.DrawImage($source,[Drawing.Rectangle]::new($x,$y,[int][Math]::Round($source.Width*$scale),[int][Math]::Round($source.Height*$scale)),0,0,$source.Width,$source.Height,[Drawing.GraphicsUnit]::Pixel)
$g.Dispose();$sprite.Save($output,[Drawing.Imaging.ImageFormat]::Png)
$record=[pscustomobject]@{Source=@($source.Width,$source.Height);VisibleBounds=$bounds[0..3];Canvas=@(320,320);Scale=$scale;Offset=@($x,$y);FootBaseline=304;Output='img/battlers/Samurai-ChudanBack-v1.png';Generator='Built-in image_gen'}
$record | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $art 'battle-chudan-export-v1.json') -Encoding UTF8
$sprite.Dispose();$source.Dispose();$record | ConvertTo-Json -Depth 3
