import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// 扩展dayjs插件
dayjs.extend(utc);
dayjs.extend(timezone);

// 默认时区
const DEFAULT_TIMEZONE = 'Asia/Shanghai';

/**
 * 获取配置的dayjs实例
 */
export { dayjs };

/**
 * 根据时区获取当前时间
 */
export function now(timezone: string = DEFAULT_TIMEZONE): dayjs.Dayjs {
  return dayjs().tz(timezone);
}

/**
 * 将时间转换为指定时区
 */
export function toTimezone(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): dayjs.Dayjs {
  return dayjs(date).tz(timezone);
}

/**
 * 验证时区是否有效
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    dayjs().tz(timezone);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取时区列表（常用的IANA时区）
 */
export function getCommonTimezones(): string[] {
  return [
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
    'Australia/Melbourne',
  ];
}
