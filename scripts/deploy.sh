#!/bin/bash

# EasySchedule Deployment Script

set -e  # Exit on error

echo "Starting EasySchedule deployment..."

# Configuration
DEPLOY_DIR="/var/www/easyschedule"
BACKUP_DIR="/var/backups/easyschedule"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="$(pwd)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: Please run this script from the project root directory"
    exit 1
fi

# Create backup
echo "Creating backup..."
if [ -d "$DEPLOY_DIR" ]; then
    sudo mkdir -p $BACKUP_DIR
    sudo cp -r $DEPLOY_DIR $BACKUP_DIR/easyschedule_$TIMESTAMP
    echo "OK: Backup completed: $BACKUP_DIR/easyschedule_$TIMESTAMP"
fi

# Build application
echo "Building application..."

# Build shared module
echo "Building shared module..."
cd $PROJECT_DIR/shared
npm ci --production
npm run build

# Build backend
echo "Building backend..."
cd $PROJECT_DIR/backend
npm ci --production
npm run build

# Generate Prisma client
npx prisma generate

# Build frontend
echo "Building frontend..."
cd $PROJECT_DIR/frontend
npm ci --production
npm run build

# Deploy files
echo "Deploying files..."
sudo mkdir -p $DEPLOY_DIR

# Copy frontend
sudo cp -r $PROJECT_DIR/frontend/dist $DEPLOY_DIR/frontend/

# Copy backend
sudo cp -r $PROJECT_DIR/backend/dist $DEPLOY_DIR/backend/
sudo cp -r $PROJECT_DIR/backend/node_modules $DEPLOY_DIR/backend/
sudo cp -r $PROJECT_DIR/backend/prisma $DEPLOY_DIR/backend/
sudo cp $PROJECT_DIR/backend/.env.production $DEPLOY_DIR/backend/.env 2>/dev/null || sudo cp $PROJECT_DIR/backend/.env.example $DEPLOY_DIR/backend/.env

# Copy shared module
sudo mkdir -p $DEPLOY_DIR/shared
sudo cp -r $PROJECT_DIR/shared/dist $DEPLOY_DIR/shared/

# Set permissions
echo "Setting permissions..."
sudo chown -R www-data:www-data $DEPLOY_DIR
sudo chmod -R 755 $DEPLOY_DIR

# Create necessary directories
sudo mkdir -p $DEPLOY_DIR/backend/data
sudo mkdir -p $DEPLOY_DIR/backend/logs
sudo chown -R www-data:www-data $DEPLOY_DIR/backend/data
sudo chown -R www-data:www-data $DEPLOY_DIR/backend/logs

# Run database migration
echo "Running database migration..."
cd $DEPLOY_DIR/backend
sudo -u www-data npx prisma migrate deploy || echo "WARNING: Database migration failed, please check configuration"

# Restart backend service
echo "Restarting backend service..."
if systemctl list-unit-files | grep -q "easyschedule-backend"; then
    sudo systemctl restart easyschedule-backend
    echo "OK: Backend service restarted"
else
    echo "WARNING: Backend service not configured, please start manually or configure systemd service"
fi

# Reload NGINX
echo "Reloading NGINX..."
if command -v nginx >/dev/null 2>&1; then
    sudo nginx -t && sudo systemctl reload nginx
    echo "OK: NGINX reloaded"
else
    echo "WARNING: NGINX not installed or not configured"
fi

# Verify deployment
echo "Verifying deployment..."
sleep 3

# Check backend health
if command -v curl >/dev/null 2>&1; then
    if curl -f http://localhost:4000/health > /dev/null 2>&1; then
        echo "OK: Backend service is running normally"
    else
        echo "ERROR: Backend service is not responding, please check logs"
        echo "View logs: sudo journalctl -u easyschedule-backend -f"
    fi
else
    echo "WARNING: curl not installed, skipping health check"
fi

echo ""
echo "Deployment completed!"
echo "Backup location: $BACKUP_DIR/easyschedule_$TIMESTAMP"
echo "Deploy directory: $DEPLOY_DIR"
echo ""
echo "Next steps:"
echo "1. Check service status: sudo systemctl status easyschedule-backend"
echo "2. View application logs: sudo journalctl -u easyschedule-backend -f"
echo "3. Verify frontend access: http://your-domain.com/EasySchedule"
echo "4. Verify API: http://your-domain.com/EasySchedule/api/health"
echo ""
echo "If there are issues, please refer to troubleshooting documentation or check log files"