# EasySchedule - 多人时间协商可视化系统

一个简单易用的多人时间协商工具，帮助团队快速找到最佳会议时间。无需注册，分享链接即可收集参与者时间。

## ✨ 特性

- 🚀 **快速创建** - 几秒钟内创建时间协商表
- 🔗 **分享链接** - 生成安全的分享链接，参与者无需注册
- 📊 **可视化分析** - 自动分析重叠时间，直观显示最佳时间段
- 🌍 **时区支持** - 统一时区处理，支持全球团队协作
- 📱 **响应式设计** - 完美适配手机、平板和桌面设备
- 🔒 **安全可靠** - 数据自动过期，保护用户隐私

## 🛠️ 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + TypeScript + Prisma
- **数据库**: SQLite (轻量级，易于部署)
- **部署**: NGINX + Windows Server 2012 R2+

## 🚀 快速开始

### 系统要求

- Node.js 18.19.0+
- npm 9.0.0+
- Git

### 一键设置开发环境

```bash
# 克隆项目
git clone <repository-url>
cd EasySchedule

# 运行设置脚本
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh

# 启动开发服务器
npm run dev
```

### 手动设置

1. **安装依赖**

   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ../shared && npm install
   ```

2. **初始化数据库**

   ```bash
   cd backend
   npx prisma migrate dev --name init
   npx prisma generate
   ```

3. **配置环境变量**

   ```bash
   # 后端
   cp backend/.env.example backend/.env

   # 前端
   cp frontend/.env.example frontend/.env
   ```

4. **启动服务**

   ```bash
   # 同时启动前后端
   npm run dev

   # 或分别启动
   npm run dev:backend  # 后端: http://localhost:4000
   npm run dev:frontend # 前端: http://localhost:5173/EasySchedule
   ```

## 📖 使用指南

### 创建时间协商表

1. 访问首页填写表单信息
2. 设置标题、描述、时区和7天时间范围
3. 点击创建，获得分享链接

### 参与者填写时间

1. 通过分享链接访问
2. 输入姓名，选择可用时间段
3. 支持快捷选择和自定义时间段

### 查看协商结果

1. 实时查看参与者提交情况
2. 可视化显示时间重叠区域
3. 快速找到最佳时间段

## 🗂️ 项目结构

```
EasySchedule/
├── backend/                 # Express.js API 服务
│   ├── src/
│   │   ├── api/            # API 路由
│   │   ├── services/       # 业务逻辑
│   │   ├── middleware/     # 中间件
│   │   ├── utils/          # 工具函数
│   │   └── config/         # 配置文件
│   ├── prisma/             # 数据库 schema
│   └── tests/              # 测试文件
├── frontend/               # React 前端应用
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API 服务
│   │   ├── hooks/          # 自定义 Hooks
│   │   └── styles/         # 样式文件
│   └── tests/              # 测试文件
├── shared/                 # 共享类型和常量
├── docs/                   # 项目文档
├── scripts/                # 构建和部署脚本
└── nginx/                  # NGINX 配置
```

## 🔧 开发命令

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
npm test                 # 运行测试
npm run test:e2e        # 端到端测试

# 代码质量
npm run lint             # 代码检查
npm run lint:fix         # 自动修复格式

# 数据库
cd backend
npx prisma studio        # 数据库管理界面
npx prisma migrate dev   # 运行迁移
npx prisma generate      # 生成客户端
```

## 🚀 部署

### 生产环境部署

```bash
# 构建应用
npm run build

# 运行部署脚本
chmod +x scripts/deploy.sh
sudo ./scripts/deploy.sh
```

详细部署指南请参考 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
用户使用手册请参考 [docs/USER_MANUAL.md](docs/USER_MANUAL.md)

### Docker 部署 (可选)

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

## 📊 功能状态

### ✅ 已完成 (v1.0)

- [x] 创建时间协商表
- [x] 生成分享链接
- [x] 参与者时间填写功能
- [x] 可视化时间重叠分析
- [x] 时间表生命周期管理（锁定/解锁/删除）
- [x] 响应式设计和移动端适配
- [x] 自动数据清理和过期管理
- [x] 错误处理和加载状态
- [x] NGINX 部署配置
- [x] 完整的维护和部署脚本

### 📋 计划中 (v1.1+)

- [ ] 邮件通知功能
- [ ] 日历集成（Google Calendar、Outlook）
- [ ] 数据导出功能（CSV、PDF）
- [ ] 高级分析功能
- [ ] 多语言支持
- [ ] API 限流和安全增强

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 支持

- 📖 [文档](docs/)
- 🐛 [问题反馈](https://github.com/your-repo/EasySchedule/issues)
- 💬 [讨论区](https://github.com/your-repo/EasySchedule/discussions)

## 🎯 路线图

### v1.0 (当前 MVP)

- 基础时间协商功能
- 分享链接机制
- 响应式界面

### v1.1 (计划中)

- 参与者时间填写
- 可视化分析
- 移动端优化

### v1.2 (未来)

- 高级分析功能
- 邮件通知
- 数据导出

---

**EasySchedule** - 让时间协商变得简单高效 🚀
