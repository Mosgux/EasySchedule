import { describe, expect, it } from 'vitest';
import {
  EASY_SCHEDULE_PUBLIC_BASE_PATH,
  normalizeEasyScheduleRequestPath,
} from './easy_schedule_path';

describe('normalizeEasyScheduleRequestPath', () => {
  it('keeps the canonical public base path', () => {
    expect(normalizeEasyScheduleRequestPath('/EasySchedule/')).toBe(
      EASY_SCHEDULE_PUBLIC_BASE_PATH
    );
  });

  it('adds the trailing slash when the base path is missing one', () => {
    expect(normalizeEasyScheduleRequestPath('/EasySchedule')).toBe(
      EASY_SCHEDULE_PUBLIC_BASE_PATH
    );
  });

  it('normalizes mixed-case base paths', () => {
    expect(normalizeEasyScheduleRequestPath('/eAsYsChEdUlE/share/token')).toBe(
      '/EasySchedule/share/token'
    );
  });

  it('collapses repeated slashes after the base path', () => {
    expect(
      normalizeEasyScheduleRequestPath('/EASYSCHEDULE//share///token')
    ).toBe('/EasySchedule/share/token');
  });

  it('preserves the query string while normalizing the path', () => {
    expect(normalizeEasyScheduleRequestPath('/easyschedule?foo=bar')).toBe(
      '/EasySchedule/?foo=bar'
    );
  });

  it('ignores unrelated paths', () => {
    expect(normalizeEasyScheduleRequestPath('/other/path')).toBeNull();
  });
});
