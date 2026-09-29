# Composites raw phone screenshots into an iPhone-style mockup (transparent PNG).
# Dependency-free: uses .NET System.Drawing (GDI+) available on Windows.
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$raw = Join-Path $PSScriptRoot 'assets\screens\raw'
$out = Join-Path $PSScriptRoot 'assets\screens'
New-Item -ItemType Directory -Force -Path $out | Out-Null

function New-RoundedRect([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

# Frame geometry (device pixels). Screens are 780x1688 (@2x of 390x844).
$bezel = 30
$radiusBody = 122
$radiusScreen = 96
$pad = 26               # transparent margin around the body (room for buttons)

function Make-Phone([string]$src, [string]$dst) {
  $img = [System.Drawing.Image]::FromFile($src)
  $sw = $img.Width; $sh = $img.Height
  $bodyW = $sw + 2 * $bezel; $bodyH = $sh + 2 * $bezel
  $canvasW = $bodyW + 2 * $pad; $canvasH = $bodyH + 2 * $pad

  $bmp = New-Object System.Drawing.Bitmap($canvasW, $canvasH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  # side buttons (drawn first, tucked just outside the body edges)
  $btnMat = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 26, 26, 30))
  $btnR = 6
  # left: silent + volume up + volume down
  foreach ($by in @(150, 300, 400)) {
    $gp = New-RoundedRect ($pad - 5) ($pad + $by) 8 120 $btnR; $g.FillPath($btnMat, $gp); $gp.Dispose()
  }
  # right: power
  $gp = New-RoundedRect ($pad + $bodyW - 3) ($pad + 320) 8 170 $btnR; $g.FillPath($btnMat, $gp); $gp.Dispose()

  # body (titanium-ish dark) with a subtle metallic rim
  $bodyRect = New-Object System.Drawing.RectangleF ([single]$pad, [single]$pad, [single]$bodyW, [single]$bodyH)
  $bodyPath = New-RoundedRect $pad $pad $bodyW $bodyH $radiusBody
  $rim = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 92, 92, 100)), 3
  $g.FillRectangle([System.Drawing.Brushes]::Black, $bodyRect)
  $g.FillPath([System.Drawing.Brushes]::Black, $bodyPath)
  $g.DrawPath($rim, $bodyPath)

  # screen: clip to rounded rect, paint the screenshot
  $sx = $pad + $bezel; $sy = $pad + $bezel
  $screenPath = New-RoundedRect $sx $sy $sw $sh $radiusScreen
  $g.SetClip($screenPath)
  $destRect = New-Object System.Drawing.Rectangle ([int]$sx, [int]$sy, [int]$sw, [int]$sh)
  $g.DrawImage($img, $destRect)

  # Dynamic Island
  $g.ResetClip()
  $islW = 250; $islH = 74; $islX = $sx + ($sw - $islW) / 2; $islY = $sy + 22
  $islPath = New-RoundedRect $islX $islY $islW $islH 37
  $g.FillPath([System.Drawing.Brushes]::Black, $islPath)
  # tiny camera dot
  $g.FillEllipse([System.Drawing.Brushes]::Black, ($islX + $islW - 58), ($islY + $islH/2 - 11), 22, 22)

  # thin inner screen bezel highlight
  $innerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(60, 255, 255, 255)), 2
  $g.DrawPath($innerPen, $screenPath)

  $g.Dispose()
  $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose(); $img.Dispose()
  Write-Output ("phone {0,-16} {1} KB" -f (Split-Path $dst -Leaf), [math]::Round((Get-Item $dst).Length/1KB))
}

foreach ($f in Get-ChildItem (Join-Path $raw '*.png')) {
  $name = $f.BaseName
  if ($name -eq 'maya') { continue }   # blank capture, skip
  Make-Phone $f.FullName (Join-Path $out "phone-$name.png")
}
