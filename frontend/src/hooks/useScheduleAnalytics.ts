import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsApi';

export const scheduleAnalyticsQueryKey = (scheduleId?: string) =>
  ['schedule-analytics', scheduleId] as const;

export function useScheduleAnalytics(scheduleId?: string) {
  return useQuery({
    queryKey: scheduleAnalyticsQueryKey(scheduleId),
    queryFn: () => analyticsService.getScheduleAnalytics(scheduleId!),
    enabled: Boolean(scheduleId),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (
        error instanceof Error &&
        (error.message.includes('不存在') || error.message.includes('已过期'))
      ) {
        return false;
      }

      return failureCount < 2;
    },
  });
}
