import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateRequest, schemas } from '../middleware/validation';
import { ShareLinkService } from '../services/ShareLinkService';
import { prisma } from '../lib/prisma';
import {
  serializeSharedSchedule,
  serializeSharedScheduleInfo,
} from './serializers';
import { logger } from '../utils/logger';

const router = Router();
const shareLinkService = new ShareLinkService(prisma);

router.get(
  '/:token',
  validateRequest({ params: schemas.token }),
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    logger.info(`Accessing schedule via share token: ${token}`);

    const shareLink = await shareLinkService.getShareLinkByToken(token);

    logger.info(
      `Successfully accessed schedule: ${shareLink.schedule.id} via share token`
    );

    res.json(serializeSharedSchedule(shareLink.schedule, token));
  })
);

router.get(
  '/:token/info',
  validateRequest({ params: schemas.token }),
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const shareLink = await shareLinkService.getShareLinkByToken(token);

    res.json(
      serializeSharedScheduleInfo(
        shareLink.schedule,
        shareLink.schedule.participants.length,
        token
      )
    );
  })
);

router.post(
  '/:token/validate',
  validateRequest({ params: schemas.token }),
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const isValid = await shareLinkService.validateShareToken(token);

    if (!isValid) {
      throw createError('Invalid or expired share token', 404);
    }

    res.json({
      valid: true,
      message: 'Share token is valid',
    });
  })
);

export default router;
