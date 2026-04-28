import React, { useMemo, useState } from 'react';
import { analyticsService, OverlapSlot } from '../services/analyticsApi';
import { useScheduleAnalytics } from '../hooks/useScheduleAnalytics';

interface TopOverlappingSlotsProps {
  scheduleId: string;
  timezone: string;
  onSlotSelect?: (slot: OverlapSlot) => void;
  maxSlots?: number;
}

export const TopOverlappingSlots: React.FC<TopOverlappingSlotsProps> = ({
  scheduleId,
  onSlotSelect,
  maxSlots = 3,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<OverlapSlot | null>(null);
  const {
    data: analytics,
    isLoading,
    error,
  } = useScheduleAnalytics(scheduleId);

  const topSlots = useMemo(
    () =>
      analytics
        ? analyticsService.findBestTimeSlots(
            analytics.topOverlappingSlots,
            maxSlots
          )
        : [],
    [analytics, maxSlots]
  );

  // 处理时间段选择
  const handleSlotSelect = (slot: OverlapSlot) => {
    setSelectedSlot(slot);
    if (onSlotSelect) {
      onSlotSelect(slot);
    }
  };

  // 获取重叠等级样式
  const getOverlapLevelClass = (
    participantCount: number,
    totalParticipants: number
  ) => {
    const percentage = analyticsService.calculateOverlapPercentage(
      participantCount,
      totalParticipants
    );

    if (percentage >= 80) return 'bg-red-50 border-red-200 text-red-800';
    if (percentage >= 60)
      return 'bg-orange-50 border-orange-200 text-orange-800';
    if (percentage >= 40)
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    if (percentage >= 20) return 'bg-green-50 border-green-200 text-green-800';
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  // 获取重叠等级标签
  const getOverlapLevelLabel = (
    participantCount: number,
    totalParticipants: number
  ) => {
    const percentage = analyticsService.calculateOverlapPercentage(
      participantCount,
      totalParticipants
    );

    if (percentage >= 80) return '极高重叠';
    if (percentage >= 60) return '很高重叠';
    if (percentage >= 40) return '高重叠';
    if (percentage >= 20) return '中等重叠';
    return '低重叠';
  };

  // 格式化持续时间
  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60)
    ); // 分钟

    if (duration < 60) {
      return `${duration}分钟`;
    } else {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">正在分析最佳时段...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">加载失败</h3>
        <p className="text-red-600 text-sm">
          {error instanceof Error ? error.message : '加载重叠时段数据失败'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
        >
          重试
        </button>
      </div>
    );
  }

  if (!analytics || topSlots.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-medium mb-1">暂无重叠时段</p>
          <p className="text-sm">参与者们的时间安排没有重叠部分</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 头部信息 */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          最佳重叠时段
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>基于 {analytics.totalParticipants} 位参与者的时间分析</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            Top {topSlots.length}
          </span>
        </div>
      </div>

      {/* 排行榜列表 */}
      <div className="p-4 space-y-3">
        {topSlots.map((slot, index) => {
          const isSelected =
            selectedSlot && selectedSlot.startTime === slot.startTime;
          const overlapLevel = getOverlapLevelClass(
            slot.participantCount,
            analytics.totalParticipants
          );
          const overlapLabel = getOverlapLevelLabel(
            slot.participantCount,
            analytics.totalParticipants
          );

          return (
            <div
              key={slot.startTime}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${overlapLevel}
                ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:shadow-md'}
              `}
              onClick={() => handleSlotSelect(slot)}
            >
              {/* 排名标识 */}
              <div className="absolute top-3 left-3">
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${
                    index === 0
                      ? 'bg-yellow-400 text-yellow-900'
                      : index === 1
                        ? 'bg-gray-300 text-gray-700'
                        : index === 2
                          ? 'bg-orange-300 text-orange-800'
                          : 'bg-gray-200 text-gray-600'
                  }
                `}
                >
                  {index + 1}
                </div>
              </div>

              {/* 内容区域 */}
              <div className="ml-12">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-base mb-1">
                      {analyticsService.formatOverlapSlot(slot)}
                    </h4>
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="font-medium">
                        {slot.participantCount}/{analytics.totalParticipants}{' '}
                        人可用
                      </span>
                      <span className="opacity-75">
                        (
                        {analyticsService.calculateOverlapPercentage(
                          slot.participantCount,
                          analytics.totalParticipants
                        )}
                        %)
                      </span>
                      <span className="opacity-60">
                        持续 {formatDuration(slot.startTime, slot.endTime)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : index === 1
                          ? 'bg-gray-100 text-gray-700'
                          : index === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                    }
                  `}
                  >
                    {overlapLabel}
                  </span>
                </div>

                {/* 参与者列表 */}
                <div className="mt-3">
                  <div className="text-sm opacity-75 mb-1">参与者:</div>
                  <div className="flex flex-wrap gap-1">
                    {slot.participants.slice(0, 6).map((participant, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-1 bg-white bg-opacity-60 rounded text-xs font-medium"
                      >
                        {participant}
                      </span>
                    ))}
                    {slot.participants.length > 6 && (
                      <span className="inline-block px-2 py-1 bg-white bg-opacity-60 rounded text-xs font-medium">
                        +{slot.participants.length - 6} 更多
                      </span>
                    )}
                  </div>
                </div>

                {/* 操作提示 */}
                <div className="mt-3 text-xs opacity-60">点击选择此时间段</div>
              </div>

              {/* 选中指示器 */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部统计信息 */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>共找到 {analytics.topOverlappingSlots.length} 个重叠时段</span>
          {topSlots.length < analytics.topOverlappingSlots.length && (
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              查看全部
            </button>
          )}
        </div>
      </div>

      {/* 选中时段详情 */}
      {selectedSlot && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">已选择时段</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  <strong>时间:</strong>{' '}
                  {analyticsService.formatOverlapSlot(selectedSlot)}
                </p>
                <p>
                  <strong>参与率:</strong>{' '}
                  {analyticsService.calculateOverlapPercentage(
                    selectedSlot.participantCount,
                    analytics.totalParticipants
                  )}
                  %
                </p>
                <p>
                  <strong>参与者:</strong>{' '}
                  {selectedSlot.participants.join(', ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedSlot(null)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              清除选择
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopOverlappingSlots;
