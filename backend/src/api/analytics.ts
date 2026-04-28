import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, schemas } from '../middleware/validation';
import { OverlapAnalysisService } from '../services/OverlapAnalysisService';
import { ScheduleService } from '../services/ScheduleService';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { serializeAnalyticsResponse } from './serializers';

const router = Router();
const scheduleService = new ScheduleService(prisma);
const overlapAnalysisService = new OverlapAnalysisService(prisma);

router.get(
  '/:scheduleId',
  validateRequest({ params: schemas.scheduleId }),
  asyncHandler(async (req, res) => {
    const { scheduleId } = req.params;

    await scheduleService.validateScheduleAccess(scheduleId);

    const analytics =
      await overlapAnalysisService.analyzeScheduleOverlap(scheduleId);

    try {
      await overlapAnalysisService.saveOverlapStats(
        scheduleId,
        analytics.topOverlappingSlots
      );
    } catch (cacheError) {
      logger.warn(`缓存分析结果失败: ${scheduleId}`, cacheError);
    }

    logger.info(
      `返回分析数据: ${scheduleId}, 参与者数: ${analytics.totalParticipants}`
    );

    res.json(serializeAnalyticsResponse(analytics));
  })
);

export default router;
