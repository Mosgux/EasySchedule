# 变更日志

本文档记录了 EasySchedule 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中

- 邮件通知功能
- 日历集成（Google Calendar、Outlook）
- 数据导出功能（CSV、PDF）
- API 限流和安全增强
- 多语言支持

## [1.0.0] - 2025-01-13

### 新增

- 🎯 **核心功能**
  - 创建时间协商表功能
  - 生成安全的分享链接机制
  - 参与者时间填写功能
  - 可视化时间重叠分析
  - 时间表生命周期管理（锁定/解锁/删除）

- 🎨 **用户界面**
  - 响应式设计，支持移动端
  - 现代化的 Tailwind CSS 设计系统
  - 直观的日历视图和时间选择器
  - 快捷时间选择（上午/下午/晚上）
  - 自定义时间段输入
  - 实时的重叠统计显示

- 🔧 **技术架构**
  - TypeScript 全栈开发
  - React 18 + Vite 前端框架
  - Express + Node.js 后端框架
  - Prisma ORM + SQLite 数据库
  - TanStack Query 状态管理

- 🛡️ **安全与可靠性**
  - nanoid 生成的安全分享链接
  - 输入验证和 SQL 注入防护
  - 错误边界和异常处理
  - 自动数据过期和清理机制

- 📦 **部署与运维**
  - NGINX 反向代理配置
  - Windows Server 2012 R2 兼容
  - 自动化部署脚本
  - 完整的维护工具集
  - 系统监控和健康检查
  - 计划任务支持（备份、清理、维护）

- 📊 **性能优化**
  - 前端代码分割和懒加载
  - 静态资源缓存优化
  - 数据库查询优化
  - 支持 20-30 人并发使用

### 技术规格

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS + Day.js + TanStack Query
- **后端**: Node.js 18.19.0 + Express + TypeScript + Prisma + SQLite
- **部署**: NGINX + Windows Server 2012 R2
- **数据库**: SQLite 单文件数据库，支持自动迁移和清理
- **缓存**: 内存缓存 + 静态资源缓存
- **日志**: Winston 日志系统 + 文件滚动
- **任务调度**: node-cron 定时任务

### 文件结构

```
EasySchedule/
├── backend/                 # Express.js API 服务
│   ├── src/
│   │   ├── api/            # API 路由端点
│   │   ├── services/       # 业务逻辑服务
│   │   ├── middleware/     # 中间件
│   │   ├── utils/          # 工具函数
│   │   └── config/         # 配置文件
│   ├── prisma/             # 数据库 schema 和迁移
│   └── tests/              # 后端测试
├── frontend/               # React 前端应用
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API 服务层
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── utils/          # 前端工具函数
│   │   └── styles/         # 样式文件
│   └── tests/              # 前端测试
├── shared/                 # 共享类型定义和常量
├── docs/                   # 项目文档
│   ├── DEPLOYMENT.md       # 部署指南
│   └── USER_MANUAL.md      # 用户手册
├── scripts/                # 构建和部署脚本
│   ├── deploy-production.bat   # 生产部署脚本
│   ├── maintenance.bat         # 维护工具脚本
│   └── setup-dev.ps1           # 开发环境设置
├── nginx/                  # NGINX 配置
│   ├── easyschedule.conf   # 主配置文件
│   ├── nginx-manager.bat   # NGINX 管理脚本
│   └── install-service.bat # Windows 服务安装
└── specs/                  # 功能规格和设计文档
    └── 001-7-09-00/        # v1.0 功能规格
```

### 数据模型

- **Schedule**: 时间协商表（标题、描述、时区、时间范围、过期时间）
- **Participant**: 参与者（姓名、颜色标识）
- **TimeSlot**: 时间段（开始时间、结束时间、自定义标识）
- **ShareLink**: 分享链接（安全令牌、关联时间表）
- **OverlapStats**: 重叠统计（重叠时间段、参与人数、姓名列表）

### API 端点

- `POST /api/schedules` - 创建时间协商表
- `GET /api/schedules/{id}/share` - 获取分享链接
- `GET /api/share/{token}` - 通过分享链接访问
- `POST /api/schedules/{id}/participants` - 添加参与者
- `PUT /api/participants/{id}/timeslots` - 更新时间段
- `GET /api/schedules/{id}/analytics` - 获取分析数据
- `POST /api/schedules/{id}/lock` - 锁定/解锁时间表
- `DELETE /api/schedules/{id}` - 删除时间表
- `GET /health` - 健康检查

### 已知限制

- 不支持匿名访问之外的认证方式
- 无实时通知功能
- 数据导出功能有限
- 单一数据库实例

### 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 版本说明

### 版本号格式

EasySchedule 遵循语义化版本 (SemVer) 格式：`MAJOR.MINOR.PATCH`

- **MAJOR**: 不兼容的 API 修改
- **MINOR**: 向下兼容的功能性新增
- **PATCH**: 向下兼容的问题修正

### 发布周期

- **主版本**: 根据重大功能更新发布
- **次版本**: 每月或根据功能完成度发布
- **修订版本**: 根据 bug 修复需要随时发布

### 支持政策

- **当前版本**: 完全支持，包括新功能和 bug 修复
- **前一个主版本**: 仅提供关键安全更新和 bug 修复
- **更早版本**: 不再维护

---

更多信息请查看：

- [部署指南](docs/DEPLOYMENT.md)
- [用户手册](docs/USER_MANUAL.md)
- [项目 README](README.md)
