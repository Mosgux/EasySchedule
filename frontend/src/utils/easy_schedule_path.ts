export const LEGACY_EASY_SCHEDULE_BASE_PATH = '/EasySchedule';

export function buildAppPath(path: string = '/'): string {
  const trimmedPath = path.trim();

  if (!trimmedPath || trimmedPath === '/') {
    return '/';
  }

  const normalizedPath = `/${trimmedPath.replace(/^\/+/, '')}`.replace(
    /\/{2,}/g,
    '/'
  );

  return normalizedPath.replace(/\/+$/, '') || '/';
}

export function normalizeLegacyEasyScheduleRequestPath(
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
    ? buildAppPath(normalizedRemainder)
    : '/';

  return search ? `${normalizedPath}?${search}` : normalizedPath;
}
