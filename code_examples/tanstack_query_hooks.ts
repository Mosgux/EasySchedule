// src/hooks/useScheduleQueries.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  useQueries,
} from '@tanstack/react-query';
import { scheduleService } from '@services/scheduleService';
import {
  Schedule,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  JoinScheduleRequest,
  Participant,
} from '@types/schedule';

// 查询键工厂
export const scheduleKeys = {
  all: ['schedules'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  list: (filters: string) => [...scheduleKeys.lists(), { filters }] as const,
  details: () => [...scheduleKeys.all, 'detail'] as const,
  detail: (id: string) => [...scheduleKeys.details(), id] as const,
  participants: (id: string) =>
    [...scheduleKeys.detail(id), 'participants'] as const,
  overlaps: (id: string) => [...scheduleKeys.detail(id), 'overlaps'] as const,
};

// 获取单个时间表
export const useSchedule = (id: string, enabled = true) => {
  return useQuery({
    queryKey: scheduleKeys.detail(id),
    queryFn: () => scheduleService.getSchedule(id),
    enabled: enabled && !!id,
    staleTime: 30 * 1000, // 30秒内数据被认为是新鲜的
    cacheTime: 5 * 60 * 1000, // 5分钟缓存
    refetchInterval: 60 * 1000, // 每分钟自动刷新
    retry: (failureCount, error) => {
      // 404 错误不重试
      if (error.status === 404) return false;
      return failureCount < 3;
    },
    meta: {
      onError: error => {
        console.error('Failed to fetch schedule:', error);
      },
    },
  });
};

// 并行获取多个时间表
export const useSchedules = (ids: string[]) => {
  return useQueries({
    queries: ids.map(id => ({
      queryKey: scheduleKeys.detail(id),
      queryFn: () => scheduleService.getSchedule(id),
      staleTime: 30 * 1000,
      enabled: !!id,
    })),
  });
};

// 创建时间表
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScheduleRequest) =>
      scheduleService.createSchedule(data),

    // 乐观更新
    onMutate: async newSchedule => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: scheduleKeys.lists() });

      // 获取之前的数据快照
      const previousSchedules = queryClient.getQueryData(scheduleKeys.lists());

      // 生成临时ID
      const tempId = `temp-${Date.now()}`;

      // 乐观更新
      const optimisticSchedule: Schedule = {
        id: tempId,
        title: newSchedule.title,
        description: newSchedule.description,
        creatorId: 'current-user', // 应该从认证状态获取
        timeZone: newSchedule.timeZone,
        startDate: newSchedule.startDate,
        endDate: newSchedule.endDate,
        expiresAt: newSchedule.expiresAt,
        locked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
        settings: {
          morningStart: '09:00',
          morningEnd: '12:00',
          afternoonStart: '13:00',
          afternoonEnd: '18:00',
          eveningStart: '19:00',
          eveningEnd: '21:00',
          timeSlotGranularity: 30,
          ...newSchedule.settings,
        },
      };

      queryClient.setQueryData(scheduleKeys.lists(), (old: Schedule[] = []) => [
        ...old,
        optimisticSchedule,
      ]);

      // 同时设置详情查询缓存
      queryClient.setQueryData(scheduleKeys.detail(tempId), optimisticSchedule);

      return { previousSchedules, tempId };
    },

    // 错误处理
    onError: (err, newSchedule, context) => {
      console.error('Failed to create schedule:', err);

      // 恢复之前的数据
      if (context?.previousSchedules) {
        queryClient.setQueryData(
          scheduleKeys.lists(),
          context.previousSchedules
        );
      }

      // 移除临时详情缓存
      if (context?.tempId) {
        queryClient.removeQueries({
          queryKey: scheduleKeys.detail(context.tempId),
        });
      }
    },

    // 成功处理
    onSuccess: (data, variables) => {
      // 预加载相关数据
      queryClient.prefetchQuery({
        queryKey: scheduleKeys.detail(data.id),
        queryFn: () => scheduleService.getSchedule(data.id),
        staleTime: 0,
      });

      // 显示成功通知
      // showToast('时间表创建成功', 'success')
    },

    // 变更完成后
    onSettled: () => {
      // 重新获取列表确保数据一致性
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
};

// 更新时间表
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduleRequest }) =>
      scheduleService.updateSchedule(id, data),

    onMutate: async ({ id, data }) => {
      // 取消相关查询
      await queryClient.cancelQueries({ queryKey: scheduleKeys.detail(id) });

      const previousSchedule = queryClient.getQueryData(
        scheduleKeys.detail(id)
      );

      // 乐观更新
      queryClient.setQueryData(scheduleKeys.detail(id), (old: Schedule) =>
        old ? { ...old, ...data, updatedAt: new Date() } : old
      );

      return { previousSchedule };
    },

    onError: (err, variables, context) => {
      console.error('Failed to update schedule:', err);

      if (context?.previousSchedule) {
        queryClient.setQueryData(
          scheduleKeys.detail(variables.id),
          context.previousSchedule
        );
      }
    },

    onSuccess: (data, variables) => {
      // 更新列表中的数据
      queryClient.setQueryData(scheduleKeys.lists(), (old: Schedule[] = []) =>
        old.map(schedule => (schedule.id === variables.id ? data : schedule))
      );
    },

    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(id) });
    },
  });
};

