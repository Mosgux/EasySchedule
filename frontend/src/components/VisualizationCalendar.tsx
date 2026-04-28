import React, { useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { analyticsService } from '../services/analyticsApi';
import { useScheduleAnalytics } from '../hooks/useScheduleAnalytics';

interface VisualizationCalendarProps {
  scheduleId: string;
  timezone: string;
  startDate: string;
  endDate: string;
  onTimeSlotSelect?: (startTime: string, endTime: string) => void;
}

interface CalendarDay {
  date: Dayjs;
  hours: Array<{ hour: number; participantCount: number; intensity: number }>;
}

export const VisualizationCalendar: React.FC<VisualizationCalendarProps> = ({
  scheduleId,
  timezone,
  startDate,
  endDate,
  onTimeSlotSelect,
}) => {
  const [selectedHour, setSelectedHour] = useState<{
    date: string;
    hour: number;
  } | null>(null);
  const [hoveredHour, setHoveredHour] = useState<{
    date: string;
    hour: number;
  } | null>(null);
  const {
    data: analytics,
    isLoading,
    error,
  } = useScheduleAnalytics(scheduleId);

  // 生成日历数据
  const calendarDays = useMemo(() => {
    if (!analytics) return [];

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const days: CalendarDay[] = [];

    let currentDate = start;
    while (currentDate.isBefore(end) || currentDate.isSame(end)) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      const dayData = analytics.availabilityHeatmap.find(
        day => day.date === dateStr
      );

      const maxParticipants = analytics.totalParticipants;

      days.push({
        date: currentDate,
        hours:
          dayData?.hours.map(hour => ({
            ...hour,
            intensity:
              maxParticipants > 0 ? hour.participantCount / maxParticipants : 0,
          })) ||
          Array.from({ length: 24 }, (_, hour) => ({
            hour,
            participantCount: 0,
            intensity: 0,
          })),
      });

      currentDate = currentDate.add(1, 'day');
    }

    return days;
  }, [analytics, startDate, endDate]);

  // 获取颜色类名
  const getColorClass = (intensity: number): string => {
    if (intensity === 0) return 'bg-gray-100 hover:bg-gray-200';
    if (intensity >= 0.8) return 'bg-purple-600 hover:bg-purple-700 text-white';
    if (intensity >= 0.6) return 'bg-purple-500 hover:bg-purple-600 text-white';
    if (intensity >= 0.4) return 'bg-purple-400 hover:bg-purple-500 text-white';
    if (intensity >= 0.2) return 'bg-purple-300 hover:bg-purple-400';
    return 'bg-purple-200 hover:bg-purple-300';
  };

  // 处理小时点击
  const handleHourClick = (date: string, hour: number) => {
    setSelectedHour({ date, hour });

    if (onTimeSlotSelect) {
      const startTime = new Date(
        `${date}T${hour.toString().padStart(2, '0')}:00:00`
      );
      const endTime = new Date(
        `${date}T${(hour + 1).toString().padStart(2, '0')}:00:00`
      );
      onTimeSlotSelect(startTime.toISOString(), endTime.toISOString());
    }
  };

  // 格式化时间显示
  const formatTime = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // 获取重叠统计信息
  const getParticipantInfo = (date: string, hour: number) => {
    const dayData = analytics?.availabilityHeatmap.find(
      day => day.date === date
    );
    const hourData = dayData?.hours.find(h => h.hour === hour);

    if (!hourData || hourData.participantCount === 0) {
      return { count: 0, percentage: 0, text: '无人可用' };
    }

    const percentage = analyticsService.calculateOverlapPercentage(
      hourData.participantCount,
      analytics?.totalParticipants || 0
    );

    return {
      count: hourData.participantCount,
      percentage,
      text: `${hourData.participantCount}人可用 (${percentage}%)`,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">正在加载分析数据...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">加载失败</h3>
        <p className="text-red-600">
          {error instanceof Error ? error.message : '加载分析数据失败'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  if (!analytics || calendarDays.length === 0) {
    return <div className="text-center py-8 text-gray-500">暂无数据</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 头部信息 */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          时间可用性热力图
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>总参与者: {analytics.totalParticipants}人</span>
          <span>时区: {timezone}</span>
        </div>
      </div>

      {/* 图例 */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600">可用性:</span>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300"></div>
            <span className="text-gray-500">0%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-purple-200 border border-gray-300"></div>
            <span className="text-gray-600">20%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-purple-300 border border-gray-300"></div>
            <span className="text-gray-600">40%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-purple-400 border border-gray-300"></div>
            <span className="text-gray-600">60%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-purple-500 border border-gray-300"></div>
            <span className="text-gray-600">80%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-purple-600 border border-gray-300"></div>
            <span className="text-white">100%</span>
          </div>
        </div>
      </div>

      {/* 日历网格 */}
      <div className="p-4">
        <div className="overflow-x-auto">
          {/* 时间标签 */}
          <div className="flex border-b border-gray-200 pb-2 mb-2">
            <div className="w-20 text-sm font-medium text-gray-600">日期</div>
            <div className="flex space-x-1">
              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={hour}
                  className="w-8 text-xs text-gray-500 text-center"
                  title={`${formatTime(hour)} - ${formatTime(hour + 1)}`}
                >
                  {hour}
                </div>
              ))}
            </div>
          </div>

          {/* 每日数据 */}
          {calendarDays.map(day => (
            <div
              key={day.date.format('YYYY-MM-DD')}
              className="flex items-center mb-1"
            >
              {/* 日期标签 */}
              <div className="w-20 text-sm text-gray-700 font-medium pr-2">
                <div>{day.date.format('MM/DD')}</div>
                <div className="text-xs text-gray-500">
                  {day.date.format('ddd')}
                </div>
              </div>

              {/* 小时格子 */}
              <div className="flex space-x-1">
                {day.hours.map(hour => {
                  const isSelected =
                    selectedHour?.date === day.date.format('YYYY-MM-DD') &&
                    selectedHour?.hour === hour.hour;
                  const isHovered =
                    hoveredHour?.date === day.date.format('YYYY-MM-DD') &&
                    hoveredHour?.hour === hour.hour;
                  const participantInfo = getParticipantInfo(
                    day.date.format('YYYY-MM-DD'),
                    hour.hour
                  );

                  return (
                    <div
                      key={hour.hour}
                      className={`
                        w-8 h-8 rounded cursor-pointer transition-all duration-200
                        ${getColorClass(hour.intensity)}
                        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                        ${isHovered ? 'transform scale-110 z-10' : ''}
                      `}
                      onClick={() =>
                        handleHourClick(
                          day.date.format('YYYY-MM-DD'),
                          hour.hour
                        )
                      }
                      onMouseEnter={() =>
                        setHoveredHour({
                          date: day.date.format('YYYY-MM-DD'),
                          hour: hour.hour,
                        })
                      }
                      onMouseLeave={() => setHoveredHour(null)}
                      title={participantInfo.text}
                    >
                      {hour.participantCount > 0 && (
                        <div className="w-full h-full flex items-center justify-center text-xs font-medium">
                          {hour.participantCount}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 选中时间详情 */}
        {selectedHour && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">
                  {selectedHour.date} {formatTime(selectedHour.hour)} -{' '}
                  {formatTime(selectedHour.hour + 1)}
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  {
                    getParticipantInfo(selectedHour.date, selectedHour.hour)
                      .text
                  }
                </p>
              </div>
              <button
                onClick={() => setSelectedHour(null)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                清除选择
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationCalendar;
