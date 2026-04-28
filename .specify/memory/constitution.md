<!--
Sync Impact Report:
Version change: N/A → 1.0.0 (initial constitution)
Modified principles: N/A (initial creation)
Added sections: Core Principles (10), Technical Constraints, Development Workflow, Governance
Removed sections: N/A
Templates requiring updates: ⚠ plan-template.md, ⚠ spec-template.md, ⚠ tasks-template.md (need review for EasySchedule alignment)
Follow-up TODOs: N/A
-->

# EasySchedule Constitution

## Core Principles

### I. 简洁第一

功能聚焦"凑时间"核心流程，拒绝非必要功能与复杂化。每个功能都必须直接服务于多人时间协商的核心需求，避免功能膨胀和用户认知负担。

### II. 无账号/轻隐私

不做登录系统；仅收集"名字+可用时段+表ID"这三项必要信息，不采集任何额外个人信息。用户数据最小化原则，确保隐私保护。

### III. 一致性与正确性

时区处理统一；所有参与者看到的时间严格一致（以表的时区为准，客户端可转换显示）。时间数据在服务器端统一管理，避免因时区差异导致的协调错误。

### IV. 可读可维护

前后端均使用 TypeScript；目录清晰，命名统一，注释简明。代码结构必须易于理解和维护，新贡献者能快速上手。

### V. 可靠与可恢复

任何用户输入都可撤销/重填；不会因单个错误导致全表不可用。系统必须具备容错能力，用户操作失误不应影响其他参与者的数据。

### VI. 明确生命周期

每个"凑时间表"有明确过期策略与人工销毁入口，并有后台定时清理。防止数据无限累积，确保系统资源合理使用。

### VII. 性能可接受

DOM/SVG 渲染的日历视图在 20-30 人规模仍保持流畅。界面响应速度必须满足实际使用场景，避免因性能问题影响用户体验。

### VIII. 安全"够用就好"

基础输入校验、防注入；分享链接难以枚举；不引入复杂权限体系。安全措施必须与项目复杂度匹配，避免过度设计。

### IX. 可部署性

保证在 Windows Server 2012 R2 + NGINX 路由 /EasySchedule 下稳定运行。部署环境必须明确，确保在目标服务器环境中稳定运行。

### X. UI 统一

严格使用 Tailwind CSS 设计系统与统一色板，保证一致的观感与交互。界面设计必须保持一致性，提升用户体验。

## Technical Constraints

### 技术栈要求

- 前端：TypeScript + 现代前端框架（React/Vue/Angular等）
- 后端：TypeScript + Node.js
- 数据库：轻量级数据库（SQLite/PostgreSQL等）
- UI框架：Tailwind CSS
- 部署：Windows Server 2012 R2 + NGINX

### 性能标准

- 支持20-30人同时使用不出现明显卡顿
- 页面加载时间不超过3秒
- 时间图表渲染响应时间不超过500ms

### 兼容性要求

- 支持现代浏览器（Chrome/Firefox/Safari/Edge最新版本）
- 响应式设计，支持移动端访问
- 时区处理支持全球主要时区

## Development Workflow

### 开发流程

1. 功能需求分析 → 技术方案设计 → 代码实现 → 测试验证 → 部署上线
2. 所有代码必须经过Code Review
3. 功能测试必须覆盖核心用户场景
4. 部署前必须进行完整的功能测试

### 质量标准

- 代码覆盖率不低于80%
- 所有API必须有文档说明
- 关键功能必须有集成测试
- 用户体验必须经过实际用户验证

## Governance

### 宪章优先级

本宪章优先于所有其他开发规范和实践。任何与宪章冲突的决策必须以宪章为准。

### 修订流程

- 宪章修订需要团队讨论一致通过
- 修订必须记录变更原因和影响范围
- 重大修订需要通知所有项目相关人员
- 修订后的宪章必须更新版本号

### 合规性审查

- 所有代码合并前必须检查是否符合宪章原则
- 定期审查项目开发过程是否符合宪章要求
- 发现违反宪章的情况必须及时纠正
- 使用宪章作为开发过程中的决策依据

**Version**: 1.0.0 | **Ratified**: 2025-01-13 | **Last Amended**: 2025-01-13
