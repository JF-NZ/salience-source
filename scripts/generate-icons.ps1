$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $repoRoot 'resources\icon.png'
$resRoot = Join-Path $repoRoot 'android\app\src\main\res'
$backgroundColor = [System.Drawing.Color]::FromArgb(255, 7, 26, 55)

function Get-ContentCrop {
  param([System.Drawing.Bitmap]$Bitmap)

  $minX = $Bitmap.Width
  $minY = $Bitmap.Height
  $maxX = 0
  $maxY = 0

  for ($y = 0; $y -lt $Bitmap.Height; $y++) {
    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      $pixel = $Bitmap.GetPixel($x, $y)
      if (($pixel.R -lt 245) -or ($pixel.G -lt 245) -or ($pixel.B -lt 245)) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  $contentWidth = $maxX - $minX + 1
  $contentHeight = $maxY - $minY + 1
  $side = [Math]::Min($Bitmap.Width, [Math]::Min($Bitmap.Height, [Math]::Max($contentWidth, $contentHeight)))
  $centerX = ($minX + $maxX) / 2
  $centerY = ($minY + $maxY) / 2
  $left = [Math]::Max(0, [Math]::Min($Bitmap.Width - $side, [Math]::Round($centerX - ($side / 2))))
  $top = [Math]::Max(0, [Math]::Min($Bitmap.Height - $side, [Math]::Round($centerY - ($side / 2))))

  [System.Drawing.Rectangle]::new([int]$left, [int]$top, [int]$side, [int]$side)
}

function New-IconBitmap {
  param(
    [System.Drawing.Bitmap]$Source,
    [System.Drawing.Rectangle]$Crop,
    [int]$Size
  )

  $dest = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($dest)
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.DrawImage($Source, [System.Drawing.Rectangle]::new(0, 0, $Size, $Size), $Crop, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.Dispose()

  for ($y = 0; $y -lt $dest.Height; $y++) {
    for ($x = 0; $x -lt $dest.Width; $x++) {
      $pixel = $dest.GetPixel($x, $y)
      if (($pixel.R -gt 248) -and ($pixel.G -gt 248) -and ($pixel.B -gt 248)) {
        $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $pixel.R, $pixel.G, $pixel.B))
      }
    }
  }

  $dest
}

function New-BackgroundBitmap {
  param([int]$Size)

  $dest = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($dest)
  $graphics.Clear($backgroundColor)
  $graphics.Dispose()
  $dest
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $Bitmap.Dispose()
}

$legacySizes = @{
  'mipmap-ldpi' = 36
  'mipmap-mdpi' = 48
  'mipmap-hdpi' = 72
  'mipmap-xhdpi' = 96
  'mipmap-xxhdpi' = 144
  'mipmap-xxxhdpi' = 192
}

$foregroundSizes = @{
  'mipmap-ldpi' = 81
  'mipmap-mdpi' = 108
  'mipmap-hdpi' = 162
  'mipmap-xhdpi' = 216
  'mipmap-xxhdpi' = 324
  'mipmap-xxxhdpi' = 432
}

$source = [System.Drawing.Bitmap]::FromFile($sourcePath)
try {
  $crop = Get-ContentCrop -Bitmap $source

  foreach ($density in $legacySizes.Keys) {
    $dir = Join-Path $resRoot $density
    Save-Png -Bitmap (New-IconBitmap -Source $source -Crop $crop -Size $legacySizes[$density]) -Path (Join-Path $dir 'ic_launcher.png')
    Save-Png -Bitmap (New-IconBitmap -Source $source -Crop $crop -Size $legacySizes[$density]) -Path (Join-Path $dir 'ic_launcher_round.png')
  }

  foreach ($density in $foregroundSizes.Keys) {
    $dir = Join-Path $resRoot $density
    Save-Png -Bitmap (New-IconBitmap -Source $source -Crop $crop -Size $foregroundSizes[$density]) -Path (Join-Path $dir 'ic_launcher_foreground.png')
    Save-Png -Bitmap (New-BackgroundBitmap -Size $foregroundSizes[$density]) -Path (Join-Path $dir 'ic_launcher_background.png')
  }

  Write-Host "Launcher icons regenerated from $sourcePath"
}
finally {
  $source.Dispose()
}
