import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { participantApi } from '../services/participantApi';
import { TimeSlotData } from '../types/participant';

interface ScheduleData {
  id: string;
  title: string;
  description: string;
  timezone: string;
  startDate: string;
  endDate: string;
  expiresAt: string;
  isLocked: boolean;
  participants: Array<{
    id: string;
    name: string;
    color: string;
    timeSlots: Array<{
      id: string;
      startTime: string;
      endTime: string;
      isCustom: boolean;
    }>;
  }>;
  shareToken: string;
  totalParticipants: number;
}

const toISOString = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export const useParticipantTimeSlots = (participantId?: string) => {
  return useQuery({
    queryKey: ['participant-time-slots', participantId],
    queryFn: () => participantApi.getParticipantTimeSlots(participantId!),
    enabled: !!participantId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useScheduleData = (token?: string) => {
  const queryClient = useQueryClient();

  // 获取时间表数据
  const {
    data: scheduleData,
    isLoading: isLoadingSchedule,
    error: scheduleError,
    refetch: refetchSchedule,
  } = useQuery({
    queryKey: ['schedule', token],
    queryFn: () => participantApi.getScheduleByToken(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据是新鲜的
    retry: (failureCount, error) => {
      // 如果是404或410错误，不重试
      if (
        error instanceof Error &&
        (error.message.includes('404') || error.message.includes('410'))
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // 验证分享链接
  const {
    mutate: validateToken,
    isPending: isValidatingToken,
    data: isValidToken,
  } = useMutation({
    mutationFn: participantApi.validateShareToken,
    onSuccess: isValid => {
      if (!isValid) {
        // 可以在这里处理无效token的情况
        console.warn('Invalid share token');
      }
    },
  });

  // 创建或更新参与者
  const {
    mutate: createOrUpdateParticipant,
    isPending: isSubmittingParticipant,
    error: submitError,
    reset: resetSubmitError,
  } = useMutation({
    mutationFn: ({
      scheduleId,
      name,
      timeSlots,
    }: {
      scheduleId: string;
      name: string;
      timeSlots: TimeSlotData[];
    }) => participantApi.createOrUpdateParticipant(scheduleId, name, timeSlots),
    onSuccess: (_, variables) => {
      // 成功提交后，刷新时间表数据
      queryClient.invalidateQueries({ queryKey: ['schedule', token] });

      // 可以选择性地更新缓存
      queryClient.setQueryData(
        ['schedule', token],
        (oldData: ScheduleData | undefined) => {
          if (!oldData) return oldData;

          // 检查是否是更新现有参与者
          const existingParticipantIndex = oldData.participants.findIndex(
            p => p.name.toLowerCase() === variables.name.toLowerCase()
          );

          if (existingParticipantIndex >= 0) {
            // 更新现有参与者
            const updatedParticipants = [...oldData.participants];
            updatedParticipants[existingParticipantIndex] = {
              ...updatedParticipants[existingParticipantIndex],
              timeSlots: variables.timeSlots.map((slot, index) => ({
                id: `temp-${Date.now()}-${index}`, // 临时ID，实际应该从API返回
                startTime: toISOString(slot.startTime),
                endTime: toISOString(slot.endTime),
                isCustom: slot.isCustom || false,
              })),
            };

            return {
              ...oldData,
              participants: updatedParticipants,
            };
          } else {
            // 添加新参与者
            const newParticipant = {
              id: `temp-${Date.now()}`, // 临时ID，实际应该从API返回
              name: variables.name,
              color: '#' + Math.floor(Math.random() * 16777215).toString(16), // 随机颜色
              timeSlots: variables.timeSlots.map((slot, index) => ({
                id: `temp-${Date.now()}-${index}`,
                startTime: toISOString(slot.startTime),
                endTime: toISOString(slot.endTime),
                isCustom: slot.isCustom || false,
              })),
            };

            return {
              ...oldData,
              participants: [...oldData.participants, newParticipant],
              totalParticipants: oldData.totalParticipants + 1,
            };
          }
        }
      );
    },
  });

  // 获取参与者时间段
  const getParticipantTimeSlots = (participantId: string) => {
    return queryClient.fetchQuery({
      queryKey: ['participant-time-slots', participantId],
      queryFn: () => participantApi.getParticipantTimeSlots(participantId),
      staleTime: 2 * 60 * 1000, // 2分钟
    });
  };

  // 更新参与者时间段
  const { mutate: updateParticipantTimeSlots, isPending: isUpdatingTimeSlots } =
    useMutation({
      mutationFn: ({
        participantId,
        timeSlots,
      }: {
        participantId: string;
        timeSlots: TimeSlotData[];
      }) => participantApi.updateParticipantTimeSlots(participantId, timeSlots),
      onSuccess: (_, variables) => {
        // 刷新相关数据
        queryClient.invalidateQueries({ queryKey: ['schedule', token] });
        queryClient.invalidateQueries({
          queryKey: ['participant-time-slots', variables.participantId],
        });
      },
    });

  // 删除参与者
  const { mutate: deleteParticipant, isPending: isDeletingParticipant } =
    useMutation({
      mutationFn: participantApi.deleteParticipant,
      onSuccess: (_, participantId) => {
        // 刷新时间表数据
        queryClient.invalidateQueries({ queryKey: ['schedule', token] });

        // 乐观更新：从缓存中移除参与者
        queryClient.setQueryData(
          ['schedule', token],
          (oldData: ScheduleData | undefined) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              participants: oldData.participants.filter(
                p => p.id !== participantId
              ),
              totalParticipants: oldData.totalParticipants - 1,
            };
          }
        );
      },
    });

  // 预取相关数据
  const prefetchScheduleInfo = (token: string) => {
    queryClient.prefetchQuery({
      queryKey: ['schedule-info', token],
      queryFn: () => participantApi.getScheduleInfoByToken(token),
      staleTime: 5 * 60 * 1000,
    });
  };

  // 清除缓存
  const clearScheduleCache = () => {
    queryClient.removeQueries({ queryKey: ['schedule', token] });
    queryClient.removeQueries({ queryKey: ['schedule-info', token] });
  };

  return {
    // 数据
    scheduleData,
    isValidToken,

    // 加载状态
    isLoadingSchedule,
    isValidatingToken,
    isSubmittingParticipant,
    isUpdatingTimeSlots,
    isDeletingParticipant,

    // 错误状态
    scheduleError,
    submitError,

    // 操作
    refetchSchedule,
    validateToken,
    createOrUpdateParticipant,
    getParticipantTimeSlots,
    updateParticipantTimeSlots,
    deleteParticipant,
    prefetchScheduleInfo,
    clearScheduleCache,
    resetSubmitError,
  };
};
