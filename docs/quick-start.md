# EasySchedule 快速开始指南

## 🚀 5分钟快速启动

### 前置要求

- Node.js 18+
- Git

### 方法一：一键启动（Windows 推荐）

```powershell
# 克隆项目
git clone <repository-url>
cd EasySchedule

# 一键启动（最简单）
.\start_easyschedule.bat
```

### 方法二：手动设置

#### 1. 克隆并安装

```bash
git clone <repository-url>
cd EasySchedule

# Windows 用户：使用设置脚本
.\scripts\setup-dev-simple.ps1

# Linux/macOS 用户：
./scripts/setup-dev.sh
```

#### 2. 修复共享模块依赖（重要）

```bash
cd shared && npm run build && cd ..
cd frontend && npm install ../shared && cd ..
```

#### 3. 初始化数据库

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

#### 4. 启动开发服务器

```bash
# 返回根目录
cd ..
npm run dev
```

### 4. 访问应用

- 前端: http://localhost:5173/EasySchedule
- 后端API: http://localhost:4000/api

## 📝 基础使用

### 创建时间协商表

1. 访问首页，填写表单信息
2. 设置标题、描述、时区和时间范围
3. 点击"创建时间协商表"
4. 复制生成的分享链接

### 分享给参与者

- 将分享链接发送给参与者
- 参与者无需注册，直接填写时间
- 实时查看参与情况

## 🛠️ 开发命令

```bash
# 开发
npm run dev              # 启动前后端开发服务器
npm run dev:backend      # 仅启动后端
npm run dev:frontend     # 仅启动前端

# 构建
npm run build            # 构建所有项目
npm run build:backend    # 构建后端
npm run build:frontend   # 构建前端

# 测试
npm test                 # 运行所有测试
npm run lint             # 代码检查
npm run lint:fix         # 自动修复代码格式

# 数据库
cd backend
npx prisma studio        # 打开数据库管理界面
npx prisma migrate dev   # 运行迁移
npx prisma generate      # 生成客户端
```

## 🔧 环境配置

### 后端 (.env)

```env
DATABASE_URL="file:./data/easy.db"
PORT=4000
NODE_ENV=development
JWT_SECRET=your-secret-key
```

### 前端 (.env)

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SHARE_BASE_URL=http://localhost:5173/EasySchedule
```

## 📁 项目结构

```
EasySchedule/
├── backend/          # Express.js API
├── frontend/         # React 前端
├── shared/           # 共享类型
├── docs/             # 文档
├── specs/            # 功能规格
└── scripts/          # 脚本
```

## 🆘 故障排除

### 常见问题

**Q: Vite 导入错误 `@/shared/constants` 失败**

```bash
# 解决方案：确保共享模块已构建并在前端安装
cd shared && npm run build && cd ..
cd frontend && npm install ../shared && cd ..
```

**Q: PowerShell 执行策略错误**

```powershell
# 解决方案：设置执行策略
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Q: esbuild 平台包缺失（Windows）**

```bash
# 解决方案：安装 Windows 平台包
npm install @esbuild/win32-x64 --force
```

**Q: Tailwind CSS 变量未定义错误**

- 确保使用标准 Tailwind 类，避免 `bg-background`、`border-border` 等自定义变量
- 检查 `frontend/src/styles/globals.css` 文件

**Q: 端口被占用怎么办？**
A: 前端会自动使用 5174 如果 5173 被占用，或修改 `.env` 文件中的 `PORT` 配置

**Q: 数据库在哪里？**
A: 位于 `backend/data/easy.db`

**Q: 如何重置数据库？**
A: 删除 `backend/data/easy.db` 后重新运行迁移

### 健康检查

运行健康检查脚本诊断问题：

```powershell
.\scripts\health-check.ps1
```

### 开发脚本

- **Windows 批处理**: `./start_easyschedule.bat` (启动开发环境)
- **Windows 停止**: `./stop_easyschedule.bat` (关闭开发环境)
- **PowerShell**: `powershell -ExecutionPolicy Bypass -File ./manage_easyschedule.ps1 -Action start -Profile dev`
- **Linux/macOS**: `./scripts/setup-dev.sh && npm run dev`

详细文档请参考 [部署指南](./deployment-guide.md)
