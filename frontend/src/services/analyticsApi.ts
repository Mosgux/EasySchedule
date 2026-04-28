import { apiClient } from './apiClient';

export interface OverlapSlot {
  startTime: string;
  endTime: string;
  participantCount: number;
  participants: string[];
}

export interface HeatmapHour {
  hour: number;
  participantCount: number;
}

export interface HeatmapData {
  date: string;
  hours: HeatmapHour[];
}

export interface AnalyticsResponse {
  totalParticipants: number;
  topOverlappingSlots: OverlapSlot[];
  availabilityHeatmap: HeatmapData[];
}

export interface AnalyticsError {
  error: string;
  message: string;
  details?: unknown;
}

interface AnalyticsApiError {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

export class AnalyticsService {
  private baseUrl = '/analytics';

  /**
   * 获取时间表的分析数据
   */
  async getScheduleAnalytics(scheduleId: string): Promise<AnalyticsResponse> {
    try {
      const response = await apiClient.get<AnalyticsResponse>(
        `${this.baseUrl}/${scheduleId}`
      );
      return response.data;
    } catch (error) {
      const requestError = error as AnalyticsApiError;
      if (requestError.response?.status === 404) {
        throw new Error('时间表不存在');
      } else if (requestError.response?.status === 410) {
        throw new Error('时间表已过期');
      } else if (requestError.response?.data?.message) {
        throw new Error(requestError.response.data.message);
      }
      throw new Error('获取分析数据失败，请稍后重试');
    }
  }

  /**
   * 获取最优重叠时间段
   */
  async getTopOverlappingSlots(
    scheduleId: string,
    limit: number = 5
  ): Promise<OverlapSlot[]> {
    try {
      const analytics = await this.getScheduleAnalytics(scheduleId);
      return this.findBestTimeSlots(analytics.topOverlappingSlots, limit);
    } catch (error) {
      throw new Error(
        `获取最优时间段失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 格式化重叠时间段为显示文本
   */
  formatOverlapSlot(slot: OverlapSlot): string {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      });
    };

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const startDate = formatDate(startTime);
    const endDate = formatDate(endTime);

    // 如果是同一天，只显示一次日期
    const dateDisplay =
      startDate === endDate ? startDate : `${startDate} - ${endDate}`;
    const timeDisplay = `${formatTime(startTime)} - ${formatTime(endTime)}`;

    return `${dateDisplay} ${timeDisplay}`;
  }

  /**
   * 计算重叠度百分比
   */
  calculateOverlapPercentage(
    participantCount: number,
    totalParticipants: number
  ): number {
    if (totalParticipants === 0) return 0;
    return Math.round((participantCount / totalParticipants) * 100);
  }

  /**
   * 获取重叠强度的CSS类名
   */
  getOverlapIntensityClass(
    participantCount: number,
    totalParticipants: number
  ): string {
    const percentage = this.calculateOverlapPercentage(
      participantCount,
      totalParticipants
    );

    if (percentage >= 80) return 'bg-red-500'; // 高重叠
    if (percentage >= 60) return 'bg-orange-500'; // 中高重叠
    if (percentage >= 40) return 'bg-yellow-500'; // 中等重叠
    if (percentage >= 20) return 'bg-green-500'; // 低重叠
    return 'bg-blue-500'; // 很低重叠
  }

  /**
   * 获取热力图颜色的CSS类名
   */
  getHeatmapColorClass(
    participantCount: number,
    maxParticipants: number
  ): string {
    if (participantCount === 0) return 'bg-gray-100';

    const intensity = participantCount / maxParticipants;

    if (intensity >= 0.8) return 'bg-purple-600';
    if (intensity >= 0.6) return 'bg-purple-500';
    if (intensity >= 0.4) return 'bg-purple-400';
    if (intensity >= 0.2) return 'bg-purple-300';
    return 'bg-purple-200';
  }

  /**
   * 格式化热力图数据为图表所需格式
   */
  formatHeatmapForChart(heatmap: HeatmapData[]): Array<{
    date: string;
    data: Array<{ hour: number; count: number; intensity: number }>;
  }> {
    const maxParticipants = Math.max(
      ...heatmap.flatMap(day => day.hours.map(hour => hour.participantCount))
    );

    return heatmap.map(day => ({
      date: day.date,
      data: day.hours.map(hour => ({
        hour: hour.hour,
        count: hour.participantCount,
        intensity:
          maxParticipants > 0 ? hour.participantCount / maxParticipants : 0,
      })),
    }));
  }

  /**
   * 查找最佳时间段（最多人可用的时段）
   */
  findBestTimeSlots(overlaps: OverlapSlot[], limit: number = 3): OverlapSlot[] {
    return [...overlaps]
      .sort((a, b) => {
        // 首先按参与人数排序
        if (b.participantCount !== a.participantCount) {
          return b.participantCount - a.participantCount;
        }
        // 然后按持续时间排序
        const durationA =
          new Date(a.endTime).getTime() - new Date(a.startTime).getTime();
        const durationB =
          new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
        return durationB - durationA;
      })
      .slice(0, limit);
  }

  /**
   * 生成时间段统计摘要
   */
  generateSummaryStats(analytics: AnalyticsResponse): {
    totalParticipants: number;
    bestOverlapCount: number;
    averageAvailability: number;
    peakHours: Array<{ hour: number; count: number }>;
  } {
    const { totalParticipants, topOverlappingSlots, availabilityHeatmap } =
      analytics;

    // 最佳重叠人数
    const bestOverlapCount =
      topOverlappingSlots.length > 0
        ? Math.max(...topOverlappingSlots.map(slot => slot.participantCount))
        : 0;

    // 计算平均可用性
    const allHourCounts = availabilityHeatmap.flatMap(day =>
      day.hours.map(hour => hour.participantCount)
    );
    const averageAvailability =
      allHourCounts.length > 0
        ? Math.round(
            allHourCounts.reduce((sum, count) => sum + count, 0) /
              allHourCounts.length
          )
        : 0;

    // 找出高峰时段
    const hourCounts: { [hour: number]: number } = {};
    availabilityHeatmap.forEach(day => {
      day.hours.forEach(hour => {
        if (!hourCounts[hour.hour]) {
          hourCounts[hour.hour] = 0;
        }
        hourCounts[hour.hour] += hour.participantCount;
      });
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      totalParticipants,
      bestOverlapCount,
      averageAvailability,
      peakHours,
    };
  }
}

// 导出单例实例
export const analyticsService = new AnalyticsService();
