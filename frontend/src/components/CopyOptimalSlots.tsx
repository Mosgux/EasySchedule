import { useMemo, useState } from 'react';
import { analyticsService } from '../services/analyticsApi';
import {
  copyOptimalTimeSlots,
  showCopyFeedback,
} from '../utils/copyToClipboard';
import { useScheduleAnalytics } from '../hooks/useScheduleAnalytics';

interface CopyOptimalSlotsProps {
  scheduleId: string;
  scheduleTitle: string;
  timezone: string;
  className?: string;
}

export function CopyOptimalSlots({
  scheduleId,
  scheduleTitle,
  timezone,
  className = '',
}: CopyOptimalSlotsProps) {
  const [isCopying, setIsCopying] = useState(false);

  // 获取最优时间段数据
  const {
    data: analytics,
    isLoading,
    error,
  } = useScheduleAnalytics(scheduleId);
  const optimalSlots = useMemo(
    () =>
      analytics
        ? analyticsService.findBestTimeSlots(analytics.topOverlappingSlots, 5)
        : [],
    [analytics]
  );

  const handleCopyOptimalSlots = async () => {
    if (!optimalSlots || optimalSlots.length === 0) {
      showCopyFeedback(false, '没有可复制的时间段');
      return;
    }

    setIsCopying(true);

    try {
      const success = await copyOptimalTimeSlots(
        optimalSlots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          participantCount: slot.participantCount,
          participantNames: slot.participants || [],
        })),
        scheduleTitle,
        timezone
      );

      showCopyFeedback(
        success,
        `已复制 ${optimalSlots.length} 个最优时间段到剪贴板`
      );
    } catch (error) {
      console.error('复制最优时间段失败:', error);
      showCopyFeedback(false, '复制失败，请重试');
    } finally {
      setIsCopying(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white border rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !optimalSlots || optimalSlots.length === 0) {
    return (
      <div
        className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}
      >
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          复制最优时间段
        </h3>
        <p className="text-sm text-gray-500">暂无可推荐的时间段</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">复制最优时间段</h3>
        <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">
          {optimalSlots.length} 个推荐
        </span>
      </div>

      {/* 预览最优时间段 */}
      <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
        {optimalSlots.slice(0, 3).map((slot, index) => (
          <div key={index} className="text-xs bg-gray-50 p-2 rounded">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">
                推荐时段 {index + 1}
              </span>
              <span className="text-blue-600 font-medium">
                {slot.participantCount} 人
              </span>
            </div>
            <div className="text-gray-600 mt-1">
              {new Date(slot.startTime).toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {' - '}
              {new Date(slot.endTime).toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            {slot.participants && slot.participants.length > 0 && (
              <div className="text-gray-500 mt-1 truncate">
                参与: {slot.participants.slice(0, 3).join(', ')}
                {slot.participants.length > 3 && '...'}
              </div>
            )}
          </div>
        ))}
        {optimalSlots.length > 3 && (
          <div className="text-xs text-gray-500 text-center">
            还有 {optimalSlots.length - 3} 个时间段...
          </div>
        )}
      </div>

      {/* 复制按钮 */}
      <button
        onClick={handleCopyOptimalSlots}
        disabled={isCopying}
        className={`
          w-full px-4 py-2 text-sm font-medium rounded-md transition-colors
          ${
            isCopying
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {isCopying ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            复制中...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            复制所有推荐时间段
          </span>
        )}
      </button>

      {/* 说明文字 */}
      <div className="mt-3 text-xs text-gray-500">
        复制的内容包含格式化的时间段信息，可直接分享给参与者
      </div>
    </div>
  );
}

// 简单的复制按钮组件，用于其他地方嵌入
export function CopyOptimalSlotsButton({
  scheduleTitle,
  timezone,
  onCopySuccess,
  onCopyError,
  className = '',
}: CopyOptimalSlotsProps & {
  onCopySuccess?: () => void;
  onCopyError?: (error: Error) => void;
}) {
  const [isCopying, setIsCopying] = useState(false);

  const handleClick = async () => {
    setIsCopying(true);

    try {
      // 这里简化处理，实际应该调用analytics API
      const success = await copyOptimalTimeSlots([], scheduleTitle, timezone);

      if (success) {
        onCopySuccess?.();
        showCopyFeedback(success, '最优时间段已复制到剪贴板');
      } else {
        onCopyError?.(new Error('复制失败'));
        showCopyFeedback(false);
      }
    } catch (error) {
      onCopyError?.(error as Error);
      showCopyFeedback(false);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isCopying}
      className={`
        px-3 py-1 text-xs font-medium rounded transition-colors
        ${
          isCopying
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        }
        ${className}
      `}
    >
      {isCopying ? '复制中...' : '复制最优时段'}
    </button>
  );
}
