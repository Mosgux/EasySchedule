import { PrismaClient, Participant, TimeSlot } from '@prisma/client';
import nanoid = require('nanoid');
import { logger } from '../utils/logger';
import { createError, isAppError } from '../middleware/errorHandler';

type ParticipantTimeSlotInput = Array<{
  startTime: Date;
  endTime: Date;
  isCustom?: boolean;
}>;

export type ParticipantWithTimeSlots = Participant & {
  timeSlots: TimeSlot[];
};

export class ParticipantService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 创建或更新参与者
   */
  async createOrUpdateParticipant(
    scheduleId: string,
    name: string,
    timeSlots: ParticipantTimeSlotInput
  ): Promise<Participant> {
    logger.info(
      `Creating/updating participant: ${name} for schedule: ${scheduleId}`
    );

    try {
      const participant = await this.prisma.$transaction(async tx => {
        const existingParticipant = await tx.participant.findFirst({
          where: {
            scheduleId,
            name,
          },
        });

        let nextParticipant: Participant;

        if (existingParticipant) {
          nextParticipant = await tx.participant.update({
            where: { id: existingParticipant.id },
            data: {
              color: this.generateParticipantColor(),
              updatedAt: new Date(),
            },
          });

          await tx.timeSlot.deleteMany({
            where: { participantId: nextParticipant.id },
          });

          logger.info(`Updated existing participant: ${name}`);
        } else {
          nextParticipant = await tx.participant.create({
            data: {
              id: nanoid(),
              scheduleId,
              name,
              color: this.generateParticipantColor(),
            },
          });

          logger.info(`Created new participant: ${name}`);
        }

        if (timeSlots.length > 0) {
          await tx.timeSlot.createMany({
            data: this.buildTimeSlotCreateManyData(
              nextParticipant.id,
              timeSlots
            ),
          });
        }

        return nextParticipant;
      });

      return participant;
    } catch (error) {
      logger.error(`Failed to create/update participant: ${name}`, error);

      if (isAppError(error)) {
        throw error;
      }

      throw createError('Failed to create or update participant', 500);
    }
  }

  /**
   * 获取参与者的时间段
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
      throw createError('Failed to get participant time slots', 500);
    }
  }

  /**
   * 获取时间表的所有参与者
   */
  async getScheduleParticipants(
    scheduleId: string
  ): Promise<ParticipantWithTimeSlots[]> {
    try {
      return await this.prisma.participant.findMany({
        where: { scheduleId },
        include: {
          timeSlots: {
            orderBy: { startTime: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      logger.error(
        `Failed to get participants for schedule: ${scheduleId}`,
        error
      );
      throw createError('Failed to get schedule participants', 500);
    }
  }

  /**
   * 删除参与者
   */
  async deleteParticipant(participantId: string): Promise<void> {
    try {
      await this.prisma.participant.delete({
        where: { id: participantId },
      });

      logger.info(`Deleted participant: ${participantId}`);
    } catch (error) {
      logger.error(`Failed to delete participant: ${participantId}`, error);
      throw createError('Failed to delete participant', 500);
    }
  }

  /**
   * 生成参与者颜色
   */
  private generateParticipantColor(): string {
    const colors = [
      '#3B82F6', // 蓝色
      '#10B981', // 绿色
      '#F59E0B', // 橙色
      '#EF4444', // 红色
      '#8B5CF6', // 紫色
      '#EC4899', // 粉色
      '#14B8A6', // 青色
      '#F97316', // 深橙色
      '#6366F1', // 靛蓝色
      '#84CC16', // 黄绿色
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * 验证时间段数据
   */
  private validateTimeSlots(
    timeSlots: Array<{
      startTime: Date;
      endTime: Date;
      isCustom?: boolean;
    }>
  ): void {
    for (const timeSlot of timeSlots) {
      if (timeSlot.startTime >= timeSlot.endTime) {
        throw new Error('Start time must be before end time');
      }

      // 检查时间段是否为30分钟的倍数
      const duration =
        timeSlot.endTime.getTime() - timeSlot.startTime.getTime();
      const thirtyMinutes = 30 * 60 * 1000; // 30分钟的毫秒数

      if (duration % thirtyMinutes !== 0) {
        throw new Error('Time slot duration must be a multiple of 30 minutes');
      }

      // 检查时间段长度不超过12小时
      const twelveHours = 12 * 60 * 60 * 1000; // 12小时的毫秒数
      if (duration > twelveHours) {
        throw new Error('Time slot duration cannot exceed 12 hours');
      }
    }
  }

  /**
   * 检查参与者是否存在于指定时间表
   */
  async participantExists(scheduleId: string, name: string): Promise<boolean> {
    try {
      const participant = await this.prisma.participant.findFirst({
        where: { scheduleId, name },
      });

      return !!participant;
    } catch (error) {
      logger.error(`Failed to check if participant exists: ${name}`, error);
      throw createError('Failed to check participant existence', 500);
    }
  }

  /**
   * 获取参与者详情
   */
  async getParticipantById(
    participantId: string
  ): Promise<ParticipantWithTimeSlots | null> {
    try {
      return await this.prisma.participant.findUnique({
        where: { id: participantId },
        include: {
          timeSlots: {
            orderBy: { startTime: 'asc' },
          },
        },
      });
    } catch (error) {
      logger.error(`Failed to get participant: ${participantId}`, error);
      throw createError('Failed to get participant', 500);
    }
  }

  private buildTimeSlotCreateManyData(
    participantId: string,
    timeSlots: ParticipantTimeSlotInput
  ) {
    return timeSlots.map(timeSlot => ({
      id: nanoid(),
      participantId,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      isCustom: timeSlot.isCustom || false,
    }));
  }
}
