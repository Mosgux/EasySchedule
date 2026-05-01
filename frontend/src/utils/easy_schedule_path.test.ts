import { describe, expect, it } from 'vitest';
import {
  buildAppPath,
  normalizeLegacyEasyScheduleRequestPath,
} from './easy_schedule_path';

describe('buildAppPath', () => {
  it('keeps the application root path canonical', () => {
    expect(buildAppPath('/')).toBe('/');
  });

  it('normalizes nested application paths', () => {
    expect(buildAppPath('schedule/token/')).toBe('/schedule/token');
  });
});

describe('normalizeLegacyEasyScheduleRequestPath', () => {
  it('normalizes the legacy base path to the application root', () => {
    expect(normalizeLegacyEasyScheduleRequestPath('/EasySchedule/')).toBe('/');
  });

  it('normalizes the legacy base path without a trailing slash', () => {
    expect(normalizeLegacyEasyScheduleRequestPath('/EasySchedule')).toBe('/');
  });

  it('normalizes mixed-case base paths', () => {
    expect(
      normalizeLegacyEasyScheduleRequestPath('/eAsYsChEdUlE/share/token')
    ).toBe('/share/token');
  });

  it('collapses repeated slashes after the base path', () => {
    expect(
      normalizeLegacyEasyScheduleRequestPath('/EASYSCHEDULE//share///token')
    ).toBe('/share/token');
  });

  it('preserves the query string while normalizing the path', () => {
    expect(
      normalizeLegacyEasyScheduleRequestPath('/easyschedule?foo=bar')
    ).toBe('/?foo=bar');
  });

  it('ignores unrelated paths', () => {
    expect(normalizeLegacyEasyScheduleRequestPath('/other/path')).toBeNull();
  });
});
