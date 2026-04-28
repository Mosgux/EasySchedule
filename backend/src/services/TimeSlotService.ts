import { PrismaClient, TimeSlot, Schedule } from '@prisma/client';
import nanoid = require('nanoid');
import { logger } from '../utils/logger';
import { createError, isAppError } from '../middleware/errorHandler';

export interface TimeSlotData {
  startTime: Date;
  endTime: Date;
  isCustom?: boolean;
}

export class TimeSlotService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 创建时间段
   */
  async createTimeSlot(
    participantId: string,
    timeSlotData: TimeSlotData
  ): Promise<TimeSlot> {
    logger.info(`Creating time slot for participant: ${participantId}`);

    try {
      // 验证时间段数据
      this.validateTimeSlot(timeSlotData);

      const timeSlot = await this.prisma.timeSlot.create({
        data: {
          id: nanoid(),
          participantId,
          startTime: timeSlotData.startTime,
          endTime: timeSlotData.endTime,
          isCustom: timeSlotData.isCustom || false,
        },
      });

      logger.info(`Created time slot: ${timeSlot.id}`);
      return timeSlot;
    } catch (error) {
      logger.error(
        `Failed to create time slot for participant: ${participantId}`,
        error
      );
      throw new Error('Failed to create time slot');
    }
  }

  /**
   * 批量创建时间段
   */
  async createTimeSlots(
    participantId: string,
    timeSlotsData: TimeSlotData[]
  ): Promise<TimeSlot[]> {
    logger.info(
      `Creating ${timeSlotsData.length} time slots for participant: ${participantId}`
    );

    try {
      const createdTimeSlots: TimeSlot[] = [];

      for (const timeSlotData of timeSlotsData) {
        this.validateTimeSlot(timeSlotData);
        const timeSlot = await this.createTimeSlot(participantId, timeSlotData);
        createdTimeSlots.push(timeSlot);
      }

      logger.info(
        `Created ${createdTimeSlots.length} time slots for participant: ${participantId}`
      );
      return createdTimeSlots;
    } catch (error) {
      logger.error(
        `Failed to create time slots for participant: ${participantId}`,
        error
      );
      throw new Error('Failed to create time slots');
    }
  }

  /**
   * 更新参与者的时间段（替换所有现有时间段）
   */
  async updateParticipantTimeSlots(
    participantId: string,
    timeSlotsData: TimeSlotData[]
  ): Promise<TimeSlot[]> {
    logger.info(`Updating time slots for participant: ${participantId}`);

    try {
      this.validateTimeSlotsData(timeSlotsData);

      await this.prisma.$transaction(async tx => {
        await tx.timeSlot.deleteMany({
          where: { participantId },
        });

        if (timeSlotsData.length > 0) {
          await tx.timeSlot.createMany({
            data: timeSlotsData.map(timeSlot => ({
              id: nanoid(),
              participantId,
              startTime: timeSlot.startTime,
              endTime: timeSlot.endTime,
              isCustom: timeSlot.isCustom || false,
            })),
          });
        }
      });

      if (timeSlotsData.length > 0) {
        return await this.getParticipantTimeSlots(participantId);
      }

      logger.info(`Cleared all time slots for participant: ${participantId}`);
      return [];
    } catch (error) {
      logger.error(
        `Failed to update time slots for participant: ${participantId}`,
        error
      );

      if (isAppError(error)) {
        throw error;
      }

      throw createError('Failed to update time slots', 500);
    }
  }

  /**
   * 获取参与者时间段
   */
  async getParticipantTimeSlots(participantId: string): Promise<TimeSlot[]> {
    try {
      return await this.prisma.timeSlot.findMany({
        where: { participantId },
        orderBy: { startTime: 'asc' },
      });
    } catch (error) {
      logger.error(
        `Failed to get time slots for participant: ${participantId}`,
        error
      );
      throw new Error('Failed to get participant time slots');
    }
  }

  /**
   * 获取时间段详情
   */
  async getTimeSlotById(timeSlotId: string): Promise<TimeSlot | null> {
    try {
      return await this.prisma.timeSlot.findUnique({
        where: { id: timeSlotId },
        include: {
          participant: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error(`Failed to get time slot: ${timeSlotId}`, error);
      throw new Error('Failed to get time slot');
    }
  }

  /**
   * 删除时间段
   */
  async deleteTimeSlot(timeSlotId: string): Promise<void> {
    try {
      await this.prisma.timeSlot.delete({
        where: { id: timeSlotId },
      });

      logger.info(`Deleted time slot: ${timeSlotId}`);
    } catch (error) {
      logger.error(`Failed to delete time slot: ${timeSlotId}`, error);
      throw new Error('Failed to delete time slot');
    }
  }

  /**
   * 删除参与者的所有时间段
   */
  async deleteParticipantTimeSlots(participantId: string): Promise<void> {
    try {
      await this.prisma.timeSlot.deleteMany({
        where: { participantId },
      });

      logger.info(`Deleted all time slots for participant: ${participantId}`);
    } catch (error) {
      logger.error(
        `Failed to delete time slots for participant: ${participantId}`,
        error
      );
      throw new Error('Failed to delete participant time slots');
    }
  }

  /**
   * 检查时间段是否重叠
   */
  private timeSlotsOverlap(slot1: TimeSlotData, slot2: TimeSlotData): boolean {
    return slot1.startTime < slot2.endTime && slot2.startTime < slot1.endTime;
  }

  /**
   * 检查时间段数组中是否有重叠
   */
  private hasOverlappingTimeSlots(timeSlots: TimeSlotData[]): boolean {
    const sortedSlots = [...timeSlots].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      if (this.timeSlotsOverlap(sortedSlots[i], sortedSlots[i + 1])) {
        return true;
      }
    }

    return false;
  }

  /**
   * 验证时间段数据
   */
  private validateTimeSlot(timeSlot: TimeSlotData): void {
    if (timeSlot.startTime >= timeSlot.endTime) {
      throw createError('Start time must be before end time', 400);
    }

    // 检查时间段是否为30分钟的倍数
    const duration = timeSlot.endTime.getTime() - timeSlot.startTime.getTime();
    const thirtyMinutes = 30 * 60 * 1000; // 30分钟的毫秒数

    if (duration % thirtyMinutes !== 0) {
      throw createError(
        'Time slot duration must be a multiple of 30 minutes',
        400
      );
    }

    // 检查时间段长度不超过12小时
    const twelveHours = 12 * 60 * 60 * 1000; // 12小时的毫秒数
    if (duration > twelveHours) {
      throw createError('Time slot duration cannot exceed 12 hours', 400);
    }

    // 检查时间段长度不少于30分钟
    if (duration < thirtyMinutes) {
      throw createError('Time slot duration must be at least 30 minutes', 400);
    }
  }

  /**
   * 验证时间段数据（批量）
   */
  validateTimeSlotsData(timeSlots: TimeSlotData[]): void {
    if (timeSlots.length === 0) {
      return; // 允许空数组，表示清空所有时间段
    }

    // 验证每个时间段
    for (const timeSlot of timeSlots) {
      this.validateTimeSlot(timeSlot);
    }

    // 检查时间段之间是否有重叠
    if (this.hasOverlappingTimeSlots(timeSlots)) {
      throw createError('Time slots cannot overlap with each other', 400);
    }

    if (timeSlots.length > 50) {
      throw createError(
        'Cannot create more than 50 time slots per participant',
        400
      );
    }
  }

  validateTimeSlotsWithinSchedule(
    timeSlots: TimeSlotData[],
    schedule: Pick<Schedule, 'timezone' | 'startDate' | 'endDate'>
  ): void {
    for (const timeSlot of timeSlots) {
      const slotDate = this.getTimeZoneDate(
        timeSlot.startTime,
        schedule.timezone
      );
      const scheduleStart = this.getTimeZoneDate(
        schedule.startDate,
        schedule.timezone
      );
      const scheduleEnd = this.getTimeZoneDate(
        schedule.endDate,
        schedule.timezone
      );

      logger.info(
        `Date validation: slot=${slotDate}, scheduleStart=${scheduleStart}, scheduleEnd=${scheduleEnd}, timezone=${schedule.timezone}`
      );

      if (slotDate < scheduleStart || slotDate > scheduleEnd) {
        throw createError(
          `Time slots must be within the schedule date range (${scheduleStart} to ${scheduleEnd}). Got: ${slotDate}`,
          400
        );
      }
    }
  }

  /**
   * 获取时间表的所有时间段
   */
  async getScheduleTimeSlots(scheduleId: string): Promise<TimeSlot[]> {
    try {
      return await this.prisma.timeSlot.findMany({
        where: {
          participant: {
            scheduleId,
          },
        },
        include: {
          participant: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: [{ participant: { name: 'asc' } }, { startTime: 'asc' }],
      });
    } catch (error) {
      logger.error(
        `Failed to get time slots for schedule: ${scheduleId}`,
        error
      );
      throw new Error('Failed to get schedule time slots');
    }
  }

  /**
   * 按日期分组时间段
   */
  async getTimeSlotsByDate(
    scheduleId: string,
    date: Date
  ): Promise<TimeSlot[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return await this.prisma.timeSlot.findMany({
        where: {
          participant: {
            scheduleId,
          },
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          participant: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
      });
    } catch (error) {
      logger.error(
        `Failed to get time slots for schedule: ${scheduleId} on date: ${date}`,
        error
      );
      throw new Error('Failed to get time slots by date');
    }
  }

  private getTimeZoneDate(date: Date, timeZone: string): string {
    const year = date.toLocaleString('en-US', { timeZone, year: 'numeric' });
    const month = date.toLocaleString('en-US', { timeZone, month: '2-digit' });
    const day = date.toLocaleString('en-US', { timeZone, day: '2-digit' });

    return `${year}-${month}-${day}`;
  }
}
