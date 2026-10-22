param([switch]$ReplaceGenerated)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies @([Drawing.Bitmap].Assembly.Location,[Drawing.Color].Assembly.Location) -TypeDefinition @'
using System;
using System.Drawing;
public static class WwsFormBounds {
    public static int[] Read(Bitmap b) {
        int l=b.Width,t=b.Height,r=-1,d=-1,transparent=0;
        for(int y=0;y<b.Height;y++) for(int x=0;x<b.Width;x++) {
            int a=b.GetPixel(x,y).A;if(a==0)transparent++;
            if(a>=64){l=Math.Min(l,x);t=Math.Min(t,y);r=Math.Max(r,x);d=Math.Max(d,y);}
        }
        int footL=b.Width,footR=-1;
        for(int y=Math.Max(0,d-(d-t)*15/100);y<=d;y++) for(int x=l;x<=r;x++) {
            Color c=b.GetPixel(x,y);
            // Locate warm-colored feet/sandals, excluding low steel blades and
            // gray hakama. This affects alignment only, never exported pixels.
            if(c.A>=64 && c.R>=70 && c.R>c.G*1.08 && c.G>c.B*1.12){footL=Math.Min(footL,x);footR=Math.Max(footR,x);}
        }
        if(footR<0){footL=l;footR=r;}
        return new int[]{l,t,r,d,transparent,footL,footR};
    }
}
'@
$root=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$art=Join-Path $PSScriptRoot 'main-character/forms'
$poses=@('Chudan','Jodan','Gedan','Kasumi','Waki')
$records=@()
$sheet=[Drawing.Bitmap]::new(2400,384,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$sg=[Drawing.Graphics]::FromImage($sheet);$sg.Clear([Drawing.Color]::FromArgb(225,221,208))
foreach($pose in $poses){
    $output=Join-Path $root ('img/battlers/Samurai-'+$pose+'Back-v2.png')
    if((Test-Path -LiteralPath $output) -and !$ReplaceGenerated){throw "Already exists: $output"}
    $sourcePath=if($pose -eq 'Chudan'){Join-Path $root 'img/battlers/Samurai-ChudanBack-v1.png'}else{Join-Path $art ($pose.ToLower()+'-source-v1.png')}
    $source=[Drawing.Bitmap]::new($sourcePath)
    $b=[WwsFormBounds]::Read($source)
    if($b[4] -eq 0 -or $b[2] -lt 0){throw "Expected visible art and true alpha for $pose"}
    $axis=($b[5]+$b[6])/2.0
    # Preserve the approved Chudan pixels exactly, adding transparent padding.
    # Jodan's reviewed hair starts at y=225 below its raised blade; use that
    # body anchor so the high guard does not shrink the figure to fit its sword.
    $bodyTop=if($pose -eq 'Jodan'){225}else{$b[1]}
    $height=if($pose -eq 'Kasumi'){260.0}else{280.0}
    $scale=if($pose -eq 'Chudan'){1.0}else{$height/($b[3]-$bodyTop+1)}
    $reach=[Math]::Max($axis-$b[0],$b[2]-$axis)
    $scale=[Math]::Min($scale,224.0/$reach)
    $scale=[Math]::Min($scale,352.0/($b[3]-$b[1]+1))
    $x=[int][Math]::Round(240-$axis*$scale)
    $y=[int][Math]::Round(368-($b[3]+1)*$scale)
    if(($b[0]*$scale+$x) -lt 8 -or ($b[2]*$scale+$x) -gt 472 -or ($b[1]*$scale+$y) -lt 8){throw "$pose would clip"}
    $sprite=[Drawing.Bitmap]::new(480,384,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g=[Drawing.Graphics]::FromImage($sprite);$g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
    $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor;$g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
    if($pose -eq 'Chudan'){$g.DrawImageUnscaled($source,$x,$y)}
    else{$g.DrawImage($source,[Drawing.Rectangle]::new($x,$y,[int][Math]::Round($source.Width*$scale),[int][Math]::Round($source.Height*$scale)),0,0,$source.Width,$source.Height,[Drawing.GraphicsUnit]::Pixel)}
    $g.Dispose();$sprite.Save($output,[Drawing.Imaging.ImageFormat]::Png)
    $sg.DrawImageUnscaled($sprite,($records.Count*480),0)
    $records += [pscustomobject]@{Pose=$pose;Source=$sourcePath;SourceSize=@($source.Width,$source.Height);VisibleBounds=$b[0..3];BodyTop=$bodyTop;FootAxis=$axis;Scale=$scale;Offset=@($x,$y);Canvas=@(480,384);FootBaseline=368;Output=('img/battlers/Samurai-'+$pose+'Back-v2.png')}
    $source.Dispose();$sprite.Dispose()
}
$sg.Dispose();$sheet.Save((Join-Path $art 'forms-preview-v2.png'),[Drawing.Imaging.ImageFormat]::Png);$sheet.Dispose()
$records | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $art 'export-v2.json') -Encoding UTF8
$records | ConvertTo-Json -Depth 4
