// EasySchedule Constants
// 复制自 shared/dist/constants/index.js 的常量定义

export const APP_CONFIG = {
  NAME: 'EasySchedule',
  VERSION: '1.0.0',
  DESCRIPTION: '多人时间协商可视化系统',
};

export const TIME_CONSTANTS = {
  GRANULARITY: 30,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  MIN_DURATION: 30,
  MAX_DURATION: 12,
};

export const COLOR_SCHEME = {
  PARTICIPANT_COLORS: [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#84cc16',
    '#22c55e',
    '#10b981',
    '#14b8a6',
    '#06b6d4',
    '#0ea5e9',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#a855f7',
    '#d946ef',
    '#ec4899',
    '#f43f5e',
  ],
  OVERLAP_COLORS: {
    HIGH: '#dc2626',
    MEDIUM: '#f59e0b',
    LOW: '#10b981',
  },
  DEFAULT_PARTICIPANT_COLOR: '#94a3b8',
};

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
];

export const DEFAULT_TIMEZONE = 'Asia/Shanghai';

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
];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const FILE_LIMITS = {
  MAX_REQUEST_SIZE: 10 * 1024 * 1024,
};

export const REGEX_PATTERNS = {
  PARTICIPANT_NAME: /^[\u4e00-\u9fa5a-zA-Z0-9_\s]{1,50}$/,
  SCHEDULE_TITLE: /^.{1,100}$/,
  DESCRIPTION: /^.{0,500}$/,
  TIMEZONE: /^[A-Za-z_/]+$/,
  SHARE_TOKEN: /^[0-9A-Za-z]{8,32}$/,
};

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
};

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  EXPIRED: 'EXPIRED',
  LOCKED: 'LOCKED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

export const CACHE_KEYS = {
  SCHEDULE: 'schedule:',
  PARTICIPANT: 'participant:',
  OVERLAP_STATS: 'overlap_stats:',
  SHARE_LINK: 'share_link:',
};

export const CACHE_TTL = {
  SCHEDULE: 3600,
  PARTICIPANT: 1800,
  OVERLAP_STATS: 300,
  SHARE_LINK: 86400,
};

export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm',
  DATETIME: 'YYYY-MM-DD HH:mm',
  DISPLAY_DATE: 'YYYY年MM月DD日',
  DISPLAY_DATETIME: 'YYYY年MM月DD日 HH:mm',
};
