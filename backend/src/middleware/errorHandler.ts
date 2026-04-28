import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: unknown;
}

const DEFAULT_ERROR_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  410: 'GONE',
  422: 'UNPROCESSABLE_ENTITY',
  500: 'INTERNAL_SERVER_ERROR',
};

export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const responseMessage =
    statusCode === 500 && process.env.NODE_ENV !== 'development'
      ? 'Internal Server Error'
      : message;
  const code =
    error.code || DEFAULT_ERROR_CODES[statusCode] || DEFAULT_ERROR_CODES[500];

  logger.error({
    error: error.message,
    code,
    statusCode,
    details: error.details,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const errorPayload: Record<string, unknown> = {
    code,
    message: responseMessage,
    statusCode,
  };

  if (error.details !== undefined) {
    errorPayload.details = error.details;
  }

  if (process.env.NODE_ENV === 'development') {
    errorPayload.stack = error.stack;
  }

  res.status(statusCode).json({
    error: errorPayload,
    message: responseMessage,
    statusCode,
  });
}

export function createError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  error.code =
    code || DEFAULT_ERROR_CODES[statusCode] || DEFAULT_ERROR_CODES[500];
  error.details = details;
  return error;
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && 'statusCode' in error;
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
