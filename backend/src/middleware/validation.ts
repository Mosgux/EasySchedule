import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from './errorHandler';

export function validateRequest(schema: {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const details: Array<{ field: string; message: string }> = [];

    const collectValidationErrors = (error: Joi.ValidationError) => {
      errors.push(...error.details.map(detail => detail.message));
      details.push(
        ...error.details.map(detail => ({
          field: detail.path.join('.') || 'value',
          message: detail.message,
        }))
      );
    };

    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, {
        abortEarly: false,
      });
      if (error) {
        collectValidationErrors(error);
      } else {
        req.body = value;
      }
    }

    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, {
        abortEarly: false,
      });
      if (error) {
        collectValidationErrors(error);
      } else {
        req.params = value;
      }
    }

    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, {
        abortEarly: false,
      });
      if (error) {
        collectValidationErrors(error);
      } else {
        req.query = value;
      }
    }

    if (errors.length > 0) {
      return next(
        createError(
          `Validation failed: ${errors.join(', ')}`,
          400,
          'VALIDATION_ERROR',
          details
        )
      );
    }

    next();
  };
}

const participantNameSchema = Joi.string()
  .trim()
  .pattern(/^[\u4e00-\u9fa5a-zA-Z0-9_\s]{1,50}$/)
  .required()
  .messages({
    'string.pattern.base':
      '姓名只能包含中文、英文、数字、下划线和空格，长度1-50字符',
  });

const timeSlotSchema = Joi.object({
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().min(Joi.ref('startTime')).required(),
  isCustom: Joi.boolean().optional(),
});

export const schemas = {
  createSchedule: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
    timezone: Joi.string().required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  }),

  createParticipant: Joi.object({
    scheduleId: Joi.string().required(),
    name: participantNameSchema,
  }),

  timeSlot: timeSlotSchema,

  timeSlots: Joi.array().items(timeSlotSchema).required(),

  createScheduleParticipant: Joi.object({
    name: participantNameSchema,
    timeSlots: Joi.array().items(timeSlotSchema).required(),
  }),

  updateParticipantTimeSlots: Joi.object({
    timeSlots: Joi.array().items(timeSlotSchema).required(),
  }),

  scheduleId: Joi.object({
    scheduleId: Joi.string().required(),
  }),

  participantId: Joi.object({
    participantId: Joi.string().required(),
  }),

  token: Joi.object({
    token: Joi.string().min(8).max(32).required(),
  }),

  lockSchedule: Joi.object({
    isLocked: Joi.boolean().required(),
  }),
};

// SQL注入防护 - Prisma已经提供了内置防护
export function sanitizeInput(input: any): any {
  if (typeof input !== 'object' || input === null) {
    return input;
  }

  const sanitized: any = Array.isArray(input) ? [] : {};

  for (const key in input) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      const value = input[key];

      if (typeof value === 'string') {
        // 移除潜在的恶意字符
        sanitized[key] = value
          .replace(/[<>'"]/g, '') // 移除HTML标签字符
          .replace(/javascript:/gi, '') // 移除javascript协议
          .replace(/on\w+=/gi, ''); // 移除事件处理器
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

// XSS防护中间件
export function xssProtection(req: Request, res: Response, next: NextFunction) {
  // 清理请求体
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }

  // 清理查询参数
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }

  // 设置安全头部
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
}
