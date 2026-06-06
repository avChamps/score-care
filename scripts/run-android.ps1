$sdkPath = "C:\Android\Sdk"

if (-not (Test-Path $sdkPath)) {
  Write-Error "Android SDK not found at $sdkPath. Install Android SDK or update scripts/run-android.ps1 with the correct path."
  exit 1
}

$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath

$sdkPathItems = @(
  "$sdkPath\platform-tools",
  "$sdkPath\emulator",
  "$sdkPath\cmdline-tools\latest\bin"
)

$env:Path = ($sdkPathItems -join ";") + ";" + $env:Path

npx cap run android @args
exit $LASTEXITCODE