// 加入时间表（参与者）
export const useJoinSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      data,
    }: {
      scheduleId: string;
      data: JoinScheduleRequest;
    }) => scheduleService.joinSchedule(scheduleId, data),

    onMutate: async ({ scheduleId, data }) => {
      await queryClient.cancelQueries({
        queryKey: scheduleKeys.detail(scheduleId),
      });

      const previousSchedule = queryClient.getQueryData(
        scheduleKeys.detail(scheduleId)
      );

      // 生成临时参与者
      const tempParticipantId = `temp-participant-${Date.now()}`;
      const optimisticParticipant: Participant = {
        id: tempParticipantId,
        name: data.name,
        color: generateParticipantColor(),
        timeSlots: data.timeSlots.map((slot, index) => ({
          ...slot,
          id: `temp-slot-${index}`,
          participantId: tempParticipantId,
        })),
        joinedAt: new Date(),
        lastModifiedAt: new Date(),
      };

      // 乐观更新
      queryClient.setQueryData(
        scheduleKeys.detail(scheduleId),
        (old: Schedule) =>
          old
            ? {
                ...old,
                participants: [...old.participants, optimisticParticipant],
                updatedAt: new Date(),
              }
            : old
      );

      return { previousSchedule, tempParticipantId };
    },

    onError: (err, variables, context) => {
      console.error('Failed to join schedule:', err);

      if (context?.previousSchedule) {
        queryClient.setQueryData(
          scheduleKeys.detail(variables.scheduleId),
          context.previousSchedule
        );
      }
    },

    onSuccess: (data, variables) => {
      // 成功后更新参与者和重叠数据
      queryClient.setQueryData(scheduleKeys.detail(variables.scheduleId), data);
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.overlaps(variables.scheduleId),
      });
    },

    onSettled: (_, __, { scheduleId }) => {
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(scheduleId),
      });
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.participants(scheduleId),
      });
    },
  });
};

// 更新参与者时间段
export const useUpdateParticipantTimeSlots = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      participantId,
      timeSlots,
    }: {
      scheduleId: string;
      participantId: string;
      timeSlots: Omit<TimeSlot, 'participantId'>[];
    }) =>
      scheduleService.updateParticipantTimeSlots(
        scheduleId,
        participantId,
        timeSlots
      ),

    onMutate: async ({ scheduleId, participantId, timeSlots }) => {
      await queryClient.cancelQueries({
        queryKey: scheduleKeys.detail(scheduleId),
      });

      const previousSchedule = queryClient.getQueryData(
        scheduleKeys.detail(scheduleId)
      );

      // 乐观更新参与者时间段
      queryClient.setQueryData(
        scheduleKeys.detail(scheduleId),
        (old: Schedule) =>
          old
            ? {
                ...old,
                participants: old.participants.map(p =>
                  p.id === participantId
                    ? {
                        ...p,
                        timeSlots: timeSlots.map((slot, index) => ({
                          ...slot,
                          id: slot.id || `temp-slot-${Date.now()}-${index}`,
                          participantId,
                        })),
                        lastModifiedAt: new Date(),
                      }
                    : p
                ),
                updatedAt: new Date(),
              }
            : old
      );

      return { previousSchedule };
    },

    onError: (err, variables, context) => {
      console.error('Failed to update time slots:', err);

      if (context?.previousSchedule) {
        queryClient.setQueryData(
          scheduleKeys.detail(variables.scheduleId),
          context.previousSchedule
        );
      }
    },

    onSuccess: (_, { scheduleId }) => {
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.overlaps(scheduleId),
      });
    },

    onSettled: (_, __, { scheduleId }) => {
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(scheduleId),
      });
    },
  });
};

// 删除时间表
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scheduleService.deleteSchedule(id),

    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: scheduleKeys.detail(id) });

      const previousSchedule = queryClient.getQueryData(
        scheduleKeys.detail(id)
      );
      const previousSchedules = queryClient.getQueryData(scheduleKeys.lists());

      // 乐观移除
      queryClient.removeQueries({ queryKey: scheduleKeys.detail(id) });
      queryClient.setQueryData(scheduleKeys.lists(), (old: Schedule[] = []) =>
        old.filter(schedule => schedule.id !== id)
      );

      return { previousSchedule, previousSchedules };
    },

    onError: (err, id, context) => {
      console.error('Failed to delete schedule:', err);

      // 恢复数据
      if (context?.previousSchedule) {
        queryClient.setQueryData(
          scheduleKeys.detail(id),
          context.previousSchedule
        );
      }
      if (context?.previousSchedules) {
        queryClient.setQueryData(
          scheduleKeys.lists(),
          context.previousSchedules
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
};

// 工具函数：生成参与者颜色
function generateParticipantColor(): string {
  const colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316',
    '#6366f1',
    '#84cc16',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// 无限滚动获取时间表列表
export const useInfiniteSchedules = (filters = {}) => {
  return useQuery({
    queryKey: [...scheduleKeys.lists(), filters],
    queryFn: ({ pageParam = 0 }) =>
      scheduleService.getSchedules({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length;
      }
      return undefined;
    },
    staleTime: 2 * 60 * 1000, // 2分钟
    cacheTime: 10 * 60 * 1000, // 10分钟
  });
};
