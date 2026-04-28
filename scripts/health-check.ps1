# EasySchedule Health Check Script
# Checks if all development servers are running correctly

Write-Host "EasySchedule Health Check" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Gray
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node -v
    Write-Host "OK: Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js: Not found" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm -v
    Write-Host "OK: npm: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm: Not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check directory structure
$requiredDirs = @("backend", "frontend", "shared", "docs")
Write-Host "Directory Structure:" -ForegroundColor Yellow

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "OK: $dir/" -ForegroundColor Green
    } else {
        Write-Host "ERROR: $dir/ (missing)" -ForegroundColor Red
    }
}

Write-Host ""

# Check dependencies
Write-Host "Dependencies:" -ForegroundColor Yellow

$projects = @("", "backend", "frontend", "shared")
foreach ($project in $projects) {
    $path = if ($project -eq "") { "." } else { $project }
    $nodeModulesPath = Join-Path $path "node_modules"

    if (Test-Path $nodeModulesPath) {
        $displayName = if ($project -eq "") { "root" } else { $project }
        Write-Host "OK: $displayName dependencies installed" -ForegroundColor Green
    } else {
        $displayName = if ($project -eq "") { "root" } else { $project }
        Write-Host "ERROR: $displayName dependencies missing" -ForegroundColor Red
    }
}

Write-Host ""

# Check server health
Write-Host "Server Health:" -ForegroundColor Yellow

# Backend health check
try {
    $backendResponse = Invoke-RestMethod -Uri "http://localhost:4000/health" -TimeoutSec 5
    Write-Host "OK: Backend: Responding on port 4000" -ForegroundColor Green
    Write-Host "   Status: $($backendResponse.status)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Backend: Not responding on port 4000" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Frontend health check
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5
    Write-Host "OK: Frontend: Responding on port 5173" -ForegroundColor Green
} catch {
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5174" -TimeoutSec 5
        Write-Host "OK: Frontend: Responding on port 5174" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Frontend: Not responding on ports 5173 or 5174" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host ""

# Check shared module
Write-Host "Shared Module:" -ForegroundColor Yellow
$sharedDistPath = "shared/dist"
if (Test-Path $sharedDistPath) {
    Write-Host "OK: Shared module built successfully" -ForegroundColor Green

    # Check specific files
    $constantsPath = "shared/dist/constants/index.d.ts"
    $typesPath = "shared/dist/types/index.d.ts"

    if (Test-Path $constantsPath) {
        Write-Host "OK: Constants module available" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Constants module missing" -ForegroundColor Red
    }

    if (Test-Path $typesPath) {
        Write-Host "OK: Types module available" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Types module missing" -ForegroundColor Red
    }
} else {
    Write-Host "ERROR: Shared module not built" -ForegroundColor Red
}

Write-Host ""

# Check environment files
Write-Host "Environment Configuration:" -ForegroundColor Yellow

$envFiles = @(
    @{ path = "backend/.env"; name = "Backend" },
    @{ path = "frontend/.env"; name = "Frontend" }
)

foreach ($envFile in $envFiles) {
    if (Test-Path $envFile.path) {
        Write-Host "OK: $($envFile.name) environment file exists" -ForegroundColor Green
    } else {
        Write-Host "WARNING: $($envFile.name) environment file missing" -ForegroundColor Yellow
        Write-Host "   Copy from $($envFile.path).example" -ForegroundColor Gray
    }
}

Write-Host ""

# Summary
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "===========" -ForegroundColor Gray

Write-Host "For detailed startup instructions, run:" -ForegroundColor White
Write-Host "- Windows start: .\start_easyschedule.bat" -ForegroundColor Gray
Write-Host "- Windows stop : .\stop_easyschedule.bat" -ForegroundColor Gray
Write-Host "- PowerShell   : powershell -ExecutionPolicy Bypass -File .\manage_easyschedule.ps1 -Action start -Profile dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation:" -ForegroundColor White
Write-Host "- Quick Start: docs/quick-start.md" -ForegroundColor Gray
Write-Host "- Deployment Guide: docs/deployment-guide.md" -ForegroundColor Gray