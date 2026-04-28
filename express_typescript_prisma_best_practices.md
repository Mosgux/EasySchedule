# Express + TypeScript + Prisma + SQLite 最佳实践指南

## 多人时间协商系统后端架构

### 目录

1. [Prisma模型设计和关系定义](#prisma模型设计和关系定义)
2. [Express API架构设计和中间件配置](#express-api架构设计和中间件配置)
3. [数据库迁移和版本管理](#数据库迁移和版本管理)
4. [性能优化策略](#性能优化策略)
5. [错误处理和日志记录](#错误处理和日志记录)
6. [安全性最佳实践](#安全性最佳实践)
7. [完整项目结构示例](#完整项目结构示例)

## Prisma模型设计和关系定义

### 核心数据模型设计

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// 时间表实体 - 核心业务对象
model Schedule {
  id          String   @id @default(cuid())
  title       String
  description String?

  // 时间配置
  startDate   DateTime // 开始日期 (UTC)
  endDate     DateTime // 结束日期 (UTC)
  timezone    String   @default("UTC") // 时区标识符，如 "Asia/Shanghai"

  // 时间段定义
  morningStart   String @default("09:00") // 上午开始时间
  morningEnd     String @default("12:00") // 上午结束时间
  afternoonStart String @default("13:00") // 下午开始时间
  afternoonEnd   String @default("18:00") // 下午结束时间
  eveningStart   String @default("19:00") // 晚上开始时间
  eveningEnd     String @default("21:00") // 晚上结束时间

  // 生命周期管理
  expiresAt   DateTime // 过期时间
  isLocked    Boolean  @default(false) // 是否锁定
  isDeleted   Boolean  @default(false) // 软删除标记

  // 元数据
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关系
  participants Participant[]

  @@index([expiresAt])
  @@index([isDeleted])
  @@index([createdAt])
}

// 参与者实体
model Participant {
  id          String   @id @default(cuid())
  scheduleId  String
  name        String

  // 颜色标识（用于可视化）
  color       String   @default("") // 十六进制颜色值

  // 元数据
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关系
  schedule    Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  timeSlots   TimeSlot[]

  @@unique([scheduleId, name]) // 确保同一时间表内姓名唯一
  @@index([scheduleId])
  @@index([name])
}

// 时间段实体
model TimeSlot {
  id           String   @id @default(cuid())
  participantId String
  startTime    DateTime // 开始时间 (UTC)
  endTime      DateTime // 结束时间 (UTC)

  // 标记是否为精细调整时段
  isFineGrained Boolean @default(false)

  // 元数据
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // 关系
  participant  Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)

  @@index([participantId])
  @@index([startTime])
  @@index([endTime])
}

// 系统配置实体（可选，用于全局配置）
model SystemConfig {
  id    String @id @default("system")
  key   String @unique
  value String

  @@map("system_config")
}
```

### Prisma客户端配置和优化

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '../generated/prisma';
import { logger } from './logger';

// 全局变量声明，避免开发环境热重载创建多个实例
declare global {
  var __prisma: PrismaClient | undefined;
}

// Prisma客户端单例模式
export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
    errorFormat: 'pretty',
  });

// 开发环境缓存客户端实例
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// 查询日志记录
prisma.$on('query', e => {
  logger.debug('Prisma Query', {
    query: e.query,
    params: e.params,
    duration: e.duration,
    timestamp: new Date().toISOString(),
  });
});

// 错误日志记录
prisma.$on('error', e => {
  logger.error('Prisma Error', {
    message: e.message,
    target: e.target,
    timestamp: new Date().toISOString(),
  });
});

// 优雅关闭处理
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// 数据库连接测试
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('数据库连接成功');
    return true;
  } catch (error) {
    logger.error('数据库连接失败', error);
    return false;
  }
}
```

## Express API架构设计和中间件配置

### 项目结构

```
src/
├── app.ts                    # Express应用配置
├── server.ts                 # 服务器启动入口
├── lib/
│   ├── prisma.ts            # Prisma客户端配置
│   ├── logger.ts            # 日志配置
│   ├── validators.ts        # 数据验证器
│   ├── utils.ts             # 工具函数
│   └── types.ts             # TypeScript类型定义
├── middleware/
│   ├── cors.ts              # CORS配置
│   ├── error.ts             # 错误处理中间件
│   ├── rateLimit.ts         # 速率限制
│   ├── requestId.ts         # 请求ID追踪
│   └── validation.ts        # 请求验证中间件
├── routes/
│   ├── index.ts             # 路由入口
│   ├── schedules.ts         # 时间表相关API
│   ├── participants.ts      # 参与者相关API
│   └── health.ts            # 健康检查API
├── services/
│   ├── scheduleService.ts   # 时间表业务逻辑
│   ├── participantService.ts # 参与者业务逻辑
│   └── analyticsService.ts  # 统计分析服务
├── controllers/
│   ├── scheduleController.ts
│   ├── participantController.ts
│   └── analyticsController.ts
└── tests/
    ├── integration/
    └── unit/
```

### Express应用配置

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { morganMiddleware } from './middleware/morgan';
import { errorHandler } from './middleware/error';
import { requestIdMiddleware } from './middleware/requestId';
import { rateLimitMiddleware } from './middleware/rateLimit';
import routes from './routes';
import { logger } from './lib/logger';

export function createApp(): express.Application {
  const app = express();

  // 安全中间件
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    })
  );

  // CORS配置
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === 'production'
          ? process.env.ALLOWED_ORIGINS?.split(',')
          : ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    })
  );

  // 基础中间件
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 请求追踪
  app.use(requestIdMiddleware);

  // 日志中间件
  app.use(morganMiddleware);

  // 速率限制
  app.use(rateLimitMiddleware);

  // API路由
  app.use('/api', routes);

  // 404处理
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: '请求的资源不存在',
        path: req.originalUrl,
      },
    });
  });

  // 错误处理（必须放在最后）
  app.use(errorHandler);

  return app;
}
```

### 核心中间件实现

```typescript
// src/middleware/error.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class ValidationError extends Error implements AppError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  isOperational = true;

  constructor(
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  code = 'NOT_FOUND';
  isOperational = true;

  constructor(resource: string) {
    super(`${resource} 不存在`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error implements AppError {
  statusCode = 409;
  code = 'CONFLICT';
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string;
  const statusCode = error.statusCode || 500;
  const errorCode = error.code || 'INTERNAL_SERVER_ERROR';

  // 记录错误日志
  logger.error('请求处理错误', {
    requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: errorCode,
      statusCode,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    },
  });

  // Prisma错误处理
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(error, res, requestId);
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_VALIDATION_ERROR',
        message: '数据库验证失败',
        requestId,
      },
    });
    return;
  }

  // 操作性错误（客户端错误）
  if (error.isOperational) {
    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        requestId,
        ...(error.details && { details: error.details }),
      },
    });
    return;
  }

  // 未知错误（服务器错误）
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? '服务器内部错误'
          : error.message,
      requestId,
    },
  });
}

