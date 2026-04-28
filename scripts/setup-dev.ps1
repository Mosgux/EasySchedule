# EasySchedule Development Setup Script (Windows PowerShell)
# Simple version with encoding fixes

# Set execution policy
$ErrorActionPreference = "Stop"

Write-Host "Setting up EasySchedule development environment..." -ForegroundColor Green

# Check Node.js version
Write-Host "Checking system requirements..." -ForegroundColor Yellow

try {
    $nodeVersion = node -v
    $nodeVersionNumber = $nodeVersion -replace 'v', ''
    $requiredVersion = "18.19.0"

    if ([version]$nodeVersionNumber -ge [version]$requiredVersion) {
        Write-Host "OK: Node.js version $nodeVersion (requires >= $requiredVersion)" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Node.js version too low: $nodeVersion, needs >= $requiredVersion" -ForegroundColor Red
        Write-Host "Please install from https://nodejs.org" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "ERROR: Node.js not found, please install Node.js >= 18.19.0" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm -v
    Write-Host "OK: npm version $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm not found" -ForegroundColor Red
    exit 1
}

# Check Git
try {
    $gitVersion = git --version
    Write-Host "OK: Git version $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Git not found" -ForegroundColor Yellow
}

# Install dependencies
Write-Host ""
Write-Host "Installing project dependencies..." -ForegroundColor Yellow

# Root dependencies
Write-Host "Installing root dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Root dependencies installation failed" -ForegroundColor Red
    exit 1
}

# Backend dependencies
Write-Host "Installing backend dependencies..."
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend dependencies installation failed" -ForegroundColor Red
    exit 1
}

# Frontend dependencies
Write-Host "Installing frontend dependencies..."
Set-Location ..\frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend dependencies installation failed" -ForegroundColor Red
    exit 1
}

# Shared dependencies
Write-Host "Installing shared dependencies..."
Set-Location ..\shared
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Shared dependencies installation failed" -ForegroundColor Red
    exit 1
}

# Build shared module
Write-Host "Building shared module..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Shared module build failed" -ForegroundColor Red
    exit 1
}

# Install shared module in frontend
Write-Host "Installing shared module in frontend..."
Set-Location ..\frontend
npm install ../shared
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Shared module installation in frontend failed" -ForegroundColor Red
    exit 1
}

# Return to root
Set-Location ..

# Setup environment variables
Write-Host ""
Write-Host "Configuring environment variables..." -ForegroundColor Yellow

# Backend env
if (-not (Test-Path "backend\.env")) {
    Write-Host "Creating backend environment config..."
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "OK: Created backend\.env" -ForegroundColor Green
} else {
    Write-Host "OK: backend\.env already exists" -ForegroundColor Green
}

# Frontend env
if (-not (Test-Path "frontend\.env")) {
    Write-Host "Creating frontend environment config..."
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "OK: Created frontend\.env" -ForegroundColor Green
} else {
    Write-Host "OK: frontend\.env already exists" -ForegroundColor Green
}

# Initialize database
Write-Host ""
Write-Host "Initializing database..." -ForegroundColor Yellow
Set-Location backend

# Generate Prisma client
Write-Host "Generating Prisma client..."
try {
    npx prisma generate
    Write-Host "OK: Prisma client generated" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Prisma client generation may need manual run" -ForegroundColor Yellow
}

# Run database migration
Write-Host "Running database migration..."
try {
    npx prisma migrate dev --name init
    Write-Host "OK: Database migration completed" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Database migration may need manual confirmation" -ForegroundColor Yellow
}

# Return to root
Set-Location ..

# Setup Git hooks
Write-Host ""
Write-Host "Setting up Git hooks..." -ForegroundColor Yellow

if (Test-Path ".git") {
    try {
        npm run prepare
        Write-Host "OK: Git hooks configured" -ForegroundColor Green
    } catch {
        Write-Host "WARNING: Git hooks setup may need manual run: npm run prepare" -ForegroundColor Yellow
    }
} else {
    Write-Host "WARNING: Not a Git repository, skipping Git hooks setup" -ForegroundColor Yellow
}

# Create necessary directories
Write-Host ""
Write-Host "Creating necessary directories..." -ForegroundColor Yellow

if (-not (Test-Path "backend\data")) {
    New-Item -ItemType Directory -Path "backend\data" -Force | Out-Null
}
if (-not (Test-Path "backend\logs")) {
    New-Item -ItemType Directory -Path "backend\logs" -Force | Out-Null
}
Write-Host "OK: Directories created" -ForegroundColor Green

# Verify installation
Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Yellow

$requiredFiles = @(
    "backend\node_modules",
    "frontend\node_modules",
    "shared\node_modules",
    "shared\dist",
    "backend\.env",
    "frontend\.env",
    "backend\prisma\schema.prisma"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "OK: $file" -ForegroundColor Green
    } else {
        Write-Host "ERROR: $file not found" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""
if ($allFilesExist) {
    Write-Host "SUCCESS: Development environment setup completed!" -ForegroundColor Green
} else {
    Write-Host "WARNING: Some components may be missing" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start development server: npm run dev" -ForegroundColor White
Write-Host "2. Or start separately:" -ForegroundColor White
Write-Host "   - Backend: cd backend; npm run dev" -ForegroundColor Gray
Write-Host "   - Frontend: cd frontend; npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:5173/EasySchedule" -ForegroundColor White
Write-Host "- Backend API: http://localhost:4000/api" -ForegroundColor White
Write-Host "- Health check: http://localhost:4000/health" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see:" -ForegroundColor Cyan
Write-Host "- Quick start: docs\quick-start.md" -ForegroundColor White
Write-Host "- Deployment guide: docs\deployment-guide.md" -ForegroundColor White

Write-Host ""
Write-Host "Setup completed! Press any key to continue..." -ForegroundColor Gray
try {
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} catch {
    Write-Host "Setup completed!" -ForegroundColor Green
}