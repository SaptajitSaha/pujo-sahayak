Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)

function To-Jpeg($pngPath) {
  $jpgPath = [System.IO.Path]::ChangeExtension($pngPath, '.jpg')
  $bmp = New-Object System.Drawing.Bitmap($pngPath)
  # Flatten onto white so any transparent padding reads correctly as JPEG.
  $flat = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height)
  $g = [System.Drawing.Graphics]::FromImage($flat)
  $g.Clear([System.Drawing.Color]::White)
  $g.DrawImage($bmp, 0, 0, $bmp.Width, $bmp.Height)
  $g.Dispose()
  $flat.Save($jpgPath, $codec, $ep)
  $flat.Dispose(); $bmp.Dispose()
  Remove-Item $pngPath -Force
  Write-Host ("  {0} ({1} bytes)" -f (Split-Path $jpgPath -Leaf), (Get-Item $jpgPath).Length)
}

# Manifest icons may be JPEG; apple-touch-icon stays PNG (iOS requires it).
foreach ($f in @('public\pwa-512x512.png', 'public\maskable-icon-512x512.png', 'public\pwa-192x192.png')) {
  To-Jpeg (Join-Path $root $f)
}
Write-Host 'done.'