function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  res: Response,
  requestId: string
): void {
  switch (error.code) {
    case 'P2002':
      res.status(409).json({
        success: false,
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: '数据唯一性约束冲突',
          details: error.meta,
          requestId,
        },
      });
      break;

    case 'P2025':
      res.status(404).json({
        success: false,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: '记录不存在',
          requestId,
        },
      });
      break;

    case 'P2003':
      res.status(400).json({
        success: false,
        error: {
          code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          message: '外键约束冲突',
          requestId,
        },
      });
      break;

    default:
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: '数据库操作失败',
          requestId,
        },
      });
  }
}
```

```typescript
// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';
import { logger } from '../lib/logger';

// Redis客户端配置（生产环境）
const redis =
  process.env.NODE_ENV === 'production'
    ? new Redis(process.env.REDIS_URL!)
    : null;

// 基础速率限制
export const rateLimitMiddleware = rateLimit({
  store: redis
    ? new RedisStore({
        sendCommand: (...args: string[]) => redis.call(...args),
      })
    : undefined,

  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试',
    },
  },

  standardHeaders: true,
  legacyHeaders: false,

  // 自定义键生成器
  keyGenerator: req => {
    return req.ip || 'unknown';
  },

  // 跳过成功的请求
  skipSuccessfulRequests: false,

  // 跳过失败的请求
  skipFailedRequests: false,

  // 自定义处理函数
  handler: (req, res) => {
    logger.warn('速率限制触发', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '请求过于频繁，请稍后再试',
        retryAfter: '15分钟',
      },
    });
  },
});

