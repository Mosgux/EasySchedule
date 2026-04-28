import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config();

export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // 数据库配置
  databaseUrl: process.env.DATABASE_URL || 'file:./data/easy.db',

  // 安全配置
  jwtSecret: process.env.JWT_SECRET || 'easyschedule-default-secret',
  nanoidSize: parseInt(process.env.NANOID_SIZE || '12', 10),

  // 日志配置
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || './logs/app.log',

  // 缓存配置
  redisUrl: process.env.REDIS_URL,

  // 清理任务配置
  cleanupInterval: process.env.CLEANUP_INTERVAL || '0 2 * * *',

  // 应用配置
  appName: 'EasySchedule',
  appVersion: '1.0.0',

  // 数据目录
  dataDir: path.join(process.cwd(), 'data'),
  logsDir: path.join(process.cwd(), 'logs'),
};

export default config;
