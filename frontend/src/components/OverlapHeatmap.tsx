import React, { useMemo, useState } from 'react';
import { analyticsService, OverlapSlot } from '../services/analyticsApi';
import { useScheduleAnalytics } from '../hooks/useScheduleAnalytics';

interface OverlapHeatmapProps {
  scheduleId: string;
  timezone: string;
  onSlotSelect?: (slot: OverlapSlot) => void;
}

interface HeatmapCell {
  day: number;
  hour: number;
  intensity: number;
  participantCount: number;
  slot?: OverlapSlot;
}

export const OverlapHeatmap: React.FC<OverlapHeatmapProps> = ({
  scheduleId,
  onSlotSelect,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<OverlapSlot | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const {
    data: analytics,
    isLoading,
    error,
  } = useScheduleAnalytics(scheduleId);

  // 生成热力图数据
  const heatmapData = useMemo(() => {
    if (!analytics) return [];

    const cells: HeatmapCell[] = [];
    const { topOverlappingSlots } = analytics;

    // 为7天24小时生成网格
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        // 检查这个时间段是否有重叠
        const matchingSlot = topOverlappingSlots.find(slot => {
          const slotStart = new Date(slot.startTime);

          // 获取星期几 (0=Sunday, 1=Monday, ...)
          const slotDay = slotStart.getDay();
          const slotHour = slotStart.getHours();

          return slotDay === day && slotHour === hour;
        });

        cells.push({
          day,
          hour,
          intensity: matchingSlot
            ? analyticsService.calculateOverlapPercentage(
                matchingSlot.participantCount,
                analytics.totalParticipants
              ) / 100
            : 0,
          participantCount: matchingSlot?.participantCount || 0,
          slot: matchingSlot,
        });
      }
    }

    return cells;
  }, [analytics]);

  // 获取颜色类名
  const getColorClass = (intensity: number): string => {
    if (intensity === 0) return 'bg-gray-100 hover:bg-gray-200';
    if (intensity >= 0.8) return 'bg-red-600 hover:bg-red-700 text-white';
    if (intensity >= 0.6) return 'bg-orange-500 hover:bg-orange-600 text-white';
    if (intensity >= 0.4) return 'bg-yellow-500 hover:bg-yellow-600 text-white';
    if (intensity >= 0.2) return 'bg-green-500 hover:bg-green-600 text-white';
    return 'bg-blue-500 hover:bg-blue-600 text-white';
  };

  // 处理格子点击
  const handleCellClick = (cell: HeatmapCell) => {
    if (cell.slot) {
      setSelectedSlot(cell.slot);
      if (onSlotSelect) {
        onSlotSelect(cell.slot);
      }
    }
  };

  // 格式化星期
  const formatDay = (day: number): string => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[day];
  };

  // 格式化时间
  const formatHour = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // 获取统计信息
  const getStats = () => {
    if (!analytics) return null;

    const { totalParticipants, topOverlappingSlots } = analytics;
    const maxOverlap =
      topOverlappingSlots.length > 0
        ? Math.max(...topOverlappingSlots.map(slot => slot.participantCount))
        : 0;
    const totalOverlapSlots = topOverlappingSlots.length;

    return {
      totalParticipants,
      maxOverlap,
      totalOverlapSlots,
      averageOverlap:
        totalOverlapSlots > 0
          ? Math.round(
              topOverlappingSlots.reduce(
                (sum, slot) => sum + slot.participantCount,
                0
              ) / totalOverlapSlots
            )
          : 0,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">正在生成热力图...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">加载失败</h3>
        <p className="text-red-600">
          {error instanceof Error ? error.message : '加载热力图数据失败'}
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

  const stats = getStats();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 头部信息 */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          时间重叠热力图
        </h3>
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">总参与者:</span>
              <span className="ml-2 font-medium">
                {stats.totalParticipants}人
              </span>
            </div>
            <div>
              <span className="text-gray-600">最大重叠:</span>
              <span className="ml-2 font-medium text-red-600">
                {stats.maxOverlap}人
              </span>
            </div>
            <div>
              <span className="text-gray-600">重叠时段:</span>
              <span className="ml-2 font-medium">
                {stats.totalOverlapSlots}个
              </span>
            </div>
            <div>
              <span className="text-gray-600">平均重叠:</span>
              <span className="ml-2 font-medium">{stats.averageOverlap}人</span>
            </div>
          </div>
        )}
      </div>

      {/* 图例 */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600">重叠程度:</span>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300"></div>
            <span className="text-gray-500">无重叠</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-500 border border-gray-300"></div>
            <span className="text-white text-xs">低</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-green-500 border border-gray-300"></div>
            <span className="text-white text-xs">中</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-yellow-500 border border-gray-300"></div>
            <span className="text-white text-xs">高</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-orange-500 border border-gray-300"></div>
            <span className="text-white text-xs">很高</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-red-600 border border-gray-300"></div>
            <span className="text-white text-xs">极高</span>
          </div>
        </div>
      </div>

      {/* 热力图网格 */}
      <div className="p-4">
        <div className="overflow-x-auto">
          {/* 时间标签 */}
          <div className="flex border-b border-gray-200 pb-2 mb-2">
            <div className="w-12 text-sm font-medium text-gray-600">时间</div>
            <div className="flex space-x-1">
              {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(
                (day, index) => (
                  <div
                    key={index}
                    className="w-12 text-xs text-gray-500 text-center"
                  >
                    {day}
                  </div>
                )
              )}
            </div>
          </div>

          {/* 小时行 */}
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="flex items-center mb-1">
              {/* 时间标签 */}
              <div className="w-12 text-sm text-gray-700 font-medium pr-2">
                {formatHour(hour)}
              </div>

              {/* 一周的热力图格子 */}
              <div className="flex space-x-1">
                {heatmapData
                  .filter(cell => cell.hour === hour)
                  .map(cell => {
                    const isSelected =
                      selectedSlot &&
                      cell.slot &&
                      selectedSlot.startTime === cell.slot.startTime;
                    const isHovered =
                      hoveredCell &&
                      hoveredCell.day === cell.day &&
                      hoveredCell.hour === cell.hour;

                    return (
                      <div
                        key={`${cell.day}-${cell.hour}`}
                        className={`
                          w-12 h-8 rounded cursor-pointer transition-all duration-200
                          ${getColorClass(cell.intensity)}
                          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                          ${isHovered ? 'transform scale-110 z-10' : ''}
                          ${cell.slot ? 'relative' : ''}
                        `}
                        onClick={() => handleCellClick(cell)}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={
                          cell.slot
                            ? `${formatDay(cell.day)} ${formatHour(cell.hour)} - ${cell.participantCount}人重叠`
                            : `${formatDay(cell.day)} ${formatHour(cell.hour)} - 无人重叠`
                        }
                      >
                        {cell.participantCount > 0 && (
                          <div className="w-full h-full flex items-center justify-center text-xs font-medium">
                            {cell.participantCount}
                          </div>
                        )}
                        {cell.slot && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full opacity-70"></div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* 悬停提示 */}
        {hoveredCell && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm">
              <span className="font-medium">
                {formatDay(hoveredCell.day)} {formatHour(hoveredCell.hour)}
              </span>
              {hoveredCell.participantCount > 0 ? (
                <span className="ml-2 text-green-600">
                  {hoveredCell.participantCount}人重叠
                </span>
              ) : (
                <span className="ml-2 text-gray-500">无人重叠</span>
              )}
            </div>
          </div>
        )}

        {/* 选中时间段详情 */}
        {selectedSlot && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">
                  重叠时间段详情
                </h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>
                    <strong>时间:</strong>{' '}
                    {analyticsService.formatOverlapSlot(selectedSlot)}
                  </p>
                  <p>
                    <strong>参与人数:</strong> {selectedSlot.participantCount}人
                  </p>
                  <p>
                    <strong>参与者:</strong>{' '}
                    {selectedSlot.participants.join(', ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
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

export default OverlapHeatmap;
