import { TimeSlotData, CreateParticipantRequest } from '../types/participant';
import { apiClient } from './apiClient';

interface ScheduleData {
  id: string;
  title: string;
  description: string;
  timezone: string;
  startDate: string;
  endDate: string;
  expiresAt: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  participants: Array<{
    id: string;
    name: string;
    color: string;
    createdAt: string;
    updatedAt: string;
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

interface ParticipantResponse {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  timeSlots: Array<{
    id: string;
    startTime: string;
    endTime: string;
    isCustom: boolean;
  }>;
}

export type Participant = ParticipantResponse;

export const participantApi = {
  /**
   * 通过分享令牌获取时间表详情
   */
  getScheduleByToken: async (token: string): Promise<ScheduleData> => {
    try {
      const response = await apiClient.get<ScheduleData>(`/share/${token}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get schedule by token:', error);
      throw error;
    }
  },

  /**
   * 获取时间表基本信息（不包含参与者详细信息）
   */
  getScheduleInfoByToken: async (token: string): Promise<ScheduleData> => {
    try {
      const response = await apiClient.get<ScheduleData>(
        `/share/${token}/info`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get schedule info by token:', error);
      throw error;
    }
  },

  /**
   * 验证分享链接是否有效
   */
  validateShareToken: async (token: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ valid: boolean }>(
        `/share/${token}/validate`
      );
      return response.data.valid;
    } catch (error) {
      return false;
    }
  },

  /**
   * 获取时间表的参与者列表
   */
  getScheduleParticipants: async (
    scheduleId: string
  ): Promise<ParticipantResponse[]> => {
    try {
      const response = await apiClient.get<{
        participants: ParticipantResponse[];
      }>(`/participants/schedules/${scheduleId}/participants`);
      return response.data.participants;
    } catch (error) {
      console.error('Failed to get schedule participants:', error);
      throw error;
    }
  },

  /**
   * 创建或更新参与者
   */
  createOrUpdateParticipant: async (
    scheduleId: string,
    name: string,
    timeSlots: TimeSlotData[]
  ): Promise<ParticipantResponse> => {
    try {
      const requestData: CreateParticipantRequest = {
        name,
        timeSlots: timeSlots.map(slot => {
          // 确保转换为Date对象再调用toISOString
          const startTime =
            slot.startTime instanceof Date
              ? slot.startTime
              : new Date(slot.startTime);
          const endTime =
            slot.endTime instanceof Date
              ? slot.endTime
              : new Date(slot.endTime);

          return {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            isCustom: slot.isCustom || false,
          };
        }),
      };

      const response = await apiClient.post<ParticipantResponse>(
        `/participants/schedules/${scheduleId}/participants`,
        requestData
      );

      return response.data;
    } catch (error) {
      console.error('Failed to create/update participant:', error);
      throw error;
    }
  },

  /**
   * 获取参与者的时间段
   */
  getParticipantTimeSlots: async (
    participantId: string
  ): Promise<ParticipantResponse['timeSlots']> => {
    try {
      const response = await apiClient.get<{
        timeSlots: ParticipantResponse['timeSlots'];
      }>(`/participants/${participantId}/timeslots`);
      return response.data.timeSlots;
    } catch (error) {
      console.error('Failed to get participant time slots:', error);
      throw error;
    }
  },

  /**
   * 更新参与者的时间段
   */
  updateParticipantTimeSlots: async (
    participantId: string,
    timeSlots: TimeSlotData[]
  ): Promise<ParticipantResponse['timeSlots']> => {
    try {
      const requestData = {
        timeSlots: timeSlots.map(slot => ({
          startTime: (slot.startTime instanceof Date
            ? slot.startTime
            : new Date(slot.startTime)
          ).toISOString(),
          endTime: (slot.endTime instanceof Date
            ? slot.endTime
            : new Date(slot.endTime)
          ).toISOString(),
          isCustom: slot.isCustom || false,
        })),
      };

      const response = await apiClient.put<{
        timeSlots: ParticipantResponse['timeSlots'];
      }>(`/participants/${participantId}/timeslots`, requestData);

      return response.data.timeSlots;
    } catch (error) {
      console.error('Failed to update participant time slots:', error);
      throw error;
    }
  },

  /**
   * 删除参与者
   */
  deleteParticipant: async (participantId: string): Promise<void> => {
    try {
      await apiClient.delete(`/participants/${participantId}`);
    } catch (error) {
      console.error('Failed to delete participant:', error);
      throw error;
    }
  },
};

export default participantApi;
