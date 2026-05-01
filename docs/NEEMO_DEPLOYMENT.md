# EasySchedule 部署指南 (schedule.neemo.tech)

## 概述

本指南说明如何将 EasySchedule 部署到 schedule.neemo.tech 域名，并通过根路径直接访问应用。

## 配置文件

### 1. NGINX 配置

已创建专用配置文件：`nginx/neemo-easyschedule.conf`

主要特性：

- **域名**: schedule.neemo.tech
- **前端代理**: http://127.0.0.1:5173 (Vite 开发服务器)
- **后端代理**: http://127.0.0.1:4000 (Node.js API)
- **路径**: /

### 2. 环境变量配置

**前端** (`frontend/.env`)：

```env
VITE_API_BASE_URL=/api
VITE_SHARE_BASE_URL=https://schedule.neemo.tech
```

**后端** (`backend/.env`)：

```env
DATABASE_URL="file:./data/easy.db"
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://schedule.neemo.tech
SHARE_BASE_URL=https://schedule.neemo.tech
```

### 3. Vite 配置

前端已配置为根路径部署：

```typescript
base: '/',
```

## 部署步骤

### 1. 停止现有服务

```bash
# 运行停止脚本
stop_easyschedule.bat server

# 或手动停止
taskkill /f /im node.exe
taskkill /f /im nginx.exe
```

### 2. 启动所有服务

```bash
# 首次或更新后先构建前端静态文件
npm run build:frontend

# 运行启动脚本
start_easyschedule.bat server

# 脚本会自动：
# 1. 启动后端服务 (端口 4000)
# 2. 使用 frontend/dist 提供静态前端资源
# 3. 启动 NGINX 代理
```

### 3. 验证部署

访问以下地址验证：

- **主应用**: https://schedule.neemo.tech/
- **API测试**: https://schedule.neemo.tech/health
- **分享链接**: https://schedule.neemo.tech/share/{token}

## 访问地址

### 主要功能

- **首页**: https://schedule.neemo.tech/
- **创建时间表**: https://schedule.neemo.tech/
- **参与者页面**: https://schedule.neemo.tech/share/{token}
- **可视化结果**: https://schedule.neemo.tech/schedule/{id}

### API 端点

- **健康检查**: GET https://schedule.neemo.tech/health
- **创建时间表**: POST https://schedule.neemo.tech/api/schedules
- **获取分享信息**: GET https://schedule.neemo.tech/api/share/{token}

## 运行说明

新的服务器模式使用构建后的前端静态文件和 `backend` 的生产启动命令：

- 启动命令：`start_easyschedule.bat server`
- 停止命令：`stop_easyschedule.bat server`
- 状态查看：`powershell -ExecutionPolicy Bypass -File .\manage_easyschedule.ps1 -Action status -Profile server`
- 前端更新后需要重新执行：`npm run build:frontend`

## 故障排除

### 1. 端口冲突

如果 5173 或 4000 端口被占用：

```bash
# 查看端口占用
netstat -an | findstr ":5173"
netstat -an | findstr ":4000"

# 终止占用进程
taskkill /f /im node.exe
```

### 2. NGINX 配置错误

```bash
# 测试配置
nginx -t -c C:/nginx/conf/neemo-easyschedule.conf

# 查看 NGINX 错误日志
type C:/apps/EasySchedule/logs/nginx_error.log
```

### 3. 前端无法访问

检查：

1. Vite 开发服务器是否启动 (端口 5173)
2. 环境变量是否正确设置
3. NGINX 配置是否正确

### 4. API 调用失败

检查：

1. 后端服务是否启动 (端口 4000)
2. CORS 配置是否正确
3. 防火墙是否阻止连接

## 维护操作

### 重启服务

```bash
# 停止服务
stop_easyschedule.bat server

# 等待几秒

# 重新启动
start_easyschedule.bat server
```

### 更新代码

前端静态文件变更后需要重新执行 `npm run build:frontend`，然后重启服务。

### 查看日志

```bash
# 前端日志 (在启动的命令窗口中查看)
# 后端日志
type C:/apps/EasySchedule/logs/app.log

# NGINX 日志
type C:/apps/EasySchedule/logs/nginx_access.log
type C:/apps/EasySchedule/logs/nginx_error.log
```

## 安全注意事项

1. **CORS 配置**: 只允许 www.neemo.tech 域名访问 API
2. **网络安全**: 确保只有必要的端口对外开放
3. **数据安全**: 定期备份数据库文件
4. **访问控制**: 建议在生产环境中添加适当的认证机制

## 性能优化

开发模式适用于测试和小规模使用。如需生产级性能：

1. 构建生产版本：`npm run build`
2. 使用 PM2 管理进程
3. 配置 CDN 缓存
4. 优化数据库查询

## 联系支持

如遇到部署问题，请：

1. 检查本指南的故障排除部分
2. 查看相关日志文件
3. 确认防火墙和网络配置
4. 验证域名解析是否正确

---

**部署完成后，访问 http://www.neemo.tech/EasySchedule/ 即可使用 EasySchedule！**
