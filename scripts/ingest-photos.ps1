# Ingest AI-generated sample photos into public/img.
#
# The project ships every image as a local, offline-first JPEG (no remote CDNs)
# at 1024px on the long edge — the same convention as the pandal/food/offer set.
# ImageGen hands back a ~1MB PNG in a scratch folder; this flattens it onto
# white, downsamples to that budget, recompresses, and strips the timestamp
# suffix so `dish-kosha-mangsho_1790834973.png` becomes `dish-kosha-mangsho.jpg`.
#
# Usage:  powershell -File scripts\ingest-photos.ps1 [-Filter '^(dish|shop)-']

param(
  [string]$Source = (Join-Path $env:USERPROFILE '.qoder\vibe_images'),
  [string]$Filter = '.*',
  [int]$MaxEdge = 1024,
  [long]$Quality = 82
)

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$root = Split-Path $PSScriptRoot -Parent
$dest = Join-Path $root 'public\img'
if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $Quality)

foreach ($file in (Get-ChildItem $Source -File | Where-Object { $_.Name -match $Filter })) {
  $leaf = ($file.BaseName -replace '_\d+$', '') + '.jpg'
  $outPath = Join-Path $dest $leaf

  $bmp = New-Object System.Drawing.Bitmap($file.FullName)
  $scale = [Math]::Min(1, $MaxEdge / [Math]::Max($bmp.Width, $bmp.Height))
  $w = [int]($bmp.Width * $scale); $h = [int]($bmp.Height * $scale)

  $flat = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($flat)
  $g.Clear([System.Drawing.Color]::White)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($bmp, 0, 0, $w, $h)
  $g.Dispose()

  $flat.Save($outPath, $codec, $ep)
  $flat.Dispose(); $bmp.Dispose()

  Write-Host ('  {0}  {1}x{2}  {3}KB' -f $leaf, $w, $h, [math]::Round((Get-Item $outPath).Length / 1KB))
}
Write-Host 'done.'
