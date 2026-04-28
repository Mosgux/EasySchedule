import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export class TimezoneService {
  /**
   * 验证时区是否有效
   */
  static isValidTimezone(tz: string): boolean {
    try {
      dayjs().tz(tz);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 将本地时间转换为UTC时间
   */
  static toUTC(date: Date, timezone: string): Date {
    return dayjs(date).tz(timezone).utc().toDate();
  }

  /**
   * 将UTC时间转换为指定时区时间
   */
  static fromUTC(date: Date, timezone: string): Date {
    return dayjs.utc(date).tz(timezone).toDate();
  }

  /**
   * 获取时区偏移量（分钟）
   */
  static getTimezoneOffset(timezone: string): number {
    return dayjs().tz(timezone).utcOffset();
  }

  /**
   * 格式化时间显示
   */
  static formatTime(
    date: Date,
    timezone: string,
    format: string = 'YYYY-MM-DD HH:mm'
  ): string {
    return dayjs(date).tz(timezone).format(format);
  }

  /**
   * 获取常用时区列表
   */
  static getCommonTimezones(): Array<{
    value: string;
    label: string;
    offset: string;
  }> {
    const timezones = [
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Asia/Singapore',
      'Asia/Hong_Kong',
      'UTC',
      'America/New_York',
      'America/Los_Angeles',
      'America/Chicago',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Australia/Sydney',
    ];

    return timezones.map(tz => ({
      value: tz,
      label: tz.replace('_', ' '),
      offset: this.getTimezoneOffsetString(tz),
    }));
  }

  /**
   * 获取时区偏移字符串
   */
  private static getTimezoneOffsetString(timezone: string): string {
    const offset = this.getTimezoneOffset(timezone);
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';

    if (minutes === 0) {
      return `UTC${sign}${hours}`;
    }
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * 检查时间是否在指定日期范围内
   */
  static isDateInRange(
    date: Date,
    startDate: Date,
    endDate: Date,
    timezone: string
  ): boolean {
    const targetDate = dayjs(date).tz(timezone).startOf('day');
    const start = dayjs(startDate).tz(timezone).startOf('day');
    const end = dayjs(endDate).tz(timezone).endOf('day');

    return targetDate.isAfter(start) && targetDate.isBefore(end);
  }

  /**
   * 获取指定时区的今天开始时间
   */
  static getStartOfDay(date: Date, timezone: string): Date {
    return dayjs(date).tz(timezone).startOf('day').toDate();
  }

  /**
   * 获取指定时区的今天结束时间
   */
  static getEndOfDay(date: Date, timezone: string): Date {
    return dayjs(date).tz(timezone).endOf('day').toDate();
  }
}
