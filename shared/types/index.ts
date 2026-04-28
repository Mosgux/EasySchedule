// 基础类型定义
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 时间表相关类型
export interface Schedule extends BaseEntity {
  title: string;
  description?: string;
  timezone: string;
  startDate: Date;
  endDate: Date;
  expiresAt: Date;
  isLocked: boolean;
  participants?: Participant[];
  shareLink?: ShareLink;
}

export interface CreateScheduleRequest {
  title: string;
  description?: string;
  timezone: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
}

export interface ScheduleResponse {
  id: string;
  title: string;
  description?: string;
  timezone: string;
  startDate: string;
  endDate: string;
  expiresAt: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  participantCount: number;
}

// 参与者相关类型
export interface Participant extends BaseEntity {
  scheduleId: string;
  name: string;
  color: string;
  timeSlots?: TimeSlot[];
}

export interface CreateParticipantRequest {
  scheduleId: string;
  name: string;
}

export interface ParticipantResponse {
  id: string;
  scheduleId: string;
  name: string;
  color: string;
  timeSlotCount: number;
  createdAt: string;
  updatedAt: string;
}

// 时间段相关类型
export interface TimeSlot {
  id: string;
  participantId: string;
  startTime: Date;
  endTime: Date;
  isCustom: boolean;
}

export interface TimeSlotRequest {
  startTime: string; // ISO string
  endTime: string; // ISO string
  isCustom?: boolean;
}

export interface TimeSlotResponse {
  id: string;
  participantId: string;
  startTime: string;
  endTime: string;
  isCustom: boolean;
}

// 分享链接相关类型
export interface ShareLink {
  id: string;
  scheduleId: string;
  token: string;
  createdAt: Date;
}

export interface ShareLinkResponse {
  id: string;
  scheduleId: string;
  token: string;
  shareUrl: string;
  createdAt: string;
}

// 重叠分析相关类型
export interface OverlapStats {
  id: string;
  scheduleId: string;
  startTime: Date;
  endTime: Date;
  participantCount: number;
  participantNames: string; // JSON string
  createdAt: Date;
}

export interface OverlapStatsResponse {
  id: string;
  scheduleId: string;
  startTime: string;
  endTime: string;
  participantCount: number;
  participantNames: string[];
  overlapLevel: 'high' | 'medium' | 'low';
  createdAt: string;
}

// 可视化相关类型
export interface CalendarDay {
  date: string;
  dayOfWeek: number;
  timeSlots: TimeSlotWithParticipant[];
}

export interface TimeSlotWithParticipant extends TimeSlotResponse {
  participant: {
    id: string;
    name: string;
    color: string;
  };
}

export interface VisualizationData {
  schedule: ScheduleResponse;
  participants: ParticipantResponse[];
  timeSlots: TimeSlotWithParticipant[];
  overlapStats: OverlapStatsResponse[];
  calendarDays: CalendarDay[];
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// 时区相关类型
export interface TimezoneInfo {
  value: string;
  label: string;
  offset: string;
}

// 快捷时间选择类型
export interface QuickTimeOption {
  id: string;
  label: string;
  timeSlots: Array<{
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  }>;
}

// 错误类型
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: any;
}

// 实用类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
