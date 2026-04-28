# EasySchedule 部署和测试指导文档

## 目录

1. [开发环境设置](#开发环境设置)
2. [本地测试](#本地测试)
3. [生产环境部署](#生产环境部署)
4. [故障排除](#故障排除)
5. [性能监控](#性能监控)

## 开发环境设置

### 系统要求

- **Node.js**: 18.19.0 或更高版本
- **npm**: 9.0.0 或更高版本
- **Git**: 2.30.0 或更高版本
- **操作系统**: Windows 10/11 或 Windows Server 2012 R2+

### 1. 克隆项目

```bash
git clone <repository-url>
cd EasySchedule
```

### 2. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install

# 安装共享模块依赖
cd ../shared
npm install

# 返回根目录
cd ..
```

### 3. 环境配置

#### 后端环境变量

复制并编辑后端环境配置：

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库配置
DATABASE_URL="file:./data/easy.db"

# 服务器配置
PORT=4000
NODE_ENV=development

# 安全配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NANOID_SIZE=12

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# 清理任务配置
CLEANUP_INTERVAL="0 2 * * *" # 每天凌晨2点清理
```

#### 前端环境变量

复制并编辑前端环境配置：

```bash
cd frontend
cp .env.example .env
```

编辑 `.env` 文件：

```env
# API配置
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SHARE_BASE_URL=http://localhost:5173/EasySchedule

# 应用配置
VITE_APP_TITLE=EasySchedule - 多人时间协商
VITE_APP_VERSION=1.0.0

# 功能开关
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

### 4. 数据库初始化

```bash
cd backend

# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init

# (可选) 填充示例数据
npx prisma db seed
```

## 本地测试

### 1. 启动开发服务器

#### 方式一：同时启动前后端（推荐）

```bash
# 在项目根目录
npm run dev
```

#### 方式二：分别启动

```bash
# 终端1：启动后端服务
cd backend
npm run dev

# 终端2：启动前端服务
cd frontend
npm run dev
```

### 2. 验证服务状态

#### 检查后端API

访问以下URL验证后端服务：

- **健康检查**: http://localhost:4000/health
- **API基础路径**: http://localhost:4000/api

预期响应：

```json
{
  "status": "ok",
  "timestamp": "2025-01-13T12:00:00.000Z"
}
```

#### 检查前端应用

访问：http://localhost:5173/EasySchedule

### 3. 功能测试

#### 基础功能测试清单

- [ ] 页面正常加载，无JavaScript错误
- [ ] 创建时间表表单可以正常填写
- [ ] 表单验证规则生效
- [ ] 成功创建时间表后显示分享链接
- [ ] 复制链接功能正常
- [ ] 错误处理和用户反馈正常

#### API测试清单

- [ ] `POST /api/schedules` 创建时间表
- [ ] `GET /api/schedules/:id/share` 获取分享链接
- [ ] 错误响应格式正确
- [ ] 输入验证生效

#### 数据库测试

```bash
cd backend

# 查看数据库文件
ls -la data/

# 使用Prisma Studio查看数据
npx prisma studio
```

### 4. 代码质量检查

```bash
# 在项目根目录
npm run lint

# 修复代码格式
npm run lint:fix

# 运行测试（如果有）
npm test
```

## 生产环境部署

### 1. 构建应用

#### 构建前端

```bash
cd frontend
npm run build
```

构建产物位于：`frontend/dist/`

#### 构建后端

```bash
cd backend
npm run build
```

构建产物位于：`backend/dist/`

#### 构建共享模块

```bash
cd shared
npm run build
```

### 2. 生产环境配置

#### 后端生产环境变量

创建生产环境配置文件：

```bash
cd backend
cp .env.example .env.production
```

编辑 `.env.production`：

```env
# 数据库配置
DATABASE_URL="file:./data/easy.db"

# 服务器配置
PORT=4000
NODE_ENV=production

# 安全配置（使用强密码）
JWT_SECRET=your-strong-production-secret-key-here
NANOID_SIZE=12

# 日志配置
LOG_LEVEL=warn
LOG_FILE=./logs/app.log

# 清理任务配置
CLEANUP_INTERVAL="0 2 * * *"
```

#### 前端生产环境配置

```bash
cd frontend
cp .env.example .env.production
```

编辑 `.env.production`：

```env
# API配置
VITE_API_BASE_URL=http://your-domain.com/api
VITE_SHARE_BASE_URL=http://your-domain.com/EasySchedule

# 应用配置
VITE_APP_TITLE=EasySchedule - 多人时间协商
VITE_APP_VERSION=1.0.0

# 功能开关
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

### 3. NGINX配置

创建NGINX配置文件 `/etc/nginx/sites-available/easyschedule`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名

    # 前端静态文件
    location /EasySchedule {
        alias /var/www/easyschedule/frontend/dist;
        try_files $uri $uri/ /EasySchedule/index.html;

        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API反向代理
    location /EasySchedule/api {
        proxy_pass http://127.0.0.1:4000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/easyschedule /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl reload nginx
```

### 4. 部署脚本

创建部署脚本 `scripts/deploy.sh`：

```bash
#!/bin/bash

# EasySchedule 部署脚本

set -e  # 遇到错误立即退出

echo "🚀 开始部署 EasySchedule..."

# 配置
DEPLOY_DIR="/var/www/easyschedule"
BACKUP_DIR="/var/backups/easyschedule"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 创建备份
echo "📦 创建备份..."
sudo mkdir -p $BACKUP_DIR
sudo cp -r $DEPLOY_DIR $BACKUP_DIR/easyschedule_$TIMESTAMP

# 构建应用
echo "🔨 构建应用..."
cd /path/to/your/EasySchedule  # 替换为实际路径

# 构建共享模块
echo "构建共享模块..."
cd shared
npm ci --production
npm run build

# 构建后端
echo "构建后端..."
cd ../backend
npm ci --production
npm run build

# 构建前端
echo "构建前端..."
cd ../frontend
npm ci --production
npm run build

# 部署文件
echo "📁 部署文件..."
sudo mkdir -p $DEPLOY_DIR
sudo cp -r frontend/dist $DEPLOY_DIR/frontend/
sudo cp -r backend/dist $DEPLOY_DIR/backend/
sudo cp -r backend/node_modules $DEPLOY_DIR/backend/
sudo cp -r backend/prisma $DEPLOY_DIR/backend/
sudo cp -r backend/.env.production $DEPLOY_DIR/backend/.env
sudo cp -r shared/dist $DEPLOY_DIR/shared/

# 设置权限
echo "🔐 设置权限..."
sudo chown -R www-data:www-data $DEPLOY_DIR
sudo chmod -R 755 $DEPLOY_DIR

# 创建必要目录
sudo mkdir -p $DEPLOY_DIR/backend/data
sudo mkdir -p $DEPLOY_DIR/backend/logs
sudo chown -R www-data:www-data $DEPLOY_DIR/backend/data
sudo chown -R www-data:www-data $DEPLOY_DIR/backend/logs

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
cd $DEPLOY_DIR/backend
sudo -u www-data npx prisma migrate deploy

# 重启后端服务
echo "🔄 重启后端服务..."
sudo systemctl restart easyschedule-backend || echo "⚠️ 后端服务未配置，请手动启动"

# 重新加载NGINX
echo "🌐 重新加载NGINX..."
sudo systemctl reload nginx

# 验证部署
echo "✅ 验证部署..."
sleep 5

if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务异常"
    exit 1
fi

echo "🎉 部署完成！"
echo "📊 备份位置: $BACKUP_DIR/easyschedule_$TIMESTAMP"
echo "🌐 应用地址: http://your-domain.com/EasySchedule"
```

使脚本可执行：

```bash
chmod +x scripts/deploy.sh
```

### 5. 系统服务配置

创建systemd服务文件 `/etc/systemd/system/easyschedule-backend.service`：

```ini
[Unit]
Description=EasySchedule Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/easyschedule/backend
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

# 日志
StandardOutput=journal
StandardError=journal

# 安全
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/easyschedule/backend/data /var/www/easyschedule/backend/logs

[Install]
WantedBy=multi-user.target
```

启用和启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable easyschedule-backend
sudo systemctl start easyschedule-backend
sudo systemctl status easyschedule-backend
```

## 故障排除

### 常见问题

#### 1. 端口被占用

```bash
# 查看端口占用
sudo netstat -tulpn | grep :4000
sudo lsof -i :4000

# 终止占用进程
sudo kill -9 <PID>
```

#### 2. 数据库权限问题

```bash
# 检查数据库文件权限
ls -la backend/data/

# 修复权限
sudo chown -R www-data:www-data backend/data/
sudo chmod 755 backend/data/
```

#### 3. 前端构建失败

```bash
# 清理缓存
cd frontend
rm -rf node_modules package-lock.json
npm install

# 检查Node.js版本
node --version  # 应该 >= 18.19.0
```

#### 4. 后端启动失败

```bash
# 查看日志
sudo journalctl -u easyschedule-backend -f

# 检查环境变量
cd backend
cat .env

# 手动启动测试
cd backend
npm run dev
```

#### 5. NGINX配置错误

```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 重新加载配置
sudo systemctl reload nginx
```

### 日志查看

#### 应用日志

```bash
# 后端应用日志
sudo tail -f /var/www/easyschedule/backend/logs/app.log

# 系统服务日志
sudo journalctl -u easyschedule-backend -f

# NGINX访问日志
sudo tail -f /var/log/nginx/access.log

# NGINX错误日志
sudo tail -f /var/log/nginx/error.log
```

## 性能监控

### 1. 系统监控

```bash
# 查看系统资源使用
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看服务状态
sudo systemctl status easyschedule-backend nginx
```

### 2. 应用监控

```bash
# 查看数据库大小
ls -lh /var/www/easyschedule/backend/data/

# 查看日志文件大小
du -sh /var/www/easyschedule/backend/logs/

# 监控API响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:4000/health
```

### 3. 性能优化建议

#### 数据库优化

- 定期运行 `VACUUM` 命令优化SQLite
- 监控数据库文件大小
- 考虑定期备份和清理

#### 前端优化

- 启用Gzip压缩（NGINX已配置）
- 设置合适的缓存策略
- 监控页面加载时间

#### 后端优化

- 监控内存使用情况
- 定期检查日志文件大小
- 考虑添加Redis缓存

## 定期维护

### 每周任务

- [ ] 检查应用日志大小
- [ ] 验证备份完整性
- [ ] 检查系统更新

### 每月任务

- [ ] 清理旧日志文件
- [ ] 更新依赖包
- [ ] 性能基准测试

### 每季度任务

- [ ] 安全审计
- [ ] 灾难恢复演练
- [ ] 容量规划评估

---

## 联系支持

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查项目Issues页面
3. 创建新的Issue并提供详细的错误信息和日志

**技术支持**: [项目GitHub Issues](https://github.com/your-repo/EasySchedule/issues)