// 创建时间表的专门限制
export const createScheduleRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 每个IP每小时最多创建10个时间表
  message: {
    success: false,
    error: {
      code: 'CREATE_SCHEDULE_LIMIT_EXCEEDED',
      message: '创建时间表过于频繁，请1小时后再试',
    },
  },
});

// 参与提交的专门限制
export const participantSubmissionLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 20, // 每个IP每5分钟最多提交20次
  message: {
    success: false,
    error: {
      code: 'PARTICIPANT_SUBMISSION_LIMIT_EXCEEDED',
      message: '提交过于频繁，请稍后再试',
    },
  },
});
```

## 数据库迁移和版本管理

### 环境配置

```typescript
// .env.example
# 数据库配置
DATABASE_URL="file:./dev.db"

# 服务器配置
PORT=3001
NODE_ENV=development

# Redis配置（生产环境）
REDIS_URL="redis://localhost:6379"

# 安全配置
JWT_SECRET=your-super-secret-jwt-key
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/app.log

# 应用配置
SCHEDULE_DEFAULT_EXPIRY_HOURS=168
MAX_PARTICIPANTS_PER_SCHEDULE=50
```

### 数据库迁移脚本

```typescript
// scripts/migrate.ts
import { PrismaClient } from '../src/generated/prisma';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

