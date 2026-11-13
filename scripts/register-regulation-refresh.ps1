param(
    [string]$Config = (Join-Path $PSScriptRoot '../config/regulation-refresh.local.json'),
    [string]$TaskName = 'LH-Regulations-Nightly'
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$configPath = [IO.Path]::GetFullPath($Config)
$settings = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($settings.timezone -ne 'Asia/Seoul' -or (Get-TimeZone).Id -ne 'Korea Standard Time') {
    throw 'This task requires Asia/Seoul and Windows Korea Standard Time.'
}
if ($settings.time -notmatch '^([01][0-9]|2[0-3]):[0-5][0-9]$') { throw 'time must be HH:mm' }
if ($settings.intervalDays -lt 1 -or $settings.intervalDays -gt 365 -or $settings.intervalDays -ne [int]$settings.intervalDays) {
    throw 'intervalDays must be an integer from 1 to 365'
}
foreach ($path in @($settings.pythonExecutable, $settings.nodeExecutable, $settings.artifactNodeModules)) {
    if (-not $path -or -not (Test-Path -LiteralPath $path)) { throw "Runtime missing: $path" }
}
$template = [IO.Path]::GetFullPath((Join-Path $root $settings.workbook))
if (-not (Test-Path -LiteralPath $template)) { throw "Workbook missing: $template" }
$output = [IO.Path]::GetFullPath((Join-Path $root $settings.outputDirectory))
$runtime = Join-Path $output 'runtime'
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
$pythonModules = Join-Path $runtime 'pydeps'
& $settings.pythonExecutable -m pip install --target $pythonModules -r (Join-Path $PSScriptRoot 'requirements-regulation-refresh.txt') --disable-pip-version-check
if ($LASTEXITCODE -ne 0) { throw 'Cannot install collector dependencies' }
$modules = Join-Path $runtime 'node_modules'
if (-not (Test-Path -LiteralPath $modules)) {
    New-Item -ItemType Junction -Path $modules -Target $settings.artifactNodeModules | Out-Null
}
$installedScripts = Join-Path $runtime 'scripts'
New-Item -ItemType Directory -Path $installedScripts -Force | Out-Null
foreach ($name in @('run-regulation-refresh.ps1', 'refresh-regulations.py', 'build-regulation-refresh.mjs')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination (Join-Path $installedScripts $name) -Force
}
$runner = Join-Path $installedScripts 'run-regulation-refresh.ps1'
$action = New-ScheduledTaskAction -Execute "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$runner`" -Config `"$configPath`" -RepositoryRoot `"$root`"" -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -Daily -DaysInterval $settings.intervalDays -At $settings.time
$options = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 6) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
$task = New-ScheduledTask -Action $action -Trigger $trigger -Settings $options -Principal $principal -Description 'LH public notices and guideline PDFs to local Excel. Reviewed regulation values remain unchanged.'
Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null
if (-not $settings.enabled) { Disable-ScheduledTask -TaskName $TaskName | Out-Null }
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State
Get-ScheduledTaskInfo -TaskName $TaskName | Select-Object NextRunTime, LastTaskResult
