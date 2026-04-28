# EasySchedule 部署指南

## 概述

EasySchedule 是一个多人时间协商可视化系统，支持 Windows Server 2012 R2 环境部署。

## 系统要求

### 硬件要求

- CPU: 2核心或更高
- 内存: 4GB RAM 或更高
- 磁盘空间: 10GB 可用空间
- 网络: 稳定的互联网连接

### 软件要求

- 操作系统: Windows Server 2012 R2 或更高版本
- Node.js: >= 18.19.0
- npm: >= 8.0.0
- NGINX: >= 1.18.0 (推荐)
- Git: >= 2.0.0 (可选)

## 快速部署

### 1. 下载源代码

```bash
git clone <repository-url>
cd EasySchedule
```

### 2. 自动部署

以管理员身份运行：

```bash
scripts\deploy-production.bat
```

### 3. 手动部署

如果需要手动部署，请按以下步骤：

#### 2.1 安装依赖

```bash
# 安装共享模块依赖
cd shared
npm install
npm run build

# 安装后端依赖
cd ..\backend
npm install
npm run build

# 安装前端依赖
cd ..\frontend
npm install
npm run build
```

#### 2.2 配置环境变量

创建后端环境变量文件 `backend/.env`：

```env
NODE_ENV=production
PORT=4000
DATABASE_URL="file:./data/easy.db"
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=http://localhost
LOG_LEVEL=info
DATA_EXPIRY_DAYS=7
CLEANUP_INTERVAL_HOURS=6
```

创建前端环境变量文件 `frontend/.env`：

```env
VITE_API_BASE_URL=http://localhost/api
VITE_SHARE_BASE_URL=http://localhost
```

#### 2.3 配置 NGINX

复制 NGINX 配置文件：

```bash
copy nginx\easyschedule.conf C:\nginx\conf\easyschedule.conf
```

启动 NGINX：

```bash
nginx -c C:\nginx\conf\easyschedule.conf
```

#### 2.4 初始化数据库

```bash
cd backend
npx prisma generate
npx prisma db push
```

#### 2.5 启动服务

启动后端服务：

```bash
cd backend
npm start
```

## 目录结构

生产环境目录结构：

```
C:\apps\EasySchedule\
├── backend\
│   ├── dist\              # 编译后的后端代码
│   ├── node_modules\      # 后端依赖
│   ├── prisma\            # 数据库模式和迁移
│   ├── data\              # SQLite 数据库文件
│   └── .env               # 后端环境变量
├── frontend\              # 编译后的前端文件
│   └── .env               # 前端环境变量
├── nginx\                 # NGINX 配置
│   ├── easyschedule.conf  # NGINX 配置文件
│   ├── nginx-manager.bat  # NGINX 管理脚本
│   └── install-service.bat # Windows 服务安装脚本
├── logs\                  # 日志文件
│   ├── nginx_access.log   # NGINX 访问日志
│   ├── nginx_error.log    # NGINX 错误日志
│   └── deploy.log         # 部署日志
├── backups\               # 备份文件
├── scripts\               # 维护脚本
│   ├── maintenance.bat    # 维护工具
│   ├── daily-backup.bat   # 每日备份脚本
│   └── start-all.bat      # 启动脚本
├── start-all.bat          # 启动所有服务
├── start-backend.bat      # 启动后端服务
└── migrate-database.bat   # 数据库迁移脚本
```

## 服务管理

### 启动服务

```bash
# 启动所有服务
C:\apps\EasySchedule\start-all.bat

# 仅启动后端
C:\apps\EasySchedule\start-backend.bat

# 管理 NGINX
C:\apps\EasySchedule\nginx\nginx-manager.bat
```

### 停止服务

```bash
# 停止 NGINX 服务
net stop EasyScheduleNGINX

# 停止后端进程
taskkill /f /im node.exe
```

### 重启服务

```bash
# 使用维护脚本重启
C:\apps\EasySchedule\scripts\maintenance.bat
选择选项 6 (重启所有服务)
```

## 维护操作

### 备份数据

```bash
C:\apps\EasySchedule\scripts\maintenance.bat
选择选项 1 (备份数据库和配置)
```

### 清理日志

```bash
C:\apps\EasySchedule\scripts\maintenance.bat
选择选项 2 (清理日志文件)
```

### 数据库维护

```bash
C:\apps\EasySchedule\scripts\maintenance.bat
选择选项 8 (数据库维护)
```

## 计划任务

系统支持自动化的计划任务：

### 自动备份

每日凌晨 2:00 自动备份数据：

```bash
C:\apps\EasySchedule\scripts\maintenance.bat
选择选项 9 (计划任务设置) -> 1 (设置自动备份)
```

### 日志清理

每日凌晨 3:00 自动清理日志：

```bash
C:\apps\EasySchedule\scripts\maintenance.bat
选择选项 9 (计划任务设置) -> 2 (设置日志清理)
```

