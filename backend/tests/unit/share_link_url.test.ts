import { describe, expect, it } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { ShareLinkService } from '../../src/services/ShareLinkService';
import { ShareLink, buildShareLinkUrl } from '../../src/models/ShareLink';

describe('share link url normalization', () => {
  it('builds a root-based share path when the base url is clean', () => {
    expect(buildShareLinkUrl('token123', 'http://localhost:5173')).toBe(
      'http://localhost:5173/share/token123'
    );
  });

  it('strips a legacy EasySchedule suffix case-insensitively', () => {
    expect(
      buildShareLinkUrl('token123', 'http://localhost:5173/eAsYsChEdUlE')
    ).toBe('http://localhost:5173/share/token123');
  });

  it('removes repeated trailing slashes before building the share url', () => {
    expect(
      buildShareLinkUrl('token123', 'http://localhost:5173/EasySchedule///')
    ).toBe('http://localhost:5173/share/token123');
  });

  it('keeps ShareLink.generateUrl aligned with the shared helper', () => {
    expect(
      ShareLink.generateUrl('token123', 'http://localhost:5173/easyschedule/')
    ).toBe('http://localhost:5173/share/token123');
  });

  it('keeps ShareLinkService.buildShareUrl aligned with the shared helper', () => {
    const service = new ShareLinkService({} as PrismaClient);
    expect(
      service.buildShareUrl('token123', 'http://localhost:5173/easyschedule/')
    ).toBe('http://localhost:5173/share/token123');
  });
});
