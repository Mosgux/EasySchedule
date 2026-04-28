import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from '../config';
import dayjs from 'dayjs';

export class CleanupService {
  private cronJob: cron.ScheduledTask | null = null;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 启动定时清理任务
   */
  start(): void {
    if (this.cronJob) {
      logger.warn('Cleanup service is already running');
      return;
    }

    // 解析cron表达式
    const cronExpression = config.cleanupInterval;
    logger.info(`Starting cleanup service with schedule: ${cronExpression}`);

    this.cronJob = cron.schedule(
      cronExpression,
      async () => {
        logger.info('Running scheduled cleanup task...');
        await this.runCleanup();
      },
      {
        scheduled: true,
        timezone: 'Asia/Shanghai',
      }
    );

    logger.info('Cleanup service started successfully');
  }

  /**
   * 停止清理任务
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Cleanup service stopped');
    }
  }

  /**
   * 手动执行清理
   */
  async runCleanup(): Promise<void> {
    try {
      const startTime = Date.now();
      const results = await Promise.allSettled([
        this.cleanupExpiredSchedules(),
        this.cleanupEmptySchedules(),
        this.cleanupOldLogs(),
      ]);

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.length - successCount;

      if (failureCount > 0) {
        const errors = results
          .filter(r => r.status === 'rejected')
          .map(r => (r as PromiseRejectedResult).reason);
        logger.error('Some cleanup tasks failed:', errors);
      }

      const duration = Date.now() - startTime;
      logger.info(
        `Cleanup task completed in ${duration}ms. Success: ${successCount}, Failed: ${failureCount}`
      );
    } catch (error) {
      logger.error('Cleanup task failed:', error);
    }
  }

  /**
   * 清理过期的时间表
   */
  private async cleanupExpiredSchedules(): Promise<void> {
    const cutoffDate = dayjs().subtract(7, 'day').toDate(); // 过期7天后删除

    const result = await this.prisma.schedule.deleteMany({
      where: {
        expiresAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Deleted ${result.count} expired schedules`);
  }

  /**
   * 清理无参与者时间表（创建超过24小时）
   */
  private async cleanupEmptySchedules(): Promise<void> {
    const cutoffDate = dayjs().subtract(24, 'hour').toDate();

    const result = await this.prisma.schedule.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        participants: {
          none: {},
        },
      },
    });

    logger.info(`Deleted ${result.count} empty schedules`);
  }

  /**
   * 清理旧的日志文件
   */
  private async cleanupOldLogs(): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
      const logsDir = config.logsDir;
      const files = await fs.readdir(logsDir);
      const cutoffDate = dayjs().subtract(30, 'day'); // 保留30天日志

      for (const file of files) {
        const filePath = path.join(logsDir, file);
        const stats = await fs.stat(filePath);

        if (dayjs(stats.mtime).isBefore(cutoffDate)) {
          await fs.unlink(filePath);
          logger.info(`Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      logger.warn('Failed to cleanup old logs:', error);
    }
  }

  /**
   * 获取清理统计信息
   */
  async getCleanupStats(): Promise<{
    expiredSchedules: number;
    emptySchedules: number;
    totalSchedules: number;
  }> {
    const expiredCutoff = dayjs().subtract(7, 'day').toDate();
    const emptyCutoff = dayjs().subtract(24, 'hour').toDate();

    const [total, expired, empty] = await Promise.all([
      this.prisma.schedule.count(),
      this.prisma.schedule.count({
        where: {
          expiresAt: {
            lt: expiredCutoff,
          },
        },
      }),
      this.prisma.schedule.count({
        where: {
          createdAt: {
            lt: emptyCutoff,
          },
          participants: {
            none: {},
          },
        },
      }),
    ]);

    return {
      totalSchedules: total,
      expiredSchedules: expired,
      emptySchedules: empty,
    };
  }
}
