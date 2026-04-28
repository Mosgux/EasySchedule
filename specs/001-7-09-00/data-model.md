# Data Model: 多人时间协商可视化系统

**Purpose**: 定义系统数据结构和关系
**Created**: 2025-01-13
**Status**: Complete

## 核心实体设计

### 1. Schedule (时间表)

```prisma
model Schedule {
  id              String   @id @default(cuid())
  title           String
  description     String?
  timezone        String   @default("Asia/Shanghai")
  startDate       DateTime // 时间范围开始日期
  endDate         DateTime // 时间范围结束日期 (startDate + 7 days)
  expiresAt       DateTime // 过期时间
  isLocked        Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // 关联关系
  participants    Participant[]
  shareLink       ShareLink?
  overlapStats    OverlapStats[]

  @@map("schedules")
}
```

**字段说明**:

- `id`: 使用cuid()生成唯一标识符
- `title`: 时间表标题
- `description`: 可选描述信息
- `timezone`: 时区设置，默认为亚洲/上海
- `startDate/endDate`: 7天时间范围
- `expiresAt`: 过期时间，默认创建后7天
- `isLocked`: 是否锁定，锁定后参与者无法修改

### 2. Participant (参与者)

```prisma
model Participant {
  id            String    @id @default(cuid())
  scheduleId    String
  name          String
  color         String    @default("") // 分配的颜色标识
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 关联关系
  schedule      Schedule  @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  timeSlots     TimeSlot[]

  @@unique([scheduleId, name]) // 同一时间表内姓名唯一
  @@map("participants")
}
```

**字段说明**:

- `name`: 参与者姓名，在同一时间表内必须唯一
- `color`: 分配给参与者的颜色，用于可视化
- `scheduleId + name`: 复合唯一约束

### 3. TimeSlot (时间段)

```prisma
model TimeSlot {
  id            String   @id @default(cuid())
  participantId String
  startTime     DateTime // 开始时间 (包含日期)
  endTime       DateTime // 结束时间 (包含日期)
  isCustom      Boolean  @default(false) // 是否为自定义时间段

  // 关联关系
  participant   Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)

  @@map("time_slots")
}
```

**字段说明**:

- `startTime/endTime`: 具体的开始和结束时间，包含日期信息
- `isCustom`: 标识是否为用户自定义的精细时间段

### 4. ShareLink (分享链接)

```prisma
model ShareLink {
  id          String   @id @default(cuid())
  scheduleId  String   @unique
  token       String   @unique // 难以枚举的访问令牌
  createdAt   DateTime @default(now())

  // 关联关系
  schedule    Schedule  @relation(fields: [scheduleId], references: [id], onDelete: Cascade)

  @@map("share_links")
}
```

**字段说明**:

- `token`: 使用nanoid生成的难以枚举的访问令牌
- `scheduleId`: 关联的时间表ID

### 5. OverlapStats (重叠统计)

```prisma
model OverlapStats {
  id                    String   @id @default(cuid())
  scheduleId            String
  startTime             DateTime // 重叠时间段开始时间
  endTime               DateTime // 重叠时间段结束时间
  participantCount      Int      // 重叠参与者数量
  participantNames      String   // 参与者姓名列表（JSON格式）
  createdAt             DateTime @default(now())

  // 关联关系
  schedule              Schedule  @relation(fields: [scheduleId], references: [id], onDelete: Cascade)

  @@index([scheduleId, startTime])
  @@map("overlap_stats")
}
```

**字段说明**:

- `startTime/endTime`: 重叠时间段的开始和结束时间
- `participantCount`: 该时间段内重叠的参与者数量
- `participantNames`: 重叠参与者的姓名列表，以JSON格式存储

## 数据验证规则

### 时间表验证

- `endDate` 必须等于 `startDate` + 7天
- `expiresAt` 必须晚于 `createdAt`
- `timezone` 必须是有效的IANA时区标识符

### 参与者验证

- `name` 长度限制：1-50字符
- `name` 不能包含特殊字符，只允许中文、英文、数字、下划线

### 时间段验证

- `endTime` 必须晚于 `startTime`
- 时间段必须在时间表的日期范围内
- 时间段粒度：30分钟的倍数
- 单个时间段的持续时间：30分钟 - 12小时

### 业务规则验证

- 同一时间表内参与者姓名不能重复
- 锁定的时间表不允许新增/修改时间段
- 过期的时间表不允许任何修改操作

## 索引设计

```sql
-- 性能优化索引
CREATE INDEX idx_participants_schedule_id ON participants(scheduleId);
CREATE INDEX idx_time_slots_participant_id ON time_slots(participantId);
CREATE INDEX idx_time_slots_schedule_id ON time_slots(participantId)
  WHERE participant_id IN (SELECT id FROM participants WHERE schedule_id = ?);
CREATE INDEX idx_schedules_expires_at ON schedules(expiresAt);
CREATE INDEX idx_share_links_token ON share_links(token);
CREATE INDEX idx_overlap_stats_schedule_start ON overlap_stats(scheduleId, startTime);
```

## 状态转换

### 时间表状态

```
创建 → 活跃 → 锁定 → 过期 → 删除
     ↑       ↓
     └─── 解锁 ←─┘
```

### 参与者操作权限

```
未锁定: 可以创建/修改/删除时间段
已锁定: 只能查看，不能修改
已过期: 只能查看，不能修改
```

## 数据生命周期

### 自动清理策略

- 过期时间表：过期后7天自动删除
- 无参与者时间表：创建后24小时自动删除
- 测试数据：开发环境可配置 shorter TTL

### 备份策略

- 重要时间表：锁定后自动备份
- 用户操作：关键操作记录审计日志

## 扩展性考虑

### 未来可能的扩展

- **通知系统**: 参与者提交时间时的邮件通知
- **投票功能**: 对最优时间段进行投票
- **重复时间表**: 支持周期性时间协商
- **集成功能**: 与日历应用集成

### 扩展点设计

- 预留 `metadata` 字段支持扩展属性
- 使用枚举类型支持新的状态
- 模块化设计便于功能扩展

## 性能考虑

### 查询优化

- 时间表查询：使用索引优化
- 重叠计算：在应用层进行，减少数据库压力
- 大量数据：考虑分页或虚拟化

### 缓存策略

- 时间表基础信息：Redis缓存，TTL 1小时
- 参与者列表：内存缓存，实时更新
- 重叠计算结果：缓存5分钟

## 数据迁移策略

### 版本控制

- 使用Prisma migrate管理数据库版本
- 向后兼容的字段添加
- 数据迁移脚本和回滚策略

### 初始化数据

- 默认时区配置
- 系统颜色方案
- 示例数据（开发环境）
