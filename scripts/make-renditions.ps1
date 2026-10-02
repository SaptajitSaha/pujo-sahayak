# Generate responsive renditions for the offline-first photo set in public/img.
#
# The masters are authored at 1024 px on the long edge (see ingest-photos.ps1)
# because they are the offline/PWA source of truth and are reused as full-bleed
# heroes on detail pages. But the SAME master is currently served to ~120-260 px
# rail/card thumbnails, which is 4-9x more pixels than those surfaces display —
# images alone were ~73% of the Home payload (docs/PERFORMANCE.md).
#
# This emits `@288` / `@480` / `@800` renditions next to every master (long
# edge, preserved aspect, high-quality bicubic downsample, q80). The <Img>
# primitive advertises them via srcset/sizes so a phone picks 288 for a square
# thumb, 480 for a card and only the large hero asks for 800/1024. A tier is
# skipped if the master is not larger than it (never upscale). Re-run any time
# new masters are ingested.
#
# Usage:  powershell -File scripts\make-renditions.ps1

param(
  [int[]]$Tiers = @(288, 480, 800),
  [long]$Quality = 80
)

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$root = Split-Path $PSScriptRoot -Parent
$dir = Join-Path $root 'public\img'

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $Quality)

function Save-Resized([string]$src, [string]$out, [int]$longEdge) {
  $bmp = New-Object System.Drawing.Bitmap($src)
  # NB: avoid [Math]::Min(1, <double>) — PowerShell binds it to the Int32
  # overload and truncates a sub-1 ratio (e.g. 0.47) to 0, collapsing to a 0x0
  # bitmap. Compute the ratio as a real double, then clamp with -gt.
  $scale = [double]$longEdge / [Math]::Max($bmp.Width, $bmp.Height)
  if ($scale -gt 1) { $scale = 1 }
  $w = [int]($bmp.Width * $scale); $h = [int]($bmp.Height * $scale)
  $dst = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($dst)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($bmp, 0, 0, $w, $h)
  $g.Dispose()
  $dst.Save($out, $codec, $ep)
  $dst.Dispose(); $bmp.Dispose()
}

$masters = Get-ChildItem $dir -File -Filter *.jpg | Where-Object { $_.Name -notmatch '@\d+\.jpg$' }
$made = 0
foreach ($m in $masters) {
  $img = New-Object System.Drawing.Bitmap($m.FullName)
  $longEdge = [Math]::Max($img.Width, $img.Height)
  $img.Dispose()
  foreach ($t in $Tiers) {
    if ($longEdge -le $t) { continue }  # never upscale
    $outPath = Join-Path $dir (($m.BaseName -replace '@\d+$','') + "@$t.jpg")
    Save-Resized $m.FullName $outPath $t | Out-Null
    $kb = [math]::Round((Get-Item $outPath).Length / 1KB)
    Write-Host ('  {0}  {1}KB' -f (Split-Path $outPath -Leaf), $kb)
    $made++
  }
}
Write-Host ("done - {0} renditions from {1} masters." -f $made, $masters.Count)
