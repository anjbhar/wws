param([ValidateSet('v1','v2')][string]$MonkVersion='v2')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot=Split-Path $PSScriptRoot -Parent
$entries=@(
    @{Name='Masanori';File='img/enemies/SamuraiInstructor-Chudan-v1.png';Foot=268;Width=250},
    @{Name='Shinsengumi';File='img/enemies/Shinsengumi-Chudan-v2.png';Foot=268;Width=250},
    @{Name='Masked monk';File=('img/enemies/WarriorMonk-Masked-'+$MonkVersion+'.png');Foot=368;Width=250},
    @{Name='Unmasked monk';File=('img/enemies/WarriorMonk-Unmasked-'+$MonkVersion+'.png');Foot=368;Width=250},
    @{Name='Player (foreground)';File='img/battlers/Samurai-ChudanBack-v2.png';Foot=368;Width=480}
)
$canvas=[Drawing.Bitmap]::new(1520,440,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g=[Drawing.Graphics]::FromImage($canvas)
$g.Clear([Drawing.Color]::FromArgb(222,219,208))
$font=[Drawing.Font]::new('Arial',15,[Drawing.FontStyle]::Bold)
$small=[Drawing.Font]::new('Arial',10)
$brush=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(43,43,45))
$pen=[Drawing.Pen]::new([Drawing.Color]::FromArgb(164,160,150),1)
$format=[Drawing.StringFormat]::new();$format.Alignment=[Drawing.StringAlignment]::Center
$x=20
foreach($entry in $entries){
    $source=[Drawing.Bitmap]::new((Join-Path $projectRoot $entry.File))
    $g.DrawString($entry.Name,$font,$brush,[Drawing.RectangleF]::new($x,12,$entry.Width,27),$format)
    $g.DrawLine($pen,$x,380,($x+$entry.Width),380)
    # Keep every source pixel at native 1x; only align canvas soles to one line.
    $offsetX=[int]($x+($entry.Width-$source.Width)/2)
    $offsetY=380-$entry.Foot
    $g.DrawImageUnscaled($source,$offsetX,$offsetY)
    $g.DrawString(($source.Width.ToString()+' x '+$source.Height.ToString()+' canvas'),$small,$brush,[Drawing.RectangleF]::new($x,398,$entry.Width,21),$format)
    $x+=$entry.Width
    $source.Dispose()
}
$relativeOutput=if($MonkVersion -eq 'v2'){'docs/art/warrior-monks/style-v2/battle-comparison.png'}else{'docs/art/battle-sprite-comparison.png'}
$output=Join-Path $projectRoot $relativeOutput
$g.Dispose();$font.Dispose();$small.Dispose();$brush.Dispose();$pen.Dispose();$format.Dispose()
$canvas.Save($output,[Drawing.Imaging.ImageFormat]::Png);$canvas.Dispose()
Write-Output $output
