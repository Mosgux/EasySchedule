import {
  PrismaClient,
  ShareLink,
  Schedule,
  Participant,
  TimeSlot,
} from '@prisma/client';
import nanoid = require('nanoid');
import { logger } from '../utils/logger';
import { config } from '../config';
import { createError } from '../middleware/errorHandler';
import { buildShareLinkUrl } from '../models/ShareLink';

export type ShareLinkWithScheduleParticipants = ShareLink & {
  schedule: Schedule & {
    participants: Array<Participant & { timeSlots: TimeSlot[] }>;
  };
};

export class ShareLinkService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 为时间表生成分享链接
   */
  async generateShareLink(scheduleId: string): Promise<ShareLink> {
    // 检查时间表是否存在
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw createError('Schedule not found', 404);
    }

    // 检查是否已经存在分享链接
    const existingLink = await this.prisma.shareLink.findUnique({
      where: { scheduleId },
    });

    if (existingLink) {
      logger.info(`Share link already exists for schedule ${scheduleId}`);
      return existingLink;
    }

    // 生成新的分享令牌
    const token = this.generateToken();

    try {
      const shareLink = await this.prisma.shareLink.create({
        data: {
          scheduleId,
          token,
        },
      });

      logger.info(`Generated share link for schedule ${scheduleId}: ${token}`);
      return shareLink;
    } catch (error) {
      logger.error('Failed to create share link:', error);
      throw createError('Failed to generate share link', 500);
    }
  }

  /**
   * 通过令牌获取分享链接信息
   */
  async getShareLinkByToken(
    token: string
  ): Promise<ShareLinkWithScheduleParticipants> {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { token },
      include: {
        schedule: {
          include: {
            participants: {
              include: {
                timeSlots: true,
              },
            },
          },
        },
      },
    });

    if (!shareLink) {
      throw createError('Invalid or expired share link', 404);
    }

    // 检查时间表是否过期
    if (shareLink.schedule.expiresAt < new Date()) {
      throw createError('Schedule has expired', 410);
    }

    return shareLink;
  }

  /**
   * 删除分享链接
   */
  async deleteShareLink(scheduleId: string): Promise<void> {
    try {
      await this.prisma.shareLink.delete({
        where: { scheduleId },
      });

      logger.info(`Deleted share link for schedule ${scheduleId}`);
    } catch (error) {
      logger.error('Failed to delete share link:', error);
      throw createError('Failed to delete share link', 500);
    }
  }

  /**
   * 重新生成分享令牌
   */
  async regenerateShareLink(scheduleId: string): Promise<ShareLink> {
    // 删除现有链接
    await this.deleteShareLink(scheduleId);

    // 生成新链接
    return this.generateShareLink(scheduleId);
  }

  /**
   * 生成安全的分享令牌
   */
  private generateToken(): string {
    const size = config.nanoidSize;
    return nanoid(size);
  }

  /**
   * 验证分享令牌是否有效
   */
  async validateShareToken(token: string): Promise<boolean> {
    try {
      const shareLink = await this.prisma.shareLink.findUnique({
        where: { token },
        include: { schedule: true },
      });

      if (!shareLink) {
        return false;
      }

      // 检查时间表是否过期
      if (shareLink.schedule.expiresAt < new Date()) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error validating share token:', error);
      return false;
    }
  }

  /**
   * 验证令牌格式
   */
  static isValidToken(token: string): boolean {
    const tokenRegex = /^[0-9A-Za-z]{8,32}$/;
    return tokenRegex.test(token);
  }

  /**
   * 构建完整的分享URL
   */
  buildShareUrl(token: string, baseUrl?: string): string {
    const base =
      baseUrl || process.env.SHARE_BASE_URL || 'http://localhost:5177';
    return buildShareLinkUrl(token, base);
  }

  /**
   * 获取分享链接统计信息
   */
  async getShareLinkStats(scheduleId: string): Promise<{
    token: string;
    createdAt: Date;
    url: string;
    participantCount: number;
  }> {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { scheduleId },
      include: {
        schedule: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!shareLink) {
      throw createError('Share link not found', 404);
    }

    return {
      token: shareLink.token,
      createdAt: shareLink.createdAt,
      url: this.buildShareUrl(shareLink.token),
      participantCount: shareLink.schedule.participants.length,
    };
  }
}