### 数据清理

每日凌晨 4:00 自动清理过期数据：

```bash
C:\apps\EasySchedule\scripts\maintenance.bat
选择选项 9 (计划任务设置) -> 3 (设置数据清理)
```

## 监控和日志

### 日志文件位置

- 应用日志: `C:\apps\EasySchedule\logs\*.log`
- NGINX 访问日志: `C:\apps\EasySchedule\logs\nginx_access.log`
- NGINX 错误日志: `C:\apps\EasySchedule\logs\nginx_error.log`
- 部署日志: `C:\apps\EasySchedule\logs\deploy.log`

### 健康检查

应用提供健康检查端点：

```bash
curl http://localhost/health
```

预期响应：

```json
{
  "status": "ok",
  "timestamp": "2025-01-13T12:00:00.000Z",
  "uptime": 3600
}
```

### 性能监控

使用维护脚本检查系统状态：

```bash
C:\apps\EasySchedule\scripts\maintenance.bat
选择选项 5 (检查系统状态)
```

## 安全配置

### 防火墙设置

确保以下端口开放：

- HTTP (80): 用于 Web 访问
- HTTPS (443): 用于安全 Web 访问 (如果启用)
- Backend (4000): 仅内部访问

### SSL/HTTPS 配置

1. 获取 SSL 证书
2. 将证书文件放在 `C:\apps\EasySchedule\ssl\`
3. 修改 NGINX 配置启用 HTTPS
4. 重新加载 NGINX 配置

详细步骤请参考 `nginx/ssl-README.md`

### 访问控制

- 限制数据库文件访问权限
- 定期更新 JWT 密钥
- 监控异常访问日志

## 故障排除

### 常见问题

#### 1. 端口占用

```bash
# 检查端口占用
netstat -an | findstr ":80"
netstat -an | findstr ":4000"

# 终止占用进程
taskkill /f /im nginx.exe
taskkill /f /im node.exe
```

#### 2. 数据库连接失败

```bash
# 检查数据库文件权限
icacls "C:\apps\EasySchedule\backend\data"

# 重新生成 Prisma 客户端
cd C:\apps\EasySchedule\backend
npx prisma generate
npx prisma db push
```

#### 3. NGINX 配置错误

```bash
# 测试 NGINX 配置
nginx -t -c C:\apps\EasySchedule\nginx\easyschedule.conf

# 查看 NGINX 错误日志
type C:\apps\EasySchedule\logs\nginx_error.log
```

#### 4. 前端无法访问后端 API

- 检查 CORS 配置
- 验证 API 基础 URL 设置
- 确认后端服务正在运行

### 日志分析

#### 错误日志分析

```bash
# 查看最近错误
type C:\apps\EasySchedule\logs\nginx_error.log | findstr "error"

# 查看访问异常
type C:\apps\EasySchedule\logs\nginx_access.log | findstr " 4"
type C:\apps\EasySchedule\logs\nginx_access.log | findstr " 5"
```

#### 性能分析

```bash
# 分析响应时间
type C:\apps\EasySchedule\logs\nginx_access.log | findstr "api"
```

## 更新部署

### 自动更新

```bash
# 停止服务
net stop EasyScheduleNGINX
taskkill /f /im node.exe

# 运行更新脚本
scripts\deploy-production.bat
```

### 手动更新

1. 备份当前版本
2. 更新源代码
3. 重新构建项目
4. 更新配置文件
5. 重启服务

## 回滚操作

### 回滚到上一版本

1. 停止服务
2. 从备份目录恢复文件
3. 重启服务

```bash
# 查看可用备份
dir C:\apps\EasySchedule\backups

# 恢复最新备份
powershell -Command "Expand-Archive -Path 'C:\apps\EasySchedule\backups\easyschedule_backup_YYYYMMDD_HHMMSS.zip' -DestinationPath 'C:\apps\EasySchedule' -Force"
```

## 性能优化

### 数据库优化

```bash
# 执行数据库优化
C:\apps\EasySchedule\scripts\maintenance.bat
选择选项 8 (数据库维护) -> 2 (数据库优化)
```

### 缓存配置

- 启用 NGINX 静态文件缓存
- 配置适当的缓存头
- 定期清理缓存

### 负载均衡 (多实例)

如果需要支持更高并发，可以配置多个后端实例：

```nginx
upstream backend {
    server 127.0.0.1:4000;
    server 127.0.0.1:4001;
    server 127.0.0.1:4002;
}

server {
    location /api/ {
        proxy_pass http://backend;
    }
}
```

## 联系支持

如果遇到部署问题，请：

1. 检查本文档的故障排除部分
2. 查看相关日志文件
3. 收集系统信息和错误截图
4. 联系技术支持团队

---

**部署完成后，请务必测试所有功能以确保系统正常运行。**
