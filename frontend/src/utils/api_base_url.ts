import { EASY_SCHEDULE_BASE_PATH } from './easy_schedule_path';

const DEV_API_BASE_PATH = '/api';
const PROD_API_BASE_PATH = `${EASY_SCHEDULE_BASE_PATH}/api`;

const isPathOnlyValue = (value: string): boolean => value.startsWith('/');

export function resolveApiBaseUrl(
  rawValue: string | undefined,
  isDev: boolean
): string {
  const trimmed = rawValue?.trim();
  if (!trimmed) {
    return isDev ? DEV_API_BASE_PATH : PROD_API_BASE_PATH;
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');

  if (isPathOnlyValue(withoutTrailingSlash)) {
    const normalizedPath = withoutTrailingSlash.replace(/\/{2,}/g, '/');

    if (/^\/api$/i.test(normalizedPath)) {
      return DEV_API_BASE_PATH;
    }

    if (/^\/easyschedule\/api$/i.test(normalizedPath)) {
      return isDev ? DEV_API_BASE_PATH : PROD_API_BASE_PATH;
    }

    return normalizedPath;
  }

  return withoutTrailingSlash;
}
