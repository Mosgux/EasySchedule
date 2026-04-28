export const EASY_SCHEDULE_BASE_PATH = '/EasySchedule';
export const EASY_SCHEDULE_PUBLIC_BASE_PATH = `${EASY_SCHEDULE_BASE_PATH}/`;

export function normalizeEasyScheduleRequestPath(
  requestPath: string
): string | null {
  const [pathname, search = ''] = requestPath.split('?', 2);
  const match = pathname.match(/^\/easyschedule(?:\/+(.*))?\/?$/i);

  if (!match) {
    return null;
  }

  const rawRemainder = match[1] ?? '';
  const normalizedRemainder = rawRemainder.split('/').filter(Boolean).join('/');

  const normalizedPath = normalizedRemainder
    ? `${EASY_SCHEDULE_BASE_PATH}/${normalizedRemainder}`
    : EASY_SCHEDULE_PUBLIC_BASE_PATH;

  return search ? `${normalizedPath}?${search}` : normalizedPath;
}
