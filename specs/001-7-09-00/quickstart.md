# Quick Start Guide: 多人时间协商可视化系统

**Purpose**: 开发环境搭建和快速启动指南
**Created**: 2025-01-13
**Updated**: 2025-01-13

## 系统要求

### 开发环境

- **Node.js**: 18.19.0 或更高版本
- **npm**: 9.0.0 或更高版本
- **Git**: 2.30.0 或更高版本
- **操作系统**: Windows 10/11 或 Windows Server 2012 R2+

### 运行时环境

- **数据库**: SQLite 3.x (自动安装)
- **Web服务器**: NGINX (生产环境)
- **反向代理**: NGINX (生产环境)

## 项目结构

```
easyschedule/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── models/         # Prisma模型
│   │   ├── services/       # 业务逻辑
│   │   ├── api/           # API路由
│   │   ├── middleware/    # 中间件
│   │   ├── utils/         # 工具函数
│   │   └── config/        # 配置文件
│   ├── prisma/            # 数据库schema和迁移
│   ├── tests/             # 测试文件
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   ├── utils/         # 工具函数
│   │   ├── hooks/         # 自定义Hooks
│   │   └── styles/        # 样式文件
│   ├── public/            # 静态资源
│   ├── tests/             # 测试文件
│   └── package.json
├── shared/                # 共享类型和常量
│   ├── types/            # TypeScript类型定义
│   └── constants/        # 常量定义
├── nginx/                 # NGINX配置
├── scripts/              # 构建和部署脚本
└── docs/                 # 项目文档
```

## 快速启动

### 1. 克隆项目

```bash
git clone <repository-url>
cd easyschedule
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install

# 返回根目录
cd ..
```

### 3. 环境配置

#### 后端环境变量 (.env)

```env
# 数据库配置
DATABASE_URL="file:./data/easy.db"

# 服务器配置
PORT=4000
NODE_ENV=development

# 安全配置
JWT_SECRET=your-super-secret-jwt-key
NANOID_SIZE=12

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# 缓存配置 (可选)
REDIS_URL=redis://localhost:6379

# 清理任务配置
CLEANUP_INTERVAL="0 2 * * *" # 每天凌晨2点清理
```

#### 前端环境变量 (.env)

```env
# API配置
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SHARE_BASE_URL=http://localhost:5173/EasySchedule

# 应用配置
VITE_APP_TITLE=EasySchedule - 多人时间协商
VITE_APP_VERSION=1.0.0

# 功能开关
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
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

### 5. 启动开发服务器

```bash
# 启动后端服务 (终端1)
cd backend
npm run dev

# 启动前端服务 (终端2)
cd frontend
npm run dev
```

### 6. 访问应用

- **前端应用**: http://localhost:5173/EasySchedule
- **后端API**: http://localhost:4000/api
- **API文档**: http://localhost:4000/api/docs (如果启用)

## 核心功能验证

### 1. 创建时间表

1. 访问 http://localhost:5173/EasySchedule
2. 填写时间表标题、描述
3. 选择时间范围和时区
4. 点击"创建"按钮
5. 复制生成的分享链接

### 2. 参与者填写

1. 使用分享链接访问时间表
2. 输入参与者姓名
3. 选择可用时间段（快捷选项或自定义）
4. 提交时间信息

### 3. 查看可视化结果

1. 刷新页面查看所有参与者的时间
2. 观察颜色叠加的重叠区域
3. 查看底部的统计信息

## 开发工作流

### 1. 创建新功能

```bash
# 创建功能分支
git checkout -b feature/new-feature-name

# 开发和测试
# ... 编写代码 ...

# 提交代码
git add .
git commit -m "feat: add new feature description"
git push origin feature/new-feature-name
```

### 2. 数据库迁移

```bash
cd backend

# 修改schema.prisma文件
# ...

# 创建迁移文件
npx prisma migrate dev --name migration-description

# 应用迁移
npx prisma migrate deploy
```

### 3. 测试

```bash
# 后端测试
cd backend
npm test                    # 单元测试
npm run test:integration     # 集成测试

# 前端测试
cd frontend
npm test                    # 单元测试
npm run test:e2e           # 端到端测试
```

## 生产部署

### 1. 构建应用

```bash
# 构建前端
cd frontend
npm run build

# 构建后端 (通常不需要，Node.js直接运行)
cd ../backend
npm run build
```

### 2. 配置NGINX

```nginx
# /etc/nginx/sites-available/easyschedule
server {
    listen 80;
    server_name www.neemo.tech;

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
    }
}
```

### 3. 部署脚本

```bash
#!/bin/bash
# scripts/deploy.sh

# 构建前端
echo "Building frontend..."
cd frontend && npm run build && cd ..

# 更新后端代码
echo "Updating backend..."
cd backend && npm install --production && cd ..

# 重启后端服务
echo "Restarting backend service..."
sudo systemctl restart easyschedule-backend

# 重新加载NGINX
echo "Reloading NGINX..."
sudo systemctl reload nginx

echo "Deployment completed!"
```

## 常见问题

### Q: 数据库文件在哪里？

A: SQLite数据库文件位于 `backend/data/easy.db`

### Q: 如何修改端口？

A: 修改 `backend/.env` 文件中的 `PORT` 变量

### Q: 如何重置数据库？

A: 删除 `backend/data/easy.db` 文件，然后重新运行 `npx prisma migrate dev`

### Q: 前端路由配置

A: React Router配置了 `basename="/EasySchedule"`，确保与NGINX路径一致

### Q: 时区问题

A: 所有时间都存储为UTC，在应用层根据用户设置的时区进行转换

## 监控和日志

### 应用日志

```bash
# 查看后端日志
tail -f backend/logs/app.log

# 查看错误日志
tail -f backend/logs/error.log
```

### 系统监控

```bash
# 检查服务状态
systemctl status easyschedule-backend
systemctl status nginx

# 查看资源使用
htop
df -h
```

## 下一步

1. **功能开发**: 参考规格说明实现具体功能
2. **测试**: 编写单元测试和集成测试
3. **性能优化**: 根据性能指标进行优化
4. **部署**: 配置生产环境和CI/CD流程

## 技术支持

- **项目文档**: `/docs` 目录
- **API文档**: 启动后端服务后访问 `/api/docs`
- **问题反馈**: 创建GitHub Issue
- **团队协作**: 参考项目README中的协作指南
