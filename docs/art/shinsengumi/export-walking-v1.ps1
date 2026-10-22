param([switch]$ReplaceGenerated)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies @([Drawing.Bitmap].Assembly.Location,[Drawing.Color].Assembly.Location) -TypeDefinition @'
using System;
using System.Drawing;
public static class ShinsengumiWalking {
  public static int[] Rows(Bitmap b) {
    int[] edges=new int[8]; int count=0;
    bool active=false; int start=0,last=0;
    for(int y=0;y<b.Height;y++) {
      int n=0; for(int x=0;x<b.Width;x++) if(b.GetPixel(x,y).A>=64)n++;
      if(n>2) {if(!active){start=y;active=true;}last=y;}
      else if(active && y-last>12) {if(count>=8)throw new Exception("Too many rows");edges[count++]=start;edges[count++]=last+1;active=false;}
    }
    if(active){if(count>=8)throw new Exception("Too many rows");edges[count++]=start;edges[count++]=last+1;}
    if(count!=8)throw new Exception("Expected four separated sprite rows; got "+count/2);
    return edges;
  }
  public static int[] Bounds(Bitmap b, int x0,int y0,int x1,int y1) {
    int l=x1,t=y1,r=-1,d=-1;
    for(int y=y0;y<y1;y++) for(int x=x0;x<x1;x++) if(b.GetPixel(x,y).A>=64) {
      l=Math.Min(l,x);t=Math.Min(t,y);r=Math.Max(r,x);d=Math.Max(d,y);
    }
    if(r<0) throw new Exception("Empty walking frame");
    return new int[]{l,t,r,d};
  }
  public static int Transparent(Bitmap b) {
    int n=0; for(int y=0;y<b.Height;y++) for(int x=0;x<b.Width;x++) if(b.GetPixel(x,y).A==0)n++;
    return n;
  }
}
'@
$source=[Drawing.Bitmap]::new((Join-Path $PSScriptRoot 'walking-source-v1.png'))
$rowEdges=[ShinsengumiWalking]::Rows($source)
$frames=@(); $scale=[double]::MaxValue
for($row=0;$row -lt 4;$row++) {for($col=0;$col -lt 3;$col++) {
  $x0=[int][Math]::Round($col*$source.Width/3.0); $x1=[int][Math]::Round(($col+1)*$source.Width/3.0)
  $y0=$rowEdges[$row*2]; $y1=$rowEdges[$row*2+1]
  $b=[ShinsengumiWalking]::Bounds($source,$x0,$y0,$x1,$y1)
  $scale=[Math]::Min($scale,[Math]::Min(44.0/($b[2]-$b[0]+1),62.0/($b[3]-$b[1]+1)))
  $frames+=,[pscustomobject]@{Row=$row;Column=$col;Cell=@($x0,$y0,$x1,$y1);Bounds=$b}
}}
$sheet=[Drawing.Bitmap]::new(144,288,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g=[Drawing.Graphics]::FromImage($sheet)
$g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
$g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
foreach($frame in $frames) {
  $b=$frame.Bounds
  $feet=[ShinsengumiWalking]::Bounds($source,$b[0],[int]($b[1]+($b[3]-$b[1])*0.82),($b[2]+1),($b[3]+1))
  $anchor=($feet[0]+$feet[2]+1)/2.0
  $w=[int][Math]::Round(($b[2]-$b[0]+1)*$scale); $h=[int][Math]::Round(($b[3]-$b[1]+1)*$scale)
  $localX=[int][Math]::Round(24-($anchor-$b[0])*$scale)
  $localX=[Math]::Max(1,[Math]::Min(47-$w,$localX))
  $dx=$frame.Column*48+$localX; $dy=$frame.Row*72+68-$h
  $g.DrawImage($source,[Drawing.Rectangle]::new($dx,$dy,$w,$h),$b[0],$b[1],($b[2]-$b[0]+1),($b[3]-$b[1]+1),[Drawing.GraphicsUnit]::Pixel)
  $frame | Add-Member -NotePropertyName Destination -NotePropertyValue @($dx,$dy,$w,$h)
}
$g.Dispose()
$output=Join-Path $PSScriptRoot '../../../img/characters/$Shinsengumi-v1.png'
if((Test-Path -LiteralPath $output) -and !$ReplaceGenerated) {throw 'Export exists; choose a new version or explicitly replace this generated draft.'}
$sheet.Save($output,[Drawing.Imaging.ImageFormat]::Png)
$preview=[Drawing.Bitmap]::new(576,1152,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$pg=[Drawing.Graphics]::FromImage($preview)
$pg.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$pg.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
$pg.DrawImage($sheet,[Drawing.Rectangle]::new(0,0,576,1152),0,0,144,288,[Drawing.GraphicsUnit]::Pixel)
$pg.Dispose(); $preview.Save((Join-Path $PSScriptRoot 'walking-preview-v1.png'),[Drawing.Imaging.ImageFormat]::Png)
$transparent=[ShinsengumiWalking]::Transparent($sheet)
if($transparent -eq 0) {throw 'Missing alpha transparency'}
$record=[ordered]@{Generator='built-in image_gen';SourceSize=@($source.Width,$source.Height);Canvas=@(144,288);FrameSize=@(48,72);Rows=@('Down','Left','Right','Up');Columns=@('Walk A','Stand','Walk B');FootBaseline=68;Scale=$scale;TransparentPixels=$transparent;Frames=$frames;Output='img/characters/$Shinsengumi-v1.png';Status='Export verified; not assigned to actor or map event'}
$record | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'walking-export-v1.json') -Encoding utf8
$sheet.Dispose();$source.Dispose();$preview.Dispose()
Write-Output 'Exported transparent 144x288 sheet, 12 aligned 48x72 frames, plus 4x nearest-neighbor preview.'
