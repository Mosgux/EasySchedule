# Implementation Plan: 多人时间协商可视化系统

**Branch**: `001-7-09-00` | **Date**: 2025-01-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-7-09-00/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

EasySchedule是一个多人时间协商可视化系统，允许用户创建时间协商表、分享链接、收集参与者可用时间并通过日历视图进行可视化分析。核心功能包括无账号系统的参与者管理、快捷时间选择、重叠时间段分析和自动数据生命周期管理。

技术方案采用前后端分离架构：前端使用React 18 + Vite + TypeScript + Tailwind CSS，后端使用Node.js + Express + TypeScript + SQLite + Prisma，部署通过NGINX反向代理在Windows Server 2012 R2环境下运行。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (Frontend + Backend)
**Primary Dependencies**: React 18 + Vite + Node.js 18.19.0 + Express + Tailwind CSS + Day.js + TanStack Query
**Storage**: SQLite (单文件：C:\apps\EasySchedule\data\easy.db)
**Testing**: Vitest + Playwright (端到端测试)
**Target Platform**: Windows Server 2012 R2 + NGINX (Web应用)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: 支持20-30人同时使用，页面加载<3秒，图表渲染<500ms
**Constraints**: 无账号系统，仅收集名字+时段+表ID，统一时区处理，Tailwind CSS统一UI
**Scale/Scope**: 多人时间协商应用，支持日历视图可视化

**关键技术选择**:

- **前端框架**: React 18 + Vite (现代化构建工具，快速开发)
- **路由**: React Router (basename="/EasySchedule")
- **时间处理**: Day.js (轻量级，支持时区和本地化)
- **状态管理**: TanStack Query (服务端状态同步)
- **UI渲染**: DOM/SVG + CSS Grid (非图片生成，性能优化)
- **后端框架**: Express + TypeScript (成熟稳定)
- **数据库ORM**: Prisma (类型安全，简化迁移)
- **ID生成**: nanoid (难以枚举的分享链接)
- **定时任务**: node-cron (自动清理过期数据)
- **日志系统**: winston (文件滚动)
- **部署方案**: NGINX反向代理，前端静态文件，后端监听4000端口

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**EasySchedule宪章检查点**:

- [x] 简洁第一：功能是否聚焦"凑时间"核心流程？ ✅ 是的，专注于时间协商的核心需求
- [x] 无账号/轻隐私：是否仅收集必要信息（名字+时段+表ID）？ ✅ 是的，使用nanoid生成分享链接，无需注册
- [x] 一致性与正确性：时区处理是否统一？ ✅ 是的，使用Day.js统一处理时区
- [x] 可读可维护：是否使用TypeScript，结构是否清晰？ ✅ 是的，前后端都使用TypeScript
- [x] 可靠与可恢复：是否支持撤销/重填，容错设计？ ✅ 是的，参与者可随时修改，有错误处理
- [x] 明确生命周期：是否有数据过期策略？ ✅ 是的，node-cron定时清理过期数据
- [x] 性能可接受：是否支持20-30人规模流畅使用？ ✅ 是的，目标支持20-30人，DOM/SVG渲染优化
- [x] 安全"够用就好"：是否有基础校验和防注入？ ✅ 是的，基础输入校验和轻量限速
- [x] 可部署性：是否兼容Windows Server 2012 R2 + NGINX？ ✅ 是的，明确部署方案
- [x] UI统一：是否使用Tailwind CSS设计系统？ ✅ 是的，统一使用Tailwind CSS

**宪章检查结果**: ✅ 全部通过，无违规项，可以继续下一阶段

**设计阶段重新评估**:

- [x] 简洁第一：数据模型设计简洁，API设计专注于核心功能
- [x] 无账号/轻隐私：仅收集必要信息，使用token机制保护访问
- [x] 一致性与正确性：时区处理统一，数据模型支持时区转换
- [x] 可读可维护：前后端TypeScript统一，清晰的模块化设计
- [x] 可靠与可恢复：支持数据修改和错误恢复，完整的错误处理
- [x] 明确生命周期：自动清理过期数据，手动销毁支持
- [x] 性能可接受：数据模型优化，缓存策略，支持20-30人并发
- [x] 安全"够用就好"：基础校验、SQL注入防护、访问控制
- [x] 可部署性：明确部署方案，NGINX配置，Docker支持
- [x] UI统一：Tailwind CSS设计系统，统一的颜色方案

**最终宪章评估**: ✅ 优秀，完全符合项目宪章要求

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```
# EasySchedule项目结构 (Web应用)
backend/
├── src/
│   ├── models/          # 数据模型 (时间表、用户时段等)
│   ├── services/        # 业务逻辑 (时区处理、数据验证等)
│   ├── api/            # API路由和中间件
│   ├── utils/          # 工具函数
│   └── config/         # 配置文件
├── tests/
│   ├── contract/       # API合约测试
│   ├── integration/    # 集成测试
│   └── unit/          # 单元测试
└── package.json

frontend/
├── src/
│   ├── components/     # UI组件 (日历视图、时间选择器等)
│   ├── pages/         # 页面组件
│   ├── services/      # 前端服务 (API调用、状态管理)
│   ├── utils/         # 工具函数 (时区转换等)
│   └── styles/        # Tailwind CSS配置
├── public/
├── tests/
└── package.json

shared/
├── types/             # 共享TypeScript类型定义
└── constants/         # 共享常量

docs/                  # 项目文档
nginx/                 # NGINX配置
scripts/               # 部署和维护脚本
```

**Structure Decision**: 采用Web应用架构，前后端分离，使用TypeScript统一开发。backend/目录负责API和数据处理，frontend/目录负责用户界面和交互，shared/目录存放共享类型定义，确保前后端类型一致性。

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
