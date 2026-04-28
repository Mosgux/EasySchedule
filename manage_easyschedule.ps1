param(
    [ValidateSet('start', 'stop', 'status', 'restart')]
    [string]$Action = 'status',

    [ValidateSet('dev', 'server')]
    [string]$Profile = 'dev'
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$runtimeDir = Join-Path $repoRoot 'logs/runtime'
$stateFile = Join-Path $runtimeDir ("{0}_state.json" -f $Profile)

$backendDir = Join-Path $repoRoot 'backend'
$frontendDir = Join-Path $repoRoot 'frontend'
$nginxDir = Join-Path $repoRoot 'nginx'

$backendLog = Join-Path $runtimeDir ("{0}_backend.log" -f $Profile)
$frontendLog = Join-Path $runtimeDir ("{0}_frontend.log" -f $Profile)

function Write-Info {
    param([string]$Message)

    Write-Host $Message -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)

    Write-Host $Message -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)

    Write-Host $Message -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Message)

    Write-Host $Message -ForegroundColor Red
}

function Ensure-RuntimeDir {
    if (-not (Test-Path $runtimeDir)) {
        New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
    }
}

function Ensure-PathExists {
    param(
        [string]$Path,
        [string]$Name
    )

    if (-not (Test-Path $Path)) {
        throw "$Name not found: $Path"
    }
}

function Ensure-Node {
    try {
        $nodeVersion = node -v
        Write-Ok ("Node.js detected: {0}" -f $nodeVersion)
    } catch {
        throw 'Node.js is required. Install Node.js 18.19.0 or newer.'
    }
}

