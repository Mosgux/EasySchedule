import { Schedule as PrismaSchedule } from '@prisma/client';

export interface CreateScheduleData {
  title: string;
  description?: string;
  timezone: string;
  startDate: Date;
  endDate: Date;
  expiresAt: Date;
}

export interface UpdateScheduleData {
  title?: string;
  description?: string;
  isLocked?: boolean;
  expiresAt?: Date;
}

export interface ScheduleResponse {
  id: string;
  title: string;
  description: string | null;
  timezone: string;
  startDate: string;
  endDate: string;
  expiresAt: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleDetailResponse extends ScheduleResponse {
  participants: Array<{
    id: string;
    name: string;
    color: string;
    createdAt: string;
    updatedAt: string;
  }>;
  shareToken?: string;
}

export class Schedule {
  static fromPrisma(schedule: PrismaSchedule): ScheduleResponse {
    return {
      id: schedule.id,
      title: schedule.title,
      description: schedule.description,
      timezone: schedule.timezone,
      startDate: schedule.startDate.toISOString(),
      endDate: schedule.endDate.toISOString(),
      expiresAt: schedule.expiresAt.toISOString(),
      isLocked: schedule.isLocked,
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
    };
  }

  static validateCreateData(data: Partial<CreateScheduleData>): string[] {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('标题不能为空');
    }

    if (data.title && data.title.length > 100) {
      errors.push('标题不能超过100个字符');
    }

    if (data.description && data.description.length > 500) {
      errors.push('描述不能超过500个字符');
    }

    if (!data.timezone) {
      errors.push('时区不能为空');
    }

    if (!data.startDate) {
      errors.push('开始日期不能为空');
    }

    if (!data.endDate) {
      errors.push('结束日期不能为空');
    }

    if (!data.expiresAt) {
      errors.push('过期时间不能为空');
    }

    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      errors.push('结束日期必须晚于开始日期');
    }

    if (data.expiresAt && data.startDate && data.expiresAt <= data.startDate) {
      errors.push('过期时间必须晚于开始日期');
    }

    return errors;
  }

  static validateUpdateData(data: Partial<UpdateScheduleData>): string[] {
    const errors: string[] = [];

    if (data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        errors.push('标题不能为空');
      }
      if (data.title.length > 100) {
        errors.push('标题不能超过100个字符');
      }
    }

    if (
      data.description !== undefined &&
      data.description &&
      data.description.length > 500
    ) {
      errors.push('描述不能超过500个字符');
    }

    if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
      errors.push('过期时间必须是未来时间');
    }

    return errors;
  }

  static isExpired(schedule: PrismaSchedule): boolean {
    return new Date() > schedule.expiresAt;
  }

  static isLocked(schedule: PrismaSchedule): boolean {
    return schedule.isLocked;
  }

  static canModify(schedule: PrismaSchedule): boolean {
    return !this.isExpired(schedule) && !this.isLocked(schedule);
  }
}
