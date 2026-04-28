// 应用常量
export const APP_CONFIG = {
  NAME: 'EasySchedule',
  VERSION: '1.0.0',
  DESCRIPTION: '多人时间协商可视化系统',
} as const;

// 时间相关常量
export const TIME_CONSTANTS = {
  // 时间粒度（分钟）
  GRANULARITY: 30,
  // 一天的小时数
  HOURS_PER_DAY: 24,
  // 一周的天数
  DAYS_PER_WEEK: 7,
  // 时间段最小持续时间（分钟）
  MIN_DURATION: 30,
  // 时间段最大持续时间（小时）
  MAX_DURATION: 12,
} as const;

// 颜色方案
export const COLOR_SCHEME = {
  PARTICIPANT_COLORS: [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#84cc16', // lime-500
    '#22c55e', // green-500
    '#10b981', // emerald-500
    '#14b8a6', // teal-500
    '#06b6d4', // cyan-500
    '#0ea5e9', // sky-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#a855f7', // purple-500
    '#d946ef', // fuchsia-500
    '#ec4899', // pink-500
    '#f43f5e', // rose-500
  ],
  OVERLAP_COLORS: {
    HIGH: '#dc2626', // red-600
    MEDIUM: '#f59e0b', // amber-500
    LOW: '#10b981', // emerald-500
  },
  DEFAULT_PARTICIPANT_COLOR: '#94a3b8', // slate-400
} as const;

// 快捷时间选项
export const QUICK_TIME_OPTIONS = [
  {
    id: 'morning',
    label: '上午',
    timeSlots: [{ startTime: '09:00', endTime: '12:00' }],
  },
  {
    id: 'afternoon',
    label: '下午',
    timeSlots: [{ startTime: '14:00', endTime: '18:00' }],
  },
  {
    id: 'evening',
    label: '晚上',
    timeSlots: [{ startTime: '19:00', endTime: '22:00' }],
  },
  {
    id: 'whole_day',
    label: '全天',
    timeSlots: [{ startTime: '09:00', endTime: '18:00' }],
  },
  {
    id: 'flexible',
    label: '灵活时间',
    timeSlots: [
      { startTime: '09:00', endTime: '12:00' },
      { startTime: '14:00', endTime: '18:00' },
    ],
  },
] as const;

// 默认时区
export const DEFAULT_TIMEZONE = 'Asia/Shanghai';

// 常用时区
export const COMMON_TIMEZONES = [
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
] as const;

// 分页默认值
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// 文件大小限制
export const FILE_LIMITS = {
  MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// 正则表达式
export const REGEX_PATTERNS = {
  PARTICIPANT_NAME: /^[\u4e00-\u9fa5a-zA-Z0-9_\s]{1,50}$/,
  SCHEDULE_TITLE: /^.{1,100}$/,
  DESCRIPTION: /^.{0,500}$/,
  TIMEZONE: /^[A-Za-z_\/]+$/,
  SHARE_TOKEN: /^[0-9A-Za-z]{8,32}$/,
} as const;

// API状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// 错误代码
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  EXPIRED: 'EXPIRED',
  LOCKED: 'LOCKED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// 缓存键前缀
export const CACHE_KEYS = {
  SCHEDULE: 'schedule:',
  PARTICIPANT: 'participant:',
  OVERLAP_STATS: 'overlap_stats:',
  SHARE_LINK: 'share_link:',
} as const;

// 缓存TTL（秒）
export const CACHE_TTL = {
  SCHEDULE: 3600, // 1小时
  PARTICIPANT: 1800, // 30分钟
  OVERLAP_STATS: 300, // 5分钟
  SHARE_LINK: 86400, // 24小时
} as const;

// 日期格式
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm',
  DATETIME: 'YYYY-MM-DD HH:mm',
  DISPLAY_DATE: 'YYYY年MM月DD日',
  DISPLAY_DATETIME: 'YYYY年MM月DD日 HH:mm',
} as const;
