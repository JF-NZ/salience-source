$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$jdkHome = $env:JAVA_HOME
$androidHome = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { $env:ANDROID_SDK_ROOT }

if ([string]::IsNullOrWhiteSpace($jdkHome) -or -not (Test-Path (Join-Path $jdkHome 'bin\java.exe'))) {
  throw 'Set JAVA_HOME to a JDK 21 installation before building the Android app.'
}

if ([string]::IsNullOrWhiteSpace($androidHome) -or -not (Test-Path $androidHome)) {
  throw 'Set ANDROID_HOME or ANDROID_SDK_ROOT to an Android SDK installation.'
}

$env:JAVA_HOME = $jdkHome
$env:ANDROID_HOME = $androidHome
$env:ANDROID_SDK_ROOT = $androidHome
$env:Path = "$jdkHome\bin;$androidHome\platform-tools;$env:Path"

Push-Location $repoRoot
try {
  npm run android:sync
  Push-Location (Join-Path $repoRoot 'android')
  try {
    .\gradlew.bat assembleDebug
  }
  finally {
    Pop-Location
  }
}
finally {
  Pop-Location
}

$apk = Join-Path $repoRoot 'android\app\build\outputs\apk\debug\app-debug.apk'
if (Test-Path $apk) {
  Write-Host "Debug APK ready: $apk"
}
