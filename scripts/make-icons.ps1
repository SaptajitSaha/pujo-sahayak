Add-Type -AssemblyName System.Drawing
# NOTE: after this runs, execute scripts/icons-to-jpeg.ps1 to shrink the three
# manifest icons (pwa-192/512, maskable-512) from PNG to JPEG, which the webmanifest
# references as .jpg. Android mipmaps stay PNG. apple-touch-icon stays PNG (iOS).
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$srcPath = Join-Path $PSScriptRoot 'app-icon-source.png'
$src = [System.Drawing.Image]::FromFile($srcPath)

function New-Square([int]$size, [double]$frac) {
  # $frac = 1.0 fills the canvas; <1.0 centers the logo with transparent padding.
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $inner = [int][Math]::Round($size * $frac)
  $off = [int](($size - $inner) / 2)
  $rect = New-Object System.Drawing.Rectangle($off, $off, $inner, $inner)
  $g.DrawImage($src, $rect)
  $g.Dispose()
  return $bmp
}

function Save-Png($bmp, $path) {
  $dir = Split-Path $path -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host ("  wrote {0} ({1} bytes)" -f $path.Substring($root.Length + 1), (Get-Item $path).Length)
}

Write-Host 'PWA / favicon icons (full-bleed, white bg) ...'
Save-Png (New-Square 192 1.0) (Join-Path $root 'public\pwa-192x192.png')
Save-Png (New-Square 512 1.0) (Join-Path $root 'public\pwa-512x512.png')
# Maskable: launcher crops this to a circle/squircle, so the logo must sit in
# the ~80% safe zone on a solid field (icons-to-jpeg flattens the pad to white).
Save-Png (New-Square 512 0.80) (Join-Path $root 'public\maskable-icon-512x512.png')
Save-Png (New-Square 64  1.0) (Join-Path $root 'public\favicon.png')
Save-Png (New-Square 180 1.0) (Join-Path $root 'public\apple-touch-icon.png')

Write-Host 'Android launcher + round icons (legacy, pre-API26) ...'
$dens = @{ 'mdpi'=48; 'hdpi'=72; 'xhdpi'=96; 'xxhdpi'=144; 'xxxhdpi'=192 }
foreach ($d in $dens.Keys) {
  $px = $dens[$d]
  $mm = Join-Path $root "android\app\src\main\res\mipmap-$d"
  Save-Png (New-Square $px 1.0) (Join-Path $mm 'ic_launcher.png')
  Save-Png (New-Square $px 1.0) (Join-Path $mm 'ic_launcher_round.png')
}

Write-Host 'Android adaptive foreground (logo in ~70% safe zone, transparent pad) ...'
$fg = @{ 'mdpi'=108; 'hdpi'=162; 'xhdpi'=216; 'xxhdpi'=324; 'xxxhdpi'=432 }
foreach ($d in $fg.Keys) {
  $px = $fg[$d]
  $mm = Join-Path $root "android\app\src\main\res\mipmap-$d"
  Save-Png (New-Square $px 0.70) (Join-Path $mm 'ic_launcher_foreground.png')
}

$src.Dispose()
Write-Host 'done.'