function Get-NginxExecutable {
    $candidates = @(
        (Join-Path $nginxDir 'nginx.exe'),
        'C:\nginx\nginx.exe'
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    throw 'nginx.exe not found. Put it in nginx/nginx.exe or C:\nginx\nginx.exe.'
}

function Get-NginxConfig {
    $candidates = @(
        (Join-Path $nginxDir 'neemo-easyschedule.conf'),
        (Join-Path $nginxDir 'easyschedule.conf')
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    throw 'No nginx config found in the nginx directory.'
}

function Get-State {
    if (-not (Test-Path $stateFile)) {
        return $null
    }

    return Get-Content -Path $stateFile -Raw | ConvertFrom-Json
}

function Save-State {
    param([array]$Processes)

    Ensure-RuntimeDir

    $state = [ordered]@{
        profile = $Profile
        updated_at = (Get-Date).ToString('o')
        processes = @($Processes)
    }

    $json = $state | ConvertTo-Json -Depth 5
    Set-Content -Path $stateFile -Value $json -Encoding UTF8
}

function Remove-State {
    if (Test-Path $stateFile) {
        Remove-Item -Path $stateFile -Force
    }
}

function Get-TrackedProcessStatus {
    param([object]$TrackedProcess)

    $process = Get-Process -Id $TrackedProcess.pid -ErrorAction SilentlyContinue

    [PSCustomObject]@{
        name = $TrackedProcess.name
        pid = $TrackedProcess.pid
        alive = $null -ne $process
        log_path = $TrackedProcess.log_path
    }
}

function Stop-TrackedProcess {
    param([object]$TrackedProcess)

    $process = Get-Process -Id $TrackedProcess.pid -ErrorAction SilentlyContinue
    if ($null -eq $process) {
        Write-Warn ("{0} already stopped (pid {1})." -f $TrackedProcess.name, $TrackedProcess.pid)
        return
    }

    Write-Info ("Stopping {0} (pid {1})..." -f $TrackedProcess.name, $TrackedProcess.pid)
    & taskkill /pid $TrackedProcess.pid /t /f | Out-Null
    Write-Ok ("Stopped {0}." -f $TrackedProcess.name)
}

function Show-Status {
    $state = Get-State

    Write-Host ''
    Write-Host ("EasySchedule status [{0}]" -f $Profile) -ForegroundColor White
    Write-Host '-----------------------------' -ForegroundColor DarkGray

    if ($null -eq $state -or $null -eq $state.processes -or $state.processes.Count -eq 0) {
        Write-Warn 'No tracked processes found.'
        return
    }

    foreach ($trackedProcess in $state.processes) {
        $status = Get-TrackedProcessStatus -TrackedProcess $trackedProcess
        if ($status.alive) {
            Write-Ok ("RUNNING  {0} (pid {1})" -f $status.name, $status.pid)
        } else {
            Write-Fail ("STOPPED  {0} (pid {1})" -f $status.name, $status.pid)
        }

        if ($status.log_path) {
            Write-Host ("  log: {0}" -f $status.log_path) -ForegroundColor Gray
        }
    }
}

function Start-CommandProcess {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$Command,
        [string]$LogPath
    )

    Ensure-PathExists -Path $WorkingDirectory -Name $Name

    if ($LogPath) {
        $shellCommand = '{0} >> "{1}" 2>&1' -f $Command, $LogPath
    } else {
        $shellCommand = $Command
    }

    $process = Start-Process -FilePath 'cmd.exe' -ArgumentList '/d', '/c', $shellCommand -WorkingDirectory $WorkingDirectory -PassThru -WindowStyle Hidden

    Write-Ok ("Started {0} (pid {1})." -f $Name, $process.Id)

    [PSCustomObject]@{
        name = $Name
        pid = $process.Id
        log_path = $LogPath
    }
}

function Get-ProcessesForProfile {
    $processes = @()

    switch ($Profile) {
        'dev' {
            $processes += Start-CommandProcess -Name 'backend' -WorkingDirectory $backendDir -Command 'npm run dev' -LogPath $backendLog
            $processes += Start-CommandProcess -Name 'frontend' -WorkingDirectory $frontendDir -Command 'npm run dev' -LogPath $frontendLog
        }

        'server' {
            Ensure-PathExists -Path (Join-Path $frontendDir 'dist/index.html') -Name 'frontend build output'

            $processes += Start-CommandProcess -Name 'backend' -WorkingDirectory $backendDir -Command 'npm start' -LogPath $backendLog

            $nginxExe = Get-NginxExecutable
            $nginxConfig = Get-NginxConfig
            $quotedConfig = $nginxConfig.Replace('"', '""')
            $quotedPrefix = $nginxDir.Replace('"', '""')

            $process = Start-Process -FilePath $nginxExe -ArgumentList '-c', $quotedConfig, '-p', $quotedPrefix -WorkingDirectory $nginxDir -PassThru -WindowStyle Hidden
            Write-Ok ("Started nginx (pid {0})." -f $process.Id)

            $processes += [PSCustomObject]@{
                name = 'nginx'
                pid = $process.Id
                log_path = $null
            }
        }
    }

    return $processes
}

function Start-Profile {
    Ensure-Node
    Ensure-RuntimeDir

    $state = Get-State
    if ($null -ne $state -and $null -ne $state.processes) {
        $running = @($state.processes | Where-Object { (Get-TrackedProcessStatus -TrackedProcess $_).alive })
        if ($running.Count -gt 0) {
            Write-Warn 'Tracked processes are already running.'
            Show-Status
            return
        }

        Remove-State
    }

    Write-Info ("Starting EasySchedule profile: {0}" -f $Profile)
    $processes = Get-ProcessesForProfile
    Save-State -Processes $processes

    Write-Host ''
    Write-Host 'Useful commands:' -ForegroundColor White
    Write-Host ("  powershell -ExecutionPolicy Bypass -File .\manage_easyschedule.ps1 -Action status -Profile {0}" -f $Profile) -ForegroundColor Gray
    Write-Host ("  powershell -ExecutionPolicy Bypass -File .\manage_easyschedule.ps1 -Action stop -Profile {0}" -f $Profile) -ForegroundColor Gray

    if ($Profile -eq 'dev') {
        Write-Host ''
        Write-Host 'URLs:' -ForegroundColor White
        Write-Host '  frontend: http://localhost:5173/EasySchedule/' -ForegroundColor Gray
        Write-Host '  backend : http://localhost:4000/api' -ForegroundColor Gray
    }
}

function Stop-Profile {
    $state = Get-State
    if ($null -eq $state -or $null -eq $state.processes -or $state.processes.Count -eq 0) {
        Write-Warn 'No tracked processes to stop.'
        return
    }

    foreach ($trackedProcess in $state.processes) {
        Stop-TrackedProcess -TrackedProcess $trackedProcess
    }

    Remove-State
}

switch ($Action) {
    'start' {
        Start-Profile
    }

    'stop' {
        Stop-Profile
    }

    'status' {
        Show-Status
    }

    'restart' {
        Stop-Profile
        Start-Profile
    }
}