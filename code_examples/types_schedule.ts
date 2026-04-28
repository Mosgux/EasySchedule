// src/types/schedule.ts
export interface Schedule {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  timeZone: string;
  startDate: Date;
  endDate: Date;
  expiresAt: Date;
  locked: boolean;
  createdAt: Date;
  updatedAt: Date;
  participants: Participant[];
  settings: ScheduleSettings;
}

export interface ScheduleSettings {
  morningStart: string; // "09:00"
  morningEnd: string; // "12:00"
  afternoonStart: string; // "13:00"
  afternoonEnd: string; // "18:00"
  eveningStart: string; // "19:00"
  eveningEnd: string; // "21:00"
  timeSlotGranularity: number; // 分钟，默认30
}

export interface Participant {
  id: string;
  name: string;
  color: string;
  timeSlots: TimeSlot[];
  joinedAt: Date;
  lastModifiedAt: Date;
}

export interface TimeSlot {
  id: string;
  participantId: string;
  startTime: Date;
  endTime: Date;
  isCustomTime: boolean; // 是否为自定义时间段
  dayOfWeek: number; // 0-6，周日到周六
}

export interface OverlapData {
  id: string;
  startTime: Date;
  endTime: Date;
  overlapCount: number;
  participants: Participant[];
  intensity: number; // 0-1，重叠强度
}

export interface CreateScheduleRequest {
  title: string;
  description?: string;
  timeZone: string;
  startDate: Date;
  endDate: Date;
  expiresAt: Date;
  settings?: Partial<ScheduleSettings>;
}

export interface UpdateScheduleRequest {
  title?: string;
  description?: string;
  locked?: boolean;
  settings?: Partial<ScheduleSettings>;
}

export interface JoinScheduleRequest {
  name: string;
  timeSlots: Omit<TimeSlot, 'id' | 'participantId'>[];
}

export interface TimeSlotSelection {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  customSlots: Array<{
    startTime: string;
    endTime: string;
  }>;
}
