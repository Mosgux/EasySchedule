# EasySchedule Deployment Script (Windows PowerShell)
# Automated deployment for production environment

param(
    [string]$Environment = "production",
    [string]$BuildPath = "./dist",
    [switch]$SkipTests = $false,
    [switch]$SkipBackup = $false,
    [string]$BackupPath = "./backups"
)

# Set execution policy
$ErrorActionPreference = "Stop"

Write-Host "EasySchedule Deployment Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Gray
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Build Path: $BuildPath" -ForegroundColor Yellow
Write-Host ""

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
if (-not (Test-Command "node")) {
    Write-Host "ERROR: Node.js not found. Please install Node.js >= 18.19.0" -ForegroundColor Red
    exit 1
}
$nodeVersion = node -v
Write-Host "OK: Node.js $nodeVersion" -ForegroundColor Green

# Check npm
if (-not (Test-Command "npm")) {
    Write-Host "ERROR: npm not found" -ForegroundColor Red
    exit 1
}
$npmVersion = npm -v
Write-Host "OK: npm v$npmVersion" -ForegroundColor Green

# Check Git (optional but recommended)
if (Test-Command "git") {
    $gitVersion = git --version
    Write-Host "OK: Git $gitVersion" -ForegroundColor Green
} else {
    Write-Host "WARNING: Git not found" -ForegroundColor Yellow
}

Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found. Please run from project root." -ForegroundColor Red
    exit 1
}

# Run tests if not skipped
if (-not $SkipTests) {
    Write-Host "Running tests..." -ForegroundColor Yellow
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Tests failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK: Tests passed" -ForegroundColor Green
} else {
    Write-Host "WARNING: Skipping tests" -ForegroundColor Yellow
}

Write-Host ""

# Create backup if not skipped
if (-not $SkipBackup) {
    Write-Host "Creating backup..." -ForegroundColor Yellow

    if (-not (Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    }

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "$BackupPath/easyschedule_backup_$timestamp.zip"

    # Create backup of current build if it exists
    if (Test-Path $BuildPath) {
        Compress-Archive -Path "$BuildPath/*" -DestinationPath $backupFile -Force
        Write-Host "OK: Backup created at $backupFile" -ForegroundColor Green
    } else {
        Write-Host "WARNING: No existing build to backup" -ForegroundColor Yellow
    }
} else {
    Write-Host "WARNING: Skipping backup" -ForegroundColor Yellow
}

Write-Host ""

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path $BuildPath) {
    Remove-Item -Path "$BuildPath/*" -Recurse -Force
    Write-Host "OK: Previous builds cleaned" -ForegroundColor Green
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm ci --production=false
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Dependency installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Dependencies installed" -ForegroundColor Green

# Build shared module
Write-Host "Building shared module..." -ForegroundColor Yellow
Set-Location shared
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Shared module build failed" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "OK: Shared module built" -ForegroundColor Green

# Build backend
Write-Host "Building backend..." -ForegroundColor Yellow
Set-Location backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend build failed" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "OK: Backend built" -ForegroundColor Green

# Build frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "OK: Frontend built" -ForegroundColor Green

# Create production build directory
Write-Host "Creating production build..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $BuildPath -Force | Out-Null

# Copy backend files
Write-Host "Copying backend files..." -ForegroundColor Gray
Copy-Item -Path "backend/dist/*" -Destination "$BuildPath/backend" -Recurse -Force
Copy-Item -Path "backend/node_modules" -Destination "$BuildPath/backend" -Recurse -Force
Copy-Item -Path "backend/prisma" -Destination "$BuildPath/backend" -Recurse -Force
Copy-Item -Path "backend/package.json" -Destination "$BuildPath/backend" -Force

# Copy frontend files
Write-Host "Copying frontend files..." -ForegroundColor Gray
Copy-Item -Path "frontend/dist/*" -Destination "$BuildPath/frontend" -Recurse -Force

# Copy shared files
Write-Host "Copying shared files..." -ForegroundColor Gray
Copy-Item -Path "shared/dist" -Destination "$BuildPath/shared" -Recurse -Force

# Copy additional files
Write-Host "Copying additional files..." -ForegroundColor Gray
Copy-Item -Path "package.json" -Destination $BuildPath -Force
Copy-Item -Path "README.md" -Destination $BuildPath -Force
Copy-Item -Path "docs" -Destination $BuildPath -Recurse -Force

# Create production environment files
Write-Host "Creating production environment files..." -ForegroundColor Gray

# Backend production env
$backendEnvContent = @"
NODE_ENV=production
PORT=4000
DATABASE_URL="file:./data/easy.db"
JWT_SECRET=your-production-jwt-secret-here
CORS_ORIGIN=http://localhost:3000
"@
Set-Content -Path "$BuildPath/backend/.env" -Value $backendEnvContent -Encoding UTF8

# Frontend production env
$frontendEnvContent = @"
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SHARE_BASE_URL=http://localhost:3000
"@
Set-Content -Path "$BuildPath/frontend/.env" -Value $frontendEnvContent -Encoding UTF8

# Create startup scripts
Write-Host "Creating startup scripts..." -ForegroundColor Gray

# Windows startup script
$startupBatContent = @"
@echo off
echo Starting EasySchedule (Production)...
echo.

cd backend
npm start
"@
Set-Content -Path "$BuildPath/start.bat" -Value $startupBatContent -Encoding ASCII

# PowerShell startup script
$startupPs1Content = @"
# EasySchedule Production Startup Script
Write-Host "Starting EasySchedule (Production)..." -ForegroundColor Green
Set-Location backend
npm start
"@
Set-Content -Path "$BuildPath/start.ps1" -Value $startupPs1Content -Encoding UTF8

# Linux/Mac startup script
$startupShContent = @"
#!/bin/bash
echo "Starting EasySchedule (Production)..."
cd backend
npm start
"@
Set-Content -Path "$BuildPath/start.sh" -Value $startupShContent -Encoding UTF8

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host ""

# Display summary
Write-Host "Deployment Summary:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Gray
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Build Path: $BuildPath" -ForegroundColor White
Write-Host "Backup: $(if ($SkipBackup) { 'Skipped' } else { $backupFile })" -ForegroundColor White
Write-Host "Tests: $(if ($SkipTests) { 'Skipped' } else { 'Passed' })" -ForegroundColor White
Write-Host ""

Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host "- Windows: cd $BuildPath && start.bat" -ForegroundColor Gray
Write-Host "- PowerShell: cd $BuildPath && .\start.ps1" -ForegroundColor Gray
Write-Host "- Linux/Mac: cd $BuildPath && chmod +x start.sh && ./start.sh" -ForegroundColor Gray
Write-Host ""

Write-Host "Application will be available at:" -ForegroundColor Yellow
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- Backend API: http://localhost:4000/api" -ForegroundColor White
Write-Host "- Health Check: http://localhost:4000/health" -ForegroundColor White

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green