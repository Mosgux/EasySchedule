import { PrismaClient, Schedule, Participant, TimeSlot } from '@prisma/client';
import { logger } from '../utils/logger';
import { TimezoneService } from './TimezoneService';
import { createError } from '../middleware/errorHandler';
import { dayjs } from '../lib/timezone';

export interface CreateScheduleData {
  title: string;
  description?: string;
  timezone: string;
  startDate: Date;
  endDate?: Date;
  expiresAt?: Date;
}

export interface UpdateScheduleData {
  title?: string;
  description?: string;
  timezone?: string;
  expiresAt?: Date;
  isLocked?: boolean;
}

export class ScheduleService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 创建新的时间表
   */
  async createSchedule(data: CreateScheduleData): Promise<Schedule> {
    // 验证时区
    if (!TimezoneService.isValidTimezone(data.timezone)) {
      throw createError('Invalid timezone', 400);
    }

    // 验证日期
    if (!dayjs(data.startDate).isValid()) {
      throw createError('Invalid start date', 400);
    }

    // 使用时区信息正确解析日期
    const startDateInTimezone = dayjs(data.startDate).tz(data.timezone);
    const endDateInTimezone = data.endDate
      ? dayjs(data.endDate).tz(data.timezone)
      : null;

    // 如果没有提供结束日期，默认为开始日期+7天
    const endDate = endDateInTimezone
      ? endDateInTimezone.toDate()
      : startDateInTimezone.add(7, 'day').toDate();

    // 如果没有提供过期时间，默认为创建时间+7天
    const expiresAt = data.expiresAt || dayjs().add(7, 'day').toDate();

    // 验证日期范围
    if (dayjs(endDate).isBefore(startDateInTimezone)) {
      throw createError('End date must be after start date', 400);
    }

    if (dayjs(expiresAt).isBefore(dayjs())) {
      throw createError('Expiration date must be in the future', 400);
    }

    try {
      const schedule = await this.prisma.schedule.create({
        data: {
          title: data.title,
          description: data.description,
          timezone: data.timezone,
          startDate: startDateInTimezone.toDate(),
          endDate,
          expiresAt,
        },
      });

      logger.info(`Created schedule: ${schedule.id} - ${schedule.title}`);
      return schedule;
    } catch (error) {
      logger.error('Failed to create schedule:', error);
      throw createError('Failed to create schedule', 500);
    }
  }

  /**
   * 根据ID获取时间表
   */
  async getScheduleById(id: string): Promise<Schedule | null> {
    try {
      const schedule = await this.prisma.schedule.findUnique({
        where: { id },
        include: {
          participants: {
            include: {
              timeSlots: true,
            },
          },
          shareLink: true,
        },
      });

      return schedule;
    } catch (error) {
      logger.error(`Failed to get schedule ${id}:`, error);
      throw createError('Failed to get schedule', 500);
    }
  }

  /**
   * 更新时间表
   */
  async updateSchedule(
    id: string,
    data: UpdateScheduleData
  ): Promise<Schedule> {
    // 检查时间表是否存在
    const existingSchedule = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      throw createError('Schedule not found', 404);
    }

    // 如果已锁定，不允许修改
    if (existingSchedule.isLocked) {
      throw createError('Schedule is locked and cannot be modified', 403);
    }

    // 如果已过期，不允许修改
    if (existingSchedule.expiresAt < new Date()) {
      throw createError('Schedule has expired and cannot be modified', 410);
    }

    // 验证时区（如果提供）
    if (data.timezone && !TimezoneService.isValidTimezone(data.timezone)) {
      throw createError('Invalid timezone', 400);
    }

    // 验证过期时间（如果提供）
    if (data.expiresAt && dayjs(data.expiresAt).isBefore(dayjs())) {
      throw createError('Expiration date must be in the future', 400);
    }

    try {
      const schedule = await this.prisma.schedule.update({
        where: { id },
        data,
      });

      logger.info(`Updated schedule: ${schedule.id}`);
      return schedule;
    } catch (error) {
      logger.error(`Failed to update schedule ${id}:`, error);
      throw createError('Failed to update schedule', 500);
    }
  }

  /**
   * 锁定/解锁时间表
   */
  async lockSchedule(id: string, isLocked: boolean): Promise<Schedule> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw createError('Schedule not found', 404);
    }

    // 如果已过期，不允许锁定
    if (schedule.expiresAt < new Date()) {
      throw createError('Schedule has expired and cannot be locked', 410);
    }

    try {
      const updatedSchedule = await this.prisma.schedule.update({
        where: { id },
        data: { isLocked },
      });

      logger.info(
        `${isLocked ? 'Locked' : 'Unlocked'} schedule: ${schedule.id}`
      );
      return updatedSchedule;
    } catch (error) {
      logger.error(
        `Failed to ${isLocked ? 'lock' : 'unlock'} schedule ${id}:`,
        error
      );
      throw createError(
        `Failed to ${isLocked ? 'lock' : 'unlock'} schedule`,
        500
      );
    }
  }

  /**
   * 删除时间表
   */
  async deleteSchedule(id: string): Promise<void> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw createError('Schedule not found', 404);
    }

    try {
      await this.prisma.schedule.delete({
        where: { id },
      });

      logger.info(`Deleted schedule: ${schedule.id}`);
    } catch (error) {
      logger.error(`Failed to delete schedule ${id}:`, error);
      throw createError('Failed to delete schedule', 500);
    }
  }

  /**
   * 获取时间表的详细信息（包括参与者和时间段）
   */
  async getScheduleDetail(id: string): Promise<
    Schedule & {
      participants: (Participant & { timeSlots: TimeSlot[] })[];
      shareLink?: { token: string };
    }
  > {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            timeSlots: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        shareLink: true,
      },
    });

    if (!schedule) {
      throw createError('Schedule not found', 404);
    }

    // 检查是否过期
    if (schedule.expiresAt < new Date()) {
      throw createError('Schedule has expired', 410);
    }

    return schedule as any;
  }

  /**
   * 验证时间表是否可访问
   */
  async validateScheduleAccess(scheduleId: string): Promise<Schedule> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw createError('Schedule not found', 404);
    }

    if (schedule.expiresAt < new Date()) {
      throw createError('Schedule has expired', 410);
    }

    return schedule;
  }

  /**
   * 获取时间表统计信息
   */
  async getScheduleStats(scheduleId: string): Promise<{
    participantCount: number;
    timeSlotCount: number;
    totalHours: number;
    averageHoursPerParticipant: number;
  }> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        participants: {
          include: {
            timeSlots: true,
          },
        },
      },
    });

    if (!schedule) {
      throw createError('Schedule not found', 404);
    }

    const participants = schedule.participants;
    const timeSlots = participants.flatMap(p => p.timeSlots);

    // 计算总时长（分钟）
    const totalMinutes = timeSlots.reduce((total, slot) => {
      const duration = dayjs(slot.endTime).diff(
        dayjs(slot.startTime),
        'minute'
      );
      return total + duration;
    }, 0);

    const totalHours = totalMinutes / 60;
    const averageHours =
      participants.length > 0 ? totalHours / participants.length : 0;

    return {
      participantCount: participants.length,
      timeSlotCount: timeSlots.length,
      totalHours: Math.round(totalHours * 100) / 100,
      averageHoursPerParticipant: Math.round(averageHours * 100) / 100,
    };
  }

  /**
   * 搜索时间表
   */
  async searchSchedules(
    query: string,
    limit: number = 10
  ): Promise<Schedule[]> {
    try {
      const schedules = await this.prisma.schedule.findMany({
        where: {
          OR: [
            {
              title: {
                contains: query,
              },
            },
            {
              description: {
                contains: query,
              },
            },
          ],
          AND: [
            {
              expiresAt: {
                gt: new Date(),
              },
            },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return schedules;
    } catch (error) {
      logger.error('Failed to search schedules:', error);
      throw createError('Failed to search schedules', 500);
    }
  }

  /**
   * 获取即将过期的时间表
   */
  async getExpiringSchedules(hours: number = 24): Promise<Schedule[]> {
    const cutoffTime = dayjs().add(hours, 'hour').toDate();

    try {
      const schedules = await this.prisma.schedule.findMany({
        where: {
          expiresAt: {
            lte: cutoffTime,
            gt: new Date(),
          },
          isLocked: false,
        },
        orderBy: {
          expiresAt: 'asc',
        },
      });

      return schedules;
    } catch (error) {
      logger.error('Failed to get expiring schedules:', error);
      throw createError('Failed to get expiring schedules', 500);
    }
  }
}