async function runMigrations() {
  try {
    logger.info('开始数据库迁移...');

    // 检查连接
    await prisma.$connect();

    // 运行迁移
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;

    // 创建基础索引
    await createIndexes();

    // 初始化基础数据
    await initializeData();

    logger.info('数据库迁移完成');
  } catch (error) {
    logger.error('数据库迁移失败', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createIndexes() {
  logger.info('创建数据库索引...');

  // 为Schedule表创建复合索引
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_schedule_expires_deleted
    ON Schedule (expiresAt, isDeleted)
  `;

  // 为Participant表创建索引
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_participant_schedule_name
    ON Participant (scheduleId, name)
  `;

  // 为TimeSlot表创建时间范围索引
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_timeslot_time_range
    ON TimeSlot (startTime, endTime)
  `;
}

async function initializeData() {
  logger.info('初始化基础数据...');

  // 检查是否已初始化
  const existingConfig = await prisma.systemConfig.findFirst({
    where: { key: 'initialized' },
  });

  if (!existingConfig) {
    // 初始化系统配置
    await prisma.systemConfig.createMany({
      data: [
        { key: 'initialized', value: 'true' },
        { key: 'app_version', value: '1.0.0' },
        { key: 'default_timezone', value: 'Asia/Shanghai' },
        { key: 'max_schedule_duration_days', value: '7' },
      ],
    });

    logger.info('基础数据初始化完成');
  }
}

if (require.main === module) {
  runMigrations();
}
```

### 数据清理策略

```typescript
// src/services/cleanupService.ts
import { PrismaClient } from '../generated/prisma';
import { logger } from '../lib/logger';
import { CronJob } from 'cron';

export class CleanupService {
  private prisma: PrismaClient;
  private cleanupJob: CronJob;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;

    // 每小时执行一次清理
    this.cleanupJob = new CronJob('0 * * * *', this.performCleanup.bind(this));
  }

  start() {
    this.cleanupJob.start();
    logger.info('数据清理服务已启动');
  }

  stop() {
    this.cleanupJob.stop();
    logger.info('数据清理服务已停止');
  }

  private async performCleanup() {
    try {
      logger.info('开始执行数据清理...');

      const stats = await this.cleanupExpiredSchedules();
      const orphanedStats = await this.cleanupOrphanedData();

      logger.info('数据清理完成', {
        expiredSchedules: stats.deletedSchedules,
        expiredParticipants: stats.deletedParticipants,
        expiredTimeSlots: stats.deletedTimeSlots,
        orphanedParticipants: orphanedStats.deletedParticipants,
        orphanedTimeSlots: orphanedStats.deletedTimeSlots,
      });
    } catch (error) {
      logger.error('数据清理失败', error);
    }
  }

  private async cleanupExpiredSchedules() {
    const now = new Date();

    // 查找过期的时间表
    const expiredSchedules = await this.prisma.schedule.findMany({
      where: {
        expiresAt: { lt: now },
        isDeleted: false,
      },
      include: {
        participants: {
          include: { timeSlots: true },
        },
      },
    });

    let deletedTimeSlots = 0;
    let deletedParticipants = 0;

    for (const schedule of expiredSchedules) {
      // 删除时间段
      deletedTimeSlots += await this.prisma.timeSlot
        .deleteMany({
          where: {
            participant: { scheduleId: schedule.id },
          },
        })
        .then(result => result.count);

      // 删除参与者
      deletedParticipants += await this.prisma.participant
        .deleteMany({
          where: { scheduleId: schedule.id },
        })
        .then(result => result.count);
    }

    // 软删除过期的时间表
    const deletedSchedules = await this.prisma.schedule
      .updateMany({
        where: {
          id: { in: expiredSchedules.map(s => s.id) },
        },
        data: { isDeleted: true },
      })
      .then(result => result.count);

    return { deletedSchedules, deletedParticipants, deletedTimeSlots };
  }

  private async cleanupOrphanedData() {
    // 清理孤立的参与者（没有关联的时间表）
    const orphanedParticipants = await this.prisma.participant.findMany({
      where: {
        schedule: { isDeleted: true },
      },
    });

    const deletedParticipants = await this.prisma.participant
      .deleteMany({
        where: {
          id: { in: orphanedParticipants.map(p => p.id) },
        },
      })
      .then(result => result.count);

    // 清理孤立的时间段
    const deletedTimeSlots = await this.prisma.timeSlot
      .deleteMany({
        where: {
          participant: {
            schedule: { isDeleted: true },
          },
        },
      })
      .then(result => result.count);

    return { deletedParticipants, deletedTimeSlots };
  }
}
```

TodoWrite
<arg_key>todos</arg_key>
<arg_value>[{"content": "研究并分析Prisma模型设计和关系定义的最佳实践", "status": "completed", "activeForm": "研究Prisma模型设计和关系定义"}, {"content": "设计Express API架构和中间件配置", "status": "completed", "activeForm": "设计Express API架构和中间件配置"}, {"content": "配置数据库迁移和版本管理", "status": "completed", "activeForm": "配置数据库迁移和版本管理"}, {"content": "实现SQLite并发处理和性能优化策略", "status": "in_progress", "activeForm": "实现SQLite并发处理和性能优化"}, {"content": "设计错误处理和日志记录系统", "status": "pending", "activeForm": "设计错误处理和日志记录系统"}, {"content": "实施安全性最佳实践", "status": "pending", "activeForm": "实施安全性最佳实践"}, {"content": "创建具体的模型设计和API路由示例", "status": "pending", "activeForm": "创建具体的模型设计和API路由示例"}]
