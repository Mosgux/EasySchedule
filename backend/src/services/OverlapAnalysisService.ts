import { PrismaClient, TimeSlot } from '@prisma/client';
import { dayjs } from '../lib/timezone';
import { logger } from '../utils/logger';

export interface OverlapSlot {
  startTime: Date;
  endTime: Date;
  participantCount: number;
  participantNames: string[];
}

export interface AnalyticsResult {
  totalParticipants: number;
  topOverlappingSlots: OverlapSlot[];
  availabilityHeatmap: HeatmapData[];
}

export interface HeatmapData {
  date: string;
  hours: HeatmapHour[];
}

export interface HeatmapHour {
  hour: number;
  participantCount: number;
}

export class OverlapAnalysisService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 分析时间表的重叠情况
   */
  async analyzeScheduleOverlap(scheduleId: string): Promise<AnalyticsResult> {
    try {
      logger.info(`开始分析时间表重叠: ${scheduleId}`);

      // 获取时间表信息
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
        throw new Error('时间表不存在');
      }

      const participants = schedule.participants;
      const totalParticipants = participants.length;

      if (totalParticipants === 0) {
        logger.info(`返回分析数据: ${scheduleId}, 参与者数: 0`);
        return {
          totalParticipants: 0,
          topOverlappingSlots: [],
          availabilityHeatmap: [],
        };
      }

      // 收集所有时间段
      const allTimeSlots = participants.flatMap(p =>
        p.timeSlots.map(ts => ({
          ...ts,
          participantName: p.name,
        }))
      );

      // 添加超时保护，30秒后返回空结果
      const timeoutPromise = new Promise<AnalyticsResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error('分析超时，请稍后重试'));
        }, 30000);
      });

      const analysisPromise = this.performAnalysis(allTimeSlots, schedule);

      try {
        const result = await Promise.race([analysisPromise, timeoutPromise]);
        logger.info(
          `时间表重叠分析完成: ${scheduleId}, 参与者数: ${totalParticipants}`
        );
        return result;
      } catch (error) {
        if (error instanceof Error && error.message.includes('超时')) {
          logger.warn(`分析超时: ${scheduleId}, 返回空结果`);
          return {
            totalParticipants,
            topOverlappingSlots: [],
            availabilityHeatmap: [],
          };
        }
        throw error;
      }
    } catch (error) {
      logger.error(`时间表重叠分析失败: ${scheduleId}`, error);
      throw error;
    }
  }

  /**
   * 执行实际的分析工作
   */
  private async performAnalysis(
    timeSlots: Array<TimeSlot & { participantName: string }>,
    schedule: any
  ): Promise<AnalyticsResult> {
    // 生成重叠分析
    const overlappingSlots = this.findOverlappingTimeSlots(timeSlots);
    const topSlots = this.getTopOverlappingSlots(overlappingSlots, 3);
    const heatmap = this.generateAvailabilityHeatmap(
      timeSlots,
      schedule.startDate,
      schedule.endDate
    );

    return {
      totalParticipants: schedule.participants.length,
      topOverlappingSlots: topSlots,
      availabilityHeatmap: heatmap,
    };
  }

  /**
   * 找出所有重叠的时间段
   */
  private findOverlappingTimeSlots(
    timeSlots: Array<TimeSlot & { participantName: string }>
  ): OverlapSlot[] {
    if (timeSlots.length === 0) return [];

    // 转换为分钟级别的时间点进行分析
    const slotRanges = timeSlots.map(slot => ({
      start: dayjs(slot.startTime).unix(),
      end: dayjs(slot.endTime).unix(),
      participantName: slot.participantName,
    }));

    // 限制分析范围，避免过长的计算
    const minTime = Math.min(...slotRanges.map(r => r.start));
    const maxTime = Math.max(...slotRanges.map(r => r.end));

    // 如果时间跨度超过30天，限制为30天
    const maxAnalysisSpan = 30 * 24 * 60 * 60; // 30天的秒数
    const limitedMaxTime = Math.min(maxTime, minTime + maxAnalysisSpan);

    // 找出所有时间点，使用更大的步长以提高性能
    const timePoints = new Set<number>();
    const stepSize = 3600; // 1小时步长，减少计算量

    slotRanges.forEach(range => {
      const limitedStart = Math.max(range.start, minTime);
      const limitedEnd = Math.min(range.end, limitedMaxTime);

      for (let time = limitedStart; time < limitedEnd; time += stepSize) {
        timePoints.add(time);
      }
    });

    const points = Array.from(timePoints).sort();
    const overlaps: OverlapSlot[] = [];

    // 分析每个时间点的参与情况
    for (let i = 0; i < points.length - 1; i++) {
      const currentTime = points[i];
      const nextTime = points[i + 1];

      const participantsAtTime = slotRanges
        .filter(range => range.start <= currentTime && range.end > currentTime)
        .map(range => range.participantName);

      if (participantsAtTime.length >= 2) {
        // 至少2人重叠才有意义
        overlaps.push({
          startTime: dayjs.unix(currentTime).toDate(),
          endTime: dayjs.unix(nextTime).toDate(),
          participantCount: participantsAtTime.length,
          participantNames: [...new Set(participantsAtTime)],
        });
      }
    }

    // 合并连续的重叠时间段
    return this.mergeConsecutiveOverlaps(overlaps);
  }

  /**
   * 合并连续的重叠时间段
   */
  private mergeConsecutiveOverlaps(overlaps: OverlapSlot[]): OverlapSlot[] {
    if (overlaps.length === 0) return [];

    const merged: OverlapSlot[] = [];
    let current = overlaps[0];

    for (let i = 1; i < overlaps.length; i++) {
      const next = overlaps[i];

      // 检查是否连续且参与者相同
      const isConsecutive = dayjs(current.endTime).isSame(
        next.startTime,
        'minute'
      );
      const hasSameParticipants =
        current.participantCount === next.participantCount &&
        current.participantNames.every(name =>
          next.participantNames.includes(name)
        );

      if (isConsecutive && hasSameParticipants) {
        // 合并时间段
        current.endTime = next.endTime;
      } else {
        merged.push(current);
        current = next;
      }
    }

    merged.push(current);
    return merged;
  }

  /**
   * 获取重叠度最高的时间段
   */
  private getTopOverlappingSlots(
    overlaps: OverlapSlot[],
    limit: number
  ): OverlapSlot[] {
    return overlaps
      .sort((a, b) => {
        // 首先按参与人数排序
        if (b.participantCount !== a.participantCount) {
          return b.participantCount - a.participantCount;
        }
        // 然后按持续时间排序
        const durationA = dayjs(a.endTime).diff(a.startTime, 'minute');
        const durationB = dayjs(b.endTime).diff(b.startTime, 'minute');
        return durationB - durationA;
      })
      .slice(0, limit);
  }

  /**
   * 生成可用时间热力图数据
   */
  private generateAvailabilityHeatmap(
    timeSlots: Array<TimeSlot & { participantName: string }>,
    startDate: Date,
    endDate: Date
  ): HeatmapData[] {
    const heatmap: HeatmapData[] = [];

    // 为每一天生成热力图数据，但限制最大范围为30天
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const maxDays = 30;

    // 计算实际结束日期
    const maxEndDate = start.add(maxDays, 'day');
    const actualEnd = end.isBefore(maxEndDate) ? end : maxEndDate;

    let current = start;
    while (current.isBefore(actualEnd) || current.isSame(actualEnd)) {
      const dateStr = current.format('YYYY-MM-DD');
      const hours: HeatmapHour[] = [];

      // 为每天的小时生成数据 (0-23)
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = current.hour(hour).minute(0).second(0);
        const hourEnd = current
          .hour(hour + 1)
          .minute(0)
          .second(0);

        // 统计该小时内有空的人数
        const availableParticipants = timeSlots
          .filter(slot => {
            const slotStart = dayjs(slot.startTime);
            const slotEnd = dayjs(slot.endTime);

            // 检查时间段是否与当前小时有重叠
            return slotStart.isBefore(hourEnd) && slotEnd.isAfter(hourStart);
          })
          .map(slot => slot.participantName);

        const uniqueParticipants = new Set(availableParticipants);

        hours.push({
          hour,
          participantCount: uniqueParticipants.size,
        });
      }

      heatmap.push({
        date: dateStr,
        hours,
      });

      current = current.add(1, 'day');
    }

    return heatmap;
  }

  /**
   * 保存重叠统计到数据库（用于缓存和后续查询）
   */
  async saveOverlapStats(
    scheduleId: string,
    overlaps: OverlapSlot[]
  ): Promise<void> {
    try {
      // 清除旧的统计数据
      await this.prisma.overlapStats.deleteMany({
        where: { scheduleId },
      });

      // 保存新的统计数据
      const statsData = overlaps.map(overlap => ({
        scheduleId,
        startTime: overlap.startTime,
        endTime: overlap.endTime,
        participantCount: overlap.participantCount,
        participantNames: JSON.stringify(overlap.participantNames),
      }));

      if (statsData.length > 0) {
        await this.prisma.overlapStats.createMany({
          data: statsData,
        });
      }

      logger.info(
        `保存重叠统计完成: ${scheduleId}, 记录数: ${statsData.length}`
      );
    } catch (error) {
      logger.error(`保存重叠统计失败: ${scheduleId}`, error);
      throw error;
    }
  }

  /**
   * 从数据库获取缓存的重叠统计
   */
  async getCachedOverlapStats(scheduleId: string): Promise<OverlapSlot[]> {
    try {
      const stats = await this.prisma.overlapStats.findMany({
        where: { scheduleId },
        orderBy: { startTime: 'asc' },
      });

      return stats.map(stat => ({
        startTime: stat.startTime,
        endTime: stat.endTime,
        participantCount: stat.participantCount,
        participantNames: JSON.parse(stat.participantNames),
      }));
    } catch (error) {
      logger.error(`获取缓存重叠统计失败: ${scheduleId}`, error);
      return [];
    }
  }
}
