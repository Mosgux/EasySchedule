import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './api_base_url';

describe('resolveApiBaseUrl', () => {
  it('uses the dev proxy path by default in development', () => {
    expect(resolveApiBaseUrl(undefined, true)).toBe('/api');
  });

  it('uses the root API path by default in production', () => {
    expect(resolveApiBaseUrl(undefined, false)).toBe('/api');
  });

  it('normalizes a mistaken EasySchedule api path back to the dev proxy', () => {
    expect(resolveApiBaseUrl('/eAsYsChEdUlE/api/', true)).toBe('/api');
  });

  it('keeps the production api path rooted while normalizing legacy casing', () => {
    expect(resolveApiBaseUrl('/eAsYsChEdUlE/api/', false)).toBe('/api');
  });

  it('preserves explicit absolute URLs while trimming trailing slashes', () => {
    expect(resolveApiBaseUrl('http://localhost:4000/api/', true)).toBe(
      'http://localhost:4000/api'
    );
  });
});
