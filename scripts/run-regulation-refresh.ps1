param(
    [string]$Config = (Join-Path $PSScriptRoot '../config/regulation-refresh.local.json'),
    [string]$RepositoryRoot = (Split-Path $PSScriptRoot -Parent)
)
$ErrorActionPreference = 'Stop'
$root = $RepositoryRoot
$env:LH_REGULATION_REPO = $root
$configPath = [IO.Path]::GetFullPath($Config)
$settings = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
$output = [IO.Path]::GetFullPath((Join-Path $root $settings.outputDirectory))
New-Item -ItemType Directory -Path $output -Force | Out-Null
# Also protects manual runs from overlapping with scheduled runs. OS releases the lock on process exit.
$lock = $null
try {
    $lock = [IO.File]::Open((Join-Path $output 'refresh.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
    $env:PYTHONUTF8 = '1'
    $log = Join-Path $output ('refresh-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')
    & $settings.pythonExecutable (Join-Path $PSScriptRoot 'refresh-regulations.py') --config $configPath *> $log
    if ($LASTEXITCODE -ne 0) { throw "Regulation refresh failed. See $log" }
} finally {
    if ($lock) { $lock.Dispose() }
}
