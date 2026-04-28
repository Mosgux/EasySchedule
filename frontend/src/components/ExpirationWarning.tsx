import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

interface ExpirationWarningProps {
  scheduleId: string;
  expiresAt: string;
  className?: string;
}

interface ExpiringSchedule {
  id: string;
  title: string;
  expiresAt: string;
  hoursUntilExpiration: number;
}

export function ExpirationWarning({
  scheduleId,
  expiresAt,
  className = '',
}: ExpirationWarningProps) {
  const [timeUntilExpiration, setTimeUntilExpiration] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isExpiringSoon, setIsExpiringSoon] = useState<boolean>(false);

  useEffect(() => {
    const updateExpirationStatus = () => {
      const now = dayjs();
      const expiration = dayjs(expiresAt);
      const diffHours = expiration.diff(now, 'hour');
      const diffMinutes = expiration.diff(now, 'minute');

      setIsExpired(diffMinutes <= 0);
      setIsExpiringSoon(diffHours > 0 && diffHours <= 24);

      if (diffMinutes <= 0) {
        setTimeUntilExpiration('已过期');
      } else if (diffHours < 1) {
        setTimeUntilExpiration(`${diffMinutes} 分钟后过期`);
      } else if (diffHours < 24) {
        setTimeUntilExpiration(`${diffHours} 小时后过期`);
      } else {
        const diffDays = expiration.diff(now, 'day');
        setTimeUntilExpiration(`${diffDays} 天后过期`);
      }
    };

    // 立即更新一次
    updateExpirationStatus();

    // 每分钟更新一次
    const interval = setInterval(updateExpirationStatus, 60000);

    return () => clearInterval(interval);
  }, [expiresAt, scheduleId]);

  // 如果时间表已过期，显示错误警告
  if (isExpired) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center space-x-3">
          <svg
            className="w-6 h-6 text-red-600 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">时间表已过期</h3>
            <p className="text-sm text-red-600 mt-1">
              该时间表已于 {dayjs(expiresAt).format('YYYY-MM-DD HH:mm')}{' '}
              过期，参与者无法再提交时间信息。
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
              >
                刷新状态
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 如果时间表即将过期（24小时内），显示警告
  if (isExpiringSoon) {
    return (
      <div
        className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center space-x-3">
          <svg
            className="w-6 h-6 text-yellow-600 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              时间表即将过期
            </h3>
            <p className="text-sm text-yellow-600 mt-1">
              该时间表将在 <strong>{timeUntilExpiration}</strong> 过期，
              过期后参与者将无法提交时间信息。
            </p>
            <div className="mt-3 text-xs text-yellow-700">
              <p>过期时间: {dayjs(expiresAt).format('YYYY-MM-DD HH:mm')}</p>
              <p>建议: 通知参与者尽快完成时间填写，或考虑延长过期时间</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 如果还有充足时间，显示正常状态信息
  return (
    <div
      className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center space-x-3">
        <svg
          className="w-6 h-6 text-green-600 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-green-800">时间表状态正常</h3>
          <p className="text-sm text-green-600 mt-1">
            该时间表还有 {timeUntilExpiration}{' '}
            过期，参与者可以正常提交时间信息。
          </p>
          <div className="mt-2 text-xs text-green-700">
            过期时间: {dayjs(expiresAt).format('YYYY-MM-DD HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );
}

// 用于显示多个即将过期时间表的组件
export function ExpiringSchedulesList({
  schedules,
}: {
  schedules: ExpiringSchedule[];
}) {
  if (!schedules || schedules.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-yellow-800 mb-3">
        即将过期的时间表
      </h3>
      <div className="space-y-2">
        {schedules.map(schedule => (
          <div
            key={schedule.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-yellow-700">{schedule.title}</span>
            <span className="text-yellow-600 font-medium">
              {schedule.hoursUntilExpiration} 小时后过期
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
