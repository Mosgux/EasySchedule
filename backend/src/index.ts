import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { setupRoutes } from './api/routes';
import { prisma } from './lib/prisma';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 中间件
app.use(helmet());
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5178',
      'http://www.neemo.tech',
      'https://www.neemo.tech',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);

// API路由
app.use('/api', setupRoutes());

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use(errorHandler);

// 优雅关闭
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
