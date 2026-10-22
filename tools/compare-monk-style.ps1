$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path $PSScriptRoot -Parent
$entries=@(
 @{Name='Masanori reference';File='img/enemies/SamuraiInstructor-Chudan-v1.png';Foot=268},
 @{Name='Shinsengumi reference';File='img/enemies/Shinsengumi-Chudan-v2.png';Foot=268},
 @{Name='Previous monk';File='img/enemies/WarriorMonk-Unmasked-v1.png';Foot=368},
 @{Name='Reworked monk';File='img/enemies/WarriorMonk-Unmasked-v2.png';Foot=368}
)
$canvas=[Drawing.Bitmap]::new(1192,440,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g=[Drawing.Graphics]::FromImage($canvas);$g.Clear([Drawing.Color]::FromArgb(222,219,208))
$font=[Drawing.Font]::new('Arial',14,[Drawing.FontStyle]::Bold)
$brush=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(43,43,45))
$pen=[Drawing.Pen]::new([Drawing.Color]::FromArgb(164,160,150),1)
$format=[Drawing.StringFormat]::new();$format.Alignment=[Drawing.StringAlignment]::Center
$x=20
foreach($entry in $entries){
 $source=[Drawing.Bitmap]::new((Join-Path $root $entry.File))
 $g.DrawString($entry.Name,$font,$brush,[Drawing.RectangleF]::new($x,12,288,25),$format)
 $g.DrawLine($pen,$x,400,($x+288),400)
 $g.DrawImageUnscaled($source,$x,(400-$entry.Foot));$source.Dispose();$x+=288
}
$g.Dispose();$font.Dispose();$brush.Dispose();$pen.Dispose();$format.Dispose()
$canvas.Save((Join-Path $root 'docs/art/warrior-monks/style-v2/unmasked-comparison.png'),[Drawing.Imaging.ImageFormat]::Png)
$canvas.Dispose()
