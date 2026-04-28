#!/bin/bash

# EasySchedule Development Environment Setup Script

set -e

echo "Setting up EasySchedule development environment..."

# Check Node.js version
echo "Checking system requirements..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="18.19.0"

    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        echo "OK: Node.js version: $NODE_VERSION (requires >= $REQUIRED_VERSION)"
    else
        echo "ERROR: Node.js version too low: $NODE_VERSION, needs >= $REQUIRED_VERSION"
        echo "Please install from https://nodejs.org"
        exit 1
    fi
else
    echo "ERROR: Node.js not found, please install Node.js >= 18.19.0"
    exit 1
fi

# Check npm
if command -v npm >/dev/null 2>&1; then
    echo "OK: npm version: $(npm -v)"
else
    echo "ERROR: npm not found"
    exit 1
fi

# Check Git
if command -v git >/dev/null 2>&1; then
    echo "OK: Git version: $(git --version)"
else
    echo "WARNING: Git not found"
fi

# Install dependencies
echo ""
echo "Installing project dependencies..."

# Root dependencies
echo "Installing root dependencies..."
npm install

# Backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install

# Frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm install

# Shared dependencies
echo "Installing shared dependencies..."
cd ../shared
npm install

# Build shared module
echo "Building shared module..."
npm run build

# Install shared module in frontend
echo "Installing shared module in frontend..."
cd ../frontend
npm install ../shared

# Return to root
cd ..

# Setup environment variables
echo ""
echo "Configuring environment variables..."

# Backend environment variables
if [ ! -f "backend/.env" ]; then
    echo "Creating backend environment config..."
    cp backend/.env.example backend/.env
    echo "OK: Created backend/.env"
else
    echo "OK: backend/.env already exists"
fi

# Frontend environment variables
if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend environment config..."
    cp frontend/.env.example frontend/.env
    echo "OK: Created frontend/.env"
else
    echo "OK: frontend/.env already exists"
fi

# Initialize database
echo ""
echo "Initializing database..."
cd backend

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migration
echo "Running database migration..."
npx prisma migrate dev --name init || echo "WARNING: Database migration may need manual confirmation"

# Return to root
cd ..

# Setup Git hooks
echo ""
echo "Setting up Git hooks..."
if [ -d ".git" ]; then
    npm run prepare || echo "WARNING: Git hooks setup may need manual run: npm run prepare"
    echo "OK: Git hooks configured"
else
    echo "WARNING: Not a Git repository, skipping Git hooks setup"
fi

# Create necessary directories
echo ""
echo "Creating necessary directories..."
mkdir -p backend/data
mkdir -p backend/logs
echo "OK: Directories created"

# Verify installation
echo ""
echo "Verifying installation..."

# Check if files exist
REQUIRED_FILES=(
    "backend/node_modules"
    "frontend/node_modules"
    "shared/node_modules"
    "shared/dist"
    "backend/.env"
    "frontend/.env"
    "backend/prisma/schema.prisma"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo "OK: $file"
    else
        echo "ERROR: $file not found"
    fi
done

echo ""
echo "SUCCESS: Development environment setup completed!"
echo ""
echo "Next steps:"
echo "1. Start development server: npm run dev"
echo "2. Or start separately:"
echo "   - Backend: cd backend && npm run dev"
echo "   - Frontend: cd frontend && npm run dev"
echo ""
echo "Access URLs:"
echo "- Frontend: http://localhost:5173/EasySchedule"
echo "- Backend API: http://localhost:4000/api"
echo "- Health check: http://localhost:4000/health"
echo ""
echo "For more information, see:"
echo "- Quick start: docs/quick-start.md"
echo "- Deployment guide: docs/deployment-guide.md"