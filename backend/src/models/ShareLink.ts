import { ShareLink as PrismaShareLink } from '@prisma/client';
import nanoid = require('nanoid');

const LEGACY_EASY_SCHEDULE_BASE_PATH_REGEX = /\/easyschedule$/i;

export function buildShareLinkUrl(
  token: string,
  baseUrl: string = 'http://localhost:5173'
): string {
  const normalizedBaseUrl = baseUrl
    .trim()
    .replace(/\/+$/, '')
    .replace(LEGACY_EASY_SCHEDULE_BASE_PATH_REGEX, '');
  return `${normalizedBaseUrl}/share/${token}`;
}

export interface ShareLinkResponse {
  url: string;
  token: string;
}

export class ShareLink {
  static generateToken(): string {
    return nanoid(12);
  }

  static generateUrl(
    token: string,
    baseUrl: string = 'http://localhost:5173'
  ): string {
    return buildShareLinkUrl(token, baseUrl);
  }

  static fromPrisma(
    shareLink: PrismaShareLink,
    baseUrl: string = 'http://localhost:5173'
  ): ShareLinkResponse {
    return {
      url: this.generateUrl(shareLink.token, baseUrl),
      token: shareLink.token,
    };
  }

  static validateToken(token: string): string[] {
    const errors: string[] = [];

    if (!token || token.trim().length === 0) {
      errors.push('分享令牌不能为空');
    }

    if (token && token.length !== 12) {
      errors.push('分享令牌格式无效');
    }

    return errors;
  }

  static isValidToken(token: string): boolean {
    return /^[a-zA-Z0-9_-]{12}$/.test(token);
  }
}
